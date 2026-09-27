import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FONT_FAMILY_OPTIONS } from '../../utils/blockTypes'

const CATEGORY_TAG = { serif: 'serif', 'sans-serif': 'sans', monospace: 'mono' }

// A font picker that actually shows what each font looks like — a native
// <select><option style="font-family"> renders inconsistently across
// browsers (Safari ignores it entirely) and even where it works, the only
// text available to preview in is the font's own name, which doesn't show
// much for an unfamiliar name. This instead renders a fixed sample string
// in each font at a readable size, so the difference between two similar
// serif fonts is actually visible.
export default function FontPicker({
  value,
  onChange,
  includeInherit = true,
  panelWidth = 240,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const options = includeInherit
    ? FONT_FAMILY_OPTIONS
    : FONT_FAMILY_OPTIONS.filter((opt) => opt.value)
  const current =
    options.find((opt) => opt.value === (value || '')) ||
    (value ? { value, label: value.split(',')[0].replace(/['"]/g, '').trim(), category: null } : options[0])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-left text-sm outline-none transition focus:border-primary"
      >
        <span
          className="truncate"
          style={{ fontFamily: current.value || undefined }}
          title={current.label}
        >
          {current.label}
        </span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {open && (
        <div
          style={{ width: panelWidth }}
          className="absolute left-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => {
            const isSelected = opt.value === (value || '')
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`flex w-full flex-col gap-0.5 px-2.5 py-1.5 text-left transition hover:bg-slate-50 ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected ? (
                    <Check size={11} className="shrink-0 text-primary" />
                  ) : (
                    <span className="w-[11px] shrink-0" />
                  )}
                  <span className="truncate text-xs text-slate-500">{opt.label}</span>
                  {CATEGORY_TAG[opt.category] && (
                    <span className="ml-auto shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium uppercase leading-none text-slate-400">
                      {CATEGORY_TAG[opt.category]}
                    </span>
                  )}
                </span>
                {opt.value && (
                  <span
                    className="truncate pl-[15px] text-base leading-tight text-slate-800"
                    style={{ fontFamily: opt.value }}
                  >
                    AaBbCc 123
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
