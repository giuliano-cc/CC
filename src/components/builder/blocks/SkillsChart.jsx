import { parseChecklist, skillLevelText } from '../../../utils/contentLists'
import { isLibraryItemShown, resolveBodyFont, resolveTitleFont } from './shared'
import Chart from './Chart'

export default function renderSkillsChartBlock({ block, globalStyle, library, titleOverrides, onUpdateBlock }) {
  // `librarySource` names any checklist-type Content Library slot
  // (Technical Skills, Core Competencies, Achievements, ...), so this
  // one chart block can plot whichever list the "Content from
  // library" dropdown picked, not just Technical Skills.
  const source = block.librarySource || 'skills'
  const items = block.useLibrarySkills
    ? parseChecklist(library[`${source}Items`], library[source])
        .filter((i) => i.text?.trim() && isLibraryItemShown(block, i.text, i.visible))
        .map((i) => ({ label: i.text, level: i.level ?? 75, levelText: skillLevelText({ ...i, level: i.level ?? 75 }) }))
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
