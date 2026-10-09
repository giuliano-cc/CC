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

// Design tools (Illustrator, Figma, ...) commonly write a <text>/<tspan>'s
// font/color onto its `style="..."` attribute instead of (or alongside)
// the equivalent plain SVG presentation attributes (font-family="...") —
// and per the SVG/CSS cascade, `style` always wins over a presentation
// attribute. Reading/writing both keeps this working regardless of which
// one a given uploaded file happens to use.
const STYLE_PROP_BY_KEY = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fill: 'fill',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
}

function parseStyleAttr(styleStr) {
  const out = {}
  ;(styleStr || '').split(';').forEach((decl) => {
    const i = decl.indexOf(':')
    if (i === -1) return
    const key = decl.slice(0, i).trim()
    const value = decl.slice(i + 1).trim()
    if (key && value) out[key] = value
  })
  return out
}

function stringifyStyleAttr(styleObj) {
  return Object.entries(styleObj)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

function readStyleValue(el, style, key) {
  const prop = STYLE_PROP_BY_KEY[key]
  return style[prop] ?? el.getAttribute(prop) ?? null
}

// `null` reads as "not set anywhere" (shown as this app's own inherited/
// default placeholder, same convention block style fields already use);
// fontSize comes back as a plain number of px, bold/italic as booleans.
function readTextStyle(el) {
  const style = parseStyleAttr(el.getAttribute('style'))
  const fontSizeRaw = readStyleValue(el, style, 'fontSize')
  const fontWeightRaw = readStyleValue(el, style, 'fontWeight') || ''
  const fontStyleRaw = readStyleValue(el, style, 'fontStyle') || ''
  return {
    fontFamily: readStyleValue(el, style, 'fontFamily'),
    fontSize: fontSizeRaw ? Math.round(parseFloat(fontSizeRaw)) : null,
    fill: readStyleValue(el, style, 'fill'),
    bold: /^(bold|[6-9]\d\d|1000)$/.test(fontWeightRaw.trim()),
    italic: /italic|oblique/.test(fontStyleRaw),
  }
}

// Writes directly onto the element's own presentation attributes and
// clears the same properties out of its `style` attribute (so the new
// value isn't silently overridden by a leftover `style` declaration);
// a key left out of `patch` is untouched. Also strips any nested
// <tspan>'s own font/color overrides, which otherwise keep winning over
// whatever the parent <text> is now set to — same flattening-to-one-run
// simplification replaceSvgText already makes for a <text>'s content.
function writeTextStyle(el, patch) {
  const style = parseStyleAttr(el.getAttribute('style'))
  function write(key, value) {
    const prop = STYLE_PROP_BY_KEY[key]
    delete style[prop]
    if (value === null || value === undefined) el.removeAttribute(prop)
    else el.setAttribute(prop, value)
  }
  if ('fontFamily' in patch) write('fontFamily', patch.fontFamily || null)
  if ('fontSize' in patch) write('fontSize', patch.fontSize ? `${patch.fontSize}px` : null)
  if ('fill' in patch) write('fill', patch.fill || null)
  if ('bold' in patch) write('fontWeight', patch.bold ? '700' : null)
  if ('italic' in patch) write('fontStyle', patch.italic ? 'italic' : null)
  el.querySelectorAll('tspan').forEach((tspan) => {
    Object.values(STYLE_PROP_BY_KEY).forEach((prop) => tspan.removeAttribute(prop))
    tspan.removeAttribute('style')
  })
  const remaining = stringifyStyleAttr(style)
  if (remaining) el.setAttribute('style', remaining)
  else el.removeAttribute('style')
}

export function getSvgTextStyle(markup, index) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const el = doc.querySelectorAll('text')[index]
  return el ? readTextStyle(el) : null
}

// The "local" (single-text) style control — overrides just this one
// <text>, independent of whatever the "global" control below last set.
export function setSvgTextStyle(markup, index, patch) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const el = doc.querySelectorAll('text')[index]
  if (!el) return markup
  writeTextStyle(el, patch)
  return sanitizeSvgMarkup(new XMLSerializer().serializeToString(doc))
}

// The "global" style control — applies the same patch to every <text> in
// the SVG at once. Each element still ends up with its own independent
// attributes (not a shared reference), so a later per-text edit through
// setSvgTextStyle only ever touches that one element.
export function setAllSvgTextStyles(markup, patch) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  doc.querySelectorAll('text').forEach((el) => writeTextStyle(el, patch))
  return sanitizeSvgMarkup(new XMLSerializer().serializeToString(doc))
}
