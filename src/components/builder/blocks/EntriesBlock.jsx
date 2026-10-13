import { BLOCK_TYPES } from '../../../utils/blockTypes'
import { formatEntryDate, parseEntries, sortEntriesByDate } from '../../../utils/contentLists'
import { translateSectionTitle } from '../../../utils/sectionTitles'
import {
  EntryLayoutCycleButton,
  alignClass,
  isLibraryItemShown,
  resolveBodyFont,
  resolveTitleFont,
  sectionTitleStyle,
  showEntryDescription,
  titleTextTransformStyle,
  titleTextTransformValue,
  visibleEntryParts,
} from './shared'

// Shared by Experience and Education — same shape, different library slot.
export default function renderEntriesBlock({ block, globalStyle, library, titleOverrides, onUpdateBlock }) {
  const isExperience = block.type === BLOCK_TYPES.EXPERIENCE
  const librarySlot = isExperience ? 'experience' : 'education'
  const usesLibrary = isExperience ? block.useLibraryExperience : block.useLibraryEducation
  const rawItems = usesLibrary
    ? parseEntries(library[`${librarySlot}Items`], library[librarySlot]).filter((item) =>
        isLibraryItemShown(block, item.id, true),
      )
    : block.items || []
  const items = block.sortByDate !== false ? sortEntriesByDate(rawItems) : rawItems
  const bodyFont = block.bodyFontFamily || resolveBodyFont(globalStyle)
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
          letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
          backgroundColor: block.bgColor || undefined,
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
          <p className="text-sm opacity-70" style={bodyStyle}>
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
                    <span className="text-sm opacity-70" style={bodyStyle}>
                      {subLineVisible}
                    </span>
                  </p>
                )}
                {dateRangeVisible && (
                  <p className="text-sm opacity-70" style={bodyStyle}>
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
                <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed" style={bodyStyle}>
                  {item.description}
                </p>
              ) : (
                descriptionLines.length > 0 && (
                  <ul
                    className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400"
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
