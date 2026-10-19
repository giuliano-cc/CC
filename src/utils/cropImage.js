import { centerCrop, convertToPixelCrop, cropToCanvas, makeAspectCrop } from 'react-image-crop'

// A centered starting rectangle for a given aspect (or, with no aspect,
// 80% of the image either way) — shared by the interactive crop tool
// (ImageCropModal.jsx, recentering whenever the aspect preset changes)
// and autoCropImageDataUrl below (applying a remembered aspect with no
// UI at all).
export function centeredCrop(mediaWidth, mediaHeight, aspect) {
  const base = aspect
    ? makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight)
    : { unit: '%', width: 80, height: 80 }
  return centerCrop(base, mediaWidth, mediaHeight)
}

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function rotatedBoundingBox(width, height, rotationDeg) {
  const rotRad = (rotationDeg * Math.PI) / 180
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

// Bakes a 90°-step rotation into a brand new image (used by the crop
// tool's rotate-left/right buttons) — applied immediately, before any
// crop selection, so the rectangle the user drags afterward lines up
// with what's actually on screen instead of a separate, deferred
// rotation transform fighting with a live crop rectangle.
export async function rotateImageDataUrl(imageSrc, degrees) {
  const image = await createImage(imageSrc)
  const { width, height } = rotatedBoundingBox(image.width, image.height, degrees)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.translate(width / 2, height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(image, -image.width / 2, -image.height / 2)
  return canvas.toDataURL('image/png')
}

// Commits a react-image-crop selection into a new, permanent image — the
// crop tool only ever previews a rectangle over the on-screen <img>;
// `cropToCanvas` (from react-image-crop) does the actual math of scaling
// that rectangle from the rendered element's size up to the source
// image's full resolution. Unlike the library's own `cropToImg` helper,
// this reads the canvas back out as a data: URL (via `toDataURL`) rather
// than an object URL — a blob: URL only lives for this page session,
// which would break as soon as the result is saved to IndexedDB/
// localStorage and reloaded later.
export async function getCroppedImageDataUrl(imageElement, pixelCrop) {
  const canvas = document.createElement('canvas')
  await cropToCanvas(imageElement, canvas, pixelCrop)
  return canvas.toDataURL('image/png')
}

// Replaces a photo/signature/image with a new upload while reusing a
// previously-used crop's aspect/shape, with no crop tool shown at all —
// a straight "swap the picture, keep the framing" for a series of same-
// shaped photos. Centers the same way the interactive tool's own
// presets do; there's no remembered position to reuse (only aspect/
// circular are kept — see imageFields.jsx/ContentLibraryPage.jsx), and a
// new photo's subject may well sit differently anyway. The "Crop" button
// is still there afterward for fine-tuning this particular photo.
export async function autoCropImageDataUrl(imageSrc, { aspect } = {}) {
  const image = await createImage(imageSrc)
  const percentCrop = centeredCrop(image.naturalWidth, image.naturalHeight, aspect)
  const pixelCrop = convertToPixelCrop(percentCrop, image.naturalWidth, image.naturalHeight)
  return getCroppedImageDataUrl(image, pixelCrop)
}
