import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronDown, Download, LogOut, Plus, Search, Upload, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useContentLibrary } from '../../context/ContentLibraryContext'
import { exportTemplates, importTemplates } from '../../services/templatesService'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { exportLibrary, importLibrary } = useContentLibrary()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const importAllInputRef = useRef(null)

  function handleLogout() {
    setIsMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  // Everything a user has built lives only in this browser's localStorage
  // (templates + Content Library, each already backupable on its own
  // page) — one combined file, reachable from anywhere in the app, so
  // saving "all of today's work" is a single click instead of remembering
  // to export both pages separately.
  function handleExportAll() {
    const backup = {
      exportedAt: new Date().toISOString(),
      templates: JSON.parse(exportTemplates()),
      contentLibrary: JSON.parse(exportLibrary()),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'printflow-full-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    setIsMenuOpen(false)
    toast.success('Full backup downloaded')
  }

  function handleImportAllFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (
      !window.confirm(
        'Restore templates and Content Library from this backup? This replaces everything currently saved in this browser.',
      )
    ) {
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result)
        if (!backup.templates || !backup.contentLibrary) throw new Error('Not a valid full backup')
        importTemplates(JSON.stringify(backup.templates))
        importLibrary(JSON.stringify(backup.contentLibrary))
        toast.success('Full backup imported — reloading...')
        // Templates are cached in a module-level array read once by
        // getTemplates() on mount, not reactive state — a reload is the
        // simplest way for every already-open page (Templates list, any
        // open builder tab) to pick up the restored data consistently.
        setTimeout(() => window.location.reload(), 800)
      } catch {
        toast.error('This file is not a valid full backup.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const initials = (user?.name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates, documents..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/templates/new')}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
      >
        <Plus size={16} />
        New Template
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {initials}
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </button>

        {isMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  navigate('/profile')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <User size={15} />
                Profile
              </button>
              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  onClick={handleExportAll}
                  title="Download templates + Content Library together, as one backup file"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Download size={15} />
                  Export full backup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    importAllInputRef.current?.click()
                  }}
                  title="Restore templates + Content Library from a full backup file"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Upload size={15} />
                  Import full backup
                </button>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          </>
        )}
        <input
          ref={importAllInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportAllFile}
        />
      </div>
    </header>
  )
}
