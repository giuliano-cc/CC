import {
  BLOCK_TYPES,
  CHART_STYLES,
  CONTENT_LIBRARY_PALETTE_ITEMS,
  HEADING_SIZE_PX,
  NESTABLE_BLOCK_DEFINITIONS,
} from '../../utils/blockTypes'
import { CONTENT_SLOTS, useContentLibrary } from '../../context/ContentLibraryContext'
import { getPlatformMeta, normalizeUrl, parseSocialLinks } from '../../utils/socialIcons'
import { parseChecklist, parseEntries, parseLanguages } from '../../utils/contentLists'
import { Globe, Image as ImageIcon, Mail, MapPin, Phone, RefreshCw } from 'lucide-react'
import QRCodeImage from './QRCodeImage'

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

// Shared inline style for "rich" text blocks (heading/text/quote): font,
// size in px, letter spacing, line height, text and background color.
// `null`/`undefined` leave the value inherited from the sheet.
function typographyStyle(block) {
  return {
    color: block.color || undefined,
    fontFamily: block.fontFamily || undefined,
    fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
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
function sectionTitleStyle(block, color) {
  const sizePx = block.fontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md
  return { fontSize: `${sizePx}px`, fontWeight: 700, color, fontFamily: block.fontFamily || undefined }
}

// A block can be "linked" to a Content Library entry (block.contentSlot):
// in that case the displayed text is read from the library instead of
// block.content, so the same content can be tried on different templates
// without having to rewrite it.
function useResolvedContent(block) {
  const { library } = useContentLibrary()
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

function SkillDots({ label, level, color, dotSize = 10 }) {
  const filled = Math.round((Math.max(0, Math.min(100, level)) / 100) * 5)
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
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
function Chart({ block, items, onUpdateBlock, accentColor }) {
  const chartStyle = block.chartStyle || 'bars'
  return (
    <div className="group/chart flex flex-col gap-3">
      <div className={`flex items-end justify-between ${block.title ? 'border-b border-slate-200 pb-1.5' : ''}`}>
        {block.title && (
          <p style={sectionTitleStyle(block, block.titleColor || accentColor)}>{block.title}</p>
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
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: meta.color }}
      >
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
  const resolvedContent = useResolvedContent(block)
  const { library } = useContentLibrary()

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
              style={{ color: block.color || undefined }}
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
      // A heading with no color of its own tracks the template's primary
      // (accent) color, not the plain body text color it'd otherwise
      // inherit — every built-in template's headings are deliberately
      // accent-colored section titles, so this is what actually lets the
      // Global Style panel's "Primary color" affect them. An explicit
      // block.color (a one-off override on a specific heading) still wins.
      const style = { ...typographyStyle(block), color: block.color || globalStyle.primaryColor }
      return (
        <Tag
          className={`whitespace-pre-line ${sizeClass} ${textStyleClasses(block)} ${
            block.rule ? 'border-b border-slate-200 pb-1.5' : ''
          }`}
          style={style}
        >
          {displayText(resolvedContent, block)}
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
      const slotLabel = block.contentSlot
        ? CONTENT_SLOTS.find((s) => s.key === block.contentSlot)?.label
        : null
      const title = block.showTitle === true && slotLabel ? slotLabel : null

      const body = block.list ? (
        (() => {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400 ${alignClass(block.align)}`}
              style={typographyStyle(block)}
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
          style={typographyStyle(block)}
        >
          {displayText(resolvedContent, block)}
        </p>
      )

      if (!title) return body
      return (
        <div className="flex flex-col gap-1.5">
          <p
            className="border-b border-slate-200 pb-1.5"
            style={sectionTitleStyle(
              { titleSize: block.titleSize, fontFamily: block.fontFamily, fontSize: block.titleFontSize },
              block.titleColor || globalStyle.primaryColor,
            )}
          >
            {title}
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

    case BLOCK_TYPES.QUOTE: {
      const resolvedAuthor = block.authorSlot ? library[block.authorSlot] || '' : block.author
      return (
        <blockquote
          className={`border-l-4 border-primary/40 pl-3 text-sm text-slate-600 ${textStyleClasses(block)}`}
          style={typographyStyle(block)}
        >
          <p>{displayText(resolvedContent, block)}</p>
          {resolvedAuthor && (
            <footer className="mt-1.5 text-xs not-italic text-slate-400">— {resolvedAuthor}</footer>
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
            .map((i) => ({ label: i.text, level: 75 }))
        : block.items
      return <Chart block={block} items={items} onUpdateBlock={onUpdateBlock} accentColor={globalStyle.primaryColor} />
    }

    case BLOCK_TYPES.LANGUAGES_CHART: {
      const items = block.useLibraryLanguages
        ? parseLanguages(library.languagesItems, library.languages)
            .filter((i) => i.name?.trim())
            .map((i) => ({ label: i.name, level: i.level }))
        : block.items
      return <Chart block={block} items={items} onUpdateBlock={onUpdateBlock} accentColor={globalStyle.primaryColor} />
    }

    case BLOCK_TYPES.QR_CODE: {
      const value = block.useLibraryValue ? library.qrValue : block.value
      return (
        <div className="flex flex-col items-center gap-1.5">
          <QRCodeImage value={value} size={Math.min(block.width - 16, block.height - 32)} />
          {block.caption && <p className="text-xs text-slate-500">{block.caption}</p>}
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
          {block.title && (
            <p
              className="mb-0.5 w-full border-b border-slate-200 pb-1.5"
              style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor)}
            >
              {block.title}
            </p>
          )}
          <div
            className={`flex text-sm text-slate-600 ${
              isRowContact ? `flex-wrap items-center gap-x-4 gap-y-1.5 ${justify}` : `flex-col gap-1.5 ${alignItems}`
            }`}
            style={{
              fontSize: block.bodyFontSize ? `${block.bodyFontSize}px` : undefined,
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
          {block.title && (
            <p
              className="border-b border-slate-200 pb-1.5"
              style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor)}
            >
              {block.title}
            </p>
          )}
          <ul className="list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400">
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
      const items = usesLibrary
        ? parseEntries(library[`${librarySlot}Items`], library[librarySlot])
        : block.items || []
      return (
        <div className={`flex flex-col gap-3 ${alignClass(block.align)}`}>
          {block.title && (
            <p
              className="border-b border-slate-200 pb-1.5"
              style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor)}
            >
              {block.title}
            </p>
          )}
          {items.map((item, i) => {
            const subLine = [item.subtitle, item.location].filter((v) => v?.trim()).join(', ')
            const dateRange = [item.startDate, item.current ? 'Present' : item.endDate]
              .filter((v) => v?.trim())
              .join(' – ')
            const descriptionLines = (item.description || '').split('\n').filter(Boolean)
            const bodyStyle = {
              fontSize: block.bodyFontSize ? `${block.bodyFontSize}px` : undefined,
              lineHeight: block.lineSpacing || undefined,
            }
            return (
              <div key={item.id || i} className="flex flex-col gap-0.5">
                {item.title && <p className="text-base font-bold">{item.title}</p>}
                {(subLine || dateRange) && (
                  <p className="text-sm text-slate-500" style={bodyStyle}>
                    {[subLine, dateRange].filter(Boolean).join(' / ')}
                  </p>
                )}
                {descriptionLines.length > 0 && (
                  <ul
                    className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400"
                    style={bodyStyle}
                  >
                    {descriptionLines.map((line, li) => (
                      <li key={li}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    case BLOCK_TYPES.COLUMNS: {
      const gridTemplateColumns = block.widths?.length
        ? block.widths.join(' ')
        : `repeat(${block.columns.length}, minmax(0, 1fr))`

      return (
        <div className="grid gap-x-8 gap-y-3" style={{ gridTemplateColumns }}>
          {block.columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-3">
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
