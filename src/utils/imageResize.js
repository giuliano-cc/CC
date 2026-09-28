// Everything the app stores (Content Library, every template's own
// blocks) lives in the browser's localStorage, which caps out around
// 5-10MB per origin. An uploaded photo straight off a phone can be
// several MB on its own once base64-encoded — well past that limit by
// itself, and the write that goes over quota fails *silently* (see the
// try/catch around every localStorage.setItem in ContentLibraryContext.jsx
// and templatesService.js), which looks exactly like "my changes keep
// getting lost" with no error to explain why. Downscaling every uploaded
// image before it's ever stored keeps the whole library well within quota
// in the first place, rather than only detecting the overflow after
// the fact.
//
// PNG is kept as PNG (so a signature's transparency survives); anything
// else is re-encoded as JPEG, which shrinks a multi-MB photo dramatically
// with no visible quality loss at CV print sizes.
export function resizeImageFile(file, { maxDimension = 1000, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read this image'))
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const isPng = file.type === 'image/png'
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
