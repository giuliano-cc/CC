import { Field, inputClasses } from './fields'

export default function ShapeProperties({ block, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Shape">
        <select
          value={block.shape || 'rectangle'}
          onChange={(e) => onChange({ shape: e.target.value })}
          className={inputClasses}
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
      </Field>
      <Field label="Fill color">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={block.color || '#e2e8f0'}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
          {block.color && (
            <button
              type="button"
              onClick={() => onChange({ color: null })}
              className="shrink-0 rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Remove fill (transparent)"
            >
              ✕
            </button>
          )}
        </div>
      </Field>
      <Field label={`Opacity (${Math.round((block.opacity ?? 1) * 100)}%)`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={block.opacity ?? 1}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      {block.shape !== 'circle' && (
        <Field label={`Corner radius (${block.borderRadius ?? 0}px)`}>
          <input
            type="range"
            min={0}
            max={100}
            value={block.borderRadius ?? 0}
            onChange={(e) => onChange({ borderRadius: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}
      <Field label={`Border width (${block.borderWidth ?? 0}px)`}>
        <input
          type="range"
          min={0}
          max={12}
          value={block.borderWidth ?? 0}
          onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      {block.borderWidth > 0 && (
        <Field label="Border color">
          <input
            type="color"
            value={block.borderColor || '#94a3b8'}
            onChange={(e) => onChange({ borderColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
        </Field>
      )}
    </div>
  )
}
