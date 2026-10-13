import { CONTENT_SLOTS } from '../../../context/ContentLibraryContext'
import {
  composeRecipientText,
  formatEntryDate,
  parseChecklist,
  parseEntries,
  parseRecipients,
  sortEntriesByDate,
} from '../../../utils/contentLists'
import { translateSectionTitle } from '../../../utils/sectionTitles'
import {
  EntryLayoutCycleButton,
  alignClass,
  displayText,
  isLibraryItemShown,
  resolveBodyFont,
  resolveTitleFont,
  sectionTitleStyle,
  showEntryDescription,
  textStyleClasses,
  titleTextTransformStyle,
  titleTextTransformValue,
  typographyStyle,
  visibleEntryParts,
} from './shared'

export default function renderTextBlock({ block, globalStyle, resolvedContent, library, titleOverrides, onUpdateBlock }) {
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
  const entriesRawItems =
    boundSlot?.type === 'entries'
      ? parseEntries(library[`${boundSlot.key}Items`], library[boundSlot.key]).filter((item) =>
          isLibraryItemShown(block, item.id, true),
        )
      : []
  const entriesItems = block.sortByDate !== false ? sortEntriesByDate(entriesRawItems) : entriesRawItems
  // A Text block bound to a "recipients" slot (Cover Letter
  // Recipients) shows just the one recipient picked in
  // PropertiesPanel.jsx's "Which recipient" field (defaulting to the
  // first saved one), composed onto its own lines — same idea as the
  // "entries" case above, but showing a single picked item instead of
  // every one of them.
  const recipientContent =
    boundSlot?.type === 'recipients'
      ? (() => {
          const recipients = parseRecipients(library[`${boundSlot.key}Items`])
          const recipient = recipients.find((r) => r.id === block.recipientId) || recipients[0]
          return composeRecipientText(recipient)
        })()
      : null
  const textContent = recipientContent !== null ? recipientContent : resolvedContent

  // A Text block bound to a "checklist" library slot (Core Competencies,
  // Certifications, Publications, Technical Skills, Leisure/Hobbies) reads
  // as a flat joined-text list by default (textContent above) — the same
  // as always. Once any item there has its own description filled in
  // (ContentLibraryPage.jsx's ChecklistField), it switches to a
  // structural render instead (title + description per item), the same
  // "falls back to the old flat behavior until there's something only the
  // structural view can show" rule the "entries" case above follows.
  const checklistItems =
    boundSlot?.type === 'checklist'
      ? parseChecklist(library[`${boundSlot.key}Items`], library[boundSlot.key]).filter(
          (item) => item.visible !== false && item.text?.trim(),
        )
      : []
  const checklistHasDescriptions = checklistItems.some((item) => item.description?.trim())
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
          <p className="text-sm opacity-70" style={entryMetaStyle}>
            {secondaryLine}
          </p>
        )
        // This item's position in the (already date-sorted, if that's
        // on) list, offset by `numberStartAt` — the list order itself
        // is still only changeable via reordering (see
        // ContentLibraryPage.jsx's Move up/down); the offset exists
        // purely so a second block showing the rest of a list split
        // across blocks/columns can continue the numbering from where
        // an earlier block left off instead of restarting at 1.
        const displayNumber = i + (block.numberStartAt || 1)
        const entryChildren = (
          <>
            {block.titleOnly ? (
              titleNode
            ) : block.titleLocationInline ? (
              <>
                {(item.title || subLineVisible) && (
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-bold" style={titleStyle}>
                      {titleTextTransformValue(item.title, block, 'entryTitle')}
                    </span>
                    <span className="text-sm opacity-70" style={entryMetaStyle}>
                      {subLineVisible}
                    </span>
                  </p>
                )}
                {dateRangeVisible && (
                  <p className="text-sm opacity-70" style={entryMetaStyle}>
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
                  <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed" style={descriptionStyle}>
                    {item.description}
                  </p>
                )
              }
              const descriptionLines = item.description.split('\n').filter(Boolean)
              return (
                descriptionLines.length > 0 && (
                  <ul
                    className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400"
                    style={descriptionStyle}
                  >
                    {descriptionLines.map((line, li) => (
                      <li key={li}>{line}</li>
                    ))}
                  </ul>
                )
              )
            })()}
          </>
        )
        return block.showEntryNumber ? (
          <div key={item.id || i} className="flex gap-2">
            {/* Only the number carries the accent color — same
                "number in accent, text follows the block's own
                style" convention the Locations Map's numbered style
                already uses. */}
            <span className="shrink-0 text-xs font-bold" style={{ color: globalStyle.primaryColor, fontFamily: entryBodyFont }}>
              {displayNumber}
            </span>
            <div className="flex flex-col gap-0.5">{entryChildren}</div>
          </div>
        ) : (
          <div key={item.id || i} className="flex flex-col gap-0.5">
            {entryChildren}
          </div>
        )
      })}
    </div>
  ) : boundSlot?.type === 'checklist' && checklistHasDescriptions ? (
    (() => {
      const ListTag = block.list === false ? 'div' : block.ordered ? 'ol' : 'ul'
      const ItemTag = block.list === false ? 'div' : 'li'
      const listClass =
        block.list === false
          ? 'flex flex-col gap-2'
          : `${block.ordered ? 'list-decimal' : 'list-disc'} space-y-1.5 pl-5 marker:text-slate-400`
      return (
        <ListTag className={`text-sm leading-relaxed ${listClass} ${alignClass(block.align)}`}>
          {checklistItems.map((item, i) => (
            <ItemTag key={i}>
              <span
                className={textStyleClasses({ ...block, align: undefined })}
                style={typographyStyle(block, bodyFont, globalStyle.typographyScale?.p1?.sizePx)}
              >
                {displayText(item.text, block)}
              </span>
              {item.description && (
                <p className="mt-0.5 text-xs not-italic normal-case opacity-70" style={{ fontFamily: bodyFont }}>
                  {item.description}
                </p>
              )}
            </ItemTag>
          ))}
        </ListTag>
      )
    })()
  ) : block.list ? (
    (() => {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400 ${alignClass(block.align)}`}
          style={typographyStyle(block, bodyFont, globalStyle.typographyScale?.p1?.sizePx)}
        >
          {textContent.split('\n').filter(Boolean).map((line, i) => (
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
      {displayText(textContent, block)}
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
