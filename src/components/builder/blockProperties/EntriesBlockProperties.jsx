import { useBuilder } from '../../../context/BuilderContext'
import { useContentLibrary } from '../../../context/ContentLibraryContext'
import { emptyEntry, parseEntries } from '../../../utils/contentLists'
import {
  BodyTextStyleFields,
  EntryTitleStyleFields,
  Field,
  inputClasses,
  LibraryItemOverridesField,
  TitleSizeField,
  TitleVisibilityFields,
} from './fields'

// Shared editor for the Experience/Education blocks: a repeatable entry
// (title/subtitle/location/dates/description) either typed directly on
// the block or read from the matching Content Library slot (kept in sync
// there via ContentLibraryPage's own entry editor).
export default function EntriesBlockProperties({ block, onChange, libraryToggleKey, librarySlotLabel, librarySlotKey }) {
  const { globalStyle } = useBuilder()
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)
  const items = block.items || []

  function updateItem(index, patch) {
    onChange({ items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  function addItem() {
    onChange({ items: [...items, emptyEntry()] })
  }

  function removeItem(index) {
    onChange({ items: items.filter((_, i) => i !== index) })
  }

  const usesLibrary = !!block[libraryToggleKey]

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title (optional)">
        <input
          type="text"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={block.sortByDate !== false}
          onChange={(e) => onChange({ sortByDate: e.target.checked })}
        />
        Sort entries most recent first
      </label>
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={block.titleOnly === true}
          onChange={(e) => onChange({ titleOnly: e.target.checked })}
        />
        Minimal — show only the title (hide company/location, dates, description)
      </label>
      {!block.titleOnly && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.showEntryLocation !== false}
              onChange={(e) => onChange({ showEntryLocation: e.target.checked })}
            />
            Show company / location
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.showEntryDate !== false}
              onChange={(e) => onChange({ showEntryDate: e.target.checked })}
            />
            Show dates
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.showEntryDescription !== false}
              onChange={(e) => onChange({ showEntryDescription: e.target.checked })}
            />
            Show description
          </label>
          {block.showEntryDescription !== false && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={block.list !== false}
                onChange={(e) => onChange({ list: e.target.checked })}
              />
              Show description as a bulleted list
            </label>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.titleLocationInline === true}
              onChange={(e) => onChange({ titleLocationInline: e.target.checked })}
            />
            Show title and location on the same line
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.locationFirst === true}
              onChange={(e) => onChange({ locationFirst: e.target.checked })}
            />
            Show location/date before the title (title stays bold either way)
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.dateFirst === true}
              onChange={(e) => onChange({ dateFirst: e.target.checked })}
            />
            Show date before location
          </label>
          <Field label="Separator between location and dates">
            <input
              type="text"
              value={block.subtitleSeparator ?? ' / '}
              onChange={(e) => onChange({ subtitleSeparator: e.target.value })}
              className={`${inputClasses} !w-20`}
            />
          </Field>
        </>
      )}
      <Field label="Content from library">
        <select
          value={usesLibrary ? 'library' : ''}
          onChange={(e) => onChange({ [libraryToggleKey]: e.target.value === 'library' })}
          className={inputClasses}
        >
          <option value="">— none (edit entries below) —</option>
          <option value="library">{librarySlotLabel}</option>
        </select>
      </Field>
      {usesLibrary && (
        <LibraryItemOverridesField
          block={block}
          onChange={onChange}
          items={parseEntries(library[`${librarySlotKey}Items`], library[librarySlotKey])}
          getKey={(item) => item.id}
          getLabel={(item) => item.title || '(untitled entry)'}
          getCatalogVisible={() => true}
        />
      )}
      {!usesLibrary && (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={item.id || i} className="flex flex-col gap-1.5 rounded-md border border-slate-200 p-2.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(i, { title: e.target.value })}
                  placeholder="Job Role / Degree"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item.subtitle}
                  onChange={(e) => updateItem(i, { subtitle: e.target.value })}
                  placeholder="Company / Institution"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
                <input
                  type="text"
                  value={item.location}
                  onChange={(e) => updateItem(i, { location: e.target.value })}
                  placeholder="City, Country"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="month"
                  value={item.startDate}
                  onChange={(e) => updateItem(i, { startDate: e.target.value })}
                  title="Start"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
                <input
                  type="month"
                  value={item.endDate}
                  onChange={(e) => updateItem(i, { endDate: e.target.value })}
                  title="End"
                  disabled={item.current}
                  className={`${inputClasses} min-w-0 flex-1 disabled:bg-slate-50 disabled:text-slate-400`}
                />
                <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={item.current}
                    onChange={(e) => updateItem(i, { current: e.target.checked })}
                  />
                  Present
                </label>
              </div>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="Description"
                className={inputClasses}
              />
            </div>
          ))}
          <button type="button" onClick={addItem} className="self-start text-xs font-medium text-primary hover:underline">
            + Add entry
          </button>
        </div>
      )}
      <EntryTitleStyleFields block={block} onChange={onChange} />
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
