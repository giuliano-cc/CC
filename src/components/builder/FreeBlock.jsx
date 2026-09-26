import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { BLOCK_TYPES } from '../../utils/blockTypes'
import { clamp, SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import BlockRenderer from './BlockRenderer'

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
  margin = 0,
  siblings = [],
  globalStyle,
  onSelect,
  onRemove,
  onAddNestedItem,
  onChangeGeometry,
}) {
  const dragState = useRef(null)

  // Plain functions, not useCallback: they close over `siblings`/`margin`,
  // which change on essentially every render (any block moving anywhere on
  // the page recomputes this block's sibling list) but weren't in the
  // memoization deps below — so a drag that started after some other
  // block moved, without this block's own x/y changing first, kept using
  // a stale (empty or outdated) sibling list and silently stopped
  // snapping to it.
  function handlePointerDownMove(event) {
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
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY

    if (state.mode === 'move') {
      // Clamped by the block's own width/height (not MIN_WIDTH/HEIGHT), so
      // it can never be dragged partly past the page edge — the page clips
      // overflow, which made the delete/resize handles unreachable there.
      let x = clamp(state.origX + dx, 0, Math.max(0, SHEET_WIDTH - block.width))
      let y = clamp(state.origY + dy, 0, Math.max(0, SHEET_HEIGHT - block.height))
      const xTargets = getSnapTargets(siblings, block.width, getX, getWidth)
      const yTargets = getSnapTargets(siblings, block.height, getY, getHeight)
      if (margin > 0) {
        xTargets.push(margin, SHEET_WIDTH - margin - block.width)
        yTargets.push(margin, SHEET_HEIGHT - margin - block.height)
      }
      x = snapTo(x, xTargets)
      y = snapTo(y, yTargets)
      onChangeGeometry({ x, y })
      return
    }

    const { handle } = state
    let { origX: x, origY: y, origWidth: width, origHeight: height } = state

    // Edges/centers of sibling blocks that the *moving* edge of this one
    // (its right edge when growing right, its left edge when growing
    // left, ...) can snap against — same idea as the margin snap, just
    // against other blocks instead of the page inset.
    const rightEdgeTargets = siblings.flatMap((s) => [s.x, s.x + s.width, s.x + s.width / 2])
    const leftEdgeTargets = rightEdgeTargets
    const bottomEdgeTargets = siblings.flatMap((s) => [s.y, s.y + s.height, s.y + s.height / 2])
    const topEdgeTargets = bottomEdgeTargets

    if (handle.x === 1) {
      width = clamp(state.origWidth + dx, MIN_WIDTH, SHEET_WIDTH - state.origX)
      const targets = [...rightEdgeTargets]
      if (margin > 0) targets.push(SHEET_WIDTH - margin)
      width = snapTo(x + width, targets) - x
    } else if (handle.x === -1) {
      const maxDx = state.origWidth - MIN_WIDTH
      const clampedDx = clamp(dx, -state.origX, maxDx)
      width = state.origWidth - clampedDx
      x = state.origX + clampedDx
      const targets = [...leftEdgeTargets]
      if (margin > 0) targets.push(margin)
      const snappedX = snapTo(x, targets)
      width += x - snappedX
      x = snappedX
    }

    if (handle.y === 1) {
      height = clamp(state.origHeight + dy, MIN_HEIGHT, SHEET_HEIGHT - state.origY)
      const targets = [...bottomEdgeTargets]
      if (margin > 0) targets.push(SHEET_HEIGHT - margin)
      height = snapTo(y + height, targets) - y
    } else if (handle.y === -1) {
      const maxDy = state.origHeight - MIN_HEIGHT
      const clampedDy = clamp(dy, -state.origY, maxDy)
      height = state.origHeight - clampedDy
      y = state.origY + clampedDy
      const targets = [...topEdgeTargets]
      if (margin > 0) targets.push(margin)
      const snappedY = snapTo(y, targets)
      height += y - snappedY
      y = snappedY
    }

    onChangeGeometry({ x, y, width, height })
  }

  function handlePointerUp() {
    dragState.current = null
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
        className={`h-full w-full overflow-auto rounded-md border p-2 transition ${
          isSelected
            ? 'cursor-move border-primary ring-2 ring-primary/20'
            : 'cursor-move border-transparent hover:border-slate-200'
        }`}
      >
        <BlockRenderer
          block={block}
          interactive={block.type === BLOCK_TYPES.COLUMNS && isSelected}
          selectedId={selectedBlockId}
          onSelectItem={onSelect}
          onAddItem={(columnIndex, type) => onAddNestedItem(block.id, columnIndex, type)}
          onUpdateBlock={onChangeGeometry}
          globalStyle={globalStyle}
        />
      </div>

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

      {isOnlySelected &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.key}
            data-no-drag
            onPointerDown={(event) => handleResizeStart(event, handle)}
            className={`pdf-ignore absolute h-3 w-3 rounded-full border-2 border-white bg-primary shadow ${handle.className}`}
          />
        ))}
    </div>
  )
}
