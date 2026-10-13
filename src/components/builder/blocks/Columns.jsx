import { CONTENT_LIBRARY_PALETTE_ITEMS, NESTABLE_BLOCK_DEFINITIONS } from '../../../utils/blockTypes'
import BlockRenderer from '../BlockRenderer'

export default function renderColumnsBlock({ block, globalStyle, interactive, selectedId, onSelectItem, onAddItem }) {
  // `minmax(0, …)` per track (not a bare `Nfr`) — a grid track's
  // default minimum is `auto`, i.e. its content's own min-content
  // size, and a column's "+ Add block" <select> has a wide option
  // ("Additional Information (other notes worth mentioning)") whose
  // intrinsic width becomes that minimum. With two otherwise-equal
  // columns that minimum was actually winning over the fr ratio
  // entirely, rendering as a plain 50/50 split no matter what custom
  // ratio was set. Pinning the minimum to 0 lets the fr ratio (and the
  // column's own `min-w-0` below, for its content) actually control it.
  const gridTemplateColumns = block.widths?.length
    ? block.widths.map((w) => `minmax(0, ${w})`).join(' ')
    : `repeat(${block.columns.length}, minmax(0, 1fr))`

  return (
    <div className="grid gap-x-8 gap-y-3" style={{ gridTemplateColumns }}>
      {block.columns.map((column, colIndex) => (
        <div key={colIndex} className="flex min-w-0 flex-col gap-3">
          {column.items.map((item) => (
            <div
              key={item.id}
              onClick={
                interactive
                  ? (event) => {
                      event.stopPropagation()
                      onSelectItem(item.id)
                    }
                  : undefined
              }
              className={
                interactive
                  ? `-m-1 cursor-pointer rounded-md p-1 transition ${
                      selectedId === item.id
                        ? 'ring-2 ring-primary/40'
                        : 'hover:bg-slate-50'
                    }`
                  : ''
              }
            >
              <BlockRenderer block={item} globalStyle={globalStyle} />
            </div>
          ))}
          {interactive && (
            <div className="pdf-ignore pt-1">
              <select
                value=""
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                  const value = event.target.value
                  event.target.value = ''
                  if (!value) return
                  if (value.startsWith('content-')) {
                    const item = CONTENT_LIBRARY_PALETTE_ITEMS.find((i) => i.key === value)
                    if (item) onAddItem(colIndex, item.blockType, item.extraProps)
                  } else {
                    onAddItem(colIndex, value)
                  }
                }}
                className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-primary outline-none"
              >
                <option value="">+ Add block</option>
                <optgroup label="Blocks">
                  {NESTABLE_BLOCK_DEFINITIONS.map((def) => (
                    <option key={def.type} value={def.type}>
                      {def.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Content Library">
                  {CONTENT_LIBRARY_PALETTE_ITEMS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
