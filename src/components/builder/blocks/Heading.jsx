import { translateSectionTitle } from '../../../utils/sectionTitles'
import { displayText, resolveTitleFont, textStyleClasses, typographyStyle } from './shared'

const HEADING_SIZE_CLASSES = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
}

// Heading's own "sm/md/lg/xl" size preset maps onto the Global
// Style typography scale's H3/–/H2/H1 (xl reads as "H1" here since
// it's the biggest of the four, same as "H1 (lg)" already being the
// largest row in "Text styles used in this template" below) — 'sm'
// stays on the fixed HEADING_SIZE_PX baseline, since it's a small
// compact heading rather than part of the H1-H3 scale. Only used
// when the block has no `fontSize` of its own.
const HEADING_SCALE_LEVEL_BY_SIZE = { xl: 'h1', lg: 'h2', md: 'h3' }

export default function renderHeadingBlock({ block, globalStyle, resolvedContent, titleOverrides }) {
  const Tag = block.level || 'h1'
  const sizeClass = block.fontSize ? '' : HEADING_SIZE_CLASSES[block.size] || HEADING_SIZE_CLASSES.md
  const scale = globalStyle.typographyScale?.[HEADING_SCALE_LEVEL_BY_SIZE[block.size]]
  // A heading with no color of its own tracks the template's primary
  // (accent) color, not the plain body text color it'd otherwise
  // inherit — every built-in template's headings are deliberately
  // accent-colored section titles, so this is what actually lets the
  // Global Style panel's "Accent color" affect them. An explicit
  // block.color (a one-off override on a specific heading) still wins.
  const style = {
    ...typographyStyle(block, scale?.fontFamily || resolveTitleFont(globalStyle)),
    color: block.color || scale?.color || globalStyle.primaryColor,
    fontSize: block.fontSize ? `${block.fontSize}px` : scale ? `${scale.sizePx}px` : undefined,
  }
  return (
    <Tag
      className={`whitespace-pre-line ${sizeClass} ${textStyleClasses(block)} ${
        block.rule ? 'border-b border-slate-200 pb-1.5' : ''
      }`}
      style={style}
    >
      {displayText(translateSectionTitle(resolvedContent, globalStyle.contentLanguage, titleOverrides), block)}
    </Tag>
  )
}
