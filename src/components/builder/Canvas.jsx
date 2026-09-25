import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useBuilder } from '../../context/BuilderContext'
import SortableBlock from './SortableBlock'

export const CANVAS_DROPPABLE_ID = 'canvas'

export default function Canvas() {
  const { blocks, selectedBlockId, selectBlock, removeBlock } = useBuilder()
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID })

  return (
    <div className="flex flex-1 justify-center overflow-y-auto bg-slate-100 p-8">
      <div
        ref={setNodeRef}
        onClick={() => selectBlock(null)}
        className={`min-h-[1123px] w-[794px] max-w-full rounded-sm bg-white p-12 shadow-lg transition ${
          isOver ? 'ring-2 ring-primary/40' : ''
        }`}
      >
        {blocks.length === 0 ? (
          <div className="flex h-full min-h-[600px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400">
            Trascina un blocco qui per iniziare
          </div>
        ) : (
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedBlockId}
                  onSelect={selectBlock}
                  onRemove={removeBlock}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
