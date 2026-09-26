// Renders the cropped region (in source-image pixels, as reported by
// react-easy-crop's onCropComplete) onto an offscreen canvas and returns
// it as a data URL — the actual "commit" step of cropping, since
// react-easy-crop itself only ever previews the crop, it never exports it.
export function getCroppedImageDataUrl(imageSrc, cropPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropPixels.width
      canvas.height = cropPixels.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height,
      )
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = reject
    image.src = imageSrc
  })
}
