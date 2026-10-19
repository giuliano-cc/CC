import { useRef } from 'react'
import { Shuffle } from 'lucide-react'
import { useBuilder } from '../../../context/BuilderContext'
import { useContentLibrary } from '../../../context/ContentLibraryContext'
import { BLOCK_TYPES, FONT_FAMILY_OPTIONS, getTemplateTypographyStyles, matchesTypographyRow, sectionTitleSizeField } from '../../../utils/blockTypes'
import { TEXT_TRANSFORM_OPTIONS } from '../../../utils/blockTypes'
import { resizeImageFile } from '../../../utils/imageResize'
import FontPicker from '../FontPicker'
import { Field, inputClasses } from './fields'

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

// An image behind every block on the page, on top of the plain page
// background color above (visible through any transparent part of the
// image, e.g. a PNG watermark or logo) — see utils/layout.js's
// pageBackgroundStyle, applied identically in the editor (Canvas.jsx) and
// the print/export tree (PrintDocument.jsx).
function PageBackgroundImageField({ globalStyle, setGlobalStyle }) {
  const fileInputRef = useRef(null)

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    // Downscaled like every other upload (see utils/imageResize.js) — a
    // full-bleed page background doesn't need to be sharper than print
    // resolution at this page size, and a raw phone photo would otherwise
    // dominate the whole template's storage footprint.
    resizeImageFile(file, { maxDimension: 1600 }).then((dataUrl) =>
      setGlobalStyle((prev) => ({ ...prev, pageBackgroundImage: dataUrl })),
    )
    event.target.value = ''
  }

  return (
    <Field label="Page background image">
      <div className="flex items-center gap-1.5">
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
        >
          {globalStyle.pageBackgroundImage ? 'Replace image' : 'Upload image'}
        </button>
        {globalStyle.pageBackgroundImage && (
          <button
            type="button"
            onClick={() => setGlobalStyle((prev) => ({ ...prev, pageBackgroundImage: '' }))}
            className="shrink-0 rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Remove image"
          >
            ✕
          </button>
        )}
      </div>
      {globalStyle.pageBackgroundImage && (
        <div className="mt-2 flex items-center gap-2">
          <img
            src={globalStyle.pageBackgroundImage}
            alt="Page background preview"
            className="h-12 w-9 shrink-0 rounded border border-slate-200 object-cover"
          />
          <select
            value={globalStyle.pageBackgroundSize || 'cover'}
            onChange={(e) => setGlobalStyle((prev) => ({ ...prev, pageBackgroundSize: e.target.value }))}
            className={`${inputClasses} !w-auto flex-1`}
          >
            <option value="cover">Cover (fill the page, cropped)</option>
            <option value="contain">Contain (fit inside, no cropping)</option>
            <option value="repeat">Repeat (tiled at original size)</option>
          </select>
        </div>
      )}
      {globalStyle.pageBackgroundImage && (
        <label className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={globalStyle.pageBackgroundImageVisible !== false}
            onChange={(e) => setGlobalStyle((prev) => ({ ...prev, pageBackgroundImageVisible: e.target.checked }))}
          />
          Show background image
        </label>
      )}
    </Field>
  )
}

export default function GlobalStylePanel() {
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
  // block, or a Text block's auto-title) uses `titleColor`/`titleBold`/a
  // size field of its own instead of `color`/`bold`/`fontSize` (which,
  // where it has them at all, mean something else — e.g. a chart's bar
  // color, or a Text block's own paragraph size), so the patch is
  // translated for it.
  function applyTypographyChange(row, patch) {
    function walk(list) {
      list.forEach((block) => {
        if (matchesTypographyRow(block, row)) {
          const isTitleOnlyMatch = row.matchType === BLOCK_TYPES.HEADING && block.type !== BLOCK_TYPES.HEADING
          if (isTitleOnlyMatch) {
            const { color, fontSize, bold, italic, textTransform, ...rest } = patch
            const translated = { ...rest }
            if (color !== undefined) translated.titleColor = color
            if (fontSize !== undefined) translated[sectionTitleSizeField(block)] = fontSize
            if (bold !== undefined) translated.titleBold = bold
            if (italic !== undefined) translated.titleItalic = italic
            if (textTransform !== undefined) translated.titleTextTransform = textTransform
            updateBlock(block.id, translated)
          } else if (row.matchType === 'entryTitle') {
            // Entry titles use their own dedicated fields so they never
            // collide with the block's own section-title color/font/size.
            const { color, fontSize, fontFamily, bold, italic, textTransform, ...rest } = patch
            const translated = { ...rest }
            if (color !== undefined) translated.entryTitleColor = color
            if (fontSize !== undefined) translated.entryTitleFontSize = fontSize
            if (fontFamily !== undefined) translated.entryTitleFontFamily = fontFamily
            if (bold !== undefined) translated.entryTitleBold = bold
            if (italic !== undefined) translated.entryTitleItalic = italic
            if (textTransform !== undefined) translated.entryTitleTextTransform = textTransform
            updateBlock(block.id, translated)
          } else if (['contactBody', 'entriesBody', 'mapBody'].includes(row.matchType)) {
            // Contact Info/Experience/Education's own body text and the
            // Locations Map legend all keep their size/font under a
            // `body*`-prefixed name (so it never collides with a
            // section-title field on the same block) — and none of them
            // has a bold/italic/text-case field of its own at all, so
            // those three are simply dropped here rather than written
            // nowhere.
            const { color, fontSize, fontFamily, bold, italic, textTransform, ...rest } = patch
            void bold
            void italic
            void textTransform
            const translated = { ...rest }
            if (color !== undefined) translated.bodyColor = color
            if (fontSize !== undefined) translated.bodyFontSize = fontSize
            if (fontFamily !== undefined) translated.bodyFontFamily = fontFamily
            updateBlock(block.id, translated)
          } else if (row.matchType === 'chartLabel') {
            // The chart's own `color` already means its bar/dot/tag fill
            // (see Chart.jsx) — the label text's color is the separate
            // `labelColor` field so changing one never changes the other.
            const { color, bold, italic, textTransform, ...rest } = patch
            void bold
            void italic
            void textTransform
            const translated = { ...rest }
            if (color !== undefined) translated.labelColor = color
            updateBlock(block.id, translated)
          } else if (row.matchType === 'leisure') {
            // Leisure's fontFamily/fontSize/color already match these
            // generic names directly — just drop the three fields it has
            // no field for.
            const { bold, italic, textTransform, ...rest } = patch
            void bold
            void italic
            void textTransform
            updateBlock(block.id, rest)
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
      <Field label="Date format (Experience, Education, Selected Works)">
        <select
          value={globalStyle.dateFormat || 'text'}
          onChange={(e) => setGlobalStyle((prev) => ({ ...prev, dateFormat: e.target.value }))}
          className={inputClasses}
        >
          <option value="text">Text (Jan 2024)</option>
          <option value="numeric">Numeric (01/2024)</option>
        </select>
      </Field>
      <p className="-mt-2 text-xs text-slate-400">
        Month names are always in English — pick Numeric for a document in
        another language, so the date doesn't mix languages.
      </p>
      <Field label="Accent color">
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
      <PageBackgroundImageField globalStyle={globalStyle} setGlobalStyle={setGlobalStyle} />
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
        <span className="text-xs font-medium text-slate-500">Golden ratio margin lines (px)</span>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['goldenOffsetSx', 'Left (sx)'],
            ['goldenOffsetDx', 'Right (dx)'],
            ['goldenOffsetTop', 'Top'],
            ['goldenOffsetBottom', 'Bottom'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min={-400}
                max={400}
                value={globalStyle[key] ?? 0}
                onChange={(e) =>
                  setGlobalStyle((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
                className={inputClasses}
              />
            </Field>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          0 = no extra lines. A non-zero value adds a symmetric pair of
          solid lines that many px to each side of that exact golden
          ratio line — the dashed line stays put as the fixed reference,
          and the two new solid lines are a snappable margin approaching
          from either direction. Each of the 4 can have its own value.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4">
        <span className="text-xs font-medium text-slate-500">Column &amp; row grid</span>
        <p className="-mt-1 text-xs text-slate-400">
          The print-design "structure grid": columns × rows of equal-size
          cells filling the space between the margins, separated by a
          gutter — toggled from the Canvas toolbar (the layout icon).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Columns">
            <input
              type="number"
              min={1}
              max={12}
              value={globalStyle.structureColumns ?? 1}
              onChange={(e) => setGlobalStyle((prev) => ({ ...prev, structureColumns: Number(e.target.value) }))}
              className={inputClasses}
            />
          </Field>
          <Field label="Rows">
            <input
              type="number"
              min={1}
              max={12}
              value={globalStyle.structureRows ?? 1}
              onChange={(e) => setGlobalStyle((prev) => ({ ...prev, structureRows: Number(e.target.value) }))}
              className={inputClasses}
            />
          </Field>
        </div>
        {((globalStyle.structureColumns ?? 1) > 1 || (globalStyle.structureRows ?? 1) > 1) && (
          <Field label="Gutter (px)">
            <input
              type="number"
              min={0}
              max={200}
              value={globalStyle.structureGutter ?? 24}
              onChange={(e) => setGlobalStyle((prev) => ({ ...prev, structureGutter: Number(e.target.value) }))}
              className={inputClasses}
            />
          </Field>
        )}
        <p className="text-xs text-slate-400">
          A block's edges or center snap to a column/row line, same as the
          golden ratio guide's lines — the whole grid stays inside the
          page margins on both axes.
        </p>
      </div>

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
                    <label className="flex shrink-0 items-center gap-1 text-slate-600">
                      <input
                        type="checkbox"
                        checked={row.bold}
                        onChange={(e) => applyTypographyChange(row, { bold: e.target.checked })}
                      />
                      Bold
                    </label>
                    <label className="flex shrink-0 items-center gap-1 text-slate-600">
                      <input
                        type="checkbox"
                        checked={row.italic}
                        onChange={(e) => applyTypographyChange(row, { italic: e.target.checked })}
                      />
                      Italic
                    </label>
                    <input
                      type="color"
                      value={row.color || inheritedColor}
                      onChange={(e) => applyTypographyChange(row, { color: e.target.value })}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-slate-300"
                      title={row.color ? 'Color (custom — click × to inherit again)' : 'Color (inherited from Accent color)'}
                    />
                    {row.color && (
                      <button
                        type="button"
                        onClick={() => applyTypographyChange(row, { color: null })}
                        className="shrink-0 rounded-md px-1.5 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Reset to inherit the global Accent/Text color"
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
                    <select
                      value={row.textTransform}
                      onChange={(e) => applyTypographyChange(row, { textTransform: e.target.value || null })}
                      title="Text case"
                      className={`${inputClasses} !w-auto shrink-0 py-1`}
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
