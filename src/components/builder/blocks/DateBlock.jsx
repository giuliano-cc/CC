import { DATE_FORMATS, formatFullDate, todayISODate } from '../../../utils/contentLists'
import { RefreshCw } from 'lucide-react'
import { alignClass, resolveBodyFont, textStyleClasses, typographyStyle } from './shared'

export default function renderDateBlock({ block, globalStyle, onUpdateBlock }) {
  // `block.date` is a native <input type="date"> value ("YYYY-MM-DD").
  // Left null (its default), it tracks today's date live, re-evaluated
  // on every render — see the "Update to today" button in
  // PropertiesPanel, which resets it back to null instead of writing
  // today's date as a value that goes stale the next day.
  const dateValue = block.date || todayISODate()
  const format = block.format || 'long'
  const locale = globalStyle.contentLanguage === 'de' ? 'de-DE' : 'en-US'
  return (
    <div className={`group/date relative flex items-center gap-1.5 ${alignClass(block.align)}`}>
      <p
        className={`whitespace-pre-line text-sm leading-relaxed ${textStyleClasses(block)}`}
        style={typographyStyle(block, resolveBodyFont(globalStyle), globalStyle.typographyScale?.p1?.sizePx)}
      >
        {formatFullDate(dateValue, format, locale)}
      </p>
      {onUpdateBlock && (
        <button
          type="button"
          data-no-drag
          title="Switch date format"
          onClick={(event) => {
            event.stopPropagation()
            const next = DATE_FORMATS[(DATE_FORMATS.indexOf(format) + 1) % DATE_FORMATS.length]
            onUpdateBlock({ format: next })
          }}
          className="invisible flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary group-hover/date:visible"
        >
          <RefreshCw size={13} />
        </button>
      )}
    </div>
  )
}
