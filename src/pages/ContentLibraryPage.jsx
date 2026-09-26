import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Crop, Download, Trash2, Upload, User } from 'lucide-react'
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
const inputClasses =
  'w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

function PhotoField({ value, onChange }) {
  const fileInputRef = useRef(null)
  const [isCropping, setIsCropping] = useState(false)

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result)
      toast.success('Photo saved', { id: 'content-library-save' })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-slate-300">
        {value ? (
          <img src={value} alt="Profile" className="h-full w-full object-cover" />
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
        Upload photo
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
          initialAspect={1}
          initialShape="circle"
          onCancel={() => setIsCropping(false)}
          onApply={(dataUrl) => {
            onChange(dataUrl)
            setIsCropping(false)
            toast.success('Photo saved', { id: 'content-library-save' })
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
function EntriesField({ itemsJson, fallbackText, titleLabel, subtitleLabel, onUpdate }) {
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
            <input
              type="text"
              value={item.subtitle}
              onChange={(e) => updateItem(i, { subtitle: e.target.value })}
              placeholder={subtitleLabel}
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

export default function ContentLibraryPage() {
  const { library, updateSlot, exportLibrary, importLibrary } = useContentLibrary()
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CONTENT_SLOTS.filter((slot) => !slot.group).map((slot) => (
          <div key={slot.key} className={cardClasses}>
            <label className="text-sm font-semibold text-slate-800" htmlFor={slot.key}>
              {slot.label}
            </label>
            {slot.isList && (
              <p className="-mt-1 text-xs text-slate-400">One item per line.</p>
            )}
            {slot.type === 'checklist' && (
              <p className="-mt-1 text-xs text-slate-400">Uncheck an item to hide it from the CV without deleting it.</p>
            )}

            {slot.type === 'image' && (
              <PhotoField value={library[slot.key]} onChange={(v) => handleChange(slot.key, v)} />
            )}

            {slot.type === 'social' && (
              <SocialLinksField value={library[slot.key]} onChange={(v) => handleChange(slot.key, v)} />
            )}

            {slot.type === 'contactGroup' && (
              <ContactGroupField library={library} onChange={handleChange} />
            )}

            {slot.type === 'checklist' && (
              <ChecklistField
                itemsJson={library[`${slot.key}Items`]}
                fallbackText={library[slot.key]}
                onUpdate={(items) => {
                  handleChange(`${slot.key}Items`, JSON.stringify(items))
                  handleChange(slot.key, composeChecklistText(items))
                  toast.success('Content saved', { id: 'content-library-save' })
                }}
              />
            )}

            {slot.type === 'languages' && (
              <LanguagesField
                itemsJson={library[`${slot.key}Items`]}
                fallbackText={library[slot.key]}
                onUpdate={(items) => {
                  handleChange(`${slot.key}Items`, JSON.stringify(items))
                  handleChange(slot.key, composeLanguagesText(items))
                  toast.success('Content saved', { id: 'content-library-save' })
                }}
              />
            )}

            {slot.type === 'entries' && (
              <EntriesField
                itemsJson={library[`${slot.key}Items`]}
                fallbackText={library[slot.key]}
                titleLabel={slot.key === 'education' ? 'Degree' : 'Job Role'}
                subtitleLabel={slot.key === 'education' ? 'Institution Name' : 'Company Name'}
                onUpdate={(items) => {
                  handleChange(`${slot.key}Items`, JSON.stringify(items))
                  handleChange(slot.key, composeEntriesText(items))
                  toast.success('Content saved', { id: 'content-library-save' })
                }}
              />
            )}

            {!slot.type && (
              <textarea
                id={slot.key}
                rows={slot.multiline ? 5 : 2}
                value={library[slot.key]}
                onChange={(e) => handleChange(slot.key, e.target.value)}
                onBlur={handleBlur}
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
        ))}
      </div>
    </div>
  )
}
