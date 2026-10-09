// Lets an uploaded SVG's own <text> labels be edited from the Properties
// panel — the same "select the block, edit its text in the sidebar"
// pattern every other block already uses (Text, Heading, Experience, ...),
// rather than introducing a one-off click-to-edit-on-canvas behavior no
// other block has.

export function isSvgDataUrl(src) {
  return typeof src === 'string' && src.startsWith('data:image/svg+xml')
}

export function decodeSvgMarkup(dataUrl) {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(5, comma) // after "data:"
  const payload = dataUrl.slice(comma + 1)
  return meta.includes('base64') ? atob(payload) : decodeURIComponent(payload)
}

export function encodeSvgMarkup(markup) {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`
}

// Strips anything capable of running script — an uploaded SVG is
// untrusted content, and unlike the <img src="..."> this app otherwise
// displays it through (which never executes a script an SVG contains),
// parsing it into a live DOM to read/edit its <text> elements does. Runs
// on decode, before the markup is ever parsed into a DOM for display or
// editing, and again every time edited text is written back.
export function sanitizeSvgMarkup(markup) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  doc.querySelectorAll('script').forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    ;[...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on') || ((name === 'href' || name === 'xlink:href') && /^\s*javascript:/i.test(attr.value))) {
        el.removeAttribute(attr.name)
      }
    })
  })
  return new XMLSerializer().serializeToString(doc)
}

// Each top-level <text> element's own textContent, in document order —
// flattening any nested <tspan> runs into one plain string. A typical
// uploaded logo/wordmark's text is simple single-run labels, and editing
// a flattened string is far simpler than preserving a tspan structure
// through a plain text input; a more elaborately tspan'd label just loses
// its internal line/style breaks on first edit, same trade-off a plain
// Text block already makes for rich formatting.
export function extractSvgTexts(markup) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  return [...doc.querySelectorAll('text')].map((el) => el.textContent)
}

export function replaceSvgText(markup, index, newText) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const textEls = doc.querySelectorAll('text')
  const target = textEls[index]
  if (!target) return markup
  target.textContent = newText
  return sanitizeSvgMarkup(new XMLSerializer().serializeToString(doc))
}
