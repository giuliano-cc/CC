import { Field, inputClasses } from './fields'

export default function DividerProperties({ block, onChange }) {
  function setOrientation(orientation) {
    if (orientation === block.orientation) return
    // Swap width/height too, so switching orientation doesn't leave a
    // vertical line squashed into a wide-and-short box (or vice versa) —
    // the block still needs resizing to taste, but starts sensible.
    onChange({ orientation, width: block.height, height: block.width })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Orientation">
        <select
          value={block.orientation || 'horizontal'}
          onChange={(e) => setOrientation(e.target.value)}
          className={inputClasses}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </Field>
      <Field label="Line style">
        <select
          value={block.lineStyle || 'solid'}
          onChange={(e) => onChange({ lineStyle: e.target.value })}
          className={inputClasses}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Field>
      <Field label={`Thickness (${block.thickness ?? 1}px)`}>
        <input
          type="range"
          min={1}
          max={12}
          value={block.thickness ?? 1}
          onChange={(e) => onChange({ thickness: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      <Field label="Color">
        <input
          type="color"
          value={block.color || '#e2e8f0'}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
        />
      </Field>
    </div>
  )
}
