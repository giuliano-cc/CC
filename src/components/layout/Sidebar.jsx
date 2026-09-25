import { NavLink } from 'react-router-dom'
import { FileText, Image, LayoutTemplate, Tag } from 'lucide-react'

const WORKSPACE_ITEMS = [
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/documents', label: 'Documenti', icon: FileText },
  { to: '/images', label: 'Immagini', icon: Image },
]

const CATEGORIES = ['Fatture', 'Report', 'Curriculum', 'Contratti', 'Lettere']

function navLinkClasses({ isActive }) {
  return [
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-white/10 text-white'
      : 'text-slate-300 hover:bg-white/5 hover:text-white',
  ].join(' ')
}

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-white md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <LayoutTemplate size={18} />
        </div>
        <span className="text-lg font-semibold">PrintFlow</span>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        {WORKSPACE_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClasses}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <nav className="flex flex-col gap-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Categorie
        </p>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Tag size={15} />
            {category}
          </button>
        ))}
      </nav>
    </aside>
  )
}
