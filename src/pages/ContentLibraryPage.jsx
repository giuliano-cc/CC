import { useRef } from 'react'
import toast from 'react-hot-toast'
import { Trash2, Upload, User } from 'lucide-react'
import { CONTENT_SLOTS, useContentLibrary } from '../context/ContentLibraryContext'
import { formatSocialLinks, parseSocialLinks, SOCIAL_PLATFORMS } from '../utils/socialIcons'

const cardClasses = 'flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4'
const inputClasses =
  'w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

function PhotoField({ value, onChange }) {
  const fileInputRef = useRef(null)

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
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex items-center gap-1 text-xs text-red-500 hover:underline"
        >
          <Trash2 size={13} />
          Remove
        </button>
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
            className={`${inputClasses} w-28 shrink-0`}
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
            className={inputClasses}
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

export default function ContentLibraryPage() {
  const { library, updateSlot } = useContentLibrary()

  function handleChange(key, value) {
    updateSlot(key, value)
  }

  function handleBlur() {
    toast.success('Content saved', { id: 'content-library-save' })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Content Library</h1>
        <p className="text-sm text-slate-500">
          Write your CV content once here: name, title, profile, skills,
          experience, photo, social links... Then, in the builder, either
          link a block to one of these contents, or open any template and
          click "Fill with my content" to apply everything at once.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CONTENT_SLOTS.map((slot) => (
          <div key={slot.key} className={cardClasses}>
            <label className="text-sm font-semibold text-slate-800" htmlFor={slot.key}>
              {slot.label}
            </label>
            {slot.isList && (
              <p className="-mt-1 text-xs text-slate-400">One item per line.</p>
            )}

            {slot.type === 'image' && (
              <PhotoField value={library[slot.key]} onChange={(v) => handleChange(slot.key, v)} />
            )}

            {slot.type === 'social' && (
              <SocialLinksField value={library[slot.key]} onChange={(v) => handleChange(slot.key, v)} />
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
