import { Link, useLocation } from 'react-router-dom'
import { useBuilder } from '../../../context/BuilderContext'
import { CONTENT_SLOTS, useContentLibrary } from '../../../context/ContentLibraryContext'
import { BLOCK_TYPES, TEXT_TRANSFORM_OPTIONS } from '../../../utils/blockTypes'
import FontPicker from '../FontPicker'

// A link to the Content Library that remembers the builder page it was
// opened from (via router state, not a query param — nothing else reads
// it) so the library page can offer a "Back to template" link of its own
// instead of leaving Nao to hunt for the browser back button. `children`
// defaults to the plain wording used everywhere this was already a bare
// "Edit in the library" text link.
export function LibraryLink({ children = 'Edit in the library', className = 'text-primary hover:underline' }) {
  const location = useLocation()
  return (
    <Link to="/content-library" state={{ from: location.pathname }} className={className}>
      {children}
    </Link>
  )
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export const inputClasses =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

export const BLOCK_LABELS = {
  [BLOCK_TYPES.HEADER]: 'Header',
  [BLOCK_TYPES.CV_HEADER]: 'Resume Header',
  [BLOCK_TYPES.HEADING]: 'Heading',
  [BLOCK_TYPES.TEXT]: 'Text',
  [BLOCK_TYPES.IMAGE]: 'Image',
  [BLOCK_TYPES.DIVIDER]: 'Divider',
  [BLOCK_TYPES.QUOTE]: 'Quote',
  [BLOCK_TYPES.FOOTER]: 'Footer',
  [BLOCK_TYPES.COLUMNS]: 'Columns',
  [BLOCK_TYPES.SKILLS_CHART]: 'Technical Skills',
  [BLOCK_TYPES.QR_CODE]: 'QR Code',
  [BLOCK_TYPES.SOCIAL_ICONS]: 'Social Icons',
  [BLOCK_TYPES.CONTACT_INFO]: 'Contact Info',
  [BLOCK_TYPES.LEISURE]: 'Leisure',
  [BLOCK_TYPES.LANGUAGES_CHART]: 'Languages',
  [BLOCK_TYPES.EXPERIENCE]: 'Experience',
  [BLOCK_TYPES.EDUCATION]: 'Education',
  [BLOCK_TYPES.SHAPE]: 'Shape',
  [BLOCK_TYPES.DATE]: 'Date',
  [BLOCK_TYPES.MAP]: 'Locations Map',
  [BLOCK_TYPES.PAGE_NUMBER]: 'Page Number',
}

// Generic "pick a Content Library slot" select, used for fields that bind
// to the library outside the usual `contentSlot` mechanism (a resume
// header's name/contacts, an image's source, etc).
export function LibrarySlotSelect({ value, onChange, filter, placeholder = '— none —' }) {
  const slots = filter ? CONTENT_SLOTS.filter(filter) : CONTENT_SLOTS
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || null)} className={inputClasses}>
      <option value="">{placeholder}</option>
      {slots.map((slot) => (
        <option key={slot.key} value={slot.key}>
          {slot.label}
        </option>
      ))}
    </select>
  )
}

// Shared by every block whose "title" is rendered as a section heading
// (Contact Info, Leisure, Experience, Education, Technical Skills,
// Languages) rather than being a HEADING block itself — lets it match
// whichever size a sibling heading in the same sidebar/column uses,
// instead of always defaulting to the page-section size.
export function TitleSizeField({ block, onChange }) {
  return (
    <Field label="Title size">
      <select
        value={block.titleSize || 'md'}
        onChange={(e) => onChange({ titleSize: e.target.value })}
        className={inputClasses}
      >
        <option value="sm">Small (compact sidebar heading)</option>
        <option value="md">Medium (page section heading)</option>
        <option value="lg">Large</option>
        <option value="xl">Extra large</option>
      </select>
    </Field>
  )
}

// Whether a section-title block (Contact Info, Leisure, Experience,
// Education, the two charts) shows its title at all, and whether that
// title gets the underline rule below it — both default on, so hiding
// either is an explicit opt-out rather than needing the title text
// cleared out (which a Text block's own showTitle checkbox never
// required either, so this brings the two in line with each other).
export function TitleVisibilityFields({ block, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={block.showTitle !== false}
          onChange={(e) => onChange({ showTitle: e.target.checked })}
        />
        Show title
      </label>
      {block.showTitle !== false && (
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={block.titleRule !== false}
            onChange={(e) => onChange({ titleRule: e.target.checked })}
          />
          Show line under title
        </label>
      )}
    </div>
  )
}

// Font size + line spacing for a block's body content (the entry list in
// Experience/Education, the field list in Contact Info) — separate from
// the block's own title size/color, which TitleSizeField controls.
// No "Body text color" field here, deliberately — every other control in
// this file that lets a block override its own text color (Text/Quote/
// Heading's "Text color", Entry title color, ...) exists alongside a field
// that already has NO working Global Style fallback of its own. Body text
// here already inherits Global Style's Text color correctly once nothing
// overrides it (see BlockRenderer.jsx) — adding a per-block color control
// would recreate the exact "silently stuck on one color" bug this was all
// fixed to get rid of, the moment someone opens this picker once.
export function BodyTextStyleFields({ block, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label="Body font">
        <FontPicker
          value={block.bodyFontFamily || ''}
          onChange={(v) => onChange({ bodyFontFamily: v || null })}
        />
      </Field>
      <div className="flex items-center gap-1.5">
        <Field label="Body text size (px)">
          <input
            type="number"
            min={8}
            max={24}
            placeholder="14"
            value={block.bodyFontSize || ''}
            onChange={(e) =>
              onChange({ bodyFontSize: e.target.value ? Number(e.target.value) : null })
            }
            className={inputClasses}
          />
        </Field>
        <Field label="Line spacing">
          <input
            type="number"
            min={1}
            max={3}
            step={0.05}
            placeholder="1.6"
            value={block.lineSpacing || ''}
            onChange={(e) =>
              onChange({ lineSpacing: e.target.value ? Number(e.target.value) : null })
            }
            className={inputClasses}
          />
        </Field>
      </div>
      <div className="flex items-center gap-1.5">
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
    </div>
  )
}

// Lets one specific block show a different subset of a Content Library
// list than what's checked in the catalog itself (ContentLibraryPage) —
// e.g. this one CV's Experience block skips an older job that's still
// checked "visible" for every other document using the same library
// entry. `block.libraryItemOverrides` is `{ [itemKey]: boolean }`; a key
// with no override falls back to the catalog's own visibility (always
// true for an entries item, which has no visibility flag of its own).
// Never touches the library itself — purely a per-block filter on top of
// it.
export function LibraryItemOverridesField({ block, onChange, items, getKey, getLabel, getCatalogVisible }) {
  if (items.length === 0) return null
  const overrides = block.libraryItemOverrides || {}

  function toggle(key, catalogVisible) {
    const current = overrides[key] !== undefined ? overrides[key] : catalogVisible
    onChange({ libraryItemOverrides: { ...overrides, [key]: !current } })
  }

  // A plain <div>, not <Field> — <Field>'s own root is a <label>, and
  // nesting a <label> (each checklist row below) inside another <label>
  // is invalid HTML that made browsers mistarget which checkbox a click
  // actually toggled.
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">Shown in this document</span>
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-slate-200 p-2">
        {items.map((item) => {
          const key = getKey(item)
          const catalogVisible = getCatalogVisible(item)
          const shown = overrides[key] !== undefined ? overrides[key] : catalogVisible
          return (
            <label key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" checked={shown} onChange={() => toggle(key, catalogVisible)} />
              <span className={!catalogVisible && overrides[key] === undefined ? 'text-slate-300' : ''}>
                {getLabel(item)}
              </span>
            </label>
          )
        })}
      </div>
      <p className="text-xs text-slate-400">
        Overrides what's checked in the Content Library, just for this block — the catalog itself isn't changed.
        To add, remove, or permanently hide an item instead, <LibraryLink>edit the catalog</LibraryLink>.
      </p>
    </div>
  )
}

// Style controls for the entry title line itself (e.g. "Associate
// Director") in Experience/Education — separate from the block's own
// section title (above) and from BodyTextStyleFields (the subtitle/date
// line and description below), so each can be sized/colored on its own.
export function EntryTitleStyleFields({ block, onChange }) {
  const { globalStyle } = useBuilder()
  return (
    <div className="flex flex-col gap-2">
      <Field label="Entry title font">
        <FontPicker
          value={block.entryTitleFontFamily || ''}
          onChange={(v) => onChange({ entryTitleFontFamily: v || null })}
        />
      </Field>
      <div className="flex items-center gap-1.5">
        <Field label="Entry title size (px)">
          <input
            type="number"
            min={8}
            max={36}
            placeholder="16"
            value={block.entryTitleFontSize || ''}
            onChange={(e) =>
              onChange({ entryTitleFontSize: e.target.value ? Number(e.target.value) : null })
            }
            className={inputClasses}
          />
        </Field>
        <Field label="Entry title color">
          <input
            type="color"
            value={block.entryTitleColor || globalStyle.textColor}
            onChange={(e) => onChange({ entryTitleColor: e.target.value })}
            className="h-9 w-full rounded-md border border-slate-200"
          />
        </Field>
      </div>
      <div className="flex items-center gap-1.5">
        <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={block.entryTitleBold !== false}
            onChange={(e) => onChange({ entryTitleBold: e.target.checked })}
          />
          Bold
        </label>
        <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={block.entryTitleItalic === true}
            onChange={(e) => onChange({ entryTitleItalic: e.target.checked })}
          />
          Italic
        </label>
        <select
          value={block.entryTitleTextTransform || ''}
          onChange={(e) => onChange({ entryTitleTextTransform: e.target.value || null })}
          title="Text case"
          className={`${inputClasses} !w-auto flex-1`}
        >
          {TEXT_TRANSFORM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Shared by both chart blocks: whether a row shows its visual meter (bar/
// dots/pill), its level as text (the custom text if set, else the derived
// Expert/Advanced/.../Native/Fluent/... label), or both together — an
// explicit choice instead of always showing both the moment a custom level
// text is set, which crowded a plain percentage bar with redundant text.
export function LevelDisplayField({ block, onChange }) {
  return (
    <Field label="Show level as">
      <select
        value={block.levelDisplay || 'both'}
        onChange={(e) => onChange({ levelDisplay: e.target.value })}
        className={inputClasses}
      >
        <option value="visual">Visual only (bar/dots/pill)</option>
        <option value="text">Text only</option>
        <option value="both">Both (visual + text)</option>
      </select>
    </Field>
  )
}

// Links the block's content to one of the Content Library slots: from
// then on the displayed text is read from there, so the content stays the
// same when switching from one template to another.
export function ContentSlotBinder({ block, onChange }) {
  const { globalStyle } = useBuilder()
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)

  return (
    <Field label="Content from library">
      <select
        value={block.contentSlot || ''}
        onChange={(e) => onChange({ contentSlot: e.target.value || null })}
        className={inputClasses}
      >
        <option value="">— none (free text) —</option>
        {/* 'checklist'/'languages' slots still resolve to a plain, newline-
            joined string (see utils/contentLists.js) — bindable here like
            any other text slot. Only 'image'/'social'/'contactGroup' need
            their own dedicated editor UI instead of a text block.
            'experience'/'education' are hidden too — a Text block bound
            to either renders the same entries structurally but without
            the dedicated Experience/Education block's chronological
            sorting, so it's a strictly worse duplicate of a block that's
            already one drag away in the Blocks panel. Still shown if a
            block already uses one (from before this changed), so its own
            dropdown doesn't appear to have lost its selection. */}
        {CONTENT_SLOTS.filter(
          (s) =>
            !['image', 'social', 'contactGroup'].includes(s.type) &&
            (!['experience', 'education'].includes(s.key) || s.key === block.contentSlot),
        ).map((slot) => (
          <option key={slot.key} value={slot.key}>
            {slot.label}
          </option>
        ))}
      </select>
      {block.contentSlot && (
        <p className="mt-1 text-xs text-slate-400">
          The displayed text comes from "{CONTENT_SLOTS.find((s) => s.key === block.contentSlot)?.label}"
          {!library[block.contentSlot] && ' (still empty)'}. <LibraryLink />
        </p>
      )}
    </Field>
  )
}
