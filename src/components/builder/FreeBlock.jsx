import { useCallback, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { BLOCK_TYPES } from '../../utils/blockTypes'
import { clamp, SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import BlockRenderer from './BlockRenderer'

const MIN_WIDTH = 60
const MIN_HEIGHT = 24
const SNAP_THRESHOLD = 8

// Snaps a value to the nearest margin line (page edge inset by `margin`)
// when within SNAP_THRESHOLD px of it, so blocks "click" into place
// against the dashed margin guide instead of needing pixel-perfect drops.
function snapTo(value, targets) {
  for (const target of targets) {
    if (Math.abs(value - target) <= SNAP_THRESHOLD) return target
  }
  return value
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
  margin = 0,
  onSelect,
  onRemove,
  onAddNestedItem,
  onChangeGeometry,
}) {
  const dragState = useRef(null)

  const handlePointerDownMove = useCallback(
    (event) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id, block.x, block.y],
  )

  const handleResizeStart = useCallback(
    (event, handle) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id, block.x, block.y, block.width, block.height],
  )

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
      if (margin > 0) {
        x = snapTo(x, [margin, SHEET_WIDTH - margin - block.width])
        y = snapTo(y, [margin, SHEET_HEIGHT - margin - block.height])
      }
      onChangeGeometry({ x, y })
      return
    }

    const { handle } = state
    let { origX: x, origY: y, origWidth: width, origHeight: height } = state

    if (handle.x === 1) {
      width = clamp(state.origWidth + dx, MIN_WIDTH, SHEET_WIDTH - state.origX)
      if (margin > 0) width = snapTo(width, [SHEET_WIDTH - margin - x])
    } else if (handle.x === -1) {
      const maxDx = state.origWidth - MIN_WIDTH
      const clampedDx = clamp(dx, -state.origX, maxDx)
      width = state.origWidth - clampedDx
      x = state.origX + clampedDx
      if (margin > 0) x = snapTo(x, [margin])
    }

    if (handle.y === 1) {
      height = clamp(state.origHeight + dy, MIN_HEIGHT, SHEET_HEIGHT - state.origY)
      if (margin > 0) height = snapTo(height, [SHEET_HEIGHT - margin - y])
    } else if (handle.y === -1) {
      const maxDy = state.origHeight - MIN_HEIGHT
      const clampedDy = clamp(dy, -state.origY, maxDy)
      height = state.origHeight - clampedDy
      y = state.origY + clampedDy
      if (margin > 0) y = snapTo(y, [margin])
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
        className={`h-full w-full overflow-auto rounded-md border p-2 transition ${
          isSelected
            ? 'cursor-move border-primary ring-2 ring-primary/20'
            : 'cursor-move border-transparent hover:border-slate-200'
        }`}
      >
        <BlockRenderer
          block={block}
          interactive={block.type === BLOCK_TYPES.COLUMNS}
          selectedId={selectedBlockId}
          onSelectItem={onSelect}
          onAddItem={(columnIndex, type) => onAddNestedItem(block.id, columnIndex, type)}
          onUpdateBlock={onChangeGeometry}
        />
      </div>

      <button
        type="button"
        data-no-drag
        onClick={(event) => {
          event.stopPropagation()
          onRemove(block.id)
        }}
        className="absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow group-hover:flex"
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
            className={`absolute h-3 w-3 rounded-full border-2 border-white bg-primary shadow ${handle.className}`}
          />
        ))}
    </div>
  )
}
