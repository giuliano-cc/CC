import { alignClass, resolveBodyFont, textStyleClasses, typographyStyle } from './shared'

// `pageIndex`/`pageCount` come from wherever this block is actually being
// drawn (Canvas.jsx's Page, or PrintDocument.jsx) — not from the block
// itself, so the exact same block (one shared definition, see
// layoutFields.jsx's "Repeat on every page") reads "Page 1/3" on page 1
// and "Page 2/3" on page 2 instead of a frozen number.
export default function renderPageNumberBlock({ block, globalStyle, pageIndex = 0, pageCount = 1 }) {
  const format = block.format || 'Page {page}/{total}'
  const text = format.replace('{page}', pageIndex + 1).replace('{total}', pageCount)
  return (
    <p
      className={`whitespace-pre-line text-sm leading-relaxed ${textStyleClasses(block)} ${alignClass(block.align)}`}
      style={typographyStyle(block, resolveBodyFont(globalStyle), globalStyle.typographyScale?.p1?.sizePx)}
    >
      {text}
    </p>
  )
}
