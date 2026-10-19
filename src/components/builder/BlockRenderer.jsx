import { BLOCK_TYPES } from '../../utils/blockTypes'
import { useContentLibrary } from '../../context/ContentLibraryContext'
import { resolveContent } from './blocks/shared'
import renderHeaderBlock from './blocks/Header'
import renderCvHeaderBlock from './blocks/CvHeader'
import renderHeadingBlock from './blocks/Heading'
import renderTextBlock from './blocks/Text'
import renderImageBlock from './blocks/Image'
import renderDividerBlock from './blocks/Divider'
import renderShapeBlock from './blocks/Shape'
import renderDateBlock from './blocks/DateBlock'
import renderPageNumberBlock from './blocks/PageNumber'
import renderQuoteBlock from './blocks/Quote'
import renderFooterBlock from './blocks/Footer'
import renderSkillsChartBlock from './blocks/SkillsChart'
import renderLanguagesChartBlock from './blocks/LanguagesChart'
import renderQrCodeBlock from './blocks/QrCode'
import renderSocialIconsBlock from './blocks/SocialIcons'
import renderContactInfoBlock from './blocks/ContactInfo'
import renderLeisureBlock from './blocks/Leisure'
import renderEntriesBlock from './blocks/EntriesBlock'
import renderMapBlock from './blocks/Map'
import renderColumnsBlock from './blocks/Columns'

// One render function per block type, each in its own file under
// ./blocks/ — this used to be a single ~1600-line switch statement with
// every block type's rendering logic inline, which made finding (and
// safely editing) any one block type's code slower the bigger this file
// grew. Each renderXBlock function gets the same props shape regardless
// of which fields it actually needs, so adding a new block type here is
// just one new file + one new entry, never a reason to touch another
// block's code. Rendered below as a real JSX component (`<Render .../>`),
// not called directly as a plain function — none of these currently use
// hooks, but calling them as functions instead of components would make
// it a silent Rules-of-Hooks violation (a hook call gated behind
// `block.type`) the moment one did, since `renderXBlock` doesn't look
// like a hook or a component to the linter.
const BLOCK_RENDERERS = {
  [BLOCK_TYPES.HEADER]: renderHeaderBlock,
  [BLOCK_TYPES.CV_HEADER]: renderCvHeaderBlock,
  [BLOCK_TYPES.HEADING]: renderHeadingBlock,
  [BLOCK_TYPES.TEXT]: renderTextBlock,
  [BLOCK_TYPES.IMAGE]: renderImageBlock,
  [BLOCK_TYPES.DIVIDER]: renderDividerBlock,
  [BLOCK_TYPES.SHAPE]: renderShapeBlock,
  [BLOCK_TYPES.DATE]: renderDateBlock,
  [BLOCK_TYPES.PAGE_NUMBER]: renderPageNumberBlock,
  [BLOCK_TYPES.QUOTE]: renderQuoteBlock,
  [BLOCK_TYPES.FOOTER]: renderFooterBlock,
  [BLOCK_TYPES.SKILLS_CHART]: renderSkillsChartBlock,
  [BLOCK_TYPES.LANGUAGES_CHART]: renderLanguagesChartBlock,
  [BLOCK_TYPES.QR_CODE]: renderQrCodeBlock,
  [BLOCK_TYPES.SOCIAL_ICONS]: renderSocialIconsBlock,
  [BLOCK_TYPES.CONTACT_INFO]: renderContactInfoBlock,
  [BLOCK_TYPES.LEISURE]: renderLeisureBlock,
  [BLOCK_TYPES.EXPERIENCE]: renderEntriesBlock,
  [BLOCK_TYPES.EDUCATION]: renderEntriesBlock,
  [BLOCK_TYPES.MAP]: renderMapBlock,
  [BLOCK_TYPES.COLUMNS]: renderColumnsBlock,
}

export default function BlockRenderer({
  block,
  interactive = false,
  selectedId = null,
  onSelectItem,
  onAddItem,
  onUpdateBlock,
  globalStyle = {},
  pageIndex = 0,
  pageCount = 1,
}) {
  const { getLibrary, getTitleOverrides } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)
  const titleOverrides = getTitleOverrides(globalStyle.contentLanguage)
  const resolvedContent = resolveContent(block, library)

  const Render = BLOCK_RENDERERS[block.type]
  if (!Render) return null
  return (
    <Render
      block={block}
      globalStyle={globalStyle}
      resolvedContent={resolvedContent}
      library={library}
      titleOverrides={titleOverrides}
      onUpdateBlock={onUpdateBlock}
      onAddItem={onAddItem}
      interactive={interactive}
      selectedId={selectedId}
      onSelectItem={onSelectItem}
      pageIndex={pageIndex}
      pageCount={pageCount}
    />
  )
}
