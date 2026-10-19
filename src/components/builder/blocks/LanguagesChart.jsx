import { languageLevelText, parseLanguages } from '../../../utils/contentLists'
import { resolveBodyFont, resolveTitleFont } from './shared'
import Chart from './Chart'

export default function renderLanguagesChartBlock({ block, globalStyle, library, titleOverrides, onUpdateBlock }) {
  const items = block.useLibraryLanguages
    ? parseLanguages(library.languagesItems, library.languages)
        .filter((i) => i.name?.trim())
        .map((i) => ({ label: i.name, level: i.level, levelText: languageLevelText(i) }))
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
      labelStyle={{
        fontFamily: block.fontFamily || resolveBodyFont(globalStyle),
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        color: block.labelColor || undefined,
      }}
    />
  )
}
