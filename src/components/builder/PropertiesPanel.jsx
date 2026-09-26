import { Link } from 'react-router-dom'
import { useBuilder } from '../../context/BuilderContext'
import { CONTENT_SLOTS, useContentLibrary } from '../../context/ContentLibraryContext'
import { BLOCK_TYPES, FONT_FAMILY_OPTIONS } from '../../utils/blockTypes'
import { SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'

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
      <h3 className="text-sm font-semibold text-slate-800">Global Style</h3>
      <Field label="Primary color">
        <input
          type="color"
          value={globalStyle.primaryColor}
          onChange={(e) =>
            setGlobalStyle((prev) => ({ ...prev, primaryColor: e.target.value }))
          }
          className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
        />
      </Field>
      <Field label="Text color">
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
          {FONT_FAMILY_OPTIONS.filter((opt) => opt.value).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-slate-400">
        Select a block on the sheet to edit its specific properties.
      </p>
    </div>
  )
}

const BLOCK_LABELS = {
  [BLOCK_TYPES.HEADER]: 'Header',
  [BLOCK_TYPES.CV_HEADER]: 'Resume Header',
  [BLOCK_TYPES.HEADING]: 'Heading',
  [BLOCK_TYPES.TEXT]: 'Text',
  [BLOCK_TYPES.IMAGE]: 'Image',
  [BLOCK_TYPES.DIVIDER]: 'Divider',
  [BLOCK_TYPES.QUOTE]: 'Quote',
  [BLOCK_TYPES.FOOTER]: 'Footer',
  [BLOCK_TYPES.COLUMNS]: 'Columns',
}

function CvHeaderProperties({ block, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Name">
        <textarea
          rows={2}
          value={block.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${inputClasses} resize-none`}
        />
      </Field>
      <Field label="Role / subtitle">
        <input
          type="text"
          value={block.role || ''}
          onChange={(e) => onChange({ role: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="Contacts (one per line)">
        <textarea
          rows={3}
          value={(block.contacts || []).join('\n')}
          onChange={(e) => onChange({ contacts: e.target.value.split('\n') })}
          className={`${inputClasses} resize-none`}
        />
      </Field>
      <Field label="Layout">
        <select
          value={block.layout}
          onChange={(e) => onChange({ layout: e.target.value })}
          className={inputClasses}
        >
          <option value="row">In a row</option>
          <option value="stacked">Stacked</option>
        </select>
      </Field>
    </div>
  )
}

function ColumnsProperties({ block }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        This block contains {block.columns.length} columns. Click a heading
        or text inside the sheet to edit it, or use the "+ Heading" / "+
        Text" buttons under each column to add new items.
      </p>
    </div>
  )
}

// Links the block's content to one of the Content Library slots: from
// then on the displayed text is read from there, so the content stays the
// same when switching from one template to another.
function ContentSlotBinder({ block, onChange }) {
  const { library } = useContentLibrary()

  return (
    <Field label="Content from library">
      <select
        value={block.contentSlot || ''}
        onChange={(e) => onChange({ contentSlot: e.target.value || null })}
        className={inputClasses}
      >
        <option value="">— none (free text) —</option>
        {CONTENT_SLOTS.map((slot) => (
          <option key={slot.key} value={slot.key}>
            {slot.label}
          </option>
        ))}
      </select>
      {block.contentSlot && (
        <p className="mt-1 text-xs text-slate-400">
          The displayed text comes from "{CONTENT_SLOTS.find((s) => s.key === block.contentSlot)?.label}"
          {!library[block.contentSlot] && ' (still empty)'}.{' '}
          <Link to="/content-library" className="text-primary hover:underline">
            Edit in the library
          </Link>
        </p>
      )}
    </Field>
  )
}

function PositionSizeFields({ block, onChange }) {
  if (typeof block.x !== 'number') return null

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
      <Field label="X (px)">
        <input
          type="number"
          value={Math.round(block.x)}
          onChange={(e) => onChange({ x: Number(e.target.value) })}
          className={inputClasses}
        />
      </Field>
      <Field label="Y (px)">
        <input
          type="number"
          value={Math.round(block.y)}
          onChange={(e) => onChange({ y: Number(e.target.value) })}
          className={inputClasses}
        />
      </Field>
      <Field label="Width (px)">
        <input
          type="number"
          min={20}
          max={SHEET_WIDTH}
          value={Math.round(block.width)}
          onChange={(e) => onChange({ width: Number(e.target.value) })}
          className={inputClasses}
        />
      </Field>
      <Field label="Height (px)">
        <input
          type="number"
          min={20}
          max={SHEET_HEIGHT}
          value={Math.round(block.height)}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
          className={inputClasses}
        />
      </Field>
    </div>
  )
}

function BlockPropertiesPanel({ block, onChange }) {
  if (block.type === BLOCK_TYPES.CV_HEADER) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <CvHeaderProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.COLUMNS) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <ColumnsProperties block={block} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  const showAlign = block.type !== BLOCK_TYPES.DIVIDER
  const showContent = block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.IMAGE
  const isHeading = block.type === BLOCK_TYPES.HEADING
  const isText = block.type === BLOCK_TYPES.TEXT
  const hasTypography = [BLOCK_TYPES.HEADING, BLOCK_TYPES.TEXT, BLOCK_TYPES.QUOTE].includes(
    block.type,
  )
  const canBindContent = hasTypography

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Block: {BLOCK_LABELS[block.type] || block.type}
      </h3>

      {canBindContent && <ContentSlotBinder block={block} onChange={onChange} />}

      {showContent && !block.contentSlot && (
        <Field label="Text">
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
          <Field label="Image URL">
            <input
              type="text"
              value={block.src}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://..."
              className={inputClasses}
            />
          </Field>
          <Field label="Shape">
            <select
              value={block.shape}
              onChange={(e) => onChange({ shape: e.target.value })}
              className={inputClasses}
            >
              <option value="rect">Rectangular</option>
              <option value="circle">Circular</option>
            </select>
          </Field>
        </>
      )}

      {isHeading && (
        <Field label="Preset size">
          <select
            value={block.size}
            onChange={(e) => onChange({ size: e.target.value })}
            className={inputClasses}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra large</option>
          </select>
        </Field>
      )}

      {hasTypography && (
        <>
          <Field label="Font">
            <select
              value={block.fontFamily || ''}
              onChange={(e) => onChange({ fontFamily: e.target.value || null })}
              className={inputClasses}
            >
              {FONT_FAMILY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Size (px)">
              <input
                type="number"
                min={8}
                max={120}
                placeholder="auto"
                value={block.fontSize || ''}
                onChange={(e) =>
                  onChange({ fontSize: e.target.value ? Number(e.target.value) : null })
                }
                className={inputClasses}
              />
            </Field>
            <Field label="Line height">
              <input
                type="number"
                min={0.8}
                max={3}
                step={0.1}
                placeholder="auto"
                value={block.lineHeight || ''}
                onChange={(e) =>
                  onChange({ lineHeight: e.target.value ? Number(e.target.value) : null })
                }
                className={inputClasses}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Letter spacing (px)">
              <input
                type="number"
                step={0.1}
                placeholder="0"
                value={block.letterSpacing || ''}
                onChange={(e) =>
                  onChange({ letterSpacing: e.target.value ? Number(e.target.value) : null })
                }
                className={inputClasses}
              />
            </Field>
            <Field label="Background color">
              <input
                type="color"
                value={block.bgColor || '#ffffff'}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
              />
            </Field>
          </div>
        </>
      )}

      {showAlign && (
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
      )}

      {hasTypography && (
        <Field label="Text color">
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
            Bold
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!block.italic}
              onChange={(e) => onChange({ italic: e.target.checked })}
            />
            Italic
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!block.underline}
              onChange={(e) => onChange({ underline: e.target.checked })}
            />
            Underline
          </label>
          {isHeading && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={!!block.rule}
                onChange={(e) => onChange({ rule: e.target.checked })}
              />
              Bottom rule
            </label>
          )}
          {isText && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={!!block.list}
                  onChange={(e) => onChange({ list: e.target.checked })}
                />
                List
              </label>
              {block.list && (
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!block.ordered}
                    onChange={(e) => onChange({ ordered: e.target.checked })}
                  />
                  Numbered
                </label>
              )}
            </>
          )}
        </div>
      )}

      <PositionSizeFields block={block} onChange={onChange} />
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
