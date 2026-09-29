import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { Check, Eraser, Loader2, RotateCcw, RotateCw, X } from 'lucide-react'
import { getCroppedImageDataUrl } from '../../utils/cropImage'
import { removeImageBackground } from '../../utils/backgroundRemoval'

// Full-screen crop tool: drag to reposition, slider to zoom/rotate, pick a
// shape (rect free-form / square / circle) to match how the image will
// actually display on the sheet. Applying commits the crop (and any
// rotation/background removal) into a new, permanent image (see
// utils/cropImage.js) — the original upload is not kept.
export default function ImageCropModal({ imageSrc, initialAspect = 1, initialShape = 'rect', onApply, onCancel }) {
  // The image actually being edited — starts as the upload, but "Remove
  // background" replaces it in place (before any crop/rotation is
  // committed) so the result can still be cropped/rotated afterward in
  // this same pass.
  const [currentSrc, setCurrentSrc] = useState(imageSrc)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspect, setAspect] = useState(initialAspect)
  const [cropShape, setCropShape] = useState(initialShape === 'circle' ? 'round' : 'rect')
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [bgError, setBgError] = useState(false)

  async function handleApply() {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    try {
      const dataUrl = await getCroppedImageDataUrl(currentSrc, croppedAreaPixels, rotation)
      onApply(dataUrl)
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

        <div className="relative flex-1 bg-slate-900">
          <Cropper
            image={currentSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
          {isRemovingBg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 text-white">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-xs">Removing background — the first time can take a moment.</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-500">Rotate</span>
            <button
              type="button"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              title="Rotate 90° left"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-primary hover:text-primary"
            >
              <RotateCcw size={14} />
            </button>
            <input
              type="range"
              min={0}
              max={359}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90° right"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-primary hover:text-primary"
            >
              <RotateCw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-500">Shape</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {[
                { label: 'Original', aspectValue: initialAspect, shape: 'rect' },
                { label: 'Square', aspectValue: 1, shape: 'rect' },
                { label: 'Portrait', aspectValue: 3 / 4, shape: 'rect' },
                { label: 'Wide', aspectValue: 16 / 9, shape: 'rect' },
                { label: 'Circle', aspectValue: 1, shape: 'round' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setAspect(opt.aspectValue)
                    setCropShape(opt.shape)
                  }}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    cropShape === opt.shape && aspect === opt.aspectValue
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-300 text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {opt.label}
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
              disabled={isSaving}
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
