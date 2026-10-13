import { Field, inputClasses } from './fields'

// A column's own ratio, read out of its `Nfr` track string (see
// BlockRenderer's COLUMNS case) — `1` for a plain even column, or
// whatever custom ratio was set.
function widthRatio(width) {
  return parseFloat(width) || 1
}

export default function ColumnsProperties({ block, onChange }) {
  const isCustom = Array.isArray(block.widths) && block.widths.length === block.columns.length

  function setColumnCount(count) {
    const columns = block.columns.slice(0, count)
    while (columns.length < count) columns.push({ items: [] })
    const patch = { columns }
    // A custom width list must always have exactly one entry per column,
    // or the grid silently falls back to even columns (see
    // BlockRenderer) — so adding/removing a column keeps it in sync,
    // extending with an even '1fr' or trimming the extra entries.
    if (isCustom) {
      const widths = block.widths.slice(0, count)
      while (widths.length < count) widths.push('1fr')
      patch.widths = widths
    }
    onChange(patch)
  }

  function setLayout(mode) {
    if (mode === 'even') {
      onChange({ widths: null })
    } else {
      onChange({ widths: block.columns.map((_, i) => `${widthRatio(block.widths?.[i]) || 1}fr`) })
    }
  }

  function setRatio(index, ratio) {
    const widths = block.columns.map((_, i) =>
      i === index ? `${ratio}fr` : block.widths?.[i] || '1fr',
    )
    onChange({ widths })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        Click a heading or text inside the sheet to edit it, or use the "+
        Heading" / "+ Text" buttons under each column to add new items.
      </p>
      <Field label={`Number of columns (${block.columns.length})`}>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setColumnCount(Math.max(1, block.columns.length - 1))}
            disabled={block.columns.length <= 1}
            className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            − Remove
          </button>
          <button
            type="button"
            onClick={() => setColumnCount(Math.min(6, block.columns.length + 1))}
            disabled={block.columns.length >= 6}
            className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add
          </button>
        </div>
      </Field>
      <Field label="Column widths">
        <select
          value={isCustom ? 'custom' : 'even'}
          onChange={(e) => setLayout(e.target.value)}
          className={inputClasses}
        >
          <option value="even">Even (all columns equal)</option>
          <option value="custom">Custom (uneven ratios)</option>
        </select>
      </Field>
      {isCustom && (
        <div className="flex flex-col gap-1.5">
          {block.columns.map((_, i) => (
            <Field key={i} label={`Column ${i + 1} ratio`}>
              <input
                type="number"
                min={0.2}
                step={0.1}
                value={widthRatio(block.widths?.[i])}
                onChange={(e) => setRatio(i, Number(e.target.value) || 1)}
                className={inputClasses}
              />
            </Field>
          ))}
          <p className="text-xs text-slate-400">
            Ratios are relative — e.g. 1 and 2 makes the second column twice
            as wide as the first.
          </p>
        </div>
      )}
    </div>
  )
}
