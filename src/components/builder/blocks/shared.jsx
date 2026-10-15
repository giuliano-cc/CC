import { HEADING_SIZE_PX } from '../../../utils/blockTypes'
import { RefreshCw } from 'lucide-react'

// Shared by Experience/Education and a Text block bound to an 'entries'
// slot (Selected Works): the title is always bold and always item.title —
// it never swaps with the location/date line. What cycles is only (a)
// whether the title's own line comes before or after the combined
// location + date line, and (b) within that combined line, whether the
// date comes before or after the location. The description always stays
// exactly where it is. Same "cycle style" hover button pattern as the
// chart blocks (see Chart.jsx), so all three entry blocks share one
// control for it. Doesn't touch titleLocationInline (the separate "title
// and location on the same line" checkbox) — that's its own toggle.
const ENTRY_LAYOUT_MODES = [
  { locationFirst: false, dateFirst: false },
  { locationFirst: false, dateFirst: true },
  { locationFirst: true, dateFirst: false },
  { locationFirst: true, dateFirst: true },
]

function entryLayoutIndex(block) {
  const index = ENTRY_LAYOUT_MODES.findIndex(
    (m) => !!m.locationFirst === !!block.locationFirst && !!m.dateFirst === !!block.dateFirst,
  )
  return index === -1 ? 0 : index
}

export function EntryLayoutCycleButton({ block, onUpdateBlock }) {
  if (!onUpdateBlock) return null
  return (
    <button
      type="button"
      data-no-drag
      title="Cycle title/location layout"
      onClick={(event) => {
        event.stopPropagation()
        const next = ENTRY_LAYOUT_MODES[(entryLayoutIndex(block) + 1) % ENTRY_LAYOUT_MODES.length]
        onUpdateBlock(next)
      }}
      className="invisible absolute right-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary group-hover/entries:visible"
    >
      <RefreshCw size={13} />
    </button>
  )
}

export function alignClass(align) {
  return align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
}

// `uppercase`/`startCase` are pure CSS (Tailwind's text-transform utility
// classes — `capitalize` is CSS's own text-transform:capitalize, which
// unconditionally capitalizes every word, i.e. "Start Case"). `smallCaps`
// is a font-variant, not a text-transform, so it's applied as an inline
// style instead (see textTransformStyle below). `titleCase` needs to
// actually skip minor words (a/the/of/...), which CSS can't express at
// all, so it's applied by transforming the displayed string itself (see
// toTitleCase/displayText below) rather than by any style.
const TEXT_TRANSFORM_CLASSES = {
  uppercase: 'uppercase',
  startCase: 'capitalize',
}

export function textStyleClasses(block) {
  return [
    block.bold ? 'font-bold' : '',
    block.italic ? 'italic' : '',
    block.underline ? 'underline' : '',
    TEXT_TRANSFORM_CLASSES[block.textTransform] || '',
    alignClass(block.align),
  ].join(' ')
}

export function textTransformStyle(block) {
  return block.textTransform === 'smallCaps' ? { fontVariant: 'small-caps' } : undefined
}

// Minor words stay lowercase in Title Case, unless they're the first or
// last word — the common English title-casing convention (vs. Start
// Case, which capitalizes every word unconditionally).
const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of',
  'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'vs', 'via',
])

export function toTitleCase(text) {
  const tokens = text.split(/(\s+)/)
  const wordIndexes = tokens.map((t, i) => (i % 2 === 0 && t ? i : -1)).filter((i) => i !== -1)
  const lastWordToken = wordIndexes[wordIndexes.length - 1]
  return tokens
    .map((token, i) => {
      if (i % 2 === 1 || !token) return token
      const lower = token.toLowerCase()
      const isEdge = i === wordIndexes[0] || i === lastWordToken
      if (!isEdge && TITLE_CASE_MINOR_WORDS.has(lower)) return lower
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
    })
    .join('')
}

// The one bit of inline rich text a block's otherwise-flat content string
// supports: "[label](url)" becomes a real hyperlink wherever it appears —
// e.g. "...visit [my portfolio site.](https://example.com)". Deliberately
// just this one markdown-style pattern rather than a full WYSIWYG editor,
// since content is still edited as plain text (a <textarea>); this reads
// naturally there and is trivial to type by hand. `mailto:` is allowed
// alongside `http(s)://` so an email address can be linked the same way.
const INLINE_LINK_PATTERN = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g

// Splits `text` on INLINE_LINK_PATTERN into an array of plain strings and
// <a> elements — safe to render directly as JSX children (never raw HTML,
// so nothing here can inject markup). `transform` mirrors displayText's
// titleCase handling per segment, since that still can't be done via CSS
// the way uppercase/smallCaps can (see textTransformStyle).
function renderInlineLinks(text, transform) {
  if (typeof text !== 'string' || !text.includes('](')) {
    return transform === 'titleCase' && typeof text === 'string' ? toTitleCase(text) : text
  }
  const applyTransform = (segment) => (transform === 'titleCase' ? toTitleCase(segment) : segment)
  const nodes = []
  let lastIndex = 0
  INLINE_LINK_PATTERN.lastIndex = 0
  let match
  while ((match = INLINE_LINK_PATTERN.exec(text))) {
    if (match.index > lastIndex) nodes.push(applyTransform(text.slice(lastIndex, match.index)))
    nodes.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        onClick={(e) => e.stopPropagation()}
      >
        {applyTransform(match[1])}
      </a>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) nodes.push(applyTransform(text.slice(lastIndex)))
  return nodes
}

// Applied to the actual rendered string (not via a style/class, since
// only titleCase needs it — everything else is textStyleClasses/
// textTransformStyle above) — and now also where an inline "[label](url)"
// link needs turning into a real <a>, see renderInlineLinks.
export function displayText(text, block) {
  return renderInlineLinks(text, block.textTransform)
}

// Section/entry titles (Experience, Education, Contact Info, chart
// titles, ...) don't go through the same block.bold/italic/textTransform/
// textStyleClasses fields a plain Heading or Text block does — they're
// always-bold, dedicated-field titles of their own (titleItalic/
// titleTextTransform, entryTitleItalic/entryTitleTextTransform), set from
// the Global Style panel's "Text styles used in this template" editor
// (see PropertiesPanel.jsx's applyTypographyChange). `field` is which of
// those two field-name pairs to read.
export function titleTextTransformValue(text, block, field) {
  return block[`${field}TextTransform`] === 'titleCase' && typeof text === 'string' ? toTitleCase(text) : text
}
export function titleTextTransformStyle(block, field) {
  const transform = block[`${field}TextTransform`]
  return {
    fontStyle: block[`${field}Italic`] ? 'italic' : undefined,
    textTransform: transform === 'uppercase' ? 'uppercase' : transform === 'startCase' ? 'capitalize' : undefined,
    fontVariant: transform === 'smallCaps' ? 'small-caps' : undefined,
  }
}

// Independently hides an entry's own location/company line and/or its
// date range — `block.titleOnly` (an older, all-or-nothing "Minimal"
// toggle) still hides both, for a block saved before these existed.
export function visibleEntryParts(block, subLine, dateRange) {
  const showLocation = !block.titleOnly && block.showEntryLocation !== false
  const showDate = !block.titleOnly && block.showEntryDate !== false
  return { subLine: showLocation ? subLine : '', dateRange: showDate ? dateRange : '' }
}
export function showEntryDescription(block) {
  return !block.titleOnly && block.showEntryDescription !== false
}

// Whether one Content Library item is included in THIS block, honoring a
// per-block override (see PropertiesPanel.jsx's LibraryItemOverridesField)
// that lets a document show a different subset of a shared library list
// than what's checked in the catalog (ContentLibraryPage.jsx) — without
// ever changing the catalog itself. `catalogVisible` is the fallback when
// no override exists for that key (an entries item has no visibility
// flag of its own, so callers just pass `true`).
export function isLibraryItemShown(block, key, catalogVisible) {
  const override = block.libraryItemOverrides?.[key]
  return override !== undefined ? override : catalogVisible
}

// Global Style's Title/Body font fields fall back to the legacy single
// `fontFamily` (a template saved before they existed only has that one),
// and ultimately to `undefined` (inherit the page's own — see Canvas.jsx,
// which sets the page itself to the body font) if neither is set either.
export function resolveTitleFont(globalStyle) {
  return globalStyle.titleFontFamily || globalStyle.fontFamily || undefined
}
export function resolveBodyFont(globalStyle) {
  return globalStyle.bodyFontFamily || globalStyle.fontFamily || undefined
}

// Shared inline style for "rich" text blocks (heading/text/quote): font,
// size in px, letter spacing, line height, text and background color.
// `null`/`undefined` leave the value inherited from the sheet. `fallbackFont`
// is the global Title or Body font (whichever this block counts as), used
// only when the block has no `fontFamily` override of its own.
// `fallbackSizePx` is the Global Style typography scale's "P1" size (see
// DEFAULT_TYPOGRAPHY_SCALE in BuilderContext.jsx) — body text's own
// default when the block hasn't set a `fontSize` of its own, so editing
// P1 there reaches every body paragraph/list/quote that hasn't been
// individually resized, the same way editing P1 already does.
export function typographyStyle(block, fallbackFont, fallbackSizePx) {
  return {
    color: block.color || undefined,
    fontFamily: block.fontFamily || fallbackFont,
    fontSize: block.fontSize ? `${block.fontSize}px` : fallbackSizePx ? `${fallbackSizePx}px` : undefined,
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
    lineHeight: block.lineHeight || undefined,
    backgroundColor: block.bgColor || undefined,
    ...textTransformStyle(block),
  }
}

// Matches the template's own "section heading" convention (a HEADING
// block at level h2 — the same look every built-in template already
// uses for "Selected Works", "Core Competencies", etc.), so an
// auto-generated title (on the Contact Info, Leisure, Experience,
// Education and chart blocks, or on any Text block bound to a Content
// Library field) reads as a native section of that template rather
// than a smaller, invented label. Size defaults to 'md' but is
// block.titleSize (or a raw block.fontSize override) so it can be made
// to match a smaller/larger sibling heading — see getTemplateTypographyStyles,
// which tracks these same titles as pseudo-H2 rows so they can all be
// resized/recolored/re-fonted together from the Global Style panel.
// Font-family defaults to inheriting the page's own font; pair with the
// "border-b border-slate-200 pb-1.5" classes (on this element or, for a
// title that sits in a row with a button, on the row) to also match the
// underline rule those headings use.
export function sectionTitleStyle(block, color, fallbackFont) {
  const sizePx = block.fontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md
  return {
    fontSize: `${sizePx}px`,
    fontWeight: block.titleBold === false ? 400 : 700,
    color,
    fontFamily: block.fontFamily || fallbackFont,
    ...titleTextTransformStyle(block, 'title'),
  }
}

// A block can be "linked" to a Content Library entry (block.contentSlot):
// in that case the displayed text is read from the library instead of
// block.content, so the same content can be tried on different templates
// without having to rewrite it. Takes `library` rather than fetching it
// itself — the caller (BlockRenderer) already reads the content library
// for every block anyway, so resolving content this way is a plain
// function, not its own hook, and doesn't cost a second
// useContentLibrary()/getLibrary() call on top of the caller's own.
export function resolveContent(block, library) {
  if (block.contentSlot && block.contentSlot in library) {
    return library[block.contentSlot]
  }
  return block.content
}
