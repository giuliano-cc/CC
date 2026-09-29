import {
  BLOCK_TYPES,
  CHART_STYLES,
  CONTENT_LIBRARY_PALETTE_ITEMS,
  HEADING_SIZE_PX,
  NESTABLE_BLOCK_DEFINITIONS,
} from '../../utils/blockTypes'
import { CONTENT_SLOTS, useContentLibrary } from '../../context/ContentLibraryContext'
import { getPlatformMeta, normalizeUrl, parseSocialLinks } from '../../utils/socialIcons'
import { formatEntryDate, parseChecklist, parseEntries, parseLanguages, sortEntriesByDate } from '../../utils/contentLists'
import { translateSectionTitle } from '../../utils/sectionTitles'
import { Globe, Image as ImageIcon, Mail, MapPin, Phone, RefreshCw } from 'lucide-react'
import QRCodeImage from './QRCodeImage'

// Shared by Experience/Education and a Text block bound to an 'entries'
// slot (Selected Works): the title is always bold and always item.title —
// it never swaps with the location/date line. What cycles is only (a)
// whether the title's own line comes before or after the combined
// location + date line, and (b) within that combined line, whether the
// date comes before or after the location. The description always stays
// exactly where it is. Same "cycle style" hover button pattern as the
// chart blocks (see Chart below), so all three entry blocks share one
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

function EntryLayoutCycleButton({ block, onUpdateBlock }) {
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

function alignClass(align) {
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

function textStyleClasses(block) {
  return [
    block.bold ? 'font-bold' : '',
    block.italic ? 'italic' : '',
    block.underline ? 'underline' : '',
    TEXT_TRANSFORM_CLASSES[block.textTransform] || '',
    alignClass(block.align),
  ].join(' ')
}

function textTransformStyle(block) {
  return block.textTransform === 'smallCaps' ? { fontVariant: 'small-caps' } : undefined
}

// Minor words stay lowercase in Title Case, unless they're the first or
// last word — the common English title-casing convention (vs. Start
// Case, which capitalizes every word unconditionally).
const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of',
  'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'vs', 'via',
])

function toTitleCase(text) {
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

// Applied to the actual rendered string (not via a style/class, since
// only titleCase needs it — everything else is textStyleClasses/
// textTransformStyle above).
function displayText(text, block) {
  if (block.textTransform === 'titleCase' && typeof text === 'string') {
    return toTitleCase(text)
  }
  return text
}

// Section/entry titles (Experience, Education, Contact Info, chart
// titles, ...) don't go through the same block.bold/italic/textTransform/
// textStyleClasses fields a plain Heading or Text block does — they're
// always-bold, dedicated-field titles of their own (titleItalic/
// titleTextTransform, entryTitleItalic/entryTitleTextTransform), set from
// the Global Style panel's "Text styles used in this template" editor
// (see PropertiesPanel.jsx's applyTypographyChange). `field` is which of
// those two field-name pairs to read.
function titleTextTransformValue(text, block, field) {
  return block[`${field}TextTransform`] === 'titleCase' && typeof text === 'string' ? toTitleCase(text) : text
}
function titleTextTransformStyle(block, field) {
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
function visibleEntryParts(block, subLine, dateRange) {
  const showLocation = !block.titleOnly && block.showEntryLocation !== false
  const showDate = !block.titleOnly && block.showEntryDate !== false
  return { subLine: showLocation ? subLine : '', dateRange: showDate ? dateRange : '' }
}
function showEntryDescription(block) {
  return !block.titleOnly && block.showEntryDescription !== false
}

// Global Style's Title/Body font fields fall back to the legacy single
// `fontFamily` (a template saved before they existed only has that one),
// and ultimately to `undefined` (inherit the page's own — see Canvas.jsx,
// which sets the page itself to the body font) if neither is set either.
function resolveTitleFont(globalStyle) {
  return globalStyle.titleFontFamily || globalStyle.fontFamily || undefined
}
function resolveBodyFont(globalStyle) {
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
function typographyStyle(block, fallbackFont, fallbackSizePx) {
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

const HEADING_SIZE_CLASSES = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
}

// See the HEADING case below.
const HEADING_SCALE_LEVEL_BY_SIZE = { xl: 'h1', lg: 'h2', md: 'h3' }

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
function sectionTitleStyle(block, color, fallbackFont) {
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
// without having to rewrite it.
function useResolvedContent(block, globalStyle) {
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)
  if (block.contentSlot && block.contentSlot in library) {
    return library[block.contentSlot]
  }
  return block.content
}

// Best-effort icon for a contact line: email/phone/website get their own
// icon, and anything else (a city, a street address, ...) falls back to a
// pin, since that's virtually always what's left in a resume header's
// contact line.
function guessContactIcon(text) {
  if (/@/.test(text)) return Mail
  if (/^[+()]?[\d\s().-]{6,}$/.test(text)) return Phone
  if (/^(https?:\/\/|www\.)|\.[a-z]{2,}(\/|$)/i.test(text)) return Globe
  return MapPin
}

function SkillBar({ label, level, color }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-400">{level}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, level))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function SkillDots({ label, level, color, dotSize = 10, dotCount = 5 }) {
  const filled = Math.round((Math.max(0, Math.min(100, level)) / 100) * dotCount)
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: dotCount }).map((_, i) => (
          <span
            key={i}
            className="shrink-0 rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: i < filled ? color : '#e2e8f0',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Shared by the Technical Skills and Languages chart blocks: same three
// styles (bars/dots/tags), same "cycle style" hover button, same dot-size
// control — only the underlying items differ.
function Chart({ block, items, onUpdateBlock, accentColor, titleFont, lang, titleOverrides }) {
  const chartStyle = block.chartStyle || 'bars'
  const showTitle = block.title && block.showTitle !== false
  return (
    <div className="group/chart flex flex-col gap-3">
      <div className={`flex items-end justify-between ${showTitle && block.titleRule !== false ? 'border-b border-slate-200 pb-1.5' : ''}`}>
        {showTitle && (
          <p style={sectionTitleStyle(block, block.titleColor || accentColor, titleFont)}>
            {titleTextTransformValue(translateSectionTitle(block.title, lang, titleOverrides), block, 'title')}
          </p>
        )}
        {onUpdateBlock && (
          <button
            type="button"
            data-no-drag
            title="Switch chart style"
            onClick={(event) => {
              event.stopPropagation()
              const next = CHART_STYLES[(CHART_STYLES.indexOf(chartStyle) + 1) % CHART_STYLES.length]
              onUpdateBlock({ chartStyle: next })
            }}
            className="invisible flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary group-hover/chart:visible"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>
      {chartStyle === 'tags' ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <SkillTag key={i} label={item.label} color={block.color || accentColor} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item, i) =>
            chartStyle === 'dots' ? (
              <SkillDots
                key={i}
                label={item.label}
                level={item.level}
                color={block.color || accentColor}
                dotSize={block.dotSize}
                dotCount={block.dotCount || 5}
              />
            ) : (
              <SkillBar key={i} label={item.label} level={item.level} color={block.color || accentColor} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function SkillTag({ label, color }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}

function SocialBadge({ platform, url }) {
  const meta = getPlatformMeta(platform)
  return (
    <a
      href={normalizeUrl(url)}
      target="_blank"
      rel="noreferrer"
      title={url}
      data-no-drag
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 no-underline hover:opacity-80"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-slate-400 bg-transparent text-[10px] font-bold text-slate-400">
        {meta.badge}
      </span>
      <span className="max-w-[9rem] truncate text-xs text-slate-600 underline">{url}</span>
    </a>
  )
}

export default function BlockRenderer({
  block,
  interactive = false,
  selectedId = null,
  onSelectItem,
  onAddItem,
  onUpdateBlock,
  globalStyle = {},
}) {
  const resolvedContent = useResolvedContent(block, globalStyle)
  const { getLibrary, getTitleOverrides } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)
  const titleOverrides = getTitleOverrides(globalStyle.contentLanguage)

  switch (block.type) {
    case BLOCK_TYPES.HEADER:
      return (
        <div
          className={`border-b border-slate-200 pb-3 text-lg ${textStyleClasses(block)}`}
          style={textTransformStyle(block)}
        >
          {displayText(resolvedContent, block)}
        </div>
      )

    case BLOCK_TYPES.CV_HEADER: {
      const isStacked = block.layout === 'stacked'
      const resolvedName = block.nameSlot ? library[block.nameSlot] ?? '' : block.name
      const resolvedContacts = block.contactsSlot
        ? (library[block.contactsSlot] || '').split('\n').filter(Boolean)
        : block.contacts
      const resolvedUsp = block.uspSlot ? library[block.uspSlot] || '' : block.usp
      return (
        <div
          className={`flex ${isStacked ? 'items-start' : 'flex-wrap items-baseline'} justify-between gap-4 border-b border-slate-200 pb-4`}
        >
          <div>
            <p
              className="whitespace-pre-line text-lg font-bold leading-tight"
              style={{ color: block.color || undefined, fontFamily: resolveTitleFont(globalStyle) }}
            >
              {resolvedName}
            </p>
            {block.role && <p className="text-sm text-slate-500">{block.role}</p>}
            {resolvedUsp && <p className="mt-1 text-sm italic text-slate-600">{resolvedUsp}</p>}
          </div>
          {resolvedContacts?.length > 0 && (
            <div
              className={`flex text-xs text-slate-500 ${
                isStacked ? 'flex-col items-end gap-1' : 'flex-wrap justify-end gap-4'
              }`}
            >
              {resolvedContacts.map((contact, i) => {
                const Icon = block.showContactIcons ? guessContactIcon(contact) : null
                return (
                  <span key={i} className="flex items-center gap-1">
                    {Icon && <Icon size={12} className="shrink-0 text-slate-400" />}
                    {contact}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    case BLOCK_TYPES.HEADING: {
      const Tag = block.level || 'h1'
      const sizeClass = block.fontSize ? '' : HEADING_SIZE_CLASSES[block.size] || HEADING_SIZE_CLASSES.md
      // Heading's own "sm/md/lg/xl" size preset maps onto the Global
      // Style typography scale's H3/–/H2/H1 (xl reads as "H1" here since
      // it's the biggest of the four, same as "H1 (lg)" already being the
      // largest row in "Text styles used in this template" below) — 'sm'
      // stays on the fixed HEADING_SIZE_PX baseline, since it's a small
      // compact heading rather than part of the H1-H3 scale. Only used
      // when the block has no `fontSize` of its own.
      const scale = globalStyle.typographyScale?.[HEADING_SCALE_LEVEL_BY_SIZE[block.size]]
      // A heading with no color of its own tracks the template's primary
      // (accent) color, not the plain body text color it'd otherwise
      // inherit — every built-in template's headings are deliberately
      // accent-colored section titles, so this is what actually lets the
      // Global Style panel's "Primary color" affect them. An explicit
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

    case BLOCK_TYPES.TEXT: {
      // A Text block bound to a Content Library field shows that field's
      // name as a title when block.showTitle is explicitly true — set by
      // default for newly dragged-in blocks (see TEXT's defaultProps), so
      // any library field can be dropped in as a titled section without a
      // dedicated block type for each one. Blocks saved before this option
      // existed have no showTitle field at all and stay untitled, since
      // the built-in templates already pair these bindings with their own
      // separate Heading block.
      const boundSlot = block.contentSlot ? CONTENT_SLOTS.find((s) => s.key === block.contentSlot) : null
      const autoTitle = block.titleText || translateSectionTitle(boundSlot?.label, globalStyle.contentLanguage, titleOverrides)
      const title = block.showTitle === true && autoTitle ? autoTitle : null
      const bodyFont = resolveBodyFont(globalStyle)

      // A Text block bound to an "entries" library slot (e.g. Selected
      // Works: Title / City, Country / dates / Description) renders each
      // entry structurally instead of as flat text — the same shape as
      // the dedicated Experience/Education blocks. The block's own Font/
      // Size/Text color fields (the same ones a plain paragraph already
      // reads via typographyStyle) apply here too, to the title and
      // description — overriding the title/body font and the default P1
      // body size when set, exactly like every other Text block.
      const p1SizePx = globalStyle.typographyScale?.p1?.sizePx
      // Entry title styling is its own identity (see EntryTitleStyleFields/
      // getTemplateTypographyStyles' 'entryTitle' row), shared with the
      // dedicated Experience/Education blocks — kept separate from
      // `fontFamily`/`fontSize`/`color` above, which style the body/
      // description text instead, so the two don't drift onto whatever the
      // generic "Body text" row says.
      const entryTitleFont = block.entryTitleFontFamily || resolveTitleFont(globalStyle)
      const entryBodyFont = block.fontFamily || bodyFont
      const entrySizePx = block.fontSize || p1SizePx
      const entryTitleSizePx = block.entryTitleFontSize || 16
      // Letter spacing/line height/background color are block-level
      // typography controls (same as `typographyStyle` below applies to a
      // plain paragraph) — entries render structurally instead of as flat
      // text, but should still honor them the same way.
      const entryExtraStyle = {
        letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
        lineHeight: block.lineHeight || undefined,
        backgroundColor: block.bgColor || undefined,
      }
      const entryMetaStyle = {
        fontFamily: entryBodyFont,
        fontSize: entrySizePx ? `${entrySizePx}px` : undefined,
        ...entryExtraStyle,
      }
      const entriesRawItems = boundSlot?.type === 'entries' ? parseEntries(library[`${boundSlot.key}Items`], library[boundSlot.key]) : []
      const entriesItems = block.sortByDate !== false ? sortEntriesByDate(entriesRawItems) : entriesRawItems
      const body = boundSlot?.type === 'entries' ? (
        <div className={`group/entries relative flex flex-col gap-3 ${alignClass(block.align)}`}>
          <EntryLayoutCycleButton block={block} onUpdateBlock={onUpdateBlock} />
          {entriesItems.map((item, i) => {
            const subLine = [item.subtitle, item.location].filter((v) => v?.trim()).join(', ')
            const dateRange = [
              formatEntryDate(item.startDate, globalStyle.dateFormat),
              item.current ? 'Present' : formatEntryDate(item.endDate, globalStyle.dateFormat),
            ]
              .filter((v) => v?.trim())
              .join(' – ')
            const { subLine: subLineVisible, dateRange: dateRangeVisible } = visibleEntryParts(block, subLine, dateRange)
            const titleStyle = {
              fontFamily: entryTitleFont,
              fontSize: `${entryTitleSizePx}px`,
              fontWeight: block.entryTitleBold === false ? 400 : 700,
              color: block.entryTitleColor || globalStyle.textColor,
              ...entryExtraStyle,
              ...titleTextTransformStyle(block, 'entryTitle'),
            }
            // The title is always item.title, always bold — it never
            // swaps with the location/date line. What cycles (via
            // EntryLayoutCycleButton above) is only which line comes
            // first (locationFirst) and, within the combined location +
            // date line, which of those two comes first (dateFirst).
            const subtitleSeparator = block.subtitleSeparator ?? ' / '
            const secondaryLine = (block.dateFirst ? [dateRangeVisible, subLineVisible] : [subLineVisible, dateRangeVisible])
              .filter(Boolean)
              .join(subtitleSeparator)
            const titleNode = item.title && (
              <p className="text-base font-bold" style={titleStyle}>
                {titleTextTransformValue(item.title, block, 'entryTitle')}
              </p>
            )
            const secondaryNode = secondaryLine && (
              <p className="text-sm text-slate-500" style={entryMetaStyle}>
                {secondaryLine}
              </p>
            )
            return (
              <div key={item.id || i} className="flex flex-col gap-0.5">
                {block.titleOnly ? (
                  titleNode
                ) : block.titleLocationInline ? (
                  <>
                    {(item.title || subLineVisible) && (
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold" style={titleStyle}>
                          {titleTextTransformValue(item.title, block, 'entryTitle')}
                        </span>
                        <span className="text-sm text-slate-500" style={entryMetaStyle}>
                          {subLineVisible}
                        </span>
                      </p>
                    )}
                    {dateRangeVisible && (
                      <p className="text-sm text-slate-500" style={entryMetaStyle}>
                        {dateRangeVisible}
                      </p>
                    )}
                  </>
                ) : block.locationFirst ? (
                  <>
                    {secondaryNode}
                    {titleNode}
                  </>
                ) : (
                  <>
                    {titleNode}
                    {secondaryNode}
                  </>
                )}
                {showEntryDescription(block) && (() => {
                  if (!item.description) return null
                  const descriptionStyle = {
                    fontFamily: entryBodyFont,
                    fontSize: entrySizePx ? `${entrySizePx}px` : undefined,
                    color: block.color || undefined,
                    ...entryExtraStyle,
                  }
                  if (block.list === false) {
                    return (
                      <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-600" style={descriptionStyle}>
                        {item.description}
                      </p>
                    )
                  }
                  const descriptionLines = item.description.split('\n').filter(Boolean)
                  return (
                    descriptionLines.length > 0 && (
                      <ul
                        className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400"
                        style={descriptionStyle}
                      >
                        {descriptionLines.map((line, li) => (
                          <li key={li}>{line}</li>
                        ))}
                      </ul>
                    )
                  )
                })()}
              </div>
            )
          })}
        </div>
      ) : block.list ? (
        (() => {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400 ${alignClass(block.align)}`}
              style={typographyStyle(block, bodyFont, globalStyle.typographyScale?.p1?.sizePx)}
            >
              {resolvedContent.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className={textStyleClasses({ ...block, align: undefined })}>
                  {displayText(line, block)}
                </li>
              ))}
            </ListTag>
          )
        })()
      ) : (
        <p
          className={`whitespace-pre-line text-sm leading-relaxed ${textStyleClasses(block)}`}
          style={typographyStyle(block, bodyFont, globalStyle.typographyScale?.p1?.sizePx)}
        >
          {displayText(resolvedContent, block)}
        </p>
      )

      if (!title) return body
      return (
        <div className={`flex flex-col gap-1.5 ${alignClass(block.align)}`}>
          <p
            className={block.titleRule !== false ? 'border-b border-slate-200 pb-1.5' : ''}
            style={sectionTitleStyle(
              {
                titleSize: block.titleSize,
                fontFamily: block.fontFamily,
                fontSize: block.titleFontSize,
                titleBold: block.titleBold,
                titleItalic: block.titleItalic,
                titleTextTransform: block.titleTextTransform,
              },
              block.titleColor || globalStyle.primaryColor,
              resolveTitleFont(globalStyle),
            )}
          >
            {titleTextTransformValue(title, block, 'title')}
          </p>
          {body}
        </div>
      )
    }

    case BLOCK_TYPES.IMAGE: {
      const justify =
        block.align === 'center'
          ? 'justify-center'
          : block.align === 'right'
            ? 'justify-end'
            : 'justify-start'
      const isCircle = block.shape === 'circle'
      const resolvedSrc = block.imageSlot ? library[block.imageSlot] || '' : block.src
      // The image fills its block's own width/height instead of a fixed
      // size, so dragging the block's resize handles actually scales the
      // picture — it used to stay a fixed 112px/160px regardless of how
      // big the block was resized to. A circle photo stays a perfect
      // circle (sized to fit within the block, capped by whichever of its
      // width/height is smaller) instead of stretching into an oval when
      // the block itself isn't square — most circle photos land in a
      // block that's wider than tall (auto-placed at the page's full
      // content width), and object-cover alone would just squash them.
      const imageShapeClasses = isCircle
        ? 'aspect-square h-full max-w-full rounded-full'
        : 'h-full w-full rounded-md'
      return (
        <div className={`flex h-full w-full ${justify}`}>
          {resolvedSrc ? (
            <img src={resolvedSrc} alt={block.alt} className={`${imageShapeClasses} object-cover`} />
          ) : (
            <div
              className={`flex items-center justify-center border border-dashed border-slate-300 text-slate-300 ${imageShapeClasses}`}
            >
              <ImageIcon size={28} />
            </div>
          )}
        </div>
      )
    }

    case BLOCK_TYPES.DIVIDER: {
      const isVertical = block.orientation === 'vertical'
      const thickness = block.thickness ?? 1
      const style = isVertical
        ? {
            width: 0,
            height: '100%',
            marginInline: 'auto',
            borderLeftWidth: thickness,
            borderLeftStyle: block.lineStyle || 'solid',
            borderLeftColor: block.color || '#e2e8f0',
          }
        : {
            width: '100%',
            height: 0,
            marginBlock: 'auto',
            borderTopWidth: thickness,
            borderTopStyle: block.lineStyle || 'solid',
            borderTopColor: block.color || '#e2e8f0',
          }
      return <div style={style} />
    }

    case BLOCK_TYPES.SHAPE: {
      const isCircleShape = block.shape === 'circle'
      const style = {
        width: '100%',
        height: '100%',
        backgroundColor: block.color || 'transparent',
        borderRadius: isCircleShape ? '9999px' : block.borderRadius || 0,
        opacity: block.opacity ?? 1,
        borderStyle: block.borderWidth ? 'solid' : undefined,
        borderWidth: block.borderWidth || undefined,
        borderColor: block.borderColor || undefined,
      }
      return <div style={style} />
    }

    case BLOCK_TYPES.QUOTE: {
      const resolvedAuthor = block.authorSlot ? library[block.authorSlot] || '' : block.author
      return (
        <blockquote
          className={`border-l-4 pl-3 text-sm text-slate-600 ${textStyleClasses(block)}`}
          style={{
            borderColor: globalStyle.primaryColor,
            ...typographyStyle(block, resolveBodyFont(globalStyle), globalStyle.typographyScale?.p1?.sizePx),
          }}
        >
          <p>{displayText(resolvedContent, block)}</p>
          {resolvedAuthor && (
            <footer className="mt-1.5 text-xs not-italic" style={{ color: globalStyle.primaryColor }}>
              — {resolvedAuthor}
            </footer>
          )}
        </blockquote>
      )
    }

    case BLOCK_TYPES.FOOTER:
      return (
        <div
          className={`border-t border-slate-200 pt-3 text-xs text-slate-500 ${textStyleClasses(block)}`}
          style={textTransformStyle(block)}
        >
          {displayText(resolvedContent, block)}
        </div>
      )

    case BLOCK_TYPES.SKILLS_CHART: {
      // `librarySource` names any checklist-type Content Library slot
      // (Technical Skills, Core Competencies, Achievements, ...), so this
      // one chart block can plot whichever list the "Content from
      // library" dropdown picked, not just Technical Skills.
      const source = block.librarySource || 'skills'
      const items = block.useLibrarySkills
        ? parseChecklist(library[`${source}Items`], library[source])
            .filter((i) => i.visible && i.text?.trim())
            .map((i) => ({ label: i.text, level: i.level ?? 75 }))
        : block.items
      return (
        <Chart
          block={block}
          items={items}
          onUpdateBlock={onUpdateBlock}
          accentColor={globalStyle.primaryColor}
          titleFont={resolveTitleFont(globalStyle)}
          lang={globalStyle.contentLanguage}
          titleOverrides={titleOverrides}
        />
      )
    }

    case BLOCK_TYPES.LANGUAGES_CHART: {
      const items = block.useLibraryLanguages
        ? parseLanguages(library.languagesItems, library.languages)
            .filter((i) => i.name?.trim())
            .map((i) => ({ label: i.name, level: i.level }))
        : block.items
      return (
        <Chart
          block={block}
          items={items}
          onUpdateBlock={onUpdateBlock}
          accentColor={globalStyle.primaryColor}
          titleFont={resolveTitleFont(globalStyle)}
          lang={globalStyle.contentLanguage}
          titleOverrides={titleOverrides}
        />
      )
    }

    case BLOCK_TYPES.QR_CODE: {
      const value = block.useLibraryValue ? library.qrValue : block.value
      const captionPosition = block.captionPosition || 'bottom'
      const isHorizontal = captionPosition === 'left' || captionPosition === 'right'
      const size = isHorizontal
        ? Math.max(20, block.height - 16)
        : Math.max(20, Math.min(block.width - 16, block.height - 32))
      const qr = <QRCodeImage value={value} size={size} />
      const caption = block.caption && <p className="text-xs text-slate-500">{block.caption}</p>
      const wrapperClass = {
        top: 'flex flex-col-reverse items-center gap-1.5',
        bottom: 'flex flex-col items-center gap-1.5',
        left: 'flex flex-row-reverse items-center gap-2.5',
        right: 'flex flex-row items-center gap-2.5',
      }[captionPosition]
      return (
        <div className={wrapperClass}>
          {qr}
          {caption}
        </div>
      )
    }

    case BLOCK_TYPES.SOCIAL_ICONS: {
      const items = block.useLibraryLinks
        ? parseSocialLinks(library.socialLinks).filter((i) => i.url)
        : block.items.filter((i) => i.url)
      const isStackedSocial = block.layout === 'stacked'
      const justify = isStackedSocial
        ? block.align === 'center'
          ? 'items-center'
          : block.align === 'right'
            ? 'items-end'
            : 'items-start'
        : block.align === 'center'
          ? 'justify-center'
          : block.align === 'right'
            ? 'justify-end'
            : 'justify-start'
      return (
        <div
          className={`flex gap-4 ${isStackedSocial ? `flex-col ${justify}` : `flex-wrap items-center ${justify}`}`}
        >
          {items.map((item, i) => (
            <SocialBadge key={i} platform={item.platform} url={item.url} />
          ))}
        </div>
      )
    }

    case BLOCK_TYPES.CONTACT_INFO: {
      const fields = block.useLibraryContact
        ? [
            { key: 'address', value: library.contactAddress, Icon: MapPin },
            { key: 'phone', value: library.contactPhone, Icon: Phone },
            { key: 'email', value: library.contactEmail, Icon: Mail },
            { key: 'website', value: library.contactWebsite, Icon: Globe },
          ]
        : [
            { key: 'address', value: block.address, Icon: MapPin },
            { key: 'phone', value: block.phone, Icon: Phone },
            { key: 'email', value: block.email, Icon: Mail },
            { key: 'website', value: block.website, Icon: Globe },
          ]
      const visible = fields.filter((f) => f.value?.trim())
      const isRowContact = block.layout === 'row'
      const alignItems = block.align === 'center' ? 'items-center' : block.align === 'right' ? 'items-end' : 'items-start'
      const justify =
        block.align === 'center' ? 'justify-center' : block.align === 'right' ? 'justify-end' : 'justify-start'
      return (
        <div className={`flex flex-col gap-1.5 ${isRowContact ? '' : alignItems}`}>
          {block.title && block.showTitle !== false && (
            <p
              className={`w-full ${alignClass(block.align)} ${block.titleRule !== false ? 'mb-0.5 border-b border-slate-200 pb-1.5' : ''}`}
              style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor, resolveTitleFont(globalStyle))}
            >
              {titleTextTransformValue(translateSectionTitle(block.title, globalStyle.contentLanguage, titleOverrides), block, 'title')}
            </p>
          )}
          <div
            className={`flex text-sm text-slate-600 ${
              isRowContact ? `flex-wrap items-center gap-x-4 gap-y-1.5 ${justify}` : `flex-col gap-1.5 ${alignItems}`
            }`}
            style={{
              fontFamily: resolveBodyFont(globalStyle),
              fontSize: block.bodyFontSize
                ? `${block.bodyFontSize}px`
                : globalStyle.typographyScale?.p1?.sizePx
                  ? `${globalStyle.typographyScale.p1.sizePx}px`
                  : undefined,
              lineHeight: block.lineSpacing || undefined,
              rowGap: block.lineSpacing && !isRowContact ? `${block.lineSpacing * 6}px` : undefined,
            }}
          >
            {visible.map((f) => (
              <span key={f.key} className="flex items-center gap-2">
                {block.showIcons && <f.Icon size={14} className="shrink-0 text-slate-400" />}
                {f.value}
              </span>
            ))}
          </div>
        </div>
      )
    }

    case BLOCK_TYPES.LEISURE: {
      const items = block.useLibraryHobbies
        ? parseChecklist(library.hobbiesItems, library.hobbies)
            .filter((i) => i.visible && i.text?.trim())
            .map((i) => i.text)
        : block.items
      return (
        <div className={`flex flex-col gap-2 ${alignClass(block.align)}`}>
          {block.title && block.showTitle !== false && (
            <p
              className={block.titleRule !== false ? 'border-b border-slate-200 pb-1.5' : ''}
              style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor, resolveTitleFont(globalStyle))}
            >
              {titleTextTransformValue(translateSectionTitle(block.title, globalStyle.contentLanguage, titleOverrides), block, 'title')}
            </p>
          )}
          <ul
            className="list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400"
            style={{ fontFamily: resolveBodyFont(globalStyle) }}
          >
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )
    }

    case BLOCK_TYPES.EXPERIENCE:
    case BLOCK_TYPES.EDUCATION: {
      const isExperience = block.type === BLOCK_TYPES.EXPERIENCE
      const librarySlot = isExperience ? 'experience' : 'education'
      const usesLibrary = isExperience ? block.useLibraryExperience : block.useLibraryEducation
      const rawItems = usesLibrary
        ? parseEntries(library[`${librarySlot}Items`], library[librarySlot])
        : block.items || []
      const items = block.sortByDate !== false ? sortEntriesByDate(rawItems) : rawItems
      const bodyFont = resolveBodyFont(globalStyle)
      // Falls back to the plain Text color (not left unset) so it's
      // never stuck on the browser's default black regardless of what
      // Global Style's Text color / entry-title row say — matching the
      // fallback the Global Style "Text styles used" row itself displays.
      const entryTitleStyle = {
        fontSize: block.entryTitleFontSize ? `${block.entryTitleFontSize}px` : undefined,
        fontWeight: block.entryTitleBold === false ? 400 : 700,
        color: block.entryTitleColor || globalStyle.textColor,
        fontFamily: block.entryTitleFontFamily || resolveTitleFont(globalStyle),
        ...titleTextTransformStyle(block, 'entryTitle'),
      }
      return (
        <div className={`group/entries relative flex flex-col gap-3 ${alignClass(block.align)}`}>
          <EntryLayoutCycleButton block={block} onUpdateBlock={onUpdateBlock} />
          {block.title && block.showTitle !== false && (
            <p
              className={block.titleRule !== false ? 'border-b border-slate-200 pb-1.5' : ''}
              style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor, resolveTitleFont(globalStyle))}
            >
              {titleTextTransformValue(translateSectionTitle(block.title, globalStyle.contentLanguage, titleOverrides), block, 'title')}
            </p>
          )}
          {items.map((item, i) => {
            const subLine = [item.subtitle, item.location].filter((v) => v?.trim()).join(', ')
            const dateRange = [
              formatEntryDate(item.startDate, globalStyle.dateFormat),
              item.current ? 'Present' : formatEntryDate(item.endDate, globalStyle.dateFormat),
            ]
              .filter((v) => v?.trim())
              .join(' – ')
            const { subLine: subLineVisible, dateRange: dateRangeVisible } = visibleEntryParts(block, subLine, dateRange)
            const descriptionLines = (item.description || '').split('\n').filter(Boolean)
            const bodyStyle = {
              fontFamily: bodyFont,
              fontSize: block.bodyFontSize
                ? `${block.bodyFontSize}px`
                : globalStyle.typographyScale?.p1?.sizePx
                  ? `${globalStyle.typographyScale.p1.sizePx}px`
                  : undefined,
              lineHeight: block.lineSpacing || undefined,
            }
            // The title is always item.title, always bold — it never
            // swaps with the location/date line. What cycles (via
            // EntryLayoutCycleButton above) is only which line comes
            // first (locationFirst) and, within the combined location +
            // date line, which of those two comes first (dateFirst).
            const subtitleSeparator = block.subtitleSeparator ?? ' / '
            const secondaryLine = (block.dateFirst ? [dateRangeVisible, subLineVisible] : [subLineVisible, dateRangeVisible])
              .filter(Boolean)
              .join(subtitleSeparator)
            const titleNode = item.title && (
              <p className="text-base font-bold" style={entryTitleStyle}>
                {titleTextTransformValue(item.title, block, 'entryTitle')}
              </p>
            )
            const secondaryNode = secondaryLine && (
              <p className="text-sm text-slate-500" style={bodyStyle}>
                {secondaryLine}
              </p>
            )
            return (
              <div key={item.id || i} className="flex flex-col gap-0.5">
                {block.titleOnly ? (
                  titleNode
                ) : block.titleLocationInline ? (
                  <>
                    {(item.title || subLineVisible) && (
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold" style={entryTitleStyle}>
                          {titleTextTransformValue(item.title, block, 'entryTitle')}
                        </span>
                        <span className="text-sm text-slate-500" style={bodyStyle}>
                          {subLineVisible}
                        </span>
                      </p>
                    )}
                    {dateRangeVisible && (
                      <p className="text-sm text-slate-500" style={bodyStyle}>
                        {dateRangeVisible}
                      </p>
                    )}
                  </>
                ) : block.locationFirst ? (
                  <>
                    {secondaryNode}
                    {titleNode}
                  </>
                ) : (
                  <>
                    {titleNode}
                    {secondaryNode}
                  </>
                )}
                {showEntryDescription(block) &&
                  item.description &&
                  (block.list === false ? (
                    <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-600" style={bodyStyle}>
                      {item.description}
                    </p>
                  ) : (
                    descriptionLines.length > 0 && (
                      <ul
                        className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400"
                        style={bodyStyle}
                      >
                        {descriptionLines.map((line, li) => (
                          <li key={li}>{line}</li>
                        ))}
                      </ul>
                    )
                  ))}
              </div>
            )
          })}
        </div>
      )
    }

    case BLOCK_TYPES.COLUMNS: {
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

    default:
      return null
  }
}
