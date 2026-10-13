import { parseChecklist } from '../../../utils/contentLists'
import { translateSectionTitle } from '../../../utils/sectionTitles'
import { alignClass, resolveBodyFont, resolveTitleFont, sectionTitleStyle, titleTextTransformValue } from './shared'

export default function renderLeisureBlock({ block, globalStyle, library, titleOverrides }) {
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
      {block.list === false ? (
        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: resolveBodyFont(globalStyle),
            fontSize: globalStyle.typographyScale?.p1?.sizePx
              ? `${globalStyle.typographyScale.p1.sizePx}px`
              : undefined,
          }}
        >
          {items.join(', ')}
        </p>
      ) : (
        <ul
          className="list-disc space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400"
          style={{
            fontFamily: resolveBodyFont(globalStyle),
            fontSize: globalStyle.typographyScale?.p1?.sizePx
              ? `${globalStyle.typographyScale.p1.sizePx}px`
              : undefined,
          }}
        >
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
