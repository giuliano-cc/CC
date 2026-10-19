import { useRef, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Check, Eraser, Loader2, RotateCcw, RotateCw, X } from 'lucide-react'
import { getCroppedImageDataUrl, rotateImageDataUrl } from '../../utils/cropImage'
import { removeImageBackground } from '../../utils/backgroundRemoval'

// A centered starting rectangle for a given aspect (or, with no aspect,
// 80% of the image either way) — same "recenter whenever the aspect
// preset changes" shape the old slider-based tool had, just expressed as
// an actual draggable/resizable selection rectangle instead of a crop
// window the image pans/zooms underneath.
function centeredCrop(mediaWidth, mediaHeight, aspect) {
  const base = aspect
    ? makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight)
    : { unit: '%', width: 80, height: 80 }
  return centerCrop(base, mediaWidth, mediaHeight)
}

const CROP_PRESETS = (initialAspect) => [
  { label: 'Free', aspect: undefined, circular: false },
  { label: 'Original', aspect: initialAspect, circular: false },
  { label: 'Square', aspect: 1, circular: false },
  { label: 'Portrait', aspect: 3 / 4, circular: false },
  { label: 'Wide', aspect: 16 / 9, circular: false },
  { label: 'Circle', aspect: 1, circular: true },
]

// Full-screen crop tool: drag/resize a rectangular selection directly
// over the image (react-image-crop — corner/edge handles, optionally
// locked to a preset aspect ratio), rotate in 90° steps, pick a shape
// preset, remove the background. Applying commits the crop (and any
// rotation/background removal) into a new, permanent image (see
// utils/cropImage.js) — the original upload is not kept — and reports
// back which preset was used (`{ aspect, circular }`, via `onApply`'s
// second argument) so a caller that remembers it can reopen the tool
// pre-set the same way next time, e.g. when replacing this same photo.
export default function ImageCropModal({
  imageSrc,
  initialAspect = 1,
  initialShape = 'rect',
  // The aspect/shape to start on, when different from initialAspect/
  // initialShape above — e.g. a previously-used crop remembered for this
  // same image slot (see imageFields.jsx). `initialAspect`/`initialShape`
  // still define what the "Original" preset itself means (the block's own
  // native ratio), so the two don't collapse into one pair of props.
  defaultAspect,
  defaultCircular,
  onApply,
  onCancel,
}) {
  const presets = CROP_PRESETS(initialAspect)
  const startAspect = defaultAspect !== undefined ? defaultAspect : initialAspect
  const startCircular = defaultCircular !== undefined ? defaultCircular : initialShape === 'circle'
  // The image actually being edited — starts as the upload, but "Remove
  // background" and "Rotate" each replace it in place (before any crop is
  // committed) so the result can still be cropped afterward in this same
  // pass, and so the crop rectangle always lines up with what's on screen.
  const [currentSrc, setCurrentSrc] = useState(imageSrc)
  const [aspect, setAspect] = useState(startAspect)
  const [circularCrop, setCircularCrop] = useState(startCircular)
  const [activePreset, setActivePreset] = useState(
    () => presets.find((p) => p.aspect === startAspect && p.circular === startCircular)?.label || 'Free',
  )
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [bgError, setBgError] = useState(false)
  const imgRef = useRef(null)

  function onImageLoad(e) {
    const { width, height } = e.currentTarget
    setCrop(centeredCrop(width, height, aspect))
  }

  function applyPreset(preset) {
    setAspect(preset.aspect)
    setCircularCrop(preset.circular)
    setActivePreset(preset.label)
    if (imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centeredCrop(width, height, preset.aspect))
    }
  }

  async function handleRotate(degrees) {
    setIsRotating(true)
    try {
      const rotated = await rotateImageDataUrl(currentSrc, degrees)
      setCurrentSrc(rotated)
      setCrop(undefined)
      setCompletedCrop(null)
    } finally {
      setIsRotating(false)
    }
  }

  async function handleApply() {
    if (!completedCrop || !imgRef.current) return
    setIsSaving(true)
    try {
      const dataUrl = await getCroppedImageDataUrl(imgRef.current, completedCrop)
      onApply(dataUrl, { aspect, circular: circularCrop })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveBackground() {
    setIsRemovingBg(true)
    setBgError(false)
    try {
      const result = await removeImageBackground(currentSrc)
      setCurrentSrc(result)
    } catch {
      // Almost always the first-run model download failing (offline, or a
      // blocked/slow connection to the CDN it's fetched from) — the crop
      // tool itself still works fine without it.
      setBgError(true)
    } finally {
      setIsRemovingBg(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Crop image</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-900 p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            aspect={aspect}
            circularCrop={circularCrop}
            minWidth={20}
            minHeight={20}
          >
            {/* react-image-crop's own stylesheet sets
                `.ReactCrop__child-wrapper > img { max-height: inherit }`,
                a higher-specificity rule than any Tailwind utility class
                here — only an inline style reliably wins that cascade, so
                a tall portrait photo is still fully visible (and
                selectable end to end) instead of overflowing the modal. */}
            <img
              ref={imgRef}
              src={currentSrc}
              alt=""
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%' }}
            />
          </ReactCrop>
          {(isRemovingBg || isRotating) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 text-white">
              <Loader2 size={24} className="animate-spin" />
              {isRemovingBg && (
                <p className="text-xs">Removing background — the first time can take a moment.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-500">Rotate</span>
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              disabled={isRotating}
              title="Rotate 90° left"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleRotate(90)}
              disabled={isRotating}
              title="Rotate 90° right"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCw size={14} />
            </button>
            <span className="text-xs text-slate-400">Drag the rectangle's corners/edges to select precisely.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-500">Shape</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {CROP_PRESETS(initialAspect).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    activePreset === preset.label
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-300 text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={isRemovingBg}
                title="Removes the background entirely client-side — nothing is uploaded anywhere"
                className="ml-auto flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eraser size={13} />
                Remove background
              </button>
            </div>
          </div>
          {bgError && (
            <p className="text-xs text-red-500">
              Couldn't remove the background (the model failed to download) — try again, or check your connection.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving || !completedCrop}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-70"
            >
              <Check size={15} />
              Apply crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
