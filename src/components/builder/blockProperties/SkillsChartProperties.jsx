import { useBuilder } from '../../../context/BuilderContext'
import { CONTENT_SLOTS, useContentLibrary } from '../../../context/ContentLibraryContext'
import { parseChecklist } from '../../../utils/contentLists'
import { Field, inputClasses, LibraryItemOverridesField, TitleSizeField, TitleVisibilityFields, LevelDisplayField } from './fields'

export default function SkillsChartProperties({ block, onChange }) {
  const { globalStyle } = useBuilder()
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)
  const linesValue = (block.items || []).map((i) => `${i.label}|${i.level}`).join('\n')

  function handleLinesChange(text) {
    const items = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, level] = line.split('|')
        return { label: (label || '').trim(), level: Number(level) || 50 }
      })
    onChange({ items })
  }

  const checklistSlots = CONTENT_SLOTS.filter((s) => s.type === 'checklist')

  return (
    <div className="flex flex-col gap-4">
      <Field label="Content from library">
        <select
          value={block.useLibrarySkills ? block.librarySource || 'skills' : ''}
          onChange={(e) => {
            const value = e.target.value
            onChange({ useLibrarySkills: !!value, librarySource: value || 'skills' })
          }}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          {checklistSlots.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
      </Field>
      {block.useLibrarySkills && (
        <LibraryItemOverridesField
          block={block}
          onChange={onChange}
          items={parseChecklist(library[`${block.librarySource || 'skills'}Items`], library[block.librarySource || 'skills'])}
          getKey={(item) => item.text}
          getLabel={(item) => item.text}
          getCatalogVisible={(item) => item.visible}
        />
      )}
      <Field label="Chart title">
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Style">
        <select
          value={block.chartStyle || 'bars'}
          onChange={(e) => onChange({ chartStyle: e.target.value })}
          className={inputClasses}
        >
          <option value="bars">Bars</option>
          <option value="dots">Dots</option>
          <option value="tags">Tags</option>
        </select>
      </Field>
      <LevelDisplayField block={block} onChange={onChange} />
      {block.chartStyle === 'dots' && (
        <>
          <Field label="Number of dots">
            <select
              value={block.dotCount ?? 5}
              onChange={(e) => onChange({ dotCount: Number(e.target.value) })}
              className={inputClasses}
            >
              <option value={5}>5 (20% per dot)</option>
              <option value={10}>10 (10% per dot, finer)</option>
            </select>
          </Field>
          <Field label={`Dot size (${block.dotSize ?? 10}px)`}>
            <input
              type="range"
              min={4}
              max={24}
              value={block.dotSize ?? 10}
              onChange={(e) => onChange({ dotSize: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}
      {!block.useLibrarySkills && (
        <Field label="Skills (one per line: Label|Level 0-100)">
          <textarea
            rows={5}
            value={linesValue}
            onChange={(e) => handleLinesChange(e.target.value)}
            placeholder="Photoshop|85"
            className={`${inputClasses} resize-none font-mono`}
          />
        </Field>
      )}
      <Field label="Bar color">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={block.color || globalStyle.primaryColor}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
          {block.color && (
            <button
              type="button"
              onClick={() => onChange({ color: null })}
              className="shrink-0 rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Reset to inherit the global Accent color"
            >
              ✕
            </button>
          )}
        </div>
      </Field>
    </div>
  )
}
