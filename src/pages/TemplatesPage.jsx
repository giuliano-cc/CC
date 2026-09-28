import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Plus, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import {
  deleteTemplate,
  duplicateTemplate,
  exportTemplates,
  getTemplates,
  importTemplates,
} from '../services/templatesService'
import TemplateCard from '../components/templates/TemplateCard'
import Skeleton from '../components/common/Skeleton'
import ErrorMessage from '../components/common/ErrorMessage'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const importInputRef = useRef(null)
  const { data: templates, setData, isLoading, error, refetch } = useApi(
    getTemplates,
    [],
  )

  async function handleExport() {
    const blob = new Blob([await exportTemplates()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'printflow-templates-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded')
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!window.confirm('Restore templates from this backup? This replaces every template currently saved in this browser.')) {
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await importTemplates(reader.result)
        refetch()
        toast.success('Backup imported')
      } catch {
        toast.error('This file is not a valid backup.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

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
            title="Restore templates from a backup file — replaces every template currently saved in this browser"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Upload size={13} />
            Import backup
          </button>
          <button
            type="button"
            onClick={handleExport}
            title="Download every template in this browser as a JSON backup file"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Download size={13} />
            Export backup
          </button>
          <button
            type="button"
            onClick={() => navigate('/templates/new')}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
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
