import { Field, inputClasses } from './fields'

export default function QrCodeProperties({ block, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Content from library">
        <select
          value={block.useLibraryValue ? 'qrValue' : ''}
          onChange={(e) => onChange({ useLibraryValue: e.target.value === 'qrValue' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="qrValue">QR Code Link</option>
        </select>
      </Field>
      {!block.useLibraryValue && (
        <Field label="Link or text to encode">
          <input
            type="text"
            value={block.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="https://..."
            className={inputClasses}
          />
        </Field>
      )}
      <Field label="Caption (optional)">
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          className={inputClasses}
        />
      </Field>
      {block.caption && (
        <Field label="Caption position">
          <select
            value={block.captionPosition || 'bottom'}
            onChange={(e) => onChange({ captionPosition: e.target.value })}
            className={inputClasses}
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </Field>
      )}
    </div>
  )
}
