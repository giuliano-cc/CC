import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react'

export default function TemplateCard({ template, onDuplicate, onDelete }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formattedDate = new Date(template.updatedAt).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={() => navigate(`/templates/${template.id}`)}
        className="flex h-40 w-full items-center justify-center bg-slate-50 text-slate-300"
      >
        <FileText size={40} />
      </button>

      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-800">
            {template.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {template.category} · {formattedDate}
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Azioni template"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Chiudi menu"
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
                  Modifica
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
                  Duplica
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
                  Elimina
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
