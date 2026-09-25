import { useBuilder } from '../../context/BuilderContext'
import { BLOCK_TYPES } from '../../utils/blockTypes'

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClasses =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

function GlobalStylePanel() {
  const { globalStyle, setGlobalStyle } = useBuilder()

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">Stile Globale</h3>
      <Field label="Colore primario">
        <input
          type="color"
          value={globalStyle.primaryColor}
          onChange={(e) =>
            setGlobalStyle((prev) => ({ ...prev, primaryColor: e.target.value }))
          }
          className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
        />
      </Field>
      <Field label="Colore testo">
        <input
          type="color"
          value={globalStyle.textColor}
          onChange={(e) =>
            setGlobalStyle((prev) => ({ ...prev, textColor: e.target.value }))
          }
          className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
        />
      </Field>
      <Field label="Font">
        <select
          value={globalStyle.fontFamily}
          onChange={(e) =>
            setGlobalStyle((prev) => ({ ...prev, fontFamily: e.target.value }))
          }
          className={inputClasses}
        >
          <option value="Inter, system-ui, sans-serif">Inter</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Georgia, 'Times New Roman', serif">Georgia (serif)</option>
          <option value="'Segoe UI', Arial, sans-serif">Segoe UI</option>
          <option value="'Courier New', monospace">Courier New</option>
        </select>
      </Field>
      <p className="text-xs text-slate-400">
        Seleziona un blocco nel foglio per modificarne le proprietà specifiche.
      </p>
    </div>
  )
}

const BLOCK_LABELS = {
  [BLOCK_TYPES.HEADER]: 'Header',
  [BLOCK_TYPES.CV_HEADER]: 'Intestazione CV',
  [BLOCK_TYPES.HEADING]: 'Heading',
  [BLOCK_TYPES.TEXT]: 'Testo',
  [BLOCK_TYPES.IMAGE]: 'Immagine',
  [BLOCK_TYPES.DIVIDER]: 'Divisore',
  [BLOCK_TYPES.QUOTE]: 'Citazione',
  [BLOCK_TYPES.FOOTER]: 'Footer',
  [BLOCK_TYPES.COLUMNS]: 'Colonne',
}

function CvHeaderProperties({ block, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Nome">
        <textarea
          rows={2}
          value={block.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${inputClasses} resize-none`}
        />
      </Field>
      <Field label="Ruolo / sottotitolo">
        <input
          type="text"
          value={block.role || ''}
          onChange={(e) => onChange({ role: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="Contatti (uno per riga)">
        <textarea
          rows={3}
          value={(block.contacts || []).join('\n')}
          onChange={(e) => onChange({ contacts: e.target.value.split('\n') })}
          className={`${inputClasses} resize-none`}
        />
      </Field>
      <Field label="Disposizione">
        <select
          value={block.layout}
          onChange={(e) => onChange({ layout: e.target.value })}
          className={inputClasses}
        >
          <option value="row">In riga</option>
          <option value="stacked">Impilata</option>
        </select>
      </Field>
    </div>
  )
}

function ColumnsProperties({ block }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        Questo blocco contiene {block.columns.length} colonne. Clicca su un
        titolo o un testo all'interno del foglio per modificarlo, oppure usa i
        pulsanti "+ Titolo" / "+ Testo" sotto ogni colonna per aggiungere
        nuovi elementi.
      </p>
    </div>
  )
}

function BlockPropertiesPanel({ block, onChange }) {
  if (block.type === BLOCK_TYPES.CV_HEADER) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Blocco: {BLOCK_LABELS[block.type]}
        </h3>
        <CvHeaderProperties block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.COLUMNS) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Blocco: {BLOCK_LABELS[block.type]}
        </h3>
        <ColumnsProperties block={block} />
      </div>
    )
  }

  const showAlign = block.type !== BLOCK_TYPES.DIVIDER
  const showContent = block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.IMAGE
  const isHeading = block.type === BLOCK_TYPES.HEADING
  const isText = block.type === BLOCK_TYPES.TEXT
  const hasColor = [BLOCK_TYPES.HEADING, BLOCK_TYPES.TEXT, BLOCK_TYPES.QUOTE].includes(block.type)

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Blocco: {BLOCK_LABELS[block.type] || block.type}
      </h3>

      {showContent && (
        <Field label="Testo">
          <textarea
            rows={3}
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}

      {block.type === BLOCK_TYPES.IMAGE && (
        <>
          <Field label="URL immagine">
            <input
              type="text"
              value={block.src}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://..."
              className={inputClasses}
            />
          </Field>
          <Field label="Forma">
            <select
              value={block.shape}
              onChange={(e) => onChange({ shape: e.target.value })}
              className={inputClasses}
            >
              <option value="rect">Rettangolare</option>
              <option value="circle">Circolare</option>
            </select>
          </Field>
        </>
      )}

      {isHeading && (
        <Field label="Dimensione">
          <select
            value={block.size}
            onChange={(e) => onChange({ size: e.target.value })}
            className={inputClasses}
          >
            <option value="sm">Piccolo</option>
            <option value="md">Medio</option>
            <option value="lg">Grande</option>
            <option value="xl">Molto grande</option>
          </select>
        </Field>
      )}

      {showAlign && (
        <Field label="Allineamento">
          <select
            value={block.align}
            onChange={(e) => onChange({ align: e.target.value })}
            className={inputClasses}
          >
            <option value="left">Sinistra</option>
            <option value="center">Centro</option>
            <option value="right">Destra</option>
          </select>
        </Field>
      )}

      {hasColor && (
        <Field label="Colore testo">
          <input
            type="color"
            value={block.color || '#1e293b'}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
        </Field>
      )}

      {showContent && (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!block.bold}
              onChange={(e) => onChange({ bold: e.target.checked })}
            />
            Grassetto
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!block.italic}
              onChange={(e) => onChange({ italic: e.target.checked })}
            />
            Corsivo
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!block.underline}
              onChange={(e) => onChange({ underline: e.target.checked })}
            />
            Sottolineato
          </label>
          {isHeading && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={!!block.rule}
                onChange={(e) => onChange({ rule: e.target.checked })}
              />
              Linea sotto
            </label>
          )}
          {isText && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={!!block.list}
                onChange={(e) => onChange({ list: e.target.checked })}
              />
              Elenco puntato
            </label>
          )}
        </div>
      )}
    </div>
  )
}

export default function PropertiesPanel() {
  const { selectedBlock, updateBlock } = useBuilder()

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
      {selectedBlock ? (
        <BlockPropertiesPanel
          block={selectedBlock}
          onChange={(patch) => updateBlock(selectedBlock.id, patch)}
        />
      ) : (
        <GlobalStylePanel />
      )}
    </aside>
  )
}
