import { cropToCanvas } from 'react-image-crop'

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
