import { displayText, textStyleClasses, textTransformStyle } from './shared'

export default function renderFooterBlock({ block, resolvedContent }) {
  return (
    <div
      className={`border-t border-slate-200 pt-3 text-xs opacity-70 ${textStyleClasses(block)}`}
      style={textTransformStyle(block)}
    >
      {displayText(resolvedContent, block)}
    </div>
  )
}
