// react-easy-crop only ever previews a crop/rotation, it never exports
// one — this is the actual "commit" step. `pixelCrop` (from
// onCropComplete) is already in the rotated image's own coordinate
// space when a `rotation` was passed to <Cropper>, so the standard
// technique (see react-easy-crop's own docs) is: draw the source image
// onto a canvas sized to its *rotated* bounding box, rotated around its
// center, then lift just the crop rectangle out of that.
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

export async function getCroppedImageDataUrl(imageSrc, cropPixels, rotation = 0) {
  const image = await createImage(imageSrc)
  const rotRad = (rotation * Math.PI) / 180
  const { width: bBoxWidth, height: bBoxHeight } = rotatedBoundingBox(image.width, image.height, rotation)

  const canvas = document.createElement('canvas')
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight
  const ctx = canvas.getContext('2d')
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  const data = ctx.getImageData(cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height)
  canvas.width = cropPixels.width
  canvas.height = cropPixels.height
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL('image/png')
}
