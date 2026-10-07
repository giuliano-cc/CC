import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { BLOCK_TYPES, EDGE_TO_EDGE_TYPES } from '../../utils/blockTypes'
import {
  a4RatioLinesX,
  a4RatioLinesY,
  clamp,
  goldenRatioLinesX,
  goldenRatioLinesY,
  goldenRatioOffsetLinesX,
  goldenRatioOffsetLinesY,
  nearestGridLine,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  structureColumnLines,
  structureRowLines,
} from '../../utils/layout'
import BlockRenderer from './BlockRenderer'

// The golden ratio guide's snap targets for one axis: the two exact
// reference lines plus, for any side that has one, its user-offset
// duplicate — the same set Canvas.jsx draws for that axis, so a block
// snaps to a line exactly where the guide actually shows it, offset
// duplicates included.
function goldenSnapTargets(exactLines, offsetLines) {
  return [
    ...Object.values(exactLines),
    ...Object.values(offsetLines)
      .filter((pair) => pair !== null)
      .flat(),
  ]
}

const MIN_WIDTH = 60
const MIN_HEIGHT = 24
const SNAP_THRESHOLD = 8

// Snaps a value to the nearest of several target positions (a margin
// line, a sibling block's edge/center, ...) when within SNAP_THRESHOLD px
// of it, so blocks "click" into place instead of needing pixel-perfect
// drops. `targets` doesn't need to be sorted; the closest one within
// range wins.
function snapTo(value, targets) {
  let best = value
  let bestDist = SNAP_THRESHOLD
  for (const target of targets) {
    const dist = Math.abs(value - target)
    if (dist <= bestDist) {
      best = target
      bestDist = dist
    }
  }
  return best
}

// For a block of the given size being moved/resized, the positions that
// would align one of its edges or its center with a sibling block already
// on the page — flush with the sibling's near/far edge, aligned to its
// far edge, centered on it, or butted right up against it (for placing
// two blocks side by side with no gap).
function getSnapTargets(siblings, size, getPos, getSize) {
  const targets = []
  siblings.forEach((sibling) => {
    const sPos = getPos(sibling)
    const sSize = getSize(sibling)
    targets.push(sPos, sPos + sSize - size, sPos + sSize, sPos - size, sPos + sSize / 2 - size / 2)
  })
  return targets
}

const getX = (b) => b.x
const getY = (b) => b.y
const getWidth = (b) => b.width
const getHeight = (b) => b.height
const GUIDE_EPS = 0.5

// Which alignment lines to draw (see Canvas.jsx's `guides` overlay) after a
// move/resize: an edge or center of this block that now lines up exactly
// with a sibling's edge/center, a margin line, or the page's own center —
// same alignments `getSnapTargets`/the margin/page-center targets above
// already snap the position to, just re-checked here in absolute page
// coordinates (rather than pre-offset by this block's own size) so the
// line is drawn where the alignment actually is, whichever edge (or the
// center) it was that matched.
function computeGuides({ x, y, width, height }, siblings, margins) {
  const left = x
  const right = x + width
  const centerX = x + width / 2
  const top = y
  const bottom = y + height
  const centerY = y + height / 2

  const vCandidates = [margins.left, SHEET_WIDTH - margins.right, SHEET_WIDTH / 2]
  const hCandidates = [margins.top, SHEET_HEIGHT - margins.bottom, SHEET_HEIGHT / 2]
  siblings.forEach((s) => {
    vCandidates.push(s.x, s.x + s.width, s.x + s.width / 2)
    hCandidates.push(s.y, s.y + s.height, s.y + s.height / 2)
  })

  const vLines = new Set()
  const hLines = new Set()
  vCandidates.forEach((v) => {
    if (Math.abs(v - left) < GUIDE_EPS || Math.abs(v - right) < GUIDE_EPS || Math.abs(v - centerX) < GUIDE_EPS) {
      vLines.add(Math.round(v))
    }
  })
  hCandidates.forEach((h) => {
    if (Math.abs(h - top) < GUIDE_EPS || Math.abs(h - bottom) < GUIDE_EPS || Math.abs(h - centerY) < GUIDE_EPS) {
      hLines.add(Math.round(h))
    }
  })
  return { vLines: [...vLines], hLines: [...hLines] }
}

const RESIZE_HANDLES = [
  { key: 'nw', className: '-left-1.5 -top-1.5 cursor-nwse-resize', x: -1, y: -1 },
  { key: 'n', className: 'left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize', x: 0, y: -1 },
  { key: 'ne', className: '-right-1.5 -top-1.5 cursor-nesw-resize', x: 1, y: -1 },
  { key: 'e', className: '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize', x: 1, y: 0 },
  { key: 'se', className: '-right-1.5 -bottom-1.5 cursor-nwse-resize', x: 1, y: 1 },
  { key: 's', className: 'left-1/2 -bottom-1.5 -translate-x-1/2 cursor-ns-resize', x: 0, y: 1 },
  { key: 'sw', className: '-left-1.5 -bottom-1.5 cursor-nesw-resize', x: -1, y: 1 },
  { key: 'w', className: '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize', x: -1, y: 0 },
]

export default function FreeBlock({
  block,
  isSelected,
  isOnlySelected,
  selectedBlockId,
  margins = { top: 0, right: 0, bottom: 0, left: 0 },
  siblings = [],
  globalStyle,
  snapToGrid = false,
  gridOffsets = { x: 0, y: 0 },
  snapToGoldenRatio = false,
  goldenOffsets = { sx: 0, dx: 0, top: 0, bottom: 0 },
  snapToA4Ratio = false,
  snapToStructureGrid = false,
  structureGrid = { columns: 1, rows: 1, gutter: 24 },
  zoom = 1,
  preview = false,
  onGuides,
  onSelect,
  onRemove,
  onAddNestedItem,
  onChangeGeometry,
}) {
  const dragState = useRef(null)

  // Plain functions, not useCallback: they close over `siblings`/`margins`,
  // which change on essentially every render (any block moving anywhere on
  // the page recomputes this block's sibling list) but weren't in the
  // memoization deps below — so a drag that started after some other
  // block moved, without this block's own x/y changing first, kept using
  // a stale (empty or outdated) sibling list and silently stopped
  // snapping to it.
  function handlePointerDownMove(event) {
    // Preview mode shows the page exactly as it will print — nothing on
    // it is draggable, resizable, or selectable, same as looking at the
    // final PDF.
    if (preview) return
    // Only the left button/primary touch starts the move; doesn't
    // interfere with clicks on input/textarea/select inside the block.
    if (event.button !== undefined && event.button !== 0) return
    const target = event.target
    if (target.closest('input, textarea, select, button, [data-no-drag]')) return

    event.preventDefault()
    event.stopPropagation()

    // Shift-click only adds/removes this block from the selection (to
    // build a multi-selection for aligning/distributing); it doesn't
    // also start dragging it.
    if (event.shiftKey) {
      onSelect(block.id, { additive: true })
      return
    }
    onSelect(block.id)

    dragState.current = {
      mode: 'move',
      startX: event.clientX,
      startY: event.clientY,
      origX: block.x,
      origY: block.y,
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handleResizeStart(event, handle) {
    event.stopPropagation()
    event.preventDefault()
    onSelect(block.id)
    dragState.current = {
      mode: 'resize',
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origX: block.x,
      origY: block.y,
      origWidth: block.width,
      origHeight: block.height,
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handlePointerMove(event) {
    const state = dragState.current
    if (!state) return
    // The page is rendered at `zoom` scale (see Canvas.jsx), but this
    // block's own x/y/width/height are always in the page's own,
    // unscaled coordinate space — so a screen-pixel pointer delta has to
    // be converted back into that space, or the block would drift
    // faster/slower than the cursor at any zoom level other than 100%.
    const dx = (event.clientX - state.startX) / zoom
    const dy = (event.clientY - state.startY) / zoom

    if (state.mode === 'move') {
      // Clamped by the block's own width/height (not MIN_WIDTH/HEIGHT), so
      // it can never be dragged partly past the page edge — the page clips
      // overflow, which made the delete/resize handles unreachable there.
      let x = clamp(state.origX + dx, 0, Math.max(0, SHEET_WIDTH - block.width))
      let y = clamp(state.origY + dy, 0, Math.max(0, SHEET_HEIGHT - block.height))
      const xTargets = getSnapTargets(siblings, block.width, getX, getWidth)
      const yTargets = getSnapTargets(siblings, block.height, getY, getHeight)
      // Centering this block on the page itself — not just on/against a
      // sibling — is common enough (a name/title, a photo) to deserve its
      // own snap target.
      xTargets.push(SHEET_WIDTH / 2 - block.width / 2)
      yTargets.push(SHEET_HEIGHT / 2 - block.height / 2)
      if (margins.left > 0 || margins.right > 0) {
        xTargets.push(margins.left, SHEET_WIDTH - margins.right - block.width)
      }
      if (margins.top > 0 || margins.bottom > 0) {
        yTargets.push(margins.top, SHEET_HEIGHT - margins.bottom - block.height)
      }
      if (snapToGrid) {
        xTargets.push(nearestGridLine(x, gridOffsets.x))
        yTargets.push(nearestGridLine(y, gridOffsets.y))
      }
      if (snapToGoldenRatio) {
        // Each golden ratio line (and its own offset duplicate, if any)
        // is a true reference line, not just an edge to butt up against —
        // so, like a sibling's edge, a block can align its left edge,
        // right edge, or center to it.
        goldenSnapTargets(goldenRatioLinesX(margins), goldenRatioOffsetLinesX(margins, goldenOffsets)).forEach(
          (v) => xTargets.push(v, v - block.width, v - block.width / 2),
        )
        goldenSnapTargets(
          goldenRatioLinesY(margins),
          goldenRatioOffsetLinesY(margins, goldenOffsets),
        ).forEach((v) => yTargets.push(v, v - block.height, v - block.height / 2))
      }
      if (snapToA4Ratio) {
        // Same idea as the golden ratio guide above, but with no offset
        // duplicate lines of its own.
        Object.values(a4RatioLinesX(margins)).forEach((v) => xTargets.push(v, v - block.width, v - block.width / 2))
        Object.values(a4RatioLinesY(margins)).forEach((v) => yTargets.push(v, v - block.height, v - block.height / 2))
      }
      if (snapToStructureGrid) {
        // Column/row edges are true reference lines like the golden
        // ratio's, so a block can align its left/right/top/bottom edge or
        // center to one.
        structureColumnLines(margins, structureGrid.columns, structureGrid.gutter).forEach((v) =>
          xTargets.push(v, v - block.width, v - block.width / 2),
        )
        structureRowLines(margins, structureGrid.rows, structureGrid.gutter).forEach((v) =>
          yTargets.push(v, v - block.height, v - block.height / 2),
        )
      }
      x = snapTo(x, xTargets)
      y = snapTo(y, yTargets)
      onGuides?.(computeGuides({ x, y, width: block.width, height: block.height }, siblings, margins))
      onChangeGeometry({ x, y })
      return
    }

    const { handle } = state
    let { origX: x, origY: y, origWidth: width, origHeight: height } = state

    // Proportional resize: holding Shift while dragging a corner handle
    // keeps the block's original aspect ratio, growing/shrinking around
    // whichever opposite corner stays put — same convention as most
    // design tools. Bypasses the independent x/y snapping below entirely
    // (locking the ratio is a deliberate override of free positioning),
    // and only for a true corner handle (both handle.x/handle.y set) —
    // an edge handle has nothing to lock the ratio against.
    const isCorner = handle.x !== 0 && handle.y !== 0
    if (isCorner && event.shiftKey) {
      const aspect = state.origWidth / state.origHeight
      // Whichever axis the pointer moved further along (relative to the
      // block's own proportions) drives the resize; the other axis
      // follows it to keep the ratio, rather than fighting between two
      // independently-dragged dimensions.
      const widthDrivenByX = Math.abs(dx) * state.origHeight >= Math.abs(dy) * state.origWidth
      let newWidth = widthDrivenByX
        ? clamp(state.origWidth + handle.x * dx, MIN_WIDTH, SHEET_WIDTH)
        : clamp(state.origHeight + handle.y * dy, MIN_HEIGHT, SHEET_HEIGHT) * aspect
      let newHeight = newWidth / aspect
      if (newHeight < MIN_HEIGHT) {
        newHeight = MIN_HEIGHT
        newWidth = newHeight * aspect
      }
      if (newWidth < MIN_WIDTH) {
        newWidth = MIN_WIDTH
        newHeight = newWidth / aspect
      }
      // The corner opposite the one being dragged stays fixed; the
      // dragged corner (and the block's x/y, when growing left/up) moves.
      const newX = handle.x === 1 ? state.origX : state.origX + state.origWidth - newWidth
      const newY = handle.y === 1 ? state.origY : state.origY + state.origHeight - newHeight
      onGuides?.(null)
      onChangeGeometry({
        x: clamp(newX, 0, SHEET_WIDTH - newWidth),
        y: clamp(newY, 0, SHEET_HEIGHT - newHeight),
        width: newWidth,
        height: newHeight,
      })
      return
    }

    // Edges/centers of sibling blocks that the *moving* edge of this one
    // (its right edge when growing right, its left edge when growing
    // left, ...) can snap against — same idea as the margin snap, just
    // against other blocks instead of the page inset.
    const rightEdgeTargets = siblings.flatMap((s) => [s.x, s.x + s.width, s.x + s.width / 2])
    const leftEdgeTargets = rightEdgeTargets
    const bottomEdgeTargets = siblings.flatMap((s) => [s.y, s.y + s.height, s.y + s.height / 2])
    const topEdgeTargets = bottomEdgeTargets

    const goldenX = snapToGoldenRatio
      ? goldenSnapTargets(goldenRatioLinesX(margins), goldenRatioOffsetLinesX(margins, goldenOffsets))
      : []
    const goldenY = snapToGoldenRatio
      ? goldenSnapTargets(goldenRatioLinesY(margins), goldenRatioOffsetLinesY(margins, goldenOffsets))
      : []
    const a4X = snapToA4Ratio ? Object.values(a4RatioLinesX(margins)) : []
    const a4Y = snapToA4Ratio ? Object.values(a4RatioLinesY(margins)) : []
    const columnX = snapToStructureGrid ? structureColumnLines(margins, structureGrid.columns, structureGrid.gutter) : []
    const rowY = snapToStructureGrid ? structureRowLines(margins, structureGrid.rows, structureGrid.gutter) : []

    if (handle.x === 1) {
      width = clamp(state.origWidth + dx, MIN_WIDTH, SHEET_WIDTH - state.origX)
      const targets = [...rightEdgeTargets, ...goldenX, ...a4X, ...columnX]
      if (margins.right > 0) targets.push(SHEET_WIDTH - margins.right)
      if (snapToGrid) targets.push(nearestGridLine(x + width, gridOffsets.x))
      width = snapTo(x + width, targets) - x
    } else if (handle.x === -1) {
      const maxDx = state.origWidth - MIN_WIDTH
      const clampedDx = clamp(dx, -state.origX, maxDx)
      width = state.origWidth - clampedDx
      x = state.origX + clampedDx
      const targets = [...leftEdgeTargets, ...goldenX, ...a4X, ...columnX]
      if (margins.left > 0) targets.push(margins.left)
      if (snapToGrid) targets.push(nearestGridLine(x, gridOffsets.x))
      const snappedX = snapTo(x, targets)
      width += x - snappedX
      x = snappedX
    }

    if (handle.y === 1) {
      height = clamp(state.origHeight + dy, MIN_HEIGHT, SHEET_HEIGHT - state.origY)
      const targets = [...bottomEdgeTargets, ...goldenY, ...a4Y, ...rowY]
      if (margins.bottom > 0) targets.push(SHEET_HEIGHT - margins.bottom)
      if (snapToGrid) targets.push(nearestGridLine(y + height, gridOffsets.y))
      height = snapTo(y + height, targets) - y
    } else if (handle.y === -1) {
      const maxDy = state.origHeight - MIN_HEIGHT
      const clampedDy = clamp(dy, -state.origY, maxDy)
      height = state.origHeight - clampedDy
      y = state.origY + clampedDy
      const targets = [...topEdgeTargets, ...goldenY, ...a4Y, ...rowY]
      if (margins.top > 0) targets.push(margins.top)
      if (snapToGrid) targets.push(nearestGridLine(y, gridOffsets.y))
      const snappedY = snapTo(y, targets)
      height += y - snappedY
      y = snappedY
    }

    onGuides?.(computeGuides({ x, y, width, height }, siblings, margins))
    onChangeGeometry({ x, y, width, height })
  }

  function handlePointerUp() {
    dragState.current = null
    onGuides?.(null)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      onPointerDown={handlePointerDownMove}
      onClick={(event) => event.stopPropagation()}
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex || 1,
      }}
      className="group"
    >
      <div
        data-block-content={block.id}
        // `overflow-hidden`, matching PrintDocument.jsx's own wrapper:
        // content taller than the box it's in is cropped at the box's own
        // edge, both here and in print, instead of spilling into whatever
        // sits after it on the page — sizing a block correctly is the
        // user's own call to make (use "Fit to content" if it's too
        // small), not something the block should paper over by leaking
        // into its neighbor. No padding for EDGE_TO_EDGE_TYPES (Shape/
        // Image/Divider) — they're meant to fill their box exactly, and
        // the usual padding would otherwise show as an unwanted white gap
        // around a color fill or photo.
        className={`h-full w-full overflow-hidden rounded-md border transition ${
          EDGE_TO_EDGE_TYPES.includes(block.type) ? '' : 'p-2'
        } ${
          preview
            ? 'border-transparent'
            : isSelected
              ? 'cursor-move border-primary ring-2 ring-primary/20'
              : 'cursor-move border-transparent hover:border-slate-200'
        }`}
      >
        <BlockRenderer
          block={block}
          interactive={!preview && block.type === BLOCK_TYPES.COLUMNS && isSelected}
          selectedId={selectedBlockId}
          onSelectItem={onSelect}
          onAddItem={(columnIndex, type, extraProps) =>
            onAddNestedItem(block.id, columnIndex, type, extraProps)
          }
          onUpdateBlock={onChangeGeometry}
          globalStyle={globalStyle}
        />
      </div>

      {!preview && (
        <button
          type="button"
          data-no-drag
          onClick={(event) => {
            event.stopPropagation()
            onRemove(block.id)
          }}
          className="pdf-ignore absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow group-hover:flex"
          aria-label="Delete block"
        >
          <Trash2 size={12} />
        </button>
      )}

      {!preview &&
        isOnlySelected &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.key}
            data-no-drag
            onPointerDown={(event) => handleResizeStart(event, handle)}
            title={handle.x !== 0 && handle.y !== 0 ? 'Hold Shift to keep proportions' : undefined}
            className={`pdf-ignore absolute h-3 w-3 rounded-full border-2 border-white bg-primary shadow ${handle.className}`}
          />
        ))}
    </div>
  )
}
