import { Field, inputClasses, PlainTextStyleFields, TitleSizeField, TitleVisibilityFields } from './fields'

export default function LeisureProperties({ block, onChange }) {
  const linesValue = (block.items || []).join('\n')

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Content from library">
        <select
          value={block.useLibraryHobbies ? 'hobbies' : ''}
          onChange={(e) => onChange({ useLibraryHobbies: e.target.value === 'hobbies' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="hobbies">Leisure / Hobbies</option>
        </select>
      </Field>
      {!block.useLibraryHobbies && (
        <Field label="Items (one per line)">
          <textarea
            rows={4}
            value={linesValue}
            onChange={(e) => onChange({ items: e.target.value.split('\n') })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={block.list !== false}
          onChange={(e) => onChange({ list: e.target.checked })}
        />
        Bulleted list (unchecked: comma-separated on one line)
      </label>
      <Field label="Alignment">
        <select
          value={block.align}
          onChange={(e) => onChange({ align: e.target.value })}
          className={inputClasses}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
      <PlainTextStyleFields block={block} onChange={onChange} />
    </div>
  )
}
