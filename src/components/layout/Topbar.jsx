import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Plus, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [search, setSearch] = useState('')

  function handleLogout() {
    setIsMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
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
            placeholder="Cerca template, documenti..."
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
        Nuovo Template
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
              aria-label="Chiudi menu"
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
                Profilo
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
