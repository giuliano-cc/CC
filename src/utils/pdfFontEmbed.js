// Embeds the app's actual Google Fonts into the exported PDF, so text set
// in e.g. "Merriweather" or "Playfair Display" really is drawn with that
// typeface's own glyphs instead of falling back to jsPDF's three built-in
// core fonts (Helvetica/Times/Courier — see pdfVectorExport.js's
// `pdfFontName`, still used for every OS/system font in
// FONT_FAMILY_OPTIONS, e.g. Arial/Georgia/"Segoe UI", which were never
// loaded as webfonts here in the first place and have no real embeddable
// file to reach for).
//
// jsPDF can only embed a raw TrueType/OpenType program (via
// `addFileToVFS` + `addFont`), never a WOFF2 container — and the actual
// files @fontsource ships (mirroring what index.html's Google Fonts
// `<link>` loads on screen) are WOFF2. `fonteditor-core`'s `woff2` module
// (Google's own woff2 codec, compiled to WASM — loaded from its own
// `.wasm` file, not this package's main bundle) converts one back to a
// plain TTF — no backend, network trick, or manual font conversion step
// required. (An earlier attempt used `wawoff2` instead: same underlying
// codec, but its Emscripten build assumes a Node-only environment and its
// `onRuntimeInitialized` promise silently never resolves once bundled
// for a browser — swapped out rather than chased further.)
import { Font, woff2 } from 'fonteditor-core'
import { FONT_FAMILY_OPTIONS } from './blockTypes'

// `fonteditor-core`'s package.json `exports` map only exposes its main
// entry and `./lib/*` — not `./woff2/woff2.wasm` — so a plain
// `import ... from 'fonteditor-core/woff2/woff2.wasm?url'` is refused by
// a strict-exports bundler (Vite's production build; the dev server is
// more lenient and would accept it, which would only mean this quietly
// works in dev and breaks on build). Resolving it as a filesystem URL
// instead sidesteps the package's own export restrictions entirely — it
// isn't a module resolution at all, just "where does this file already
// installed on disk live", which Vite still turns into a proper
// versioned/copied build asset like any other `?url` import.
const woff2WasmUrl = new URL('../../node_modules/fonteditor-core/woff2/woff2.wasm', import.meta.url).href

const woff2Ready = woff2.init(woff2WasmUrl)

import ebGaramondNormal from '@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2?url'
import ebGaramondBold from '@fontsource/eb-garamond/files/eb-garamond-latin-700-normal.woff2?url'
import ebGaramondItalic from '@fontsource/eb-garamond/files/eb-garamond-latin-400-italic.woff2?url'
import ebGaramondBoldItalic from '@fontsource/eb-garamond/files/eb-garamond-latin-700-italic.woff2?url'

import figtreeNormal from '@fontsource/figtree/files/figtree-latin-400-normal.woff2?url'
import figtreeBold from '@fontsource/figtree/files/figtree-latin-700-normal.woff2?url'
import figtreeItalic from '@fontsource/figtree/files/figtree-latin-400-italic.woff2?url'
import figtreeBoldItalic from '@fontsource/figtree/files/figtree-latin-700-italic.woff2?url'

import ibmPlexSansNormal from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2?url'
import ibmPlexSansBold from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2?url'
import ibmPlexSansItalic from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-italic.woff2?url'
import ibmPlexSansBoldItalic from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-italic.woff2?url'

import ibmPlexMonoNormal from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url'
import ibmPlexMonoBold from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2?url'
import ibmPlexMonoItalic from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-italic.woff2?url'
import ibmPlexMonoBoldItalic from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-italic.woff2?url'

import loraNormal from '@fontsource/lora/files/lora-latin-400-normal.woff2?url'
import loraBold from '@fontsource/lora/files/lora-latin-700-normal.woff2?url'
import loraItalic from '@fontsource/lora/files/lora-latin-400-italic.woff2?url'
import loraBoldItalic from '@fontsource/lora/files/lora-latin-700-italic.woff2?url'

import merriweatherNormal from '@fontsource/merriweather/files/merriweather-latin-400-normal.woff2?url'
import merriweatherBold from '@fontsource/merriweather/files/merriweather-latin-700-normal.woff2?url'
import merriweatherItalic from '@fontsource/merriweather/files/merriweather-latin-400-italic.woff2?url'
import merriweatherBoldItalic from '@fontsource/merriweather/files/merriweather-latin-700-italic.woff2?url'

import playfairDisplayNormal from '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2?url'
import playfairDisplayBold from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url'
import playfairDisplayItalic from '@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2?url'
import playfairDisplayBoldItalic from '@fontsource/playfair-display/files/playfair-display-latin-700-italic.woff2?url'

import sourceSans3Normal from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2?url'
import sourceSans3Bold from '@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff2?url'
import sourceSans3Italic from '@fontsource/source-sans-3/files/source-sans-3-latin-400-italic.woff2?url'
import sourceSans3BoldItalic from '@fontsource/source-sans-3/files/source-sans-3-latin-700-italic.woff2?url'

import poppinsNormal from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url'
import poppinsBold from '@fontsource/poppins/files/poppins-latin-700-normal.woff2?url'
import poppinsItalic from '@fontsource/poppins/files/poppins-latin-400-italic.woff2?url'
import poppinsBoldItalic from '@fontsource/poppins/files/poppins-latin-700-italic.woff2?url'

import robotoNormal from '@fontsource/roboto/files/roboto-latin-400-normal.woff2?url'
import robotoBold from '@fontsource/roboto/files/roboto-latin-700-normal.woff2?url'
import robotoItalic from '@fontsource/roboto/files/roboto-latin-400-italic.woff2?url'
import robotoBoldItalic from '@fontsource/roboto/files/roboto-latin-700-italic.woff2?url'

import interNormal from '@fontsource/inter/files/inter-latin-400-normal.woff2?url'
import interBold from '@fontsource/inter/files/inter-latin-700-normal.woff2?url'
import interItalic from '@fontsource/inter/files/inter-latin-400-italic.woff2?url'
import interBoldItalic from '@fontsource/inter/files/inter-latin-700-italic.woff2?url'

// Google's own metric-compatible clones of Arial/Times New Roman/Courier
// New/Georgia (see the comment on FONT_FAMILY_OPTIONS in blockTypes.js) —
// embedded under those options' own labels below, so picking "Arial" (or
// "Segoe UI", "Times New Roman", "Courier New", "Georgia"/"Georgia
// (serif)") gets a real embedded file too, not just the plain
// Helvetica/Times/Courier category fallback.
import arimoNormal from '@fontsource/arimo/files/arimo-latin-400-normal.woff2?url'
import arimoBold from '@fontsource/arimo/files/arimo-latin-700-normal.woff2?url'
import arimoItalic from '@fontsource/arimo/files/arimo-latin-400-italic.woff2?url'
import arimoBoldItalic from '@fontsource/arimo/files/arimo-latin-700-italic.woff2?url'

import tinosNormal from '@fontsource/tinos/files/tinos-latin-400-normal.woff2?url'
import tinosBold from '@fontsource/tinos/files/tinos-latin-700-normal.woff2?url'
import tinosItalic from '@fontsource/tinos/files/tinos-latin-400-italic.woff2?url'
import tinosBoldItalic from '@fontsource/tinos/files/tinos-latin-700-italic.woff2?url'

import cousineNormal from '@fontsource/cousine/files/cousine-latin-400-normal.woff2?url'
import cousineBold from '@fontsource/cousine/files/cousine-latin-700-normal.woff2?url'
import cousineItalic from '@fontsource/cousine/files/cousine-latin-400-italic.woff2?url'
import cousineBoldItalic from '@fontsource/cousine/files/cousine-latin-700-italic.woff2?url'

import gelasioNormal from '@fontsource/gelasio/files/gelasio-latin-400-normal.woff2?url'
import gelasioBold from '@fontsource/gelasio/files/gelasio-latin-700-normal.woff2?url'
import gelasioItalic from '@fontsource/gelasio/files/gelasio-latin-400-italic.woff2?url'
import gelasioBoldItalic from '@fontsource/gelasio/files/gelasio-latin-700-italic.woff2?url'

// Keyed by FONT_FAMILY_OPTIONS' own `label` (not the raw CSS `value`,
// which carries quotes/fallback stacks that are easy to mismatch) — every
// label here is one this app actually loads as a webfont in index.html.
// "Segoe UI"/Arial/Georgia/"Georgia (serif)"/"Times New Roman"/"Courier
// New" reuse Arimo/Gelasio/Tinos/Cousine, Google's own metric-compatible
// clones of those system typefaces (see the comment on FONT_FAMILY_OPTIONS
// in blockTypes.js) — every option now has a real embeddable file; only a
// family that somehow isn't in this map at all still falls back to the
// plain Helvetica/Times/Courier category mapping in pdfVectorExport.js.
const FONT_EMBED_FILES = {
  'EB Garamond': { normal: ebGaramondNormal, bold: ebGaramondBold, italic: ebGaramondItalic, bolditalic: ebGaramondBoldItalic },
  Figtree: { normal: figtreeNormal, bold: figtreeBold, italic: figtreeItalic, bolditalic: figtreeBoldItalic },
  'IBM Plex Sans': { normal: ibmPlexSansNormal, bold: ibmPlexSansBold, italic: ibmPlexSansItalic, bolditalic: ibmPlexSansBoldItalic },
  'IBM Plex Mono': { normal: ibmPlexMonoNormal, bold: ibmPlexMonoBold, italic: ibmPlexMonoItalic, bolditalic: ibmPlexMonoBoldItalic },
  Lora: { normal: loraNormal, bold: loraBold, italic: loraItalic, bolditalic: loraBoldItalic },
  Merriweather: { normal: merriweatherNormal, bold: merriweatherBold, italic: merriweatherItalic, bolditalic: merriweatherBoldItalic },
  'Playfair Display': { normal: playfairDisplayNormal, bold: playfairDisplayBold, italic: playfairDisplayItalic, bolditalic: playfairDisplayBoldItalic },
  'Source Sans 3': { normal: sourceSans3Normal, bold: sourceSans3Bold, italic: sourceSans3Italic, bolditalic: sourceSans3BoldItalic },
  Poppins: { normal: poppinsNormal, bold: poppinsBold, italic: poppinsItalic, bolditalic: poppinsBoldItalic },
  Roboto: { normal: robotoNormal, bold: robotoBold, italic: robotoItalic, bolditalic: robotoBoldItalic },
  Inter: { normal: interNormal, bold: interBold, italic: interItalic, bolditalic: interBoldItalic },
  'Segoe UI': { normal: arimoNormal, bold: arimoBold, italic: arimoItalic, bolditalic: arimoBoldItalic },
  Arial: { normal: arimoNormal, bold: arimoBold, italic: arimoItalic, bolditalic: arimoBoldItalic },
  Georgia: { normal: gelasioNormal, bold: gelasioBold, italic: gelasioItalic, bolditalic: gelasioBoldItalic },
  'Georgia (serif)': { normal: gelasioNormal, bold: gelasioBold, italic: gelasioItalic, bolditalic: gelasioBoldItalic },
  'Times New Roman': { normal: tinosNormal, bold: tinosBold, italic: tinosItalic, bolditalic: tinosBoldItalic },
  'Courier New': { normal: cousineNormal, bold: cousineBold, italic: cousineItalic, bolditalic: cousineBoldItalic },
}

// `label -> Set of styles` successfully registered on the jsPDF instance
// `registerEmbeddedFonts` was last called with — VFS registration
// (`addFileToVFS`/`addFont`) is per-instance jsPDF state, and a fresh
// `new jsPDF()` is created for every export, so this (unlike
// `fontDataCache` below) can't be a do-it-once cache; it just records
// what's usable on the *current* instance so `resolveEmbeddedFont` knows
// what to fall back from.
const registeredStyles = new Map()

// `url -> base64 TTF`, the one part that's genuinely safe to do once per
// browser session — the network fetch + WASM decompression, independent
// of which jsPDF instance it ends up registered on.
const fontDataCache = new Map()

async function decompressToBase64(url) {
  if (fontDataCache.has(url)) return fontDataCache.get(url)
  await woff2Ready
  const res = await fetch(url)
  const font = Font.create(await res.arrayBuffer(), { type: 'woff2' })
  const ttf = font.write({ type: 'ttf', hinting: true })
  const bytes = new Uint8Array(ttf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const base64 = btoa(binary)
  fontDataCache.set(url, base64)
  return base64
}

// Fetches + decompresses every embeddable font (cached after the first
// call) and registers each into `pdf`'s own VFS — needed again on every
// call since each export gets a fresh jsPDF instance. Never rejects: a
// family/style that fails to load just isn't added to `registeredStyles`,
// and callers fall back to the category mapping for it.
export async function registerEmbeddedFonts(pdf) {
  registeredStyles.clear()
  await Promise.all(
    Object.entries(FONT_EMBED_FILES).flatMap(([label, styles]) =>
      Object.entries(styles).map(async ([style, url]) => {
        try {
          const base64 = await decompressToBase64(url)
          const filename = `${label.replace(/\s+/g, '')}-${style}.ttf`
          pdf.addFileToVFS(filename, base64)
          pdf.addFont(filename, label, style)
          if (!registeredStyles.has(label)) registeredStyles.set(label, new Set())
          registeredStyles.get(label).add(style)
        } catch {
          // Left unregistered — resolveEmbeddedFont falls back below.
        }
      }),
    ),
  )
}

// The registered PDF font name + style for (fontFamilyValue, bold,
// italic), or null if this isn't one of the embeddable families (falls
// back to the Helvetica/Times/Courier category mapping) or its files
// haven't finished registering. Falls back to the family's own "normal"
// style rather than giving up the real typeface entirely when the exact
// bold/italic combination didn't register (e.g. no italic cut exists).
export function resolveEmbeddedFont(fontFamilyValue, style) {
  const label = FONT_FAMILY_OPTIONS.find((f) => f.value === fontFamilyValue)?.label
  if (!label || !FONT_EMBED_FILES[label]) return null
  const styles = registeredStyles.get(label)
  if (!styles) return null
  if (styles.has(style)) return { name: label, style }
  if (styles.has('normal')) return { name: label, style: 'normal' }
  return null
}
