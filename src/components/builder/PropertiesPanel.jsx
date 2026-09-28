import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlignHorizontalDistributeCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Crop,
  Maximize2,
  Shuffle,
  Trash2,
  Upload,
} from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import { CONTENT_SLOTS, useContentLibrary } from '../../context/ContentLibraryContext'
import {
  BLOCK_TYPES,
  FONT_FAMILY_OPTIONS,
  getTemplateTypographyStyles,
  matchesTypographyRow,
  sectionTitleSizeField,
} from '../../utils/blockTypes'
import { emptyEntry } from '../../utils/contentLists'
import { SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import { SOCIAL_PLATFORMS } from '../../utils/socialIcons'
import FontPicker from './FontPicker'
import ImageCropModal from './ImageCropModal'

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

// The typography scale's 6 fixed levels, in display order — every new
// template starts with all of these ready to edit (see
// DEFAULT_TYPOGRAPHY_SCALE in BuilderContext.jsx), independent of
// whether any block currently uses that size. H1-H3 reshape every
// Heading using the matching size preset immediately (xl/lg/md — see
// HEADING_SCALE_LEVEL_BY_SIZE in BlockRenderer.jsx); P1 reshapes every
// block's body text left at its own default size. P2/P3 don't apply
// themselves anywhere on their own — they're additional presets to
// dial in and then set a specific block's own Body text size to match.
const TYPOGRAPHY_SCALE_LEVELS = [
  { key: 'h1', label: 'H1' },
  { key: 'h2', label: 'H2' },
  { key: 'h3', label: 'H3' },
  { key: 'p1', label: 'P1 (body default)' },
  { key: 'p2', label: 'P2' },
  { key: 'p3', label: 'P3' },
]

function GlobalStylePanel() {
  const { globalStyle, setGlobalStyle, blocks, updateBlock } = useBuilder()
  const { languages } = useContentLibrary()
  const typographyRows = getTemplateTypographyStyles({ blocks })
  const typographyScale = globalStyle.typographyScale

  function updateTypographyScale(level, patch) {
    setGlobalStyle((prev) => ({
      ...prev,
      typographyScale: {
        ...prev.typographyScale,
        [level]: { ...prev.typographyScale[level], ...patch },
      },
    }))
  }

  // Applies an edit made on a typography row to every block across the
  // template that shares that row's identity (same heading level+size, or
  // every Text/Quote block, or a Contact Info/Leisure/Experience/
  // Education/chart block's own title — or a Text block's own auto-title
  // — at that size), including nested inside a Columns block — so "change
  // the H2 style" changes every H2, not just one instance. A block matched
  // into an H2 row that isn't itself a literal Heading (a section-title
  // block, or a Text block's auto-title) uses `titleColor`/a size field of
  // its own instead of `color`/`fontSize` (which, where it has them at
  // all, mean something else — e.g. a chart's bar color, or a Text
  // block's own paragraph size) and doesn't support a bold toggle (its
  // title is always bold), so the patch is translated for it.
  function applyTypographyChange(row, patch) {
    function walk(list) {
      list.forEach((block) => {
        if (matchesTypographyRow(block, row)) {
          const isTitleOnlyMatch = row.matchType === BLOCK_TYPES.HEADING && block.type !== BLOCK_TYPES.HEADING
          if (isTitleOnlyMatch) {
            const { color, fontSize, bold: _bold, ...rest } = patch
            const translated = { ...rest }
            if (color !== undefined) translated.titleColor = color
            if (fontSize !== undefined) translated[sectionTitleSizeField(block)] = fontSize
            updateBlock(block.id, translated)
          } else if (row.matchType === 'entryTitle') {
            // Entry titles are always bold (no toggle of their own — see
            // the Chart's/section title's own "always bold" comment above)
            // and use their own dedicated fields so they never collide
            // with the block's own section-title color/font/size.
            const { color, fontSize, fontFamily, bold: _bold, ...rest } = patch
            const translated = { ...rest }
            if (color !== undefined) translated.entryTitleColor = color
            if (fontSize !== undefined) translated.entryTitleFontSize = fontSize
            if (fontFamily !== undefined) translated.entryTitleFontFamily = fontFamily
            updateBlock(block.id, translated)
          } else {
            updateBlock(block.id, patch)
          }
        }
        if (block.type === BLOCK_TYPES.COLUMNS) {
          block.columns?.forEach((column) => walk(column.items))
        }
      })
    }
    walk(blocks)
  }

  // Clears every row's own color/font override in one go, back to
  // inheriting the global Primary/Text color and Font — a template built
  // up over several edits (or one whose blocks were originally created
  // with a literal color baked in) can end up with more than one row
  // stuck on an old explicit color, and finding + clicking each row's own
  // ✕ individually is easy to miss one of.
  const hasAnyOverride = typographyRows.some((row) => row.color || row.fontFamily)
  function resetAllTypography() {
    typographyRows.forEach((row) => applyTypographyChange(row, { color: null, fontFamily: null }))
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">Global Style</h3>
      <Field label="Content language">
        <select
          value={globalStyle.contentLanguage || 'en'}
          onChange={(e) => setGlobalStyle((prev) => ({ ...prev, contentLanguage: e.target.value }))}
          className={inputClasses}
        >
          {languages.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>
      <p className="-mt-2 text-xs text-slate-400">
        Every block linked to the Content Library (and "Fill with my
        content") reads this document's own language — write both versions
        once in the library, then pick which one each document uses here.
      </p>
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
      <Field label="Page background">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={globalStyle.pageBackground || '#ffffff'}
            onChange={(e) =>
              setGlobalStyle((prev) => ({ ...prev, pageBackground: e.target.value }))
            }
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
          {globalStyle.pageBackground && globalStyle.pageBackground !== '#ffffff' && (
            <button
              type="button"
              onClick={() => setGlobalStyle((prev) => ({ ...prev, pageBackground: '#ffffff' }))}
              className="shrink-0 rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Reset to white"
            >
              ✕
            </button>
          )}
        </div>
      </Field>
      <Field label="Title font">
        <FontPicker
          value={globalStyle.titleFontFamily || globalStyle.fontFamily}
          onChange={(v) => setGlobalStyle((prev) => ({ ...prev, titleFontFamily: v }))}
          includeInherit={false}
        />
      </Field>
      <Field label="Body font">
        <FontPicker
          value={globalStyle.bodyFontFamily || globalStyle.fontFamily}
          onChange={(v) => setGlobalStyle((prev) => ({ ...prev, bodyFontFamily: v }))}
          includeInherit={false}
        />
      </Field>
      <button
        type="button"
        onClick={() => {
          const realFonts = FONT_FAMILY_OPTIONS.filter((f) => f.value)
          const pick = () => realFonts[Math.floor(Math.random() * realFonts.length)].value
          setGlobalStyle((prev) => ({ ...prev, titleFontFamily: pick(), bodyFontFamily: pick() }))
        }}
        className="flex items-center justify-center gap-1.5 self-start rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
      >
        <Shuffle size={13} />
        Randomize title/body fonts
      </button>
      <p className="-mt-2 text-xs text-slate-400">
        Title font is used for every heading and section title (Experience,
        Education, chart titles, ...); Body font for paragraph text, entry
        descriptions, and contact/list items — every block on every page
        that hasn't been given its own font override.
      </p>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-500">Page margins (px)</span>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['marginTop', 'Top'],
            ['marginRight', 'Right'],
            ['marginBottom', 'Bottom'],
            ['marginLeft', 'Left'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min={0}
                max={200}
                value={globalStyle[key] ?? globalStyle.margin ?? 48}
                onChange={(e) =>
                  setGlobalStyle((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
                className={inputClasses}
              />
            </Field>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400">
        The margin shows as a magenta dashed guide on the sheet — it's a
        visual guide only, blocks can still be placed anywhere.
      </p>

      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4">
        <h4 className="text-xs font-semibold text-slate-600">Typography scale</h4>
        <p className="-mt-1 text-xs text-slate-400">
          The sizes new Heading/Text blocks start from. H1/H2/H3 apply to
          every Heading using that size preset (Extra large/Large/Medium);
          P1 is body text's own default everywhere it hasn't been resized
          individually. P2/P3 are extra presets to reference or copy into
          one block's own Body text size.
        </p>
        <div className="flex flex-col divide-y divide-slate-100 rounded-md border border-slate-200">
          {TYPOGRAPHY_SCALE_LEVELS.map(({ key, label }) => {
            const level = typographyScale[key]
            const isHeadingLevel = key === 'h1' || key === 'h2' || key === 'h3'
            const inheritedColor = isHeadingLevel ? globalStyle.primaryColor : globalStyle.textColor
            return (
              <div key={key} className="flex flex-col gap-1.5 px-2.5 py-2 text-xs">
                <span
                  className="truncate"
                  style={{
                    fontWeight: level.bold ? 700 : 400,
                    color: level.color || inheritedColor,
                    fontFamily: level.fontFamily || undefined,
                  }}
                >
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={8}
                    max={96}
                    value={level.sizePx}
                    onChange={(e) => updateTypographyScale(key, { sizePx: Number(e.target.value) })}
                    className={`${inputClasses} !w-14 shrink-0 py-1`}
                    title="Size (px)"
                  />
                  <label className="flex shrink-0 items-center gap-1 text-slate-600">
                    <input
                      type="checkbox"
                      checked={level.bold}
                      onChange={(e) => updateTypographyScale(key, { bold: e.target.checked })}
                    />
                    Bold
                  </label>
                  <input
                    type="color"
                    value={level.color || inheritedColor}
                    onChange={(e) => updateTypographyScale(key, { color: e.target.value })}
                    className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-slate-300"
                    title={level.color ? 'Color (custom — click × to inherit again)' : 'Color (inherited from Primary/Text color)'}
                  />
                  {level.color && (
                    <button
                      type="button"
                      onClick={() => updateTypographyScale(key, { color: null })}
                      className="shrink-0 rounded-md px-1.5 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Reset to inherit the global Primary/Text color"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <FontPicker
                    value={level.fontFamily || ''}
                    onChange={(v) => updateTypographyScale(key, { fontFamily: v || null })}
                    className="flex-1"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {typographyRows.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-slate-600">Text styles used in this template</h4>
            {hasAnyOverride && (
              <button
                type="button"
                onClick={resetAllTypography}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                title="Clears every row's own color/font, back to the Primary/Text color and Font above"
              >
                Reset all to inherit
              </button>
            )}
          </div>
          <p className="-mt-1 text-xs text-slate-400">
            Editing one applies to every block using that style across the template.
          </p>
          <div className="flex flex-col divide-y divide-slate-100 rounded-md border border-slate-200">
            {typographyRows.map((row) => {
              // Headings (and section titles, which merge into an H2 row)
              // track the primary/accent color by default; body text and
              // quotes track the plain text color — matching each render
              // path's own fallback, so this preview never lies about what
              // "inherited" actually looks like.
              const inheritedColor =
                row.matchType === BLOCK_TYPES.HEADING ? globalStyle.primaryColor : globalStyle.textColor
              return (
                <div key={row.key} className="flex flex-col gap-1.5 px-2.5 py-2 text-xs">
                  <span
                    className="truncate"
                    style={{
                      fontWeight: row.bold ? 700 : 400,
                      color: row.color || inheritedColor,
                      fontFamily: row.fontFamily || undefined,
                    }}
                  >
                    {row.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={8}
                      max={96}
                      value={row.sizePx}
                      onChange={(e) => applyTypographyChange(row, { fontSize: Number(e.target.value) })}
                      className={`${inputClasses} !w-14 shrink-0 py-1`}
                      title="Size (px)"
                    />
                    <label
                      className={`flex shrink-0 items-center gap-1 ${row.matchType === 'entryTitle' ? 'text-slate-300' : 'text-slate-600'}`}
                      title={row.matchType === 'entryTitle' ? 'Entry titles are always bold' : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={row.bold}
                        disabled={row.matchType === 'entryTitle'}
                        onChange={(e) => applyTypographyChange(row, { bold: e.target.checked })}
                      />
                      Bold
                    </label>
                    <input
                      type="color"
                      value={row.color || inheritedColor}
                      onChange={(e) => applyTypographyChange(row, { color: e.target.value })}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-slate-300"
                      title={row.color ? 'Color (custom — click × to inherit again)' : 'Color (inherited from Primary color)'}
                    />
                    {row.color && (
                      <button
                        type="button"
                        onClick={() => applyTypographyChange(row, { color: null })}
                        className="shrink-0 rounded-md px-1.5 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Reset to inherit the global Primary/Text color"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FontPicker
                      value={row.fontFamily || ''}
                      onChange={(v) => applyTypographyChange(row, { fontFamily: v || null })}
                      className="flex-1"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
  [BLOCK_TYPES.SKILLS_CHART]: 'Technical Skills',
  [BLOCK_TYPES.QR_CODE]: 'QR Code',
  [BLOCK_TYPES.SOCIAL_ICONS]: 'Social Icons',
  [BLOCK_TYPES.CONTACT_INFO]: 'Contact Info',
  [BLOCK_TYPES.LEISURE]: 'Leisure',
  [BLOCK_TYPES.LANGUAGES_CHART]: 'Languages',
  [BLOCK_TYPES.EXPERIENCE]: 'Experience',
  [BLOCK_TYPES.EDUCATION]: 'Education',
  [BLOCK_TYPES.SHAPE]: 'Shape',
}

// Generic "pick a Content Library slot" select, used for fields that bind
// to the library outside the usual `contentSlot` mechanism (a resume
// header's name/contacts, an image's source, etc).
function LibrarySlotSelect({ value, onChange, filter, placeholder = '— none —' }) {
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

function CvHeaderProperties({ block, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Name from library">
        <LibrarySlotSelect
          value={block.nameSlot}
          onChange={(v) => onChange({ nameSlot: v })}
          filter={(s) => s.key === 'name'}
          placeholder="— none (type below) —"
        />
      </Field>
      {!block.nameSlot && (
        <Field label="Name">
          <textarea
            rows={2}
            value={block.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}
      <Field label="Role / subtitle">
        <input
          type="text"
          value={block.role || ''}
          onChange={(e) => onChange({ role: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="USP from library">
        <LibrarySlotSelect
          value={block.uspSlot}
          onChange={(v) => onChange({ uspSlot: v })}
          filter={(s) => s.key === 'usp'}
          placeholder="— none (type below) —"
        />
      </Field>
      {!block.uspSlot && (
        <Field label="USP (unique selling proposition)">
          <input
            type="text"
            value={block.usp || ''}
            onChange={(e) => onChange({ usp: e.target.value })}
            placeholder="What makes you different in one short line"
            className={inputClasses}
          />
        </Field>
      )}
      <Field label="Contacts from library">
        <LibrarySlotSelect
          value={block.contactsSlot}
          onChange={(v) => onChange({ contactsSlot: v })}
          filter={(s) => s.key === 'contact'}
          placeholder="— none (type below) —"
        />
      </Field>
      {!block.contactsSlot && (
        <Field label="Contacts (one per line)">
          <textarea
            rows={3}
            value={(block.contacts || []).join('\n')}
            onChange={(e) => onChange({ contacts: e.target.value.split('\n') })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={!!block.showContactIcons}
          onChange={(e) => onChange({ showContactIcons: e.target.checked })}
        />
        Show icons next to email/phone/website
      </label>
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

// Shared by every block whose "title" is rendered as a section heading
// (Contact Info, Leisure, Experience, Education, Technical Skills,
// Languages) rather than being a HEADING block itself — lets it match
// whichever size a sibling heading in the same sidebar/column uses,
// instead of always defaulting to the page-section size.
function TitleSizeField({ block, onChange }) {
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
function TitleVisibilityFields({ block, onChange }) {
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
function BodyTextStyleFields({ block, onChange }) {
  return (
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
  )
}

// Style controls for the entry title line itself (e.g. "Associate
// Director") in Experience/Education — separate from the block's own
// section title (above) and from BodyTextStyleFields (the subtitle/date
// line and description below), so each can be sized/colored on its own.
function EntryTitleStyleFields({ block, onChange }) {
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
    </div>
  )
}

function DividerProperties({ block, onChange }) {
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

function ShapeProperties({ block, onChange }) {
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

// A column's own ratio, read out of its `Nfr` track string (see
// BlockRenderer's COLUMNS case) — `1` for a plain even column, or
// whatever custom ratio was set.
function widthRatio(width) {
  return parseFloat(width) || 1
}

function ColumnsProperties({ block, onChange }) {
  const isCustom = Array.isArray(block.widths) && block.widths.length === block.columns.length

  function setColumnCount(count) {
    const columns = block.columns.slice(0, count)
    while (columns.length < count) columns.push({ items: [] })
    const patch = { columns }
    // A custom width list must always have exactly one entry per column,
    // or the grid silently falls back to even columns (see
    // BlockRenderer) — so adding/removing a column keeps it in sync,
    // extending with an even '1fr' or trimming the extra entries.
    if (isCustom) {
      const widths = block.widths.slice(0, count)
      while (widths.length < count) widths.push('1fr')
      patch.widths = widths
    }
    onChange(patch)
  }

  function setLayout(mode) {
    if (mode === 'even') {
      onChange({ widths: null })
    } else {
      onChange({ widths: block.columns.map((_, i) => `${widthRatio(block.widths?.[i]) || 1}fr`) })
    }
  }

  function setRatio(index, ratio) {
    const widths = block.columns.map((_, i) =>
      i === index ? `${ratio}fr` : block.widths?.[i] || '1fr',
    )
    onChange({ widths })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        Click a heading or text inside the sheet to edit it, or use the "+
        Heading" / "+ Text" buttons under each column to add new items.
      </p>
      <Field label={`Number of columns (${block.columns.length})`}>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setColumnCount(Math.max(1, block.columns.length - 1))}
            disabled={block.columns.length <= 1}
            className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            − Remove
          </button>
          <button
            type="button"
            onClick={() => setColumnCount(Math.min(6, block.columns.length + 1))}
            disabled={block.columns.length >= 6}
            className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add
          </button>
        </div>
      </Field>
      <Field label="Column widths">
        <select
          value={isCustom ? 'custom' : 'even'}
          onChange={(e) => setLayout(e.target.value)}
          className={inputClasses}
        >
          <option value="even">Even (all columns equal)</option>
          <option value="custom">Custom (uneven ratios)</option>
        </select>
      </Field>
      {isCustom && (
        <div className="flex flex-col gap-1.5">
          {block.columns.map((_, i) => (
            <Field key={i} label={`Column ${i + 1} ratio`}>
              <input
                type="number"
                min={0.2}
                step={0.1}
                value={widthRatio(block.widths?.[i])}
                onChange={(e) => setRatio(i, Number(e.target.value) || 1)}
                className={inputClasses}
              />
            </Field>
          ))}
          <p className="text-xs text-slate-400">
            Ratios are relative — e.g. 1 and 2 makes the second column twice
            as wide as the first.
          </p>
        </div>
      )}
    </div>
  )
}

function SkillsChartProperties({ block, onChange }) {
  const { globalStyle } = useBuilder()
  const linesValue = (block.items || []).map((i) => `${i.label}|${i.level}`).join('\n')

  function handleLinesChange(text) {
    const items = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, level] = line.split('|')
        return { label: (label || '').trim(), level: Number(level) || 50 }
      })
    onChange({ items })
  }

  const checklistSlots = CONTENT_SLOTS.filter((s) => s.type === 'checklist')

  return (
    <div className="flex flex-col gap-4">
      <Field label="Content from library">
        <select
          value={block.useLibrarySkills ? block.librarySource || 'skills' : ''}
          onChange={(e) => {
            const value = e.target.value
            onChange({ useLibrarySkills: !!value, librarySource: value || 'skills' })
          }}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          {checklistSlots.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Chart title">
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Style">
        <select
          value={block.chartStyle || 'bars'}
          onChange={(e) => onChange({ chartStyle: e.target.value })}
          className={inputClasses}
        >
          <option value="bars">Bars</option>
          <option value="dots">Dots</option>
          <option value="tags">Tags</option>
        </select>
      </Field>
      {block.chartStyle === 'dots' && (
        <>
          <Field label="Number of dots">
            <select
              value={block.dotCount ?? 5}
              onChange={(e) => onChange({ dotCount: Number(e.target.value) })}
              className={inputClasses}
            >
              <option value={5}>5 (20% per dot)</option>
              <option value={10}>10 (10% per dot, finer)</option>
            </select>
          </Field>
          <Field label={`Dot size (${block.dotSize ?? 10}px)`}>
            <input
              type="range"
              min={4}
              max={24}
              value={block.dotSize ?? 10}
              onChange={(e) => onChange({ dotSize: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}
      {!block.useLibrarySkills && (
        <Field label="Skills (one per line: Label|Level 0-100)">
          <textarea
            rows={5}
            value={linesValue}
            onChange={(e) => handleLinesChange(e.target.value)}
            placeholder="Photoshop|85"
            className={`${inputClasses} resize-none font-mono`}
          />
        </Field>
      )}
      <Field label="Bar color">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={block.color || globalStyle.primaryColor}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
          {block.color && (
            <button
              type="button"
              onClick={() => onChange({ color: null })}
              className="shrink-0 rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Reset to inherit the global Primary color"
            >
              ✕
            </button>
          )}
        </div>
      </Field>
    </div>
  )
}

function LanguagesChartProperties({ block, onChange }) {
  const { globalStyle } = useBuilder()
  const linesValue = (block.items || []).map((i) => `${i.label}|${i.level}`).join('\n')

  function handleLinesChange(text) {
    const items = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, level] = line.split('|')
        return { label: (label || '').trim(), level: Number(level) || 50 }
      })
    onChange({ items })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Content from library">
        <select
          value={block.useLibraryLanguages ? 'languages' : ''}
          onChange={(e) => onChange({ useLibraryLanguages: e.target.value === 'languages' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="languages">Languages</option>
        </select>
      </Field>
      <Field label="Chart title">
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Style">
        <select
          value={block.chartStyle || 'bars'}
          onChange={(e) => onChange({ chartStyle: e.target.value })}
          className={inputClasses}
        >
          <option value="bars">Bars</option>
          <option value="dots">Dots</option>
          <option value="tags">Tags</option>
        </select>
      </Field>
      {block.chartStyle === 'dots' && (
        <>
          <Field label="Number of dots">
            <select
              value={block.dotCount ?? 5}
              onChange={(e) => onChange({ dotCount: Number(e.target.value) })}
              className={inputClasses}
            >
              <option value={5}>5 (20% per dot)</option>
              <option value={10}>10 (10% per dot, finer)</option>
            </select>
          </Field>
          <Field label={`Dot size (${block.dotSize ?? 10}px)`}>
            <input
              type="range"
              min={4}
              max={24}
              value={block.dotSize ?? 10}
              onChange={(e) => onChange({ dotSize: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}
      {!block.useLibraryLanguages && (
        <Field label="Languages (one per line: Label|Level 0-100)">
          <textarea
            rows={5}
            value={linesValue}
            onChange={(e) => handleLinesChange(e.target.value)}
            placeholder="English|90"
            className={`${inputClasses} resize-none font-mono`}
          />
        </Field>
      )}
      <Field label="Bar color">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={block.color || globalStyle.primaryColor}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-slate-300"
          />
          {block.color && (
            <button
              type="button"
              onClick={() => onChange({ color: null })}
              className="shrink-0 rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Reset to inherit the global Primary color"
            >
              ✕
            </button>
          )}
        </div>
      </Field>
    </div>
  )
}

function QrCodeProperties({ block, onChange }) {
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

function SocialIconsProperties({ block, onChange }) {
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

function ContactInfoProperties({ block, onChange }) {
  const fields = [
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title (optional)">
        <input
          type="text"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Contact Info"
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Content from library">
        <select
          value={block.useLibraryContact ? 'contact' : ''}
          onChange={(e) => onChange({ useLibraryContact: e.target.value === 'contact' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="contact">Contact</option>
        </select>
      </Field>
      {!block.useLibraryContact && (
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type="text"
                value={block[f.key]}
                onChange={(e) => onChange({ [f.key]: e.target.value })}
                className={inputClasses}
              />
            </Field>
          ))}
        </div>
      )}
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={!!block.showIcons}
          onChange={(e) => onChange({ showIcons: e.target.checked })}
        />
        Show icons next to each field
      </label>
      <Field label="Layout">
        <select
          value={block.layout || 'stacked'}
          onChange={(e) => onChange({ layout: e.target.value })}
          className={inputClasses}
        >
          <option value="stacked">Stacked</option>
          <option value="row">Row</option>
        </select>
      </Field>
      <BodyTextStyleFields block={block} onChange={onChange} />
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

function LeisureProperties({ block, onChange }) {
  const linesValue = (block.items || []).join('\n')

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
      <Field label="Content from library">
        <select
          value={block.useLibraryHobbies ? 'hobbies' : ''}
          onChange={(e) => onChange({ useLibraryHobbies: e.target.value === 'hobbies' })}
          className={inputClasses}
        >
          <option value="">— none (type below) —</option>
          <option value="hobbies">Leisure / Hobbies</option>
        </select>
      </Field>
      {!block.useLibraryHobbies && (
        <Field label="Items (one per line)">
          <textarea
            rows={4}
            value={linesValue}
            onChange={(e) => onChange({ items: e.target.value.split('\n') })}
            className={`${inputClasses} resize-none`}
          />
        </Field>
      )}
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

// Shared editor for the Experience/Education blocks: a repeatable entry
// (title/subtitle/location/dates/description) either typed directly on
// the block or read from the matching Content Library slot (kept in sync
// there via ContentLibraryPage's own entry editor).
function EntriesBlockProperties({ block, onChange, libraryToggleKey, librarySlotLabel }) {
  const items = block.items || []

  function updateItem(index, patch) {
    onChange({ items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  function addItem() {
    onChange({ items: [...items, emptyEntry()] })
  }

  function removeItem(index) {
    onChange({ items: items.filter((_, i) => i !== index) })
  }

  const usesLibrary = !!block[libraryToggleKey]

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title (optional)">
        <input
          type="text"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <TitleSizeField block={block} onChange={onChange} />
      <TitleVisibilityFields block={block} onChange={onChange} />
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
          checked={block.titleLocationInline === true}
          onChange={(e) => onChange({ titleLocationInline: e.target.checked })}
        />
        Show title and location on the same line
      </label>
      {block.type === BLOCK_TYPES.EXPERIENCE && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.locationFirst === true}
              onChange={(e) => onChange({ locationFirst: e.target.checked })}
            />
            Show location before the job title
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
      <Field label="Content from library">
        <select
          value={usesLibrary ? 'library' : ''}
          onChange={(e) => onChange({ [libraryToggleKey]: e.target.value === 'library' })}
          className={inputClasses}
        >
          <option value="">— none (edit entries below) —</option>
          <option value="library">{librarySlotLabel}</option>
        </select>
      </Field>
      {!usesLibrary && (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={item.id || i} className="flex flex-col gap-1.5 rounded-md border border-slate-200 p-2.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(i, { title: e.target.value })}
                  placeholder="Job Role / Degree"
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
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item.subtitle}
                  onChange={(e) => updateItem(i, { subtitle: e.target.value })}
                  placeholder="Company / Institution"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
                <input
                  type="text"
                  value={item.location}
                  onChange={(e) => updateItem(i, { location: e.target.value })}
                  placeholder="City, Country"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item.startDate}
                  onChange={(e) => updateItem(i, { startDate: e.target.value })}
                  placeholder="Start"
                  className={`${inputClasses} min-w-0 flex-1`}
                />
                <input
                  type="text"
                  value={item.endDate}
                  onChange={(e) => updateItem(i, { endDate: e.target.value })}
                  placeholder="End"
                  disabled={item.current}
                  className={`${inputClasses} min-w-0 flex-1 disabled:bg-slate-50 disabled:text-slate-400`}
                />
                <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={item.current}
                    onChange={(e) => updateItem(i, { current: e.target.checked })}
                  />
                  Present
                </label>
              </div>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="Description"
                className={inputClasses}
              />
            </div>
          ))}
          <button type="button" onClick={addItem} className="self-start text-xs font-medium text-primary hover:underline">
            + Add entry
          </button>
        </div>
      )}
      <EntryTitleStyleFields block={block} onChange={onChange} />
      <BodyTextStyleFields block={block} onChange={onChange} />
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

// Links the block's content to one of the Content Library slots: from
// then on the displayed text is read from there, so the content stays the
// same when switching from one template to another.
function ContentSlotBinder({ block, onChange }) {
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
            their own dedicated editor UI instead of a text block. */}
        {CONTENT_SLOTS.filter((s) => !['image', 'social', 'contactGroup'].includes(s.type)).map((slot) => (
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

function ImageUploadField({ onChange }) {
  const fileInputRef = useRef(null)

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange({ src: reader.result, imageSlot: null })
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 py-1.5 text-sm text-slate-600 transition hover:border-primary hover:text-primary"
      >
        <Upload size={14} />
        Upload from computer
      </button>
    </>
  )
}

// Crops whichever image is actually showing (an uploaded/URL src, or the
// Content Library photo when imageSlot is bound) and writes the cropped
// result back to wherever it came from.
function ImageCropButton({ block, onChange }) {
  const { getLibrary, updateSlot } = useContentLibrary()
  const [isCropping, setIsCropping] = useState(false)
  // `imageSlot` only ever binds to a shared 'image' slot (Photo/Signature —
  // see ContentLibraryContext.jsx), which every language's library resolves
  // to the same value, so no particular language needs to be passed here.
  const currentSrc = block.imageSlot ? getLibrary()[block.imageSlot] : block.src
  if (!currentSrc) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsCropping(true)}
        className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 py-1.5 text-sm text-slate-600 transition hover:border-primary hover:text-primary"
      >
        <Crop size={14} />
        Crop image
      </button>
      {isCropping && (
        <ImageCropModal
          imageSrc={currentSrc}
          initialAspect={block.width && block.height ? block.width / block.height : 1}
          initialShape={block.shape}
          onCancel={() => setIsCropping(false)}
          onApply={(dataUrl) => {
            if (block.imageSlot) updateSlot(block.imageSlot, dataUrl)
            else onChange({ src: dataUrl })
            setIsCropping(false)
          }}
        />
      )}
    </>
  )
}

function AlignIconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-primary"
    >
      <Icon size={16} />
    </button>
  )
}

const PAGE_ALIGN_MODES = {
  left: 'page-left',
  centerH: 'page-center-h',
  right: 'page-right',
  top: 'page-top',
  middle: 'page-middle',
  bottom: 'page-bottom',
}

const SELECTION_ALIGN_MODES = {
  left: 'left',
  centerH: 'center-h',
  right: 'right',
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
}

// One row of align buttons: left/center/right relative to the horizontal
// axis, then top/middle/bottom relative to the vertical one. `modes` picks
// whether "center"/"page" targets the sheet or the selection's own
// bounding box (see utils/align.js).
function AlignRow({ modes, onAlign }) {
  return (
    <div className="flex items-center gap-0.5">
      <AlignIconButton icon={AlignHorizontalJustifyStart} label="Align left" onClick={() => onAlign(modes.left)} />
      <AlignIconButton
        icon={AlignHorizontalJustifyCenter}
        label="Align center"
        onClick={() => onAlign(modes.centerH)}
      />
      <AlignIconButton icon={AlignHorizontalJustifyEnd} label="Align right" onClick={() => onAlign(modes.right)} />
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <AlignIconButton icon={AlignVerticalJustifyStart} label="Align top" onClick={() => onAlign(modes.top)} />
      <AlignIconButton
        icon={AlignVerticalJustifyCenter}
        label="Align middle"
        onClick={() => onAlign(modes.middle)}
      />
      <AlignIconButton icon={AlignVerticalJustifyEnd} label="Align bottom" onClick={() => onAlign(modes.bottom)} />
    </div>
  )
}

// Alignment relative to the page (top/middle/bottom, left/center/right):
// available for any single free block, since it only needs its own
// position/size to compute.
function PageAlignField() {
  const { alignSelection } = useBuilder()
  return (
    <Field label="Align to page">
      <AlignRow modes={PAGE_ALIGN_MODES} onAlign={alignSelection} />
    </Field>
  )
}

// Shown instead of the single-block editor when 2+ free blocks are
// selected (shift-click on the sheet to build a selection): align them to
// the page, to each other, or spread them out evenly.
function MultiSelectPanel({ count }) {
  const { alignSelection } = useBuilder()
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">{count} objects selected</h3>
      <p className="text-xs text-slate-500">
        Shift-click blocks on the sheet to add or remove them from the selection.
      </p>
      <Field label="Align to page">
        <AlignRow modes={PAGE_ALIGN_MODES} onAlign={alignSelection} />
      </Field>
      <Field label="Align to each other">
        <AlignRow modes={SELECTION_ALIGN_MODES} onAlign={alignSelection} />
      </Field>
      {count >= 3 && (
        <Field label="Distribute evenly">
          <div className="flex items-center gap-1">
            <AlignIconButton
              icon={AlignHorizontalDistributeCenter}
              label="Distribute horizontally"
              onClick={() => alignSelection('distribute-h')}
            />
            <AlignIconButton
              icon={AlignVerticalDistributeCenter}
              label="Distribute vertically"
              onClick={() => alignSelection('distribute-v')}
            />
          </div>
        </Field>
      )}
    </div>
  )
}

function PositionSizeFields({ block, onChange }) {
  const { sendToBack, bringToFront } = useBuilder()
  if (typeof block.x !== 'number') return null

  // Measures the block's own rendered content (see FreeBlock.jsx's
  // data-block-content wrapper) and sets the block's width AND height to
  // match exactly on all four sides — not just growing height to fit
  // overflow, which is all `scrollHeight` alone can tell you: a wrapper
  // sized bigger than its content reports its own (larger) box back as
  // scrollHeight/scrollWidth, since a shorter/narrower child doesn't make
  // an already-bigger box "overflow" in the other direction. Measuring the
  // content's true natural size means briefly letting the node size itself
  // (`max-content`, overflow visible) instead of staying pinned to the
  // block's current box, then reverting before the next paint — so this
  // also correctly *shrinks* an oversized block, not just grows one.
  // `axis` picks which dimension(s) actually change:
  //  - 'height': keeps the current width (so text reflows exactly as
  //    already shown) and measures how tall that makes it — for a
  //    fixed-width paragraph/column where only the height should shrink
  //    or grow to stop clipping or leaving empty space below the text.
  //  - 'width': keeps the current height and measures the content's
  //    intrinsic (unwrapped) width — for a short line/title that's
  //    sitting in a box wider or narrower than the text actually needs.
  //  - 'both' (default): measures both at once, letting the box shrink-
  //    wrap the text exactly on all four sides.
  // Both edges stay anchored at the block's own x/y — nothing here moves
  // the block, only its width/height, so which corner it grows/shrinks
  // from is whatever the block's own top-left position already is.
  function fitToContent(axis = 'both') {
    const node = document.querySelector(`[data-block-content="${block.id}"]`)
    if (!node) return
    const prevWidth = node.style.width
    const prevHeight = node.style.height
    const prevOverflow = node.style.overflow
    if (axis !== 'height') node.style.width = 'max-content'
    if (axis !== 'width') node.style.height = 'max-content'
    node.style.overflow = 'visible'
    const rect = node.getBoundingClientRect()
    const naturalWidth = rect.width
    const naturalHeight = rect.height
    node.style.width = prevWidth
    node.style.height = prevHeight
    node.style.overflow = prevOverflow
    const patch = {}
    if (axis !== 'height' && naturalWidth) {
      patch.width = Math.min(SHEET_WIDTH, Math.max(20, Math.ceil(naturalWidth)))
    }
    if (axis !== 'width' && naturalHeight) {
      patch.height = Math.min(SHEET_HEIGHT, Math.max(20, Math.ceil(naturalHeight)))
    }
    if (Object.keys(patch).length > 0) onChange(patch)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
      <PageAlignField />
      <div className="grid grid-cols-2 gap-3">
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
      <Field label="Fit to content">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => fitToContent('width')}
            title="Resize width only, keeping the current height"
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Maximize2 size={12} />
            Width
          </button>
          <button
            type="button"
            onClick={() => fitToContent('height')}
            title="Resize height only, keeping the current width"
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Maximize2 size={12} />
            Height
          </button>
          <button
            type="button"
            onClick={() => fitToContent('both')}
            title="Resize both width and height exactly to the content"
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Maximize2 size={12} />
            Both
          </button>
        </div>
      </Field>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => sendToBack(block.id)}
          title="Move behind every other block on this page"
          className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
        >
          Send to back
        </button>
        <button
          type="button"
          onClick={() => bringToFront(block.id)}
          title="Move in front of every other block on this page"
          className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
        >
          Bring to front
        </button>
      </div>
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
        <ColumnsProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.DIVIDER) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <DividerProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.SHAPE) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <ShapeProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.SKILLS_CHART) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <SkillsChartProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.LANGUAGES_CHART) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <LanguagesChartProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.QR_CODE) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <QrCodeProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.SOCIAL_ICONS) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <SocialIconsProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.CONTACT_INFO) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <ContactInfoProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.LEISURE) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <LeisureProperties block={block} onChange={onChange} />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.EXPERIENCE) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <EntriesBlockProperties
          block={block}
          onChange={onChange}
          libraryToggleKey="useLibraryExperience"
          librarySlotLabel="Work Experience"
        />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  if (block.type === BLOCK_TYPES.EDUCATION) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Block: {BLOCK_LABELS[block.type]}
        </h3>
        <EntriesBlockProperties
          block={block}
          onChange={onChange}
          libraryToggleKey="useLibraryEducation"
          librarySlotLabel="Education"
        />
        <PositionSizeFields block={block} onChange={onChange} />
      </div>
    )
  }

  const showAlign = block.type !== BLOCK_TYPES.DIVIDER
  const showContent = block.type !== BLOCK_TYPES.DIVIDER && block.type !== BLOCK_TYPES.IMAGE
  const isHeading = block.type === BLOCK_TYPES.HEADING
  const isText = block.type === BLOCK_TYPES.TEXT
  const isImage = block.type === BLOCK_TYPES.IMAGE
  const hasTypography = [BLOCK_TYPES.HEADING, BLOCK_TYPES.TEXT, BLOCK_TYPES.QUOTE].includes(
    block.type,
  )
  const canBindContent =
    hasTypography || block.type === BLOCK_TYPES.HEADER || block.type === BLOCK_TYPES.FOOTER

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Block: {BLOCK_LABELS[block.type] || block.type}
      </h3>

      {canBindContent && <ContentSlotBinder block={block} onChange={onChange} />}

      {block.type === BLOCK_TYPES.TEXT && block.contentSlot && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={block.showTitle === true}
              onChange={(e) => onChange({ showTitle: e.target.checked })}
            />
            Show the field's name as a title above it
          </label>
          {block.showTitle === true && (
            <>
              <Field label="Title text (optional)">
                <input
                  type="text"
                  value={block.titleText || ''}
                  onChange={(e) => onChange({ titleText: e.target.value || null })}
                  placeholder={CONTENT_SLOTS.find((s) => s.key === block.contentSlot)?.label || ''}
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
        CONTENT_SLOTS.find((s) => s.key === block.contentSlot)?.type === 'entries' && (
          <>
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
              Show location before the title
            </label>
            <EntryTitleStyleFields block={block} onChange={onChange} />
          </>
        )}

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

      <PositionSizeFields block={block} onChange={onChange} />
    </div>
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
