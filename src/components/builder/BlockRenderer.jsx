import { BLOCK_TYPES } from '../../utils/blockTypes'
import { useContentLibrary } from '../../context/ContentLibraryContext'
import { useResolvedContent } from './blocks/shared'
import renderHeaderBlock from './blocks/Header'
import renderCvHeaderBlock from './blocks/CvHeader'
import renderHeadingBlock from './blocks/Heading'
import renderTextBlock from './blocks/Text'
import renderImageBlock from './blocks/Image'
import renderDividerBlock from './blocks/Divider'
import renderShapeBlock from './blocks/Shape'
import renderDateBlock from './blocks/DateBlock'
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
// grew. Each renderXBlock function gets the same `ctx` shape regardless
// of which fields it actually needs, so adding a new block type here is
// just one new file + one new case, never a reason to touch another
// block's code.
const BLOCK_RENDERERS = {
  [BLOCK_TYPES.HEADER]: renderHeaderBlock,
  [BLOCK_TYPES.CV_HEADER]: renderCvHeaderBlock,
  [BLOCK_TYPES.HEADING]: renderHeadingBlock,
  [BLOCK_TYPES.TEXT]: renderTextBlock,
  [BLOCK_TYPES.IMAGE]: renderImageBlock,
  [BLOCK_TYPES.DIVIDER]: renderDividerBlock,
  [BLOCK_TYPES.SHAPE]: renderShapeBlock,
  [BLOCK_TYPES.DATE]: renderDateBlock,
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
}) {
  const resolvedContent = useResolvedContent(block, globalStyle)
  const { getLibrary, getTitleOverrides } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)
  const titleOverrides = getTitleOverrides(globalStyle.contentLanguage)

  const render = BLOCK_RENDERERS[block.type]
  if (!render) return null
  return render({
    block,
    globalStyle,
    resolvedContent,
    library,
    titleOverrides,
    onUpdateBlock,
    onAddItem,
    interactive,
    selectedId,
    onSelectItem,
  })
}
