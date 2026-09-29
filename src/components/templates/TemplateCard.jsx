import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Edit3, MoreVertical, Pencil, Trash2, Type } from 'lucide-react'
import { getTemplateFontLabels } from '../../utils/blockTypes'
import TemplateThumbnail from './TemplateThumbnail'

export default function TemplateCard({ template, onDuplicate, onDelete, onRename }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftTitle, setDraftTitle] = useState(template.title)
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select()
  }, [isRenaming])

  function commitRename() {
    setIsRenaming(false)
    const trimmed = draftTitle.trim()
    if (!trimmed || trimmed === template.title) {
      setDraftTitle(template.title)
      return
    }
    onRename(template.id, trimmed)
  }

  const formattedDate = new Date(template.updatedAt).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const fontLabels = getTemplateFontLabels(template)

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={() => navigate(`/templates/${template.id}`)}
        className="block w-full overflow-hidden rounded-t-xl"
      >
        <TemplateThumbnail template={template} />
      </button>

      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  setDraftTitle(template.title)
                  setIsRenaming(false)
                }
              }}
              className="w-full rounded border border-primary px-1 py-0.5 text-sm font-semibold text-slate-800 outline-none"
            />
          ) : (
            <h3 className="truncate text-sm font-semibold text-slate-800">
              {template.title}
            </h3>
          )}
          <p className="mt-0.5 text-xs text-slate-500">
            {template.category} · {formattedDate}
          </p>
          {fontLabels.length > 0 && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400" title={fontLabels.join(', ')}>
              <Type size={12} className="shrink-0" />
              {fontLabels.join(', ')}
            </p>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Template actions"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    navigate(`/templates/${template.id}`)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setDraftTitle(template.title)
                    setIsRenaming(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 size={14} />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onDuplicate(template.id)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onDelete(template.id)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
