import toast from 'react-hot-toast'
import { CONTENT_SLOTS, useContentLibrary } from '../context/ContentLibraryContext'

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
          Write your CV content once here: title, profile, skills,
          experience... Then, in the builder, link a text block to one of
          these contents to reuse it across different templates without
          rewriting it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CONTENT_SLOTS.map((slot) => (
          <div
            key={slot.key}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4"
          >
            <label className="text-sm font-semibold text-slate-800" htmlFor={slot.key}>
              {slot.label}
            </label>
            {slot.isList && (
              <p className="-mt-1 text-xs text-slate-400">One item per line.</p>
            )}
            <textarea
              id={slot.key}
              rows={slot.multiline ? 5 : 2}
              value={library[slot.key]}
              onChange={(e) => handleChange(slot.key, e.target.value)}
              onBlur={handleBlur}
              placeholder={
                slot.isList
                  ? 'Item 1\nItem 2\nItem 3'
                  : 'Write the content here...'
              }
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
