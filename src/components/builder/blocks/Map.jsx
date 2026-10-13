import { parseEntries } from '../../../utils/contentLists'
import { translateSectionTitle } from '../../../utils/sectionTitles'
import WorldMap from '../WorldMap'
import { isLibraryItemShown, resolveBodyFont, resolveTitleFont, sectionTitleStyle, titleTextTransformValue } from './shared'

export default function renderMapBlock({ block, globalStyle, library, titleOverrides }) {
  // Same "pick any slot of the right type" pattern as the Technical
  // Skills chart's librarySource (any checklist slot) — here, any
  // 'entries' slot (Selected Works, Work Experience, Education,
  // Achievements), so this one block plots whichever list the
  // "Content from library" dropdown picked, not just Selected Works.
  const source = block.librarySource || 'selectedWorks'
  // Plotted in the entries list's own order — the same list order
  // the Content Library's Selected Works section itself shows (and
  // lets you change with Move up/down), so the map's marker numbers
  // always agree with it without a separate field to keep in sync.
  const items = parseEntries(library[`${source}Items`], library[source]).filter((item) =>
    isLibraryItemShown(block, item.id, true),
  )
  const showTitle = block.title && block.showTitle !== false
  // The content area's own width (title and padding already
  // subtracted) — WorldMap uses this for its font-size scale, so
  // label text matches the block's configured size regardless of how
  // tight or wide the map's own geographic crop is.
  const mapContentWidth = Math.max(20, (block.width || 0) - 16)
  return (
    <div className="flex h-full flex-col gap-3">
      {showTitle && (
        <p
          className={block.titleRule !== false ? 'border-b border-slate-200 pb-1.5' : ''}
          style={sectionTitleStyle(block, block.titleColor || globalStyle.primaryColor, resolveTitleFont(globalStyle))}
        >
          {titleTextTransformValue(translateSectionTitle(block.title, globalStyle.contentLanguage, titleOverrides), block, 'title')}
        </p>
      )}
      {/* The map's own natural size (from its tight geographic crop)
          rarely matches the block's resized height exactly — centering
          it in the remaining space (instead of leaving it pinned to the
          top with blank room below) keeps a taller block looking
          intentional rather than like the map is stuck in a corner. */}
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <WorldMap
          items={items}
          accentColor={globalStyle.primaryColor}
          legendStyle={block.legendStyle || 'numbered'}
          leaderDirection={block.leaderDirection || 'sides'}
          bodyFont={block.bodyFontFamily || resolveBodyFont(globalStyle)}
          titleFont={block.entryTitleFontFamily || resolveTitleFont(globalStyle)}
          textColor={globalStyle.textColor}
          titleColor={block.entryTitleColor || null}
          titleFontSizePx={block.entryTitleFontSize || 16}
          titleBold={block.entryTitleBold}
          viewportWidthPx={mapContentWidth}
          bodyFontSizePx={block.bodyFontSize || globalStyle.typographyScale?.p1?.sizePx}
          lineSpacing={block.lineSpacing}
          letterSpacing={block.letterSpacing}
        />
      </div>
    </div>
  )
}
