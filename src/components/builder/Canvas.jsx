import { useDroppable } from '@dnd-kit/core'
import { useBuilder } from '../../context/BuilderContext'
import { SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import FreeBlock from './FreeBlock'

export const CANVAS_DROPPABLE_ID = 'canvas'

export default function Canvas() {
  const {
    blocks,
    selectedBlockId,
    selectedIds,
    selectBlock,
    removeBlock,
    addNestedItem,
    updateBlock,
    globalStyle,
  } = useBuilder()
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID })

  return (
    <div className="flex flex-1 justify-center overflow-auto bg-slate-100 p-8">
      <div
        ref={setNodeRef}
        onClick={() => selectBlock(null)}
        style={{
          width: SHEET_WIDTH,
          height: SHEET_HEIGHT,
          fontFamily: globalStyle.fontFamily,
          color: globalStyle.textColor,
        }}
        className={`relative shrink-0 overflow-hidden rounded-sm bg-white shadow-lg transition ${
          isOver ? 'ring-2 ring-primary/40' : ''
        }`}
      >
        {blocks.length === 0 && (
          <div className="absolute inset-8 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400">
            Drag a block here to get started
          </div>
        )}

        {blocks.map((block) => (
          <FreeBlock
            key={block.id}
            block={block}
            isSelected={selectedIds.includes(block.id)}
            isOnlySelected={selectedIds.length === 1 && selectedIds[0] === block.id}
            selectedBlockId={selectedBlockId}
            onSelect={selectBlock}
            onRemove={removeBlock}
            onAddNestedItem={addNestedItem}
            onChangeGeometry={(geometry) => updateBlock(block.id, geometry)}
          />
        ))}
      </div>
    </div>
  )
}
