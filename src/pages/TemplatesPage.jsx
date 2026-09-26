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
      toast.success('Template duplicated')
    } catch {
      toast.error('Unable to duplicate the template')
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Permanently delete this template?')
    if (!confirmed) return

    try {
      await deleteTemplate(id)
      setData((prev) => (prev ?? []).filter((t) => t.id !== id))
      toast.success('Template deleted')
    } catch {
      toast.error('Unable to delete the template')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Your templates</h1>
          <p className="text-sm text-slate-500">
            Manage the layouts you've created for invoices, reports and more.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/templates/new')}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Plus size={16} />
          New Template
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
          message="Unable to load templates."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && templates?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
          No templates yet. Create one to get started.
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
