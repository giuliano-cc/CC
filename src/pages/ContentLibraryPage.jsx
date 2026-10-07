import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, ChevronDown, Copy, Crop, Download, Trash2, Upload, User } from 'lucide-react'
import { CONTENT_SLOTS, SHARED_SLOT_KEYS, useContentLibrary } from '../context/ContentLibraryContext'
import ImageCropModal from '../components/builder/ImageCropModal'
import { resizeImageFile } from '../utils/imageResize'
import { SECTION_TITLE_DEFS } from '../utils/sectionTitles'
import { formatSocialLinks, parseSocialLinks, SOCIAL_PLATFORMS } from '../utils/socialIcons'
import {
  composeChecklistText,
  composeEntriesText,
  composeLanguagesText,
  emptyEntry,
  emptyRecipient,
  LANGUAGE_LEVELS,
  parseChecklist,
  parseEntries,
  parseLanguages,
  parseRecipients,
  SKILL_LEVELS,
  sortEntriesByDate,
} from '../utils/contentLists'

const cardClasses = 'flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4'
// `resize-y`, not `resize-none`: a textarea's box is just a starting size,
// not a hard limit — a long "Professional Profile" or "Cover Letter Body"
// shouldn't be stuck scrolling in a 5-row window. Harmless on <input>
// (resize only ever applies to a textarea anyway).
const inputClasses =
  'w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

// Groups CONTENT_SLOTS into collapsible sections, purely for how the
// Content Library page organizes itself — every key from CONTENT_SLOTS
// (other than a `group` sub-field, e.g. the four contact fields folded
// into "Contact") must appear in exactly one of these lists.
const SECTIONS = [
  { title: 'Identity', keys: ['name', 'title', 'usp', 'usp2', 'usp3', 'usp4', 'photo', 'signature'] },
  {
    title: 'Profile & Quote',
    keys: ['profileSummary', 'profileSummary2', 'profileSummary3', 'profileSummary4', 'quote', 'quoteAuthor'],
  },
  { title: 'Experience & Education', keys: ['experience', 'education'] },
  {
    title: 'Skills & Languages',
    keys: ['coreCompetencies', 'skills', 'languages', 'keywords'],
  },
  {
    title: 'Portfolio',
    keys: ['selectedWorks', 'selectedClients', 'certifications', 'publications', 'achievements'],
  },
  { title: 'Contact & Links', keys: ['contact', 'socialLinks', 'qrValue'] },
  { title: 'Additional', keys: ['references', 'additionalInfo', 'hobbies'] },
  { title: 'Cover Letter', keys: ['coverLetterBody', 'coverLetterRecipients'] },
]

// Shared by any 'image' Content Library slot (Profile Photo, Signature):
// `variant` picks the preview shape/crop defaults, since a face photo and
// a signature scan are cropped very differently.
function PhotoField({ value, onChange, variant = 'photo' }) {
  const fileInputRef = useRef(null)
  const [isCropping, setIsCropping] = useState(false)
  const isSignature = variant === 'signature'

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    // Downscaled before it ever reaches state/localStorage — a raw phone
    // photo can be several MB, which alone can blow the ~5-10MB per-origin
    // storage quota and make every save silently fail from then on.
    resizeImageFile(file, { maxDimension: isSignature ? 700 : 900 }).then((dataUrl) => {
      onChange(dataUrl)
      toast.success(`${isSignature ? 'Signature' : 'Photo'} saved`, { id: 'content-library-save' })
    })
    event.target.value = ''
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 text-slate-300 ${
          isSignature ? 'h-16 w-32 rounded-md' : 'h-16 w-16 rounded-full'
        }`}
      >
        {value ? (
          <img src={value} alt={isSignature ? 'Signature' : 'Profile'} className="h-full w-full object-contain" />
        ) : (
          <User size={24} />
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
      >
        <Upload size={13} />
        Upload {isSignature ? 'signature' : 'photo'}
      </button>
      {value && (
        <>
          <button
            type="button"
            onClick={() => setIsCropping(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Crop size={13} />
            Crop
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1 text-xs text-red-500 hover:underline"
          >
            <Trash2 size={13} />
            Remove
          </button>
        </>
      )}
      {isCropping && (
        <ImageCropModal
          imageSrc={value}
          initialAspect={isSignature ? 2.5 : 1}
          initialShape={isSignature ? 'rect' : 'circle'}
          onCancel={() => setIsCropping(false)}
          onApply={(dataUrl) => {
            onChange(dataUrl)
            setIsCropping(false)
            toast.success(`${isSignature ? 'Signature' : 'Photo'} saved`, { id: 'content-library-save' })
          }}
        />
      )}
    </div>
  )
}

function SocialLinksField({ value, onChange }) {
  const items = parseSocialLinks(value)

  function update(items) {
    onChange(formatSocialLinks(items))
    toast.success('Content saved', { id: 'content-library-save' })
  }

  function updateItem(index, patch) {
    update(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    update([...items, { platform: 'linkedin', url: '' }])
  }

  function removeItem(index) {
    update(items.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <select
            value={item.platform}
            onChange={(e) => updateItem(i, { platform: e.target.value })}
            className={`${inputClasses} !w-28 shrink-0`}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={item.url}
            onChange={(e) => updateItem(i, { url: e.target.value })}
            placeholder="url or handle"
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
      ))}
      <button type="button" onClick={addItem} className="self-start text-xs font-medium text-primary hover:underline">
        + Add link
      </button>
    </div>
  )
}

function ContactGroupField({ library, onChange }) {
  const otherFields = [
    { key: 'contactPhone', label: 'Phone', placeholder: '+00 000 000 0000' },
    { key: 'contactEmail', label: 'Email', placeholder: 'you@example.com' },
    { key: 'contactWebsite', label: 'Website', placeholder: 'yourwebsite.com' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Street & number</span>
        <input
          type="text"
          value={library.contactStreet}
          onChange={(e) => onChange('contactStreet', e.target.value)}
          placeholder="Winzerhalde 109"
          className={inputClasses}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">ZIP / Postal code</span>
          <input
            type="text"
            value={library.contactZip}
            onChange={(e) => onChange('contactZip', e.target.value)}
            placeholder="8049"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">City</span>
          <input
            type="text"
            value={library.contactCity}
            onChange={(e) => onChange('contactCity', e.target.value)}
            placeholder="Zürich"
            className={inputClasses}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {otherFields.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">{field.label}</span>
            <input
              type="text"
              value={library[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

// A saved list of cover letter recipients (contact person, company,
// address) — a cover letter's recipient block (PropertiesPanel.jsx) picks
// one of these by name instead of its address being retyped by hand every
// time the same template goes to a different company.
function RecipientsField({ itemsJson, onUpdate }) {
  const items = parseRecipients(itemsJson)

  function updateItem(index, patch) {
    onUpdate(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    onUpdate([...items, emptyRecipient()])
  }

  function removeItem(index) {
    onUpdate(items.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              placeholder="Name for this recipient (e.g. Acme Corp)"
              className={`${inputClasses} font-medium`}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Contact Person</span>
              <input
                type="text"
                value={item.contactPerson}
                onChange={(e) => updateItem(i, { contactPerson: e.target.value })}
                placeholder="Hiring Manager"
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Company</span>
              <input
                type="text"
                value={item.company}
                onChange={(e) => updateItem(i, { company: e.target.value })}
                placeholder="Company Name"
                className={inputClasses}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Street & number</span>
            <input
              type="text"
              value={item.street}
              onChange={(e) => updateItem(i, { street: e.target.value })}
              placeholder="Street & number"
              className={inputClasses}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">ZIP / Postal code</span>
              <input
                type="text"
                value={item.zip}
                onChange={(e) => updateItem(i, { zip: e.target.value })}
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">City</span>
              <input
                type="text"
                value={item.city}
                onChange={(e) => updateItem(i, { city: e.target.value })}
                className={inputClasses}
              />
            </label>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="self-start text-xs font-medium text-primary hover:underline">
        + Add recipient
      </button>
    </div>
  )
}

// Line-by-line editor with a visibility checkbox per row: unchecking an
// item keeps it saved but excludes it from the plain-text value that the
// rest of the app (bindings, "Fill with my content") already reads.
function ChecklistField({ itemsJson, fallbackText, onUpdate, showLevel }) {
  const items = parseChecklist(itemsJson, fallbackText)

  function set(next) {
    onUpdate(next)
  }

  function updateItem(index, patch) {
    set(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    set([...items, { text: '', visible: true, ...(showLevel ? { level: 75 } : {}) }])
  }

  function removeItem(index) {
    set(items.filter((_, i) => i !== index))
  }

  // Locale-aware, case-insensitive — "iPhone" and "Photoshop" sort by
  // letter, not by which happens to start with a capital, and accented
  // names (e.g. "Écriture") land where they'd actually be expected.
  function sortAlphabetically() {
    set([...items].sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' })))
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className={showLevel ? 'flex flex-col gap-1 rounded-md border border-slate-200 p-2' : 'flex items-center gap-1.5'}
        >
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(e) => updateItem(i, { visible: e.target.checked })}
              title="Visible on the CV"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(i, { text: e.target.value })}
              placeholder="Item"
              className={`${inputClasses} min-w-0 flex-1`}
            />
            {showLevel && (
              <>
                <select
                  value={item.level ?? 75}
                  onChange={(e) => updateItem(i, { level: Number(e.target.value) })}
                  title="Skill level — used by the Skills Chart block"
                  className={`${inputClasses} !w-32 shrink-0`}
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l.level} value={l.level}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={item.level ?? 75}
                  onChange={(e) => updateItem(i, { level: Math.max(0, Math.min(100, Number(e.target.value))) })}
                  title="Exact percentage (used by the Skills Chart block)"
                  className={`${inputClasses} !w-16 shrink-0`}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
          {showLevel && (
            <input
              type="text"
              value={item.customLevel || ''}
              onChange={(e) => updateItem(i, { customLevel: e.target.value || null })}
              placeholder="Text version instead of the level above, e.g. Certified, since 2019"
              className={`${inputClasses} text-xs`}
            />
          )}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="button" onClick={addItem} className="text-xs font-medium text-primary hover:underline">
          + Add item
        </button>
        {items.length > 1 && (
          <button type="button" onClick={sortAlphabetically} className="text-xs font-medium text-primary hover:underline">
            Sort A→Z
          </button>
        )}
      </div>
    </div>
  )
}

function LanguagesField({ itemsJson, fallbackText, onUpdate }) {
  const items = parseLanguages(itemsJson, fallbackText)

  function set(next) {
    onUpdate(next)
  }

  function updateItem(index, patch) {
    set(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    set([...items, { name: '', level: 75 }])
  }

  function removeItem(index) {
    set(items.filter((_, i) => i !== index))
  }

  function sortAlphabetically() {
    set([...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })))
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 rounded-md border border-slate-200 p-2">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
              placeholder="Language"
              className={`${inputClasses} min-w-0 flex-1`}
            />
            <select
              value={item.level}
              onChange={(e) => updateItem(i, { level: Number(e.target.value) })}
              className={`${inputClasses} !w-36 shrink-0`}
            >
              {LANGUAGE_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>
                  {l.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={100}
              value={item.level}
              onChange={(e) => updateItem(i, { level: Math.max(0, Math.min(100, Number(e.target.value))) })}
              title="Exact percentage (used by the Skills Chart block)"
              className={`${inputClasses} !w-16 shrink-0`}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={item.customLevel || ''}
            onChange={(e) => updateItem(i, { customLevel: e.target.value || null })}
            placeholder="Text version instead of the level above, e.g. B2 / C1 in Vorbereitung"
            className={`${inputClasses} text-xs`}
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="button" onClick={addItem} className="text-xs font-medium text-primary hover:underline">
          + Add language
        </button>
        {items.length > 1 && (
          <button type="button" onClick={sortAlphabetically} className="text-xs font-medium text-primary hover:underline">
            Sort A→Z
          </button>
        )}
      </div>
    </div>
  )
}

// Repeatable Work Experience / Education entry: title (Job Role / Degree),
// subtitle (Company / Institution), an optional location, a date range
// with a "current/ongoing" flag, and a description (rendered as bullet
// lines by the matching builder block — see BLOCK_TYPES.EXPERIENCE/EDUCATION).
function EntriesField({
  itemsJson,
  fallbackText,
  titleLabel,
  subtitleLabel,
  showSubtitle = true,
  showLocation = true,
  showDates = true,
  onUpdate,
}) {
  const items = parseEntries(itemsJson, fallbackText)

  function set(next) {
    onUpdate(next)
  }

  function updateItem(index, patch) {
    set(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    set([...items, emptyEntry()])
  }

  function removeItem(index) {
    set(items.filter((_, i) => i !== index))
  }

  // Most-recent-first, current/ongoing entries leading — same rule a
  // bound Experience/Education/Selected Works block already applies at
  // render time by default (see sortEntriesByDate) — this just lets the
  // catalog's own order match what's shown, instead of the two only
  // agreeing once "Sort entries most recent first" is on for every block.
  function sortByDate() {
    set(sortEntriesByDate(items))
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item.id || i} className="flex flex-col gap-1.5 rounded-md border border-slate-200 p-2.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder={titleLabel}
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
          {(showSubtitle || showLocation) && (
            <div className="flex items-center gap-1.5">
              {showSubtitle && (
                <input
                  type="text"
                  value={item.subtitle}
                  onChange={(e) => updateItem(i, { subtitle: e.target.value })}
                  placeholder={subtitleLabel}
                  className={`${inputClasses} min-w-0 flex-1`}
                />
              )}
              {showLocation && (
                <input
                  type="text"
                  value={item.location}
                  onChange={(e) => updateItem(i, { location: e.target.value })}
                  placeholder="City, Country"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
              )}
            </div>
          )}
          {showDates && (
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
          )}
          <textarea
            rows={2}
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            placeholder="Description, responsibilities and results achieved"
            className={inputClasses}
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="button" onClick={addItem} className="text-xs font-medium text-primary hover:underline">
          + Add entry
        </button>
        {showDates && items.length > 1 && (
          <button type="button" onClick={sortByDate} className="text-xs font-medium text-primary hover:underline">
            Sort by date
          </button>
        )}
      </div>
    </div>
  )
}

// The field-type dispatch for one slot in one language — same logic this
// page always had, just no longer assuming there's only one language's
// value to read/write (see SlotCard below, which renders this once per
// language for anything other than a shared 'image' slot).
function SlotField({ slot, library, onChange, onBlur }) {
  return (
    <>
      {slot.type === 'social' && (
        <SocialLinksField value={library[slot.key]} onChange={(v) => onChange(slot.key, v)} />
      )}

      {slot.type === 'contactGroup' && <ContactGroupField library={library} onChange={onChange} />}

      {slot.type === 'recipients' && (
        <RecipientsField
          itemsJson={library[`${slot.key}Items`]}
          onUpdate={(items) => {
            onChange(`${slot.key}Items`, JSON.stringify(items))
            toast.success('Content saved', { id: 'content-library-save' })
          }}
        />
      )}

      {slot.type === 'checklist' && (
        <ChecklistField
          itemsJson={library[`${slot.key}Items`]}
          fallbackText={library[slot.key]}
          showLevel
          onUpdate={(items) => {
            onChange(`${slot.key}Items`, JSON.stringify(items))
            onChange(slot.key, composeChecklistText(items))
            toast.success('Content saved', { id: 'content-library-save' })
          }}
        />
      )}

      {slot.type === 'languages' && (
        <LanguagesField
          itemsJson={library[`${slot.key}Items`]}
          fallbackText={library[slot.key]}
          onUpdate={(items) => {
            onChange(`${slot.key}Items`, JSON.stringify(items))
            onChange(slot.key, composeLanguagesText(items))
            toast.success('Content saved', { id: 'content-library-save' })
          }}
        />
      )}

      {slot.type === 'entries' && (
        <EntriesField
          itemsJson={library[`${slot.key}Items`]}
          fallbackText={library[slot.key]}
          titleLabel={
            slot.key === 'education'
              ? 'Degree'
              : slot.key === 'selectedWorks'
                ? 'Project Title'
                : slot.key === 'achievements'
                  ? 'Achievement / Award'
                  : 'Job Role'
          }
          subtitleLabel={slot.key === 'education' ? 'Institution Name' : 'Company Name'}
          showSubtitle={slot.key !== 'selectedWorks' && slot.key !== 'achievements'}
          showLocation={slot.key !== 'achievements'}
          showDates={slot.key !== 'achievements'}
          onUpdate={(items) => {
            onChange(`${slot.key}Items`, JSON.stringify(items))
            onChange(slot.key, composeEntriesText(items))
            toast.success('Content saved', { id: 'content-library-save' })
          }}
        />
      )}

      {!slot.type && (
        <textarea
          rows={slot.multiline ? 5 : 2}
          value={library[slot.key]}
          onChange={(e) => onChange(slot.key, e.target.value)}
          onBlur={onBlur}
          placeholder={
            slot.key === 'qrValue'
              ? 'https://your-portfolio.com'
              : slot.key === 'usp' || /^usp\d$/.test(slot.key)
                ? 'What makes you different in one short line'
                : slot.isList
                  ? 'Item 1\nItem 2\nItem 3'
                  : 'Write the content here...'
          }
          className={inputClasses}
        />
      )}
    </>
  )
}

// One CONTENT_SLOTS card. A slot whose value never varies by language
// (see SHARED_SLOT_KEYS in ContentLibraryContext.jsx — photo/signature,
// name, contact details, social links) is entered once instead of twice;
// everything else renders side by side, one column per language, instead
// of behind a single toggle — so writing the German version next to the
// English one (or copying a date/number that doesn't need translating)
// never means navigating away and losing your place.
function SlotCard({ slot, libraries, languages, onChange, onBlur }) {
  if (slot.type === 'image') {
    return (
      <div className={cardClasses}>
        <label className="text-sm font-semibold text-slate-800" htmlFor={slot.key}>
          {slot.label}
        </label>
        <p className="-mt-1 text-xs text-slate-400">Shared across languages — no need to upload it twice.</p>
        <PhotoField
          value={libraries[languages[0].key][slot.key]}
          onChange={(v) => onChange(slot.key, v)}
          variant={slot.key === 'signature' ? 'signature' : 'photo'}
        />
      </div>
    )
  }

  if (SHARED_SLOT_KEYS.includes(slot.key)) {
    return (
      <div className={cardClasses}>
        <label className="text-sm font-semibold text-slate-800">{slot.label}</label>
        <p className="-mt-1 text-xs text-slate-400">Shared across languages — the same for every document.</p>
        <SlotField
          slot={slot}
          library={libraries[languages[0].key]}
          onChange={(key, value) => onChange(key, value, languages[0].key)}
          onBlur={onBlur}
        />
      </div>
    )
  }

  return (
    <div className={cardClasses}>
      <label className="text-sm font-semibold text-slate-800">{slot.label}</label>
      {slot.isList && <p className="-mt-1 text-xs text-slate-400">One item per line.</p>}
      {slot.type === 'checklist' && (
        <p className="-mt-1 text-xs text-slate-400">
          Uncheck an item to hide it from the CV without deleting it. The level sets how full its bar/dots show on a
          Skills Chart block.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {languages.map((lang) => (
          <div key={lang.key} className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <span className="w-fit rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {lang.label}
            </span>
            <SlotField
              slot={slot}
              library={libraries[lang.key]}
              onChange={(key, value) => onChange(key, value, lang.key)}
              onBlur={onBlur}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// One editable section heading (Experience, Education, Professional
// Profile, Quote, ...): a custom per-language wording overrides the
// built-in default (see utils/sectionTitles.js) wherever that heading is
// shown — English and German side by side, same as every other field
// above. An empty box just means "use the default", shown as its
// placeholder, so leaving both blank changes nothing.
function SectionTitleRow({ def, titles, languages, onChange, onBlur }) {
  return (
    <div className={cardClasses}>
      <label className="text-sm font-semibold text-slate-800">{def.en}</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {languages.map((lang) => (
          <div key={lang.key} className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <span className="w-fit rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {lang.label}
            </span>
            <input
              type="text"
              value={titles[lang.key][def.key] ?? ''}
              placeholder={def[lang.key] || def.en}
              onChange={(e) => onChange(def.key, e.target.value, lang.key)}
              onBlur={onBlur}
              className={inputClasses}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// A collapsible group of SlotCards — collapsed by default so the whole
// catalog doesn't render open-and-scrolling on first load; click a title to
// expand just that section. `forceOpen` (set while a search is active)
// overrides the collapsed state so matching sections stay visible without
// needing a click.
function CollapsibleSection({ title, children, forceOpen }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = forceOpen || isOpen

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="flex flex-col gap-4 border-t border-slate-100 p-4">{children}</div>}
    </section>
  )
}

export default function ContentLibraryPage() {
  // Set by LibraryLink (PropertiesPanel.jsx) when this page is opened from
  // a template's "Edit in the library"/"edit the catalog" link — router
  // state, not a query param, since nothing besides this page reads it.
  // Opened from the sidebar nav instead, `from` is undefined and no back
  // link shows.
  const location = useLocation()
  const backTo = location.state?.from
  const {
    getLibrary,
    getTitleOverrides,
    updateTitle,
    languages,
    updateSlot,
    copyLanguageContent,
    exportLibrary,
    importLibrary,
  } = useContentLibrary()
  const importInputRef = useRef(null)
  const libraries = Object.fromEntries(languages.map((l) => [l.key, getLibrary(l.key)]))
  const titles = Object.fromEntries(languages.map((l) => [l.key, getTitleOverrides(l.key)]))

  // Lets a long catalog be searched instead of scrolled: typing filters
  // every section down to just the fields whose label matches, and expands
  // those sections automatically (CollapsibleSection's `forceOpen`) so the
  // results are visible without also having to click each one open.
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearching = normalizedQuery.length > 0
  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    keys: isSearching
      ? section.keys.filter((key) => CONTENT_SLOTS.find((s) => s.key === key)?.label.toLowerCase().includes(normalizedQuery))
      : section.keys,
  })).filter((section) => !isSearching || section.keys.length > 0)

  function handleChange(key, value, lang) {
    updateSlot(key, value, lang)
  }

  function handleTitleChange(key, value, lang) {
    updateTitle(key, value, lang)
  }

  function handleCopyEnToDe() {
    if (
      !window.confirm(
        'Copy every English field into German? This overwrites whatever is currently written in German.',
      )
    ) {
      return
    }
    copyLanguageContent('en', 'de')
    toast.success('English content copied to German')
  }

  function handleBlur() {
    toast.success('Content saved', { id: 'content-library-save' })
  }

  function handleExport() {
    const blob = new Blob([exportLibrary()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'printflow-content-library.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded')
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importLibrary(reader.result)
        toast.success('Backup imported')
      } catch {
        toast.error('This file is not a valid backup.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div>
      {backTo && (
        <div className="mb-3 flex items-center gap-2">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft size={15} />
            Back to template
          </Link>
          <span className="text-xs text-slate-400">— every change here saves automatically</span>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Content Library</h1>
          <p className="text-sm text-slate-500">
            Write your CV content once here: name, title, profile, skills,
            experience, photo, social links... English and German are
            written side by side below — a photo/signature is shared
            between them, no need to upload it twice. Then, in the
            builder, pick which language each document reads (Global
            Style → Content language), link a block to one of these
            contents, or open any template and click "Fill with my
            content" to apply everything at once.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={handleCopyEnToDe}
            title="Overwrite the German column with a copy of the English one, as a starting point to translate from"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Copy size={13} />
            Copy EN → DE
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Upload size={13} />
            Import backup
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Download size={13} />
            Export backup
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a field (e.g. &quot;profile&quot;, &quot;skills&quot;)..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-4">
        {visibleSections.map((section) => (
          <CollapsibleSection key={section.title} title={section.title} forceOpen={isSearching}>
            {section.keys.map((key) => {
              const slot = CONTENT_SLOTS.find((s) => s.key === key)
              if (!slot) return null
              return (
                <SlotCard
                  key={slot.key}
                  slot={slot}
                  libraries={libraries}
                  languages={languages}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              )
            })}
          </CollapsibleSection>
        ))}
        {!isSearching && (
          <CollapsibleSection title="Section titles">
            <p className="-mt-2 text-xs text-slate-400">
              Customize the wording of any heading a CV shows (Experience, Education, Professional Profile, Quote,
              ...) in either language. Leave a box empty to keep using the default shown as its placeholder.
            </p>
            {SECTION_TITLE_DEFS.map((def) => (
              <SectionTitleRow
                key={def.key}
                def={def}
                titles={titles}
                languages={languages}
                onChange={handleTitleChange}
                onBlur={handleBlur}
              />
            ))}
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}
