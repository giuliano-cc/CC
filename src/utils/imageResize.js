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

// pdfjs-dist pulls in its own parser/worker bundle (a few hundred KB) —
// dynamically imported so a document that never uploads a PDF doesn't pay
// for it, same reasoning as WorldMap's dynamically-imported dot basemap.
let pdfjsPromise = null
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
      return pdfjs
    })
  }
  return pdfjsPromise
}

function downscaleAndEncode(source, sourceWidth, sourceHeight, { maxDimension, quality, isPng }) {
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight))
  const width = Math.round(sourceWidth * scale)
  const height = Math.round(sourceHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!isPng) {
    // A PDF page (or any source with no alpha channel) composites onto
    // whatever the canvas already has — transparent black by default,
    // which would otherwise turn a white page into a black rectangle
    // once re-encoded as a background-less JPEG.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(source, 0, 0, width, height)
  return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality)
}

// Renders a PDF's first page to a data URL — someone's CV-builder photo
// slot is just as likely to get handed a scanned signature or a logo
// exported straight out of a PDF as an actual photo, and there's no
// other way to preview or print a raw PDF inside an image block.
function resizePdfFile(file, { maxDimension, quality }) {
  return loadPdfjs().then(async (pdfjs) => {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: buffer }).promise
    const page = await pdf.getPage(1)
    // Rendered at a high enough resolution first that downscaling to
    // maxDimension afterwards is a quality reduction, not an upscale —
    // a PDF page's own "size" is in points, not pixels, so this has
    // nothing to do with the final output size.
    const baseViewport = page.getViewport({ scale: 1 })
    const renderScale = Math.max(1, (maxDimension * 2) / Math.max(baseViewport.width, baseViewport.height))
    const viewport = page.getViewport({ scale: renderScale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    return downscaleAndEncode(canvas, canvas.width, canvas.height, { maxDimension, quality, isPng: false })
  })
}

function resizeRasterFile(file, { maxDimension, quality }) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read this image'))
      img.onload = () => {
        const isPng = file.type === 'image/png'
        resolve(downscaleAndEncode(img, img.width, img.height, { maxDimension, quality, isPng }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Read straight through as a data URL, no canvas round-trip — rasterizing
// an SVG (the same way every other format is downscaled) would throw away
// exactly what makes it an SVG: it stays crisp at any print size and its
// own file size already has nothing to do with pixel dimensions, so
// there's no quota-driven reason to re-encode it as a raster image. An
// SVG loaded through <img src="..."> (every place this app renders one)
// never executes scripts it contains, so this is no less safe than any
// other uploaded image.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export function resizeImageFile(file, { maxDimension = 1000, quality = 0.85 } = {}) {
  if (file.type === 'application/pdf') {
    return resizePdfFile(file, { maxDimension, quality })
  }
  if (file.type === 'image/svg+xml') {
    return readFileAsDataUrl(file)
  }
  return resizeRasterFile(file, { maxDimension, quality })
}
