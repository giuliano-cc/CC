import { useCallback, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { BLOCK_TYPES } from '../../utils/blockTypes'
import { clamp, SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import BlockRenderer from './BlockRenderer'

const MIN_WIDTH = 60
const MIN_HEIGHT = 24

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
  selectedBlockId,
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
      const x = clamp(state.origX + dx, 0, SHEET_WIDTH - MIN_WIDTH)
      const y = clamp(state.origY + dy, 0, SHEET_HEIGHT - MIN_HEIGHT)
      onChangeGeometry({ x, y })
      return
    }

    const { handle } = state
    let { origX: x, origY: y, origWidth: width, origHeight: height } = state

    if (handle.x === 1) {
      width = clamp(state.origWidth + dx, MIN_WIDTH, SHEET_WIDTH - state.origX)
    } else if (handle.x === -1) {
      const maxDx = state.origWidth - MIN_WIDTH
      const clampedDx = clamp(dx, -state.origX, maxDx)
      width = state.origWidth - clampedDx
      x = state.origX + clampedDx
    }

    if (handle.y === 1) {
      height = clamp(state.origHeight + dy, MIN_HEIGHT, SHEET_HEIGHT - state.origY)
    } else if (handle.y === -1) {
      const maxDy = state.origHeight - MIN_HEIGHT
      const clampedDy = clamp(dy, -state.origY, maxDy)
      height = state.origHeight - clampedDy
      y = state.origY + clampedDy
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

      {isSelected &&
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
