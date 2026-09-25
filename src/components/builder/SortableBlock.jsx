import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import BlockRenderer from './BlockRenderer'

export default function SortableBlock({ block, isSelected, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(block.id)
      }}
      className={`group relative rounded-lg border p-4 transition ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent hover:border-slate-200'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="absolute -left-8 top-4 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Trascina per riordinare"
        >
          <GripVertical size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onRemove(block.id)
        }}
        className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow group-hover:flex"
        aria-label="Elimina blocco"
      >
        <Trash2 size={12} />
      </button>

      <BlockRenderer block={block} />
    </div>
  )
}
