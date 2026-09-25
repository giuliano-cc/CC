import toast from 'react-hot-toast'
import { Download, Trash2 } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { deleteDocument, getDocuments } from '../services/documentsService'
import Skeleton from '../components/common/Skeleton'
import ErrorMessage from '../components/common/ErrorMessage'

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-700',
  processing: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  completed: 'Completato',
  processing: 'In elaborazione',
  failed: 'Fallito',
}

export default function DocumentsPage() {
  const { data: documents, setData, isLoading, error, refetch } = useApi(
    getDocuments,
    [],
  )

  async function handleDelete(id) {
    const confirmed = window.confirm('Eliminare questo documento?')
    if (!confirmed) return

    try {
      await deleteDocument(id)
      setData((prev) => (prev ?? []).filter((d) => d.id !== id))
      toast.success('Documento eliminato')
    } catch {
      toast.error('Impossibile eliminare il documento')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Documenti</h1>
        <p className="text-sm text-slate-500">
          Storico dei documenti generati dai tuoi template.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <ErrorMessage message="Impossibile caricare i documenti." onRetry={refetch} />
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Stato</th>
                <th className="px-4 py-3 font-medium text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nessun documento generato finora.
                  </td>
                </tr>
              )}
              {documents?.map((doc) => (
                <tr key={doc.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{doc.name}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.type}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(doc.createdAt).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
                        aria-label="Scarica"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
