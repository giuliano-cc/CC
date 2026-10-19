import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Crop, Upload } from 'lucide-react'
import { useContentLibrary } from '../../../context/ContentLibraryContext'
import { resizeImageFile } from '../../../utils/imageResize'
import {
  isSvgDataUrl,
  decodeSvgMarkup,
  encodeSvgMarkup,
  extractSvgTexts,
  replaceSvgText,
  getSvgTextStyle,
  setSvgTextStyle,
  setAllSvgTextStyles,
} from '../../../utils/svgText'
import { autoCropImageDataUrl } from '../../../utils/cropImage'
import FontPicker from '../FontPicker'
import ImageCropModal from '../ImageCropModal'
import { Field, inputClasses } from './fields'

// `cropMeta` is a small JSON blob — `{ aspect, circular, cropPercent }` —
// remembering the crop a "Crop image" pass last used, so replacing the
// photo later can reuse that exact rectangle instead of defaulting back
// to "Original" every time. Parsed defensively since it's user/import-
// reachable storage, not a value this app alone ever writes.
function safeParseCropMeta(json) {
  if (!json) return null
  try {
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function ImageUploadField({ block, onChange }) {
  const fileInputRef = useRef(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const storedCrop = safeParseCropMeta(block?.cropMeta)

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    // Downscaled before it ever reaches state/localStorage — a raw upload
    // can be several MB, which alone can blow the ~5-10MB per-origin
    // storage quota and make every save silently fail from then on.
    resizeImageFile(file, { maxDimension: 1000 }).then(async (dataUrl) => {
      if (storedCrop) {
        // This block was already cropped once — apply that same crop
        // rectangle straight to the replacement photo (same position,
        // same shape — see autoCropImageDataUrl) instead of either
        // keeping the raw, uncropped image or interrupting with the crop
        // tool for what's meant to be a quick swap. "Crop" right below
        // still opens it for fine-tuning this particular photo afterward.
        setIsReplacing(true)
        try {
          const cropped = await autoCropImageDataUrl(dataUrl, storedCrop)
          onChange({ src: cropped, imageSlot: null })
        } finally {
          setIsReplacing(false)
        }
      } else {
        onChange({ src: dataUrl, imageSlot: null })
      }
    })
    event.target.value = ''
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isReplacing}
        className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 py-1.5 text-sm text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload size={14} />
        {storedCrop ? 'Replace image' : 'Upload from computer'}
      </button>
    </>
  )
}

// Crops whichever image is actually showing (an uploaded/URL src, or the
// Content Library photo when imageSlot is bound) and writes the cropped
// result back to wherever it came from. A library-bound image's crop
// shape/ratio is remembered on that same library slot (`${imageSlot}
// CropMeta`, e.g. `photoCropMeta`) — the same key ContentLibraryPage.jsx's
// PhotoField reads/writes — so it's remembered regardless of which of the
// two crop entry points (this button, or the Content Library page) was
// used last. A direct block.src image has nowhere shared to keep that
// memory, so it's kept on the block itself (`block.cropMeta`).
export function ImageCropButton({ block, onChange }) {
  const { getLibrary, updateSlot } = useContentLibrary()
  const [isCropping, setIsCropping] = useState(false)
  // `imageSlot` only ever binds to a shared 'image' slot (Photo/Signature —
  // see ContentLibraryContext.jsx), which every language's library resolves
  // to the same value, so no particular language needs to be passed here.
  const currentSrc = block.imageSlot ? getLibrary()[block.imageSlot] : block.src
  const cropMetaKey = block.imageSlot ? `${block.imageSlot}CropMeta` : null
  const storedCrop = safeParseCropMeta(cropMetaKey ? getLibrary()[cropMetaKey] : block.cropMeta)
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
          defaultAspect={storedCrop?.aspect}
          defaultCircular={storedCrop?.circular}
          defaultCropPercent={storedCrop?.cropPercent}
          onCancel={() => setIsCropping(false)}
          onApply={(dataUrl, meta) => {
            if (block.imageSlot) {
              updateSlot(block.imageSlot, dataUrl)
              updateSlot(cropMetaKey, JSON.stringify(meta))
            } else {
              onChange({ src: dataUrl, cropMeta: JSON.stringify(meta) })
            }
            setIsCropping(false)
          }}
        />
      )}
    </>
  )
}

// Font/size/color/bold/italic controls for one SVG <text> element's
// style — shared by the "global" (applies to every text at once) and
// "local" (one specific text, overriding the global style for just that
// one) controls below. `style` is whatever getSvgTextStyle read back —
// `null` fields show as this field's own placeholder/unchecked default,
// the same "not explicitly set" convention every other block style field
// already uses.
export function SvgTextStyleControls({ style, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FontPicker value={style.fontFamily || ''} onChange={(v) => onChange({ fontFamily: v || null })} />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={4}
          max={200}
          placeholder="size"
          value={style.fontSize || ''}
          onChange={(e) => onChange({ fontSize: e.target.value ? Number(e.target.value) : null })}
          className={`${inputClasses} !w-20`}
          title="Font size (px)"
        />
        <input
          type="color"
          value={style.fill || '#000000'}
          onChange={(e) => onChange({ fill: e.target.value })}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-slate-300"
          title="Text color"
        />
        <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" checked={!!style.bold} onChange={(e) => onChange({ bold: e.target.checked })} />
          Bold
        </label>
        <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" checked={!!style.italic} onChange={(e) => onChange({ italic: e.target.checked })} />
          Italic
        </label>
      </div>
    </div>
  )
}

// Edits an uploaded SVG's own <text> labels in place — one field per
// <text> element found, same "select the block, edit its text here"
// pattern every other block already uses, rather than a one-off
// click-to-edit-on-canvas behavior no other block has. Only for a
// directly-uploaded SVG (block.src); an imageSlot-bound one is edited
// from the Content Library instead, same as any other library image.
// A "global" style control applies the same font/size/color/bold/italic
// to every text at once; each one can still be expanded for its own
// "local" override afterwards — editing the global control again
// overwrites any local overrides already made, same as every other
// bulk-then-per-item style control in this app (e.g. Global Style's
// typography rows vs. a single block's own font override).
export function SvgTextFields({ block, onChange }) {
  const [expandedIndex, setExpandedIndex] = useState(null)
  if (block.imageSlot || !isSvgDataUrl(block.src)) return null
  const markup = decodeSvgMarkup(block.src)
  const texts = extractSvgTexts(markup)
  if (texts.length === 0) return null

  function updateMarkup(fn) {
    onChange({ src: encodeSvgMarkup(fn(decodeSvgMarkup(block.src))) })
  }

  return (
    <>
      <Field label="Text style (all text in this SVG)">
        <SvgTextStyleControls
          style={getSvgTextStyle(markup, 0) || {}}
          onChange={(patch) => updateMarkup((m) => setAllSvgTextStyles(m, patch))}
        />
      </Field>
      <Field label="Text in this SVG">
        <div className="flex flex-col gap-1.5">
          {texts.map((text, i) => (
            // eslint-disable-next-line react/no-array-index-key -- texts
            // are re-derived from the SVG markup itself on every render,
            // so their order/count is this element's own stable identity.
            <div key={i} className="flex flex-col gap-1.5 rounded-md border border-slate-200 p-1.5">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => updateMarkup((m) => replaceSvgText(m, i, e.target.value))}
                  className={`${inputClasses} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  title="This text's own style override"
                  className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
                >
                  {expandedIndex === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {expandedIndex === i && (
                <SvgTextStyleControls
                  style={getSvgTextStyle(markup, i) || {}}
                  onChange={(patch) => updateMarkup((m) => setSvgTextStyle(m, i, patch))}
                />
              )}
            </div>
          ))}
        </div>
      </Field>
    </>
  )
}
