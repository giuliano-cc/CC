// Runs fully client-side (WASM) — no backend, no image ever leaves the
// browser. The segmentation model itself isn't bundled (would bloat
// every page load); it's fetched from a CDN the first time this runs and
// cached by the browser after that, so the first call is noticeably
// slower than later ones.
export async function removeImageBackground(imageSrc) {
  const { removeBackground } = await import('@imgly/background-removal')
  const blob = await removeBackground(imageSrc)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
