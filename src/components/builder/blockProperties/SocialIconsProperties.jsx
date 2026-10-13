import { SOCIAL_PLATFORMS } from '../../../utils/socialIcons'
import { Field, inputClasses } from './fields'

export default function SocialIconsProperties({ block, onChange }) {
  function updateItem(index, patch) {
    const items = block.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ items })
  }

  function addItem() {
    onChange({ items: [...block.items, { platform: 'linkedin', url: '' }] })
  }

  function removeItem(index) {
    onChange({ items: block.items.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Content from library">
        <select
          value={block.useLibraryLinks ? 'socialLinks' : ''}
          onChange={(e) => onChange({ useLibraryLinks: e.target.value === 'socialLinks' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="socialLinks">Social Links</option>
        </select>
      </Field>
      {!block.useLibraryLinks && (
        <div className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={item.platform}
                onChange={(e) => updateItem(i, { platform: e.target.value })}
                className={`${inputClasses} !w-28 shrink-0`}
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={item.url}
                onChange={(e) => updateItem(i, { url: e.target.value })}
                placeholder="url or handle"
                className={`${inputClasses} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            + Add link
          </button>
        </div>
      )}
      <Field label="Layout">
        <select
          value={block.layout || 'row'}
          onChange={(e) => onChange({ layout: e.target.value })}
          className={inputClasses}
        >
          <option value="row">Row</option>
          <option value="stacked">Stacked</option>
        </select>
      </Field>
      <Field label="Alignment">
        <select
          value={block.align}
          onChange={(e) => onChange({ align: e.target.value })}
          className={inputClasses}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
    </div>
  )
}
