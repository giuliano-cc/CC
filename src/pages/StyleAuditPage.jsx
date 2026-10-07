import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import BlockRenderer from '../components/builder/BlockRenderer'
import FontPicker from '../components/builder/FontPicker'
import { BLOCK_TYPES, createBlockInstance } from '../utils/blockTypes'
import { DEFAULT_GLOBAL_STYLE } from '../context/BuilderContext'

// Debug-only page (see /debug-styles in App.jsx): a "map" of every text
// block type against the Global Style system, to see at a glance which
// blocks actually honor Font Family/Size/Color and which silently ignore
// them. Deliberately reads the real, live BlockRenderer output (not a
// hand-written description of what each block "should" do) — the
// technical panel on the right is built by inspecting the actual DOM
// BlockRenderer produced for that block, so it can never drift out of
// sync with the component code the way a written-out doc would.

// One instance per block/variant worth auditing — every type BlockRenderer
// treats as "text" in some way, plus one row per Heading size so the H1/H2/
// H3 mapping is actually visible. Columns/Divider/Image/Shape/QR/Social are
// left out: they're not primarily text, so a font/size/color audit of them
// wouldn't mean much. `scale` describes which Global Style typography-scale
// row (if any) this block/variant actually reads — see scaleBadge below for
// how each was confirmed by reading BlockRenderer.jsx itself, not guessed.
const AUDIT_SAMPLES = [
  { type: BLOCK_TYPES.HEADER, label: 'Header', scale: 'H2', scaleNote: 'Falls back to Global Style\'s H2 row, same mechanism as Heading/Text.' },
  { type: BLOCK_TYPES.CV_HEADER, label: 'Resume Header (CV Header)', scale: 'H1', scaleNote: 'Name falls back to H1; role falls back to P2; USP falls back to P1.' },
  { type: BLOCK_TYPES.HEADING, overrides: { size: 'xl' }, label: 'Heading — size "xl"', scale: 'H1', scaleNote: 'Reads Global Style\'s H1 row (unless this block has its own Font Size override).' },
  { type: BLOCK_TYPES.HEADING, overrides: { size: 'lg' }, label: 'Heading — size "lg"', scale: 'H2', scaleNote: 'Reads Global Style\'s H2 row.' },
  { type: BLOCK_TYPES.HEADING, overrides: { size: 'md' }, label: 'Heading — size "md"', scale: 'H3', scaleNote: 'Reads Global Style\'s H3 row.' },
  { type: BLOCK_TYPES.HEADING, overrides: { size: 'sm' }, label: 'Heading — size "sm"', scale: 'none', scaleNote: '"sm" has its own fixed baseline — outside the H1–H3 scale.' },
  { type: BLOCK_TYPES.TEXT, label: 'Text / Paragraph', scale: 'P1', scaleNote: 'Falls back to Global Style\'s P1 size (unless this block has its own Font Size override).' },
  { type: BLOCK_TYPES.QUOTE, label: 'Quote', scale: 'P1', scaleNote: 'Same P1 fallback as a plain paragraph.' },
  { type: BLOCK_TYPES.FOOTER, label: 'Footer', scale: 'none', scaleNote: 'Fixed Tailwind "text-xs" — not wired to the scale at all.' },
  { type: BLOCK_TYPES.CONTACT_INFO, label: 'Contact Info', scale: 'P1', scaleNote: 'Body lines fall back to P1 (unless "Body size" is set on this block).' },
  { type: BLOCK_TYPES.LEISURE, label: 'Leisure / Hobbies', scale: 'P1', scaleNote: 'Falls back to Global Style\'s P1 size, same as every other body-text block.' },
  { type: BLOCK_TYPES.EXPERIENCE, label: 'Experience (entries)', scale: 'P1', scaleNote: 'Description/date lines fall back to P1; the entry title itself is a separate fixed-16px identity, not part of the scale.' },
  { type: BLOCK_TYPES.EDUCATION, label: 'Education (entries)', scale: 'P1', scaleNote: 'Same as Experience.' },
  { type: BLOCK_TYPES.SKILLS_CHART, label: 'Technical Skills (chart)', scale: 'none*', scaleNote: 'Title uses its own fixed sm/md/lg/xl baseline (not the editable H1–H3 scale) — only grouped with it visually in "Text styles used in this template".' },
  { type: BLOCK_TYPES.LANGUAGES_CHART, label: 'Languages (chart)', scale: 'none*', scaleNote: 'Same as Technical Skills.' },
]

// A hardcoded Tailwind text-color utility (e.g. "text-slate-500") always
// wins over an inherited `color` — and everywhere in this codebase, Global
// Style's Primary/Text color is applied as an inline `style.color`, never
// as a class. So any element carrying one of these classes has its color
// permanently disconnected from Global Style, regardless of what the user
// picks there. This is a fact about CSS specificity, not a guess — it's
// what actually makes Footer/Quote/CV Header ignore the page's text color
// (see the findings list below the audit table).
// (?<!:) excludes a variant-prefixed class like "marker:text-slate-400"
// (colors only the bullet's ::marker pseudo-element, not the element's own
// text) from being flagged as the element's own hardcoded color.
const HARDCODED_COLOR_CLASS = /(?<!:)\btext-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/

function collectStyleInfo(root) {
  const rows = []
  function walk(el) {
    const classes = el.getAttribute('class') || ''
    const styleAttr = el.getAttribute('style') || ''
    if (classes || styleAttr) {
      const colorMatch = classes.match(HARDCODED_COLOR_CLASS)
      const hasInlineColor = /(^|;)\s*color\s*:/.test(styleAttr)
      rows.push({
        tag: el.tagName.toLowerCase(),
        sample: el.children.length === 0 ? el.textContent.trim().slice(0, 36) : '',
        classes,
        style: styleAttr,
        flagged: !!colorMatch && !hasInlineColor,
        flagReason: colorMatch
          ? `Hardcoded "${colorMatch[0]}" class — always overrides the inherited Global Style text color, since nothing here sets an inline color.`
          : null,
      })
    }
    Array.from(el.children).forEach(walk)
  }
  Array.from(root.children).forEach(walk)
  return rows
}

const SCALE_BADGE_CLASSES = {
  none: 'bg-slate-100 text-slate-500',
  'none*': 'bg-slate-100 text-slate-500',
}

function AuditRow({ sample: config, globalStyle }) {
  const containerRef = useRef(null)
  const [rows, setRows] = useState([])
  const sample = { ...createBlockInstance(config.type), ...config.overrides }

  useEffect(() => {
    if (containerRef.current) setRows(collectStyleInfo(containerRef.current))
  }, [globalStyle])

  const flaggedCount = rows.filter((r) => r.flagged).length

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{config.label}</span>
          <div className="flex items-center gap-1.5">
            <span
              title={config.scaleNote}
              className={`cursor-help rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                SCALE_BADGE_CLASSES[config.scale] || 'bg-primary/10 text-primary'
              }`}
            >
              scale: {config.scale}
            </span>
            {flaggedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                <AlertTriangle size={11} />
                {flaggedCount} hardcoded
              </span>
            )}
          </div>
        </div>
        <p className="-mt-1 text-[11px] text-slate-400">{config.scaleNote}</p>
        <div
          className="rounded-lg border border-dashed border-slate-200 p-4"
          style={{
            fontFamily: globalStyle.bodyFontFamily || globalStyle.fontFamily,
            color: globalStyle.textColor,
            background: globalStyle.pageBackground,
          }}
        >
          <div ref={containerRef}>
            <BlockRenderer block={sample} globalStyle={globalStyle} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
        {rows.length === 0 && <span className="text-slate-500">No classes/inline styles found.</span>}
        {rows.map((row, i) => (
          <div
            key={i}
            className={`rounded px-1.5 py-1 ${row.flagged ? 'border border-red-500/60 bg-red-950/40' : ''}`}
          >
            <div className="flex items-center gap-1.5">
              {row.flagged && <AlertTriangle size={11} className="shrink-0 text-red-400" />}
              <span className="text-sky-400">&lt;{row.tag}&gt;</span>
              {row.sample && <span className="truncate text-slate-500">"{row.sample}"</span>}
            </div>
            {row.classes && (
              <div className="pl-3 text-amber-300">
                class=<span className="text-amber-200">"{row.classes}"</span>
              </div>
            )}
            {row.style && (
              <div className="pl-3 text-emerald-300">
                style=<span className="text-emerald-200">"{row.style}"</span>
              </div>
            )}
            {row.flagged && <div className="pl-3 text-red-300">⚠ {row.flagReason}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StyleAuditPage() {
  const [globalStyle, setGlobalStyle] = useState(DEFAULT_GLOBAL_STYLE)

  function set(key, value) {
    setGlobalStyle((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">Style Audit — Global Style vs. block output</h1>
      <p className="mt-1 text-sm text-slate-500">
        Debug tool: every text-ish block type rendered side by side with the exact Tailwind classes and inline
        styles BlockRenderer gave it, so it's obvious at a glance which blocks actually follow the Global Style
        controls below and which ones don't. Not linked from the sidebar — reach it directly at{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5">/debug-styles</code>.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Body font</label>
          <FontPicker
            value={globalStyle.bodyFontFamily || globalStyle.fontFamily}
            onChange={(v) => set('bodyFontFamily', v)}
            includeInherit={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Title font</label>
          <FontPicker
            value={globalStyle.titleFontFamily || globalStyle.fontFamily}
            onChange={(v) => set('titleFontFamily', v)}
            includeInherit={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Accent color</label>
          <input
            type="color"
            value={globalStyle.primaryColor}
            onChange={(e) => set('primaryColor', e.target.value)}
            className="h-9 w-full rounded-md border border-slate-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Text color</label>
          <input
            type="color"
            value={globalStyle.textColor}
            onChange={(e) => set('textColor', e.target.value)}
            className="h-9 w-full rounded-md border border-slate-300"
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-medium text-slate-500">
          Typography scale (Global Style's "Text styles used in this template" sizes) — each "scale: …" badge
          below names which of these rows that block/variant actually reads.
        </p>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {['h1', 'h2', 'h3', 'p1', 'p2', 'p3'].map((level) => (
            <div key={level} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">{level.toUpperCase()} size</label>
              <input
                type="number"
                value={globalStyle.typographyScale?.[level]?.sizePx ?? ''}
                onChange={(e) =>
                  set('typographyScale', {
                    ...globalStyle.typographyScale,
                    [level]: { ...globalStyle.typographyScale?.[level], sizePx: Number(e.target.value) },
                  })
                }
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          P2/P3 aren't applied automatically anywhere — no block falls back to them the way plain body text falls
          back to P1 (see "scale: none" badges above). They only reach a document if a specific block's own Font
          Size is set to match one by hand.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {AUDIT_SAMPLES.map((sample, i) => (
          <AuditRow key={i} sample={sample} globalStyle={globalStyle} />
        ))}
      </div>
    </div>
  )
}
