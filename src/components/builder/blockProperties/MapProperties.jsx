import { CONTENT_SLOTS } from '../../../context/ContentLibraryContext'
import { BodyTextStyleFields, EntryTitleStyleFields, Field, inputClasses, TitleSizeField, TitleVisibilityFields } from './fields'

export default function MapProperties({ block, onChange }) {
  const entriesSlots = CONTENT_SLOTS.filter((s) => s.type === 'entries')

  return (
    <div className="flex flex-col gap-4">
      <Field label="Content from library">
        <select
          value={block.librarySource || 'selectedWorks'}
          onChange={(e) => onChange({ librarySource: e.target.value })}
          className={inputClasses}
        >
          {entriesSlots.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          Each item's own "Location" field (city, country) is matched against a bundled place list and plotted
          automatically — no coordinates to type in.
        </p>
      </Field>
      <Field label="Title">
        <input
          type="text"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Legend style">
        <select
          value={block.legendStyle || 'numbered'}
          onChange={(e) => onChange({ legendStyle: e.target.value })}
          className={inputClasses}
        >
          <option value="numbered">Numbered — a legend list below the map</option>
          <option value="leader">Leader lines — labels pointing to each location</option>
        </select>
      </Field>
      {block.legendStyle === 'leader' && (
        <Field label="Leader line direction">
          <select
            value={block.leaderDirection || 'sides'}
            onChange={(e) => onChange({ leaderDirection: e.target.value })}
            className={inputClasses}
          >
            <option value="sides">Left / Right</option>
            <option value="topBottom">Top / Bottom</option>
          </select>
        </Field>
      )}
      {/* Styles the project title/description text on the map itself
          (numbered legend or leader-line labels) — same two field groups
          Experience/Education use for their own entry title + body text,
          so this map's text can match the rest of the document instead
          of always inheriting Global Style with no way to override it. */}
      <EntryTitleStyleFields block={block} onChange={onChange} />
      <BodyTextStyleFields block={block} onChange={onChange} />
    </div>
  )
}
