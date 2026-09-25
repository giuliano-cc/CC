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
          <option value="'Courier New', monospace">Courier New</option>
        </select>
      </Field>
      <p className="text-xs text-slate-400">
        Seleziona un blocco nel foglio per modificarne le proprietà specifiche.
      </p>
    </div>
  )
}

function BlockPropertiesPanel({ block, onChange }) {
  const showAlign = block.type !== BLOCK_TYPES.DIVIDER
  const showContent = block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.IMAGE

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold capitalize text-slate-800">
        Blocco: {block.type}
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
        <Field label="URL immagine">
          <input
            type="text"
            value={block.src}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="https://..."
            className={inputClasses}
          />
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

      {showContent && (
        <div className="flex gap-4">
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
