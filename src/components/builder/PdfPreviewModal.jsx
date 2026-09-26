import { useEffect } from 'react'
import { Download, Loader2, X } from 'lucide-react'

// Shows the generated PDF blob in an <iframe> (browsers render PDFs
// natively there) plus a direct download link. `blobUrl` is null while
// still generating.
export default function PdfPreviewModal({ blobUrl, isGenerating, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">PDF preview</h2>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download="printflow-document.pdf"
                className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
              >
                <Download size={13} />
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden bg-slate-100">
          {isGenerating || !blobUrl ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Generating PDF preview...</p>
            </div>
          ) : (
            <iframe src={blobUrl} title="PDF preview" className="h-full w-full border-0" />
          )}
        </div>
      </div>
    </div>
  )
}
