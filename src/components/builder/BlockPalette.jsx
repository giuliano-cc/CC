import { BLOCK_DEFINITIONS, CONTENT_LIBRARY_PALETTE_ITEMS } from '../../utils/blockTypes'
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
            <PaletteItem
              key={definition.type}
              dragId={`palette-${definition.type}`}
              blockType={definition.type}
              label={definition.label}
              icon={definition.icon}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Content Library
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {CONTENT_LIBRARY_PALETTE_ITEMS.map((item) => (
            <PaletteItem
              key={item.key}
              dragId={`palette-${item.key}`}
              blockType={item.blockType}
              label={item.label}
              icon={item.icon}
              extraProps={item.extraProps}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Drops in as a titled text block already bound to that field.
        </p>
      </div>

      <p className="text-xs text-slate-400">
        Drag a block onto the sheet to add it to the template.
      </p>
    </aside>
  )
}
