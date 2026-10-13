import { BodyTextStyleFields, Field, inputClasses, TitleSizeField, TitleVisibilityFields } from './fields'

export default function ContactInfoProperties({ block, onChange }) {
  const fields = [
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title (optional)">
        <input
          type="text"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Contact Info"
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Content from library">
        <select
          value={block.useLibraryContact ? 'contact' : ''}
          onChange={(e) => onChange({ useLibraryContact: e.target.value === 'contact' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="contact">Contact</option>
        </select>
      </Field>
      {!block.useLibraryContact && (
        <div className="flex flex-col gap-3">
          <Field label="Street & number">
            <input
              type="text"
              value={block.addressStreet || ''}
              onChange={(e) => onChange({ addressStreet: e.target.value })}
              placeholder="Winzerhalde 109"
              className={inputClasses}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ZIP / Postal code">
              <input
                type="text"
                value={block.addressZip || ''}
                onChange={(e) => onChange({ addressZip: e.target.value })}
                placeholder="8049"
                className={inputClasses}
              />
            </Field>
            <Field label="City">
              <input
                type="text"
                value={block.addressCity || ''}
                onChange={(e) => onChange({ addressCity: e.target.value })}
                placeholder="Zürich"
                className={inputClasses}
              />
            </Field>
          </div>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type="text"
                value={block[f.key]}
                onChange={(e) => onChange({ [f.key]: e.target.value })}
                className={inputClasses}
              />
            </Field>
          ))}
        </div>
      )}
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={!!block.showIcons}
          onChange={(e) => onChange({ showIcons: e.target.checked })}
        />
        Show icons next to each field
      </label>
      <Field label="Layout">
        <select
          value={block.layout || 'stacked'}
          onChange={(e) => onChange({ layout: e.target.value })}
          className={inputClasses}
        >
          <option value="stacked">Stacked</option>
          <option value="row">Row</option>
        </select>
      </Field>
      <BodyTextStyleFields block={block} onChange={onChange} />
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
    </div>
  )
}
