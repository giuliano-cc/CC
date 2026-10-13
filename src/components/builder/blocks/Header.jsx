import { displayText, resolveTitleFont, textStyleClasses, textTransformStyle } from './shared'

export default function renderHeaderBlock({ block, globalStyle, resolvedContent }) {
  // Falls back to the H2 row of Global Style's typography scale
  // (same mechanism Heading/Text/Quote already use) instead of a
  // fixed "text-lg" — so resizing the whole document's scale also
  // resizes this, like every other section-title-ish block does.
  const headerSizePx = globalStyle.typographyScale?.h2?.sizePx
  return (
    <div
      className={`border-b border-slate-200 pb-3 ${headerSizePx ? '' : 'text-lg'} ${textStyleClasses(block)}`}
      style={{
        // Same accent-color default as Heading and every section title
        // (Experience/Education/Contact Info/chart titles) — Header is
        // a title too, so it shouldn't be the one exception left on
        // plain Text color.
        color: block.color || globalStyle.primaryColor,
        fontFamily: resolveTitleFont(globalStyle),
        fontSize: headerSizePx ? `${headerSizePx}px` : undefined,
        ...textTransformStyle(block),
      }}
    >
      {displayText(resolvedContent, block)}
    </div>
  )
}
