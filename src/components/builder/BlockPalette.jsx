import { BLOCK_DEFINITIONS, CONTENT_LIBRARY_PALETTE_ITEMS } from '../../utils/blockTypes'
import PaletteItem from './PaletteItem'

export default function BlockPalette() {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-200 bg-white p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Blocks</h2>
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

      <p className="text-xs text-slate-400">
        Drag a block onto the sheet to add it to the template. A block already bound to a Content Library field
        drops in as a titled text block ready to go.
      </p>
    </aside>
  )
}
