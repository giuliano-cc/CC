import { resolveBodyFont, textStyleClasses, typographyStyle } from './shared'

// `pageIndex`/`pageCount` come from wherever this block is actually being
// drawn (Canvas.jsx's Page, or PrintDocument.jsx) — not from the block
// itself, so the exact same block (one shared definition, see
// layoutFields.jsx's "Repeat on every page") reads "Page 1/3" on page 1
// and "Page 2/3" on page 2 instead of a frozen number.
export default function renderPageNumberBlock({ block, globalStyle, pageIndex = 0, pageCount = 1 }) {
  const numberFormat = block.numberFormat || '{page}/{total}'
  const number = numberFormat.replace('{page}', pageIndex + 1).replace('{total}', pageCount)
  const label = block.label || ''
  const className = `whitespace-pre-line text-sm leading-relaxed ${textStyleClasses(block)}`
  const style = typographyStyle(block, resolveBodyFont(globalStyle), globalStyle.typographyScale?.p1?.sizePx)

  if (block.layout === 'stacked') {
    return (
      <div className="flex flex-col gap-0.5">
        {label && (
          <p className={className} style={style}>
            {label}
          </p>
        )}
        <p className={className} style={style}>
          {number}
        </p>
      </div>
    )
  }

  return (
    <p className={className} style={style}>
      {[label, number].filter(Boolean).join(' ')}
    </p>
  )
}
