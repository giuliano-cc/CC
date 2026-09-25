import { AlertTriangle, RotateCw } from 'lucide-react'

export default function ErrorMessage({
  message = 'Si è verificato un errore. Riprova.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="text-red-500" size={32} />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-200"
        >
          <RotateCw size={14} />
          Riprova
        </button>
      )}
    </div>
  )
}
