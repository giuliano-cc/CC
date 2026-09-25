import { useDraggable } from '@dnd-kit/core'

export default function PaletteItem({ definition }) {
  const { type, label, icon: Icon } = definition
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', blockType: type },
  })

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-3 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  )
}
