import { BLOCK_DEFINITIONS } from '../../utils/blockTypes'
import PaletteItem from './PaletteItem'

export default function BlockPalette() {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-200 bg-white p-4">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Blocks
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_DEFINITIONS.map((definition) => (
            <PaletteItem key={definition.type} definition={definition} />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Drag a block onto the sheet to add it to the template.
      </p>
    </aside>
  )
}
