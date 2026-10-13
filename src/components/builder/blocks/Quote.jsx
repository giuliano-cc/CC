import { displayText, resolveBodyFont, textStyleClasses, typographyStyle } from './shared'

// Quote block's decorative “/” marks sit near the top of their own line
// box in every font (confirmed by measuring the two characters' real ink
// extent) — meaning most of a line-height:1 box is empty space BELOW the
// ink, not above it. A fixed px gap pulled from the box's edge (the
// naive approach) therefore reads very differently depending on which
// edge of the box that gap is measured from: pulling the opening mark's
// *bottom* toward the text below leaves most of that dead space still
// between the ink and the text, while pulling the closing mark's *top*
// toward the text above barely needs any compensation, since the ink
// already sits right at that edge. Reading the browser's own real font
// metrics (not a guessed percentage) gives the exact dead-space amount on
// each side, for whatever font/size the block actually uses — anything
// moving the actual <canvas> 2D context's measureText() call.
let _quoteMarkMeasureCanvas = null
function quoteMarkInkMetrics(fontFamily, fontSizePx) {
  try {
    if (!_quoteMarkMeasureCanvas) _quoteMarkMeasureCanvas = document.createElement('canvas')
    const ctx = _quoteMarkMeasureCanvas.getContext('2d')
    ctx.font = `${fontSizePx}px ${fontFamily}`
    const m = ctx.measureText('“')
    if (typeof m.fontBoundingBoxAscent !== 'number') return null // not supported in this browser
    return {
      fontAscent: m.fontBoundingBoxAscent,
      fontDescent: m.fontBoundingBoxDescent,
      inkAscent: m.actualBoundingBoxAscent,
      inkDescent: m.actualBoundingBoxDescent,
    }
  } catch {
    return null
  }
}

export default function renderQuoteBlock({ block, globalStyle, resolvedContent, library }) {
  const resolvedAuthor = block.authorSlot ? library[block.authorSlot] || '' : block.author
  // Decorative open/close quotation marks, oversized and dimmed so
  // they read as ornamental punctuation rather than more text — off
  // by default (see Quote's defaultProps), since not every quote style
  // wants them.
  // Each mark is its OWN line, above/below the quote — not inlined
  // into the first/last line of text. Inlining them (the previous
  // approach) made just that one line's line-box grow to the mark's
  // oversized height, breaking the even line-to-line spacing every
  // other line in the paragraph has; it also never fully escaped
  // clipping against the block's own fixed-height, overflow-hidden
  // box (an italic glyph in particular paints past its own layout box
  // — invisible to a bounding-rect check, but still visibly clipped).
  // A mark on its own block-level line has no such interaction with
  // the paragraph's line-height at all, and `fontStyle: 'normal'`
  // keeps it upright regardless of the block's own italic setting,
  // since it's ornamental punctuation, not part of the quoted text.
  // A plain numeric size (em, relative to the block's own font-size)
  // instead of named presets — simpler to reason about, and lets
  // someone dial in exactly how big they want it instead of picking
  // from two fixed steps. `block.quoteMarkSize` may still hold the
  // older 'L'/'XL' preset strings from before this changed; mapped
  // to their old numeric values so an existing document's marks
  // don't jump to a different size.
  const legacyMarkSizes = { L: 1.6, XL: 3.2 }
  const markSizeEm =
    typeof block.quoteMarkSize === 'number' ? block.quoteMarkSize : legacyMarkSizes[block.quoteMarkSize] ?? 1.6
  // The gap above/below the quote is sized off the *body* text's own
  // font size, not the mark's own (much bigger) one — a negative
  // margin pulling each mark about half a body line closer to the
  // quote, however big the mark itself is drawn.
  const bodyFontSizePx = block.fontSize || globalStyle.typographyScale?.p1?.sizePx || 14
  const markGapPx = Math.round(bodyFontSizePx * 0.75)
  // Both “ and ” sit near the TOP of their own line box in every
  // font — most of a line-height:1 box is empty space below the ink,
  // not above it. That's exactly what makes the same pull asymmetric
  // in practice: the closing mark's box-top (what marginTop pulls
  // toward the text above) sits right where its ink already is, so a
  // small pull reads as tight — but the opening mark's box-BOTTOM
  // (what marginBottom pulls toward the text below) is on the empty
  // side, far from where its ink actually sits, so the same small
  // pull leaves a visibly bigger gap. Reading the real font metrics
  // (via a hidden <canvas> measureText call) gives the exact dead-
  // space on each side for whatever font/size this block actually
  // uses, rather than a guessed percentage that only happened to
  // look right at one particular size.
  const markFontSizePx = markSizeEm * bodyFontSizePx
  const inkMetrics = quoteMarkInkMetrics(block.fontFamily || resolveBodyFont(globalStyle), markFontSizePx)
  // The paragraph's own first line also carries some "half-leading"
  // above it (extra space line-height adds beyond the font's own
  // metrics, split evenly above/below the text) — measured
  // empirically rather than derived, since it depends on the body
  // text's own line-height, not the mark's. It only meaningfully
  // affects the opening side: the closing mark pulls from the
  // bottom of the *last* line, where that same extra space already
  // sits between the text and where the mark lands, rather than
  // adding more on top of it.
  const paragraphLeadingPx = Math.round(bodyFontSizePx * 0.6)
  const openMarkGapPx = Math.round(
    markGapPx +
      paragraphLeadingPx +
      Math.max(0, inkMetrics ? inkMetrics.fontDescent - inkMetrics.inkDescent : markFontSizePx * 0.3),
  )
  const closeMarkGapPx = Math.round(
    markGapPx + Math.max(0, inkMetrics ? inkMetrics.fontAscent - inkMetrics.inkAscent : 0),
  )
  const quoteMarkStyle = {
    fontSize: `${markSizeEm}em`,
    lineHeight: 1,
    fontStyle: 'normal',
    color: globalStyle.primaryColor,
    opacity: 0.45,
  }
  // `showBorder` (default true) toggles just the border-related
  // classes/color — `pl-3` stays either way, so hiding the bar
  // doesn't also yank the text back out to the block's own edge.
  const showBorder = block.showBorder !== false
  return (
    <blockquote
      className={`${showBorder ? 'border-l-4' : ''} pl-3 text-sm ${textStyleClasses(block)}`}
      style={{
        borderColor: showBorder ? globalStyle.primaryColor : undefined,
        ...typographyStyle(block, resolveBodyFont(globalStyle), globalStyle.typographyScale?.p1?.sizePx),
      }}
    >
      {block.showQuoteMarks && (
        <div aria-hidden="true" style={{ ...quoteMarkStyle, marginBottom: `-${openMarkGapPx}px` }} className="text-left">
          “
        </div>
      )}
      <p>{displayText(resolvedContent, block)}</p>
      {block.showQuoteMarks && (
        <div aria-hidden="true" style={{ ...quoteMarkStyle, marginTop: `-${closeMarkGapPx}px` }} className="text-right">
          ”
        </div>
      )}
      {resolvedAuthor && (
        <footer className="mt-1.5 text-xs not-italic" style={{ color: globalStyle.primaryColor }}>
          — {resolvedAuthor}
        </footer>
      )}
    </blockquote>
  )
}
