import { Field, inputClasses, LibrarySlotSelect } from './fields'

export default function CvHeaderProperties({ block, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Name from library">
        <LibrarySlotSelect
          value={block.nameSlot}
          onChange={(v) => onChange({ nameSlot: v })}
          filter={(s) => s.key === 'name'}
          placeholder="— none (type below) —"
        />
      </Field>
      {!block.nameSlot && (
        <Field label="Name">
          <textarea
            rows={2}
            value={block.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}
      <Field label="Role / subtitle">
        <input
          type="text"
          value={block.role || ''}
          onChange={(e) => onChange({ role: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="USP from library">
        <LibrarySlotSelect
          value={block.uspSlot}
          onChange={(v) => onChange({ uspSlot: v })}
          filter={(s) => s.key === 'usp'}
          placeholder="— none (type below) —"
        />
      </Field>
      {!block.uspSlot && (
        <Field label="USP (unique selling proposition)">
          <input
            type="text"
            value={block.usp || ''}
            onChange={(e) => onChange({ usp: e.target.value })}
            placeholder="What makes you different in one short line"
            className={inputClasses}
          />
        </Field>
      )}
      <Field label="Contacts from library">
        <LibrarySlotSelect
          value={block.contactsSlot}
          onChange={(v) => onChange({ contactsSlot: v })}
          filter={(s) => s.key === 'contact'}
          placeholder="— none (type below) —"
        />
      </Field>
      {!block.contactsSlot && (
        <Field label="Contacts (one per line)">
          <textarea
            rows={3}
            value={(block.contacts || []).join('\n')}
            onChange={(e) => onChange({ contacts: e.target.value.split('\n') })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={!!block.showContactIcons}
          onChange={(e) => onChange({ showContactIcons: e.target.checked })}
        />
        Show icons next to email/phone/website
      </label>
      <Field label="Layout">
        <select
          value={block.layout}
          onChange={(e) => onChange({ layout: e.target.value })}
          className={inputClasses}
        >
          <option value="row">In a row</option>
          <option value="stacked">Stacked</option>
        </select>
      </Field>
    </div>
  )
}
