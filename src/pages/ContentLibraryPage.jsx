import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronDown, Crop, Download, Trash2, Upload, User } from 'lucide-react'
import { CONTENT_SLOTS, useContentLibrary } from '../context/ContentLibraryContext'
import ImageCropModal from '../components/builder/ImageCropModal'
import { formatSocialLinks, parseSocialLinks, SOCIAL_PLATFORMS } from '../utils/socialIcons'
import {
  composeChecklistText,
  composeEntriesText,
  composeLanguagesText,
  emptyEntry,
  LANGUAGE_LEVELS,
  parseChecklist,
  parseEntries,
  parseLanguages,
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
  { title: 'Identity', keys: ['name', 'title', 'usp', 'photo', 'signature'] },
  { title: 'Profile & Quote', keys: ['profileSummary', 'quote', 'quoteAuthor'] },
  { title: 'Experience & Education', keys: ['experience', 'education'] },
  {
    title: 'Skills & Languages',
    keys: ['coreCompetencies', 'skills', 'languages', 'keywords', 'achievements'],
  },
  { title: 'Portfolio', keys: ['selectedWorks', 'selectedClients', 'certifications', 'publications'] },
  { title: 'Contact & Links', keys: ['contact', 'socialLinks', 'qrValue'] },
  { title: 'Additional', keys: ['references', 'additionalInfo', 'hobbies'] },
  { title: 'Cover Letter', keys: ['coverLetterBody'] },
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
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result)
      toast.success(`${isSignature ? 'Signature' : 'Photo'} saved`, { id: 'content-library-save' })
    }
    reader.readAsDataURL(file)
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
  const fields = [
    { key: 'contactAddress', label: 'Address', placeholder: '123 Main St, City' },
    { key: 'contactPhone', label: 'Phone', placeholder: '+00 000 000 0000' },
    { key: 'contactEmail', label: 'Email', placeholder: 'you@example.com' },
    { key: 'contactWebsite', label: 'Website', placeholder: 'yourwebsite.com' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-xs text-slate-500" htmlFor={field.key}>
            {field.label}
          </label>
          <input
            id={field.key}
            type="text"
            value={library[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={inputClasses}
          />
        </div>
      ))}
    </div>
  )
}

// Line-by-line editor with a visibility checkbox per row: unchecking an
// item keeps it saved but excludes it from the plain-text value that the
// rest of the app (bindings, "Fill with my content") already reads.
function ChecklistField({ itemsJson, fallbackText, onUpdate }) {
  const items = parseChecklist(itemsJson, fallbackText)

  function set(next) {
    onUpdate(next)
  }

  function updateItem(index, patch) {
    set(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    set([...items, { text: '', visible: true }])
  }

  function removeItem(index) {
    set(items.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
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
        + Add item
      </button>
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

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
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
      ))}
      <button type="button" onClick={addItem} className="self-start text-xs font-medium text-primary hover:underline">
        + Add language
      </button>
    </div>
  )
}

// Repeatable Work Experience / Education entry: title (Job Role / Degree),
// subtitle (Company / Institution), an optional location, a date range
// with a "current/ongoing" flag, and a description (rendered as bullet
// lines by the matching builder block — see BLOCK_TYPES.EXPERIENCE/EDUCATION).
function EntriesField({ itemsJson, fallbackText, titleLabel, subtitleLabel, showSubtitle = true, showDates = true, onUpdate }) {
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
            <input
              type="text"
              value={item.location}
              onChange={(e) => updateItem(i, { location: e.target.value })}
              placeholder="City, Country"
              className={`${inputClasses} min-w-0 flex-1`}
            />
          </div>
          {showDates && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={item.startDate}
                onChange={(e) => updateItem(i, { startDate: e.target.value })}
                placeholder="Start (e.g. Jan 2022)"
                className={`${inputClasses} min-w-0 flex-1`}
              />
              <input
                type="text"
                value={item.endDate}
                onChange={(e) => updateItem(i, { endDate: e.target.value })}
                placeholder="End (e.g. Jan 2024)"
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
      <button type="button" onClick={addItem} className="self-start text-xs font-medium text-primary hover:underline">
        + Add entry
      </button>
    </div>
  )
}

// One CONTENT_SLOTS card — the same field-type dispatch this page always
// had, just pulled out so it can be reused inside each collapsible
// section instead of one long inline map.
function SlotCard({ slot, library, onChange, onBlur }) {
  return (
    <div className={cardClasses}>
      <label className="text-sm font-semibold text-slate-800" htmlFor={slot.key}>
        {slot.label}
      </label>
      {slot.isList && <p className="-mt-1 text-xs text-slate-400">One item per line.</p>}
      {slot.type === 'checklist' && (
        <p className="-mt-1 text-xs text-slate-400">Uncheck an item to hide it from the CV without deleting it.</p>
      )}

      {slot.type === 'image' && (
        <PhotoField
          value={library[slot.key]}
          onChange={(v) => onChange(slot.key, v)}
          variant={slot.key === 'signature' ? 'signature' : 'photo'}
        />
      )}

      {slot.type === 'social' && (
        <SocialLinksField value={library[slot.key]} onChange={(v) => onChange(slot.key, v)} />
      )}

      {slot.type === 'contactGroup' && <ContactGroupField library={library} onChange={onChange} />}

      {slot.type === 'checklist' && (
        <ChecklistField
          itemsJson={library[`${slot.key}Items`]}
          fallbackText={library[slot.key]}
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
          titleLabel={slot.key === 'education' ? 'Degree' : slot.key === 'selectedWorks' ? 'Project Title' : 'Job Role'}
          subtitleLabel={slot.key === 'education' ? 'Institution Name' : 'Company Name'}
          showSubtitle={slot.key !== 'selectedWorks'}
          showDates={slot.key !== 'selectedWorks'}
          onUpdate={(items) => {
            onChange(`${slot.key}Items`, JSON.stringify(items))
            onChange(slot.key, composeEntriesText(items))
            toast.success('Content saved', { id: 'content-library-save' })
          }}
        />
      )}

      {!slot.type && (
        <textarea
          id={slot.key}
          rows={slot.multiline ? 5 : 2}
          value={library[slot.key]}
          onChange={(e) => onChange(slot.key, e.target.value)}
          onBlur={onBlur}
          placeholder={
            slot.key === 'qrValue'
              ? 'https://your-portfolio.com'
              : slot.key === 'usp'
                ? 'What makes you different in one short line'
                : slot.isList
                  ? 'Item 1\nItem 2\nItem 3'
                  : 'Write the content here...'
          }
          className={inputClasses}
        />
      )}
    </div>
  )
}

// A collapsible group of SlotCards — open by default (nothing is hidden
// on first load), collapsible from then on so a long library doesn't mean
// endless scrolling once most sections are already filled in.
function CollapsibleSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(true)

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
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-4 md:grid-cols-2">{children}</div>
      )}
    </section>
  )
}

export default function ContentLibraryPage() {
  const { library, language, setLanguage, languages, updateSlot, exportLibrary, importLibrary } = useContentLibrary()
  const importInputRef = useRef(null)

  function handleChange(key, value) {
    updateSlot(key, value)
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Content Library</h1>
          <p className="text-sm text-slate-500">
            Write your CV content once here: name, title, profile, skills,
            experience, photo, social links... Then, in the builder, either
            link a block to one of these contents, or open any template and
            click "Fill with my content" to apply everything at once.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-md border border-slate-300 p-0.5" title="Content is kept separately per language — switch to write the German version">
            {languages.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLanguage(l.key)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  language === l.key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
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

      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <CollapsibleSection key={section.title} title={section.title}>
            {section.keys.map((key) => {
              const slot = CONTENT_SLOTS.find((s) => s.key === key)
              if (!slot) return null
              return (
                <SlotCard
                  key={slot.key}
                  slot={slot}
                  library={library}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              )
            })}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  )
}
