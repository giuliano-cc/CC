import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import { CONTENT_SLOTS, useContentLibrary } from '../../context/ContentLibraryContext'
import { BLOCK_TYPES, TEXT_TRANSFORM_OPTIONS } from '../../utils/blockTypes'
import { DATE_FORMAT_LABELS, DATE_FORMATS, parseEntries, parseRecipients, todayISODate } from '../../utils/contentLists'
import { SHEET_HEIGHT } from '../../utils/layout'
import FontPicker from './FontPicker'
import GlobalStylePanel from './blockProperties/GlobalStylePanel'
import {
  BLOCK_LABELS,
  ContentSlotBinder,
  EntryTitleStyleFields,
  Field,
  inputClasses,
  LibraryItemOverridesField,
  LibraryLink,
  LibrarySlotSelect,
  TitleSizeField,
} from './blockProperties/fields'
import { ImageCropButton, ImageUploadField, SvgTextFields } from './blockProperties/imageFields'
import { MultiSelectPanel, measureNaturalSize, PositionSizeFields, TextFlowField } from './blockProperties/layoutFields'
import CvHeaderProperties from './blockProperties/CvHeaderProperties'
import ColumnsProperties from './blockProperties/ColumnsProperties'
import DividerProperties from './blockProperties/DividerProperties'
import ShapeProperties from './blockProperties/ShapeProperties'
import SkillsChartProperties from './blockProperties/SkillsChartProperties'
import MapProperties from './blockProperties/MapProperties'
import LanguagesChartProperties from './blockProperties/LanguagesChartProperties'
import QrCodeProperties from './blockProperties/QrCodeProperties'
import SocialIconsProperties from './blockProperties/SocialIconsProperties'
import ContactInfoProperties from './blockProperties/ContactInfoProperties'
import LeisureProperties from './blockProperties/LeisureProperties'
import EntriesBlockProperties from './blockProperties/EntriesBlockProperties'

// One dedicated <XProperties> component per block type that has enough of
// its own fields to warrant one (each in its own file under
// ./blockProperties/) — BlockPropertiesPanel below is left with just the
// types that share one common tail of conditionally-rendered fields
// (Header/Heading/Text/Image/Quote/Footer/Date), since those don't split
// into independent panels as cleanly.
const DEDICATED_PROPERTIES = {
  [BLOCK_TYPES.CV_HEADER]: CvHeaderProperties,
  [BLOCK_TYPES.COLUMNS]: ColumnsProperties,
  [BLOCK_TYPES.DIVIDER]: DividerProperties,
  [BLOCK_TYPES.SHAPE]: ShapeProperties,
  [BLOCK_TYPES.SKILLS_CHART]: SkillsChartProperties,
  [BLOCK_TYPES.MAP]: MapProperties,
  [BLOCK_TYPES.LANGUAGES_CHART]: LanguagesChartProperties,
  [BLOCK_TYPES.QR_CODE]: QrCodeProperties,
  [BLOCK_TYPES.SOCIAL_ICONS]: SocialIconsProperties,
  [BLOCK_TYPES.CONTACT_INFO]: ContactInfoProperties,
  [BLOCK_TYPES.LEISURE]: LeisureProperties,
}

// Every block type's panel shares this same "Block: <label>" header and
// PositionSizeFields footer — written once here instead of once per
// return branch in BlockPropertiesPanel below, so changing the wrapper
// (or adding something every panel should have) doesn't mean finding
// and updating 4 near-identical copies.
function BlockPanelShell({ block, onChange, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Block: {BLOCK_LABELS[block.type] || block.type}
      </h3>
      {children}
      <PositionSizeFields block={block} onChange={onChange} />
    </div>
  )
}

function BlockPropertiesPanel({ block, onChange }) {
  const { globalStyle } = useBuilder()
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)

  // The oversized quote marks each add their own extra line above/below
  // the quote — on a block sized to fit just the plain text, that extra
  // height has nowhere to go and clips against the block's own
  // (fixed-height, overflow-hidden) box. Keying this on
  // showQuoteMarks/quoteMarkSize means it runs right after either is
  // changed below, and whenever this panel opens on a block that already
  // had marks on (a document saved before this effect existed, or just
  // reselecting the block) — either way, nothing more than seeing the
  // block selected here is needed; it only ever grows the block, never
  // shrinks it (so switching from XL back to L doesn't auto-shrink it).
  // `block.height` is a dependency too (not just read inside) so the
  // check re-runs if something else changes it later — e.g. the user
  // manually shrinks the "Height (px)" field below while the marks are
  // already on — instead of only re-checking on id/showQuoteMarks/
  // quoteMarkSize changes. Safe against a dependency loop: once this
  // effect grows the block to fit, `measured.naturalHeight > block.height`
  // is false on the next run, so it doesn't re-fire itself.
  useEffect(() => {
    if (block.type !== BLOCK_TYPES.QUOTE || !block.showQuoteMarks) return
    const raf = requestAnimationFrame(() => {
      const measured = measureNaturalSize(block.id, 'height')
      if (measured?.naturalHeight && measured.naturalHeight > block.height) {
        onChange({ height: Math.min(SHEET_HEIGHT, Math.ceil(measured.naturalHeight)) })
      }
    })
    return () => cancelAnimationFrame(raf)
    // `onChange` deliberately stays out of this list — it's a fresh
    // closure every render (see PropertiesPanel's `onChange={(patch) =>
    // updateBlock(selectedBlock.id, patch)}`) that always resolves to the
    // same `updateBlock(selectedBlock.id, ...)` call for as long as
    // `block.id` doesn't change, so including it would only make this
    // effect re-run on every render for no behavioral difference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, block.showQuoteMarks, block.quoteMarkSize, block.height])

  const Dedicated = DEDICATED_PROPERTIES[block.type]
  if (Dedicated) {
    return (
      <BlockPanelShell block={block} onChange={onChange}>
        <Dedicated block={block} onChange={onChange} />
      </BlockPanelShell>
    )
  }

  if (block.type === BLOCK_TYPES.EXPERIENCE) {
    return (
      <BlockPanelShell block={block} onChange={onChange}>
        <EntriesBlockProperties
          block={block}
          onChange={onChange}
          libraryToggleKey="useLibraryExperience"
          librarySlotLabel="Work Experience"
          librarySlotKey="experience"
        />
      </BlockPanelShell>
    )
  }

  if (block.type === BLOCK_TYPES.EDUCATION) {
    return (
      <BlockPanelShell block={block} onChange={onChange}>
        <EntriesBlockProperties
          block={block}
          onChange={onChange}
          libraryToggleKey="useLibraryEducation"
          librarySlotLabel="Education"
          librarySlotKey="education"
        />
      </BlockPanelShell>
    )
  }

  const boundSlot = CONTENT_SLOTS.find((s) => s.key === block.contentSlot)
  const showAlign = block.type !== BLOCK_TYPES.DIVIDER
  const showContent = block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.IMAGE
  const isHeading = block.type === BLOCK_TYPES.HEADING
  const isText = block.type === BLOCK_TYPES.TEXT
  const isImage = block.type === BLOCK_TYPES.IMAGE
  const hasTypography = [BLOCK_TYPES.HEADING, BLOCK_TYPES.TEXT, BLOCK_TYPES.QUOTE, BLOCK_TYPES.DATE].includes(
    block.type,
  )
  const canBindContent =
    (hasTypography && block.type !== BLOCK_TYPES.DATE) ||
    block.type === BLOCK_TYPES.HEADER ||
    block.type === BLOCK_TYPES.FOOTER

  return (
    <BlockPanelShell block={block} onChange={onChange}>
      {canBindContent && <ContentSlotBinder block={block} onChange={onChange} />}

      {boundSlot?.type === 'recipients' &&
        (() => {
          const recipients = parseRecipients(library[`${block.contentSlot}Items`])
          return (
            <Field label="Which recipient">
              <select
                value={block.recipientId || recipients[0]?.id || ''}
                onChange={(e) => onChange({ recipientId: e.target.value || null })}
                className={inputClasses}
              >
                {recipients.length === 0 && <option value="">— no recipients saved yet —</option>}
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label || r.company || '(untitled recipient)'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Add or edit recipients in <LibraryLink>the catalog</LibraryLink>.
              </p>
            </Field>
          )
        })()}

      {block.type === BLOCK_TYPES.DATE && (
        <>
          <Field label="Date">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={block.date || todayISODate()}
                onChange={(e) => onChange({ date: e.target.value || null })}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => onChange({ date: null })}
                className="shrink-0 whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                title="Reset to always show today's date, updated automatically"
              >
                Today
              </button>
            </div>
          </Field>
          <Field label="Format">
            <select
              value={block.format || 'long'}
              onChange={(e) => onChange({ format: e.target.value })}
              className={inputClasses}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {DATE_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              You can also click the block itself to cycle through formats.
            </p>
          </Field>
        </>
      )}

      {block.type === BLOCK_TYPES.TEXT && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.showTitle === true}
              onChange={(e) => onChange({ showTitle: e.target.checked })}
            />
            {block.contentSlot ? "Show the field's name as a title above it" : 'Add a title above this text'}
          </label>
          {block.showTitle === true && (
            <>
              <Field label={block.contentSlot ? 'Title text (optional)' : 'Title text'}>
                <input
                  type="text"
                  value={block.titleText || ''}
                  onChange={(e) => onChange({ titleText: e.target.value || null })}
                  placeholder={boundSlot?.label || 'e.g. Portfolio'}
                  className={inputClasses}
                />
              </Field>
              <TitleSizeField block={block} onChange={onChange} />
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={block.titleRule !== false}
                  onChange={(e) => onChange({ titleRule: e.target.checked })}
                />
                Show line under title
              </label>
            </>
          )}
        </>
      )}

      {block.type === BLOCK_TYPES.TEXT &&
        boundSlot?.type === 'entries' && (
          <>
            <LibraryItemOverridesField
              block={block}
              onChange={onChange}
              items={parseEntries(library[`${block.contentSlot}Items`], library[block.contentSlot])}
              getKey={(item) => item.id}
              getLabel={(item) => item.title || '(untitled entry)'}
              getCatalogVisible={() => true}
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={block.sortByDate !== false}
                onChange={(e) => onChange({ sortByDate: e.target.checked })}
              />
              Sort entries most recent first
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={block.titleOnly === true}
                onChange={(e) => onChange({ titleOnly: e.target.checked })}
              />
              Minimal — show only the title (hide company/location, dates, description)
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={block.showEntryNumber === true}
                onChange={(e) => onChange({ showEntryNumber: e.target.checked })}
              />
              Show number (accent-colored, same style as the Locations Map's numbered legend — follows this list's own order)
            </label>
            {block.showEntryNumber === true && (
              <Field label="Continue numbering from (first number shown here)">
                <input
                  type="number"
                  min={1}
                  value={block.numberStartAt || 1}
                  onChange={(e) => onChange({ numberStartAt: Math.max(1, Number(e.target.value) || 1) })}
                  className={inputClasses}
                />
              </Field>
            )}
            {!block.titleOnly && (
              <>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={block.showEntryLocation !== false}
                    onChange={(e) => onChange({ showEntryLocation: e.target.checked })}
                  />
                  Show company / location
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={block.showEntryDate !== false}
                    onChange={(e) => onChange({ showEntryDate: e.target.checked })}
                  />
                  Show dates
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={block.showEntryDescription !== false}
                    onChange={(e) => onChange({ showEntryDescription: e.target.checked })}
                  />
                  Show description
                </label>
                {block.showEntryDescription !== false && (
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={block.list !== false}
                      onChange={(e) => onChange({ list: e.target.checked })}
                    />
                    Show description as a bulleted list
                  </label>
                )}
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={block.titleLocationInline === true}
                    onChange={(e) => onChange({ titleLocationInline: e.target.checked })}
                  />
                  Show title and location on the same line
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={block.locationFirst === true}
                    onChange={(e) => onChange({ locationFirst: e.target.checked })}
                  />
                  Show location/date before the title (title stays bold either way)
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={block.dateFirst === true}
                    onChange={(e) => onChange({ dateFirst: e.target.checked })}
                  />
                  Show date before location
                </label>
                <Field label="Separator between location and dates">
                  <input
                    type="text"
                    value={block.subtitleSeparator ?? ' / '}
                    onChange={(e) => onChange({ subtitleSeparator: e.target.value })}
                    className={`${inputClasses} !w-20`}
                  />
                </Field>
              </>
            )}
            <EntryTitleStyleFields block={block} onChange={onChange} />
          </>
        )}

      {showContent && !block.contentSlot && block.type !== BLOCK_TYPES.DATE && (
        <Field label="Text">
          <textarea
            rows={3}
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            className={`${inputClasses} resize-none`}
          />
          <p className="mt-1 text-xs text-slate-400">
            Tip: <code className="rounded bg-slate-100 px-1">[link text](https://example.com)</code> turns those
            words into a clickable link.
          </p>
        </Field>
      )}

      {block.type === BLOCK_TYPES.TEXT &&
        !block.contentSlot &&
        !block.list &&
        !(block.showTitle === true && block.titleText) && <TextFlowField block={block} onChange={onChange} />}

      {block.type === BLOCK_TYPES.QUOTE && (
        <>
          <Field label="Author (name, position) from library">
            <LibrarySlotSelect
              value={block.authorSlot}
              onChange={(v) => onChange({ authorSlot: v })}
              filter={(s) => s.key === 'quoteAuthor'}
              placeholder="— none (type below) —"
            />
          </Field>
          {!block.authorSlot && (
            <Field label="Author (name, position)">
              <input
                type="text"
                value={block.author}
                onChange={(e) => onChange({ author: e.target.value })}
                placeholder="Jane Doe, CEO of Company"
                className={inputClasses}
              />
            </Field>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!block.showQuoteMarks}
              onChange={(e) => onChange({ showQuoteMarks: e.target.checked })}
            />
            Show oversized “ ” quotation marks
          </label>
          {block.showQuoteMarks && (
            <Field label="Marker size (em)">
              <input
                type="number"
                min={1}
                max={6}
                step={0.1}
                value={typeof block.quoteMarkSize === 'number' ? block.quoteMarkSize : 1.6}
                onChange={(e) => onChange({ quoteMarkSize: Number(e.target.value) })}
                className={inputClasses}
              />
            </Field>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.showBorder !== false}
              onChange={(e) => onChange({ showBorder: e.target.checked })}
            />
            Show vertical bar
          </label>
        </>
      )}

      {isImage && (
        <>
          <Field label="Image from library">
            <LibrarySlotSelect
              value={block.imageSlot}
              onChange={(v) => onChange({ imageSlot: v })}
              filter={(s) => s.type === 'image'}
              placeholder="— none —"
            />
          </Field>
          {!block.imageSlot && (
            <>
              <ImageUploadField onChange={onChange} />
              <Field label="or image URL">
                <input
                  type="text"
                  value={block.src}
                  onChange={(e) => onChange({ src: e.target.value })}
                  placeholder="https://..."
                  className={inputClasses}
                />
              </Field>
            </>
          )}
          <ImageCropButton block={block} onChange={onChange} />
          <SvgTextFields block={block} onChange={onChange} />
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
            <FontPicker value={block.fontFamily || ''} onChange={(v) => onChange({ fontFamily: v || null })} />
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

      {isHeading && (
        <Field label="Heading level (HTML tag)">
          <select
            value={block.level || 'h1'}
            onChange={(e) => onChange({ level: e.target.value })}
            className={inputClasses}
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
          </select>
        </Field>
      )}

      {showContent && (
        <Field label="Text case">
          <select
            value={block.textTransform || ''}
            onChange={(e) => onChange({ textTransform: e.target.value || null })}
            className={inputClasses}
          >
            {TEXT_TRANSFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    </BlockPanelShell>
  )
}

export default function PropertiesPanel() {
  const { selectedBlock, selectedIds, updateBlock, removeBlock } = useBuilder()

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
      {selectedIds.length > 1 ? (
        <MultiSelectPanel count={selectedIds.length} />
      ) : selectedBlock ? (
        <div className="flex flex-col gap-4">
          <BlockPropertiesPanel
            block={selectedBlock}
            onChange={(patch) => updateBlock(selectedBlock.id, patch)}
          />
          {/* The only way to remove a block nested inside a Columns column
              — its delete handle only exists on a top-level FreeBlock (the
              hover trash icon on the sheet), so a nested item had no way to
              be deleted at all once added. Works the same for a top-level
              block too, as a second way to do the same thing. */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this block?')) removeBlock(selectedBlock.id)
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete block
          </button>
        </div>
      ) : (
        <GlobalStylePanel />
      )}
    </aside>
  )
}
