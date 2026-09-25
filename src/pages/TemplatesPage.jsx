import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import {
  deleteTemplate,
  duplicateTemplate,
  getTemplates,
} from '../services/templatesService'
import TemplateCard from '../components/templates/TemplateCard'
import Skeleton from '../components/common/Skeleton'
import ErrorMessage from '../components/common/ErrorMessage'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { data: templates, setData, isLoading, error, refetch } = useApi(
    getTemplates,
    [],
  )

  async function handleDuplicate(id) {
    try {
      const copy = await duplicateTemplate(id)
      setData((prev) => [copy, ...(prev ?? [])])
      toast.success('Template duplicato')
    } catch {
      toast.error('Impossibile duplicare il template')
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Eliminare definitivamente questo template?')
    if (!confirmed) return

    try {
      await deleteTemplate(id)
      setData((prev) => (prev ?? []).filter((t) => t.id !== id))
      toast.success('Template eliminato')
    } catch {
      toast.error('Impossibile eliminare il template')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">I tuoi template</h1>
          <p className="text-sm text-slate-500">
            Gestisci i layout che hai creato per fatture, report e altro.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/templates/new')}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Plus size={16} />
          Nuovo Template
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorMessage
          message="Impossibile caricare i template."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && templates?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
          Nessun template ancora. Creane uno per iniziare.
        </div>
      )}

      {!isLoading && !error && templates?.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
