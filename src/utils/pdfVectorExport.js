// Generates the exported PDF as real vector content — actual PDF text
// operators and drawing primitives, not a screenshot of the DOM (see the
// old `pdfExport.js`, now unused, which rasterized each page via
// html2canvas). That means: selectable/searchable/copyable text, crisp at
// any zoom or print size, and a file that's mostly text (kilobytes, not a
// full-page PNG per page).
//
// The trade-off: jsPDF's core fonts are Helvetica/Times/Courier only (no
// embedding of the app's actual Google Fonts, which would mean fetching
// and converting each one's binary at export time). Every font in
// FONT_FAMILY_OPTIONS is mapped to the nearest of the three by its own
// `category` (serif/sans-serif/monospace) — the weight/style (bold,
// italic) and every size/color/spacing/alignment/wrap still match the
// editor exactly, just not the exact typeface.
//
// Block positions (x/y/width/height) are already stored in the same pixel
// space as the sheet (SHEET_WIDTH/SHEET_HEIGHT, see utils/layout.js), and
// jsPDF's 'px' unit uses that same 96dpi CSS pixel — so a block's
// coordinates need no conversion at all, only its *content* needs a real
// (if small) layout engine: wrapping text to the block's width and
// stacking each line/entry/list item vertically, since nested blocks
// (inside a Columns block) have no explicit position of their own — they
// flow one below the previous, exactly like the browser's own flexbox
// layout in BlockRenderer.jsx.
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import {
  BLOCK_TYPES,
  FONT_FAMILY_OPTIONS,
  HEADING_SIZE_PX,
} from './blockTypes'
import { CONTENT_SLOTS } from '../context/ContentLibraryContext'
import { parseChecklist, parseEntries, parseLanguages, sortEntriesByDate } from './contentLists'
import { getPlatformMeta, parseSocialLinks } from './socialIcons'
import { SHEET_HEIGHT, SHEET_WIDTH } from './layout'

// ---------------------------------------------------------------------
// Color / font helpers
// ---------------------------------------------------------------------

const SLATE = {
  200: [226, 232, 240],
  300: [203, 213, 225],
  400: [148, 163, 184],
  500: [100, 116, 139],
  600: [71, 85, 105],
  700: [51, 65, 85],
}

function hexToRgb(hex, fallback = [15, 23, 42]) {
  if (!hex) return fallback
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return fallback
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

const PDF_FONT_BY_CATEGORY = { serif: 'times', 'sans-serif': 'helvetica', monospace: 'courier' }

function fontCategory(fontFamilyValue) {
  return FONT_FAMILY_OPTIONS.find((f) => f.value === fontFamilyValue)?.category || 'sans-serif'
}

function pdfFontName(fontFamilyValue) {
  return PDF_FONT_BY_CATEGORY[fontCategory(fontFamilyValue)] || 'helvetica'
}

function pdfFontStyle(bold, italic) {
  if (bold && italic) return 'bolditalic'
  if (bold) return 'bold'
  if (italic) return 'italic'
  return 'normal'
}

function setFont(pdf, fontFamilyValue, { bold = false, italic = false, sizePx }) {
  pdf.setFont(pdfFontName(fontFamilyValue), pdfFontStyle(bold, italic))
  if (sizePx) pdf.setFontSize(sizePx)
}

function setTextColor(pdf, hex, fallback) {
  pdf.setTextColor(...hexToRgb(hex, fallback))
}

function setFillColor(pdf, hex, fallback) {
  pdf.setFillColor(...hexToRgb(hex, fallback))
}

function setDrawColor(pdf, hex, fallback) {
  pdf.setDrawColor(...hexToRgb(hex, fallback))
}

function resolveTitleFont(globalStyle) {
  return globalStyle.titleFontFamily || globalStyle.fontFamily || ''
}
function resolveBodyFont(globalStyle) {
  return globalStyle.bodyFontFamily || globalStyle.fontFamily || ''
}

// ---------------------------------------------------------------------
// Text transform (mirrors textStyleClasses/displayText in BlockRenderer.jsx
// — CSS text-transform/font-variant have no PDF equivalent, so every
// transform is applied to the actual string instead)
// ---------------------------------------------------------------------

const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of',
  'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'vs', 'via',
])

function toTitleCase(text) {
  const tokens = text.split(/(\s+)/)
  const wordIndexes = tokens.map((t, i) => (i % 2 === 0 && t ? i : -1)).filter((i) => i !== -1)
  const lastWordToken = wordIndexes[wordIndexes.length - 1]
  return tokens
    .map((token, i) => {
      if (i % 2 === 1 || !token) return token
      const lower = token.toLowerCase()
      const isEdge = i === wordIndexes[0] || i === lastWordToken
      if (!isEdge && TITLE_CASE_MINOR_WORDS.has(lower)) return lower
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
    })
    .join('')
}

function applyTextTransform(text, transform) {
  if (!text) return text
  // 'smallCaps' has no true PDF equivalent (mixed-size capitals) without a
  // dedicated font — uppercase is the closest plain-text approximation.
  if (transform === 'uppercase' || transform === 'smallCaps') return text.toUpperCase()
  if (transform === 'titleCase') return toTitleCase(text)
  if (transform === 'startCase') return text.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))
  return text
}

// ---------------------------------------------------------------------
// Layout primitives — everything below draws starting at a top-left
// (x, y) and returns the height (px) it consumed, so a caller stacking
// several of these vertically (a Columns column, an Experience entry's
// title+subtitle+description, a Chart's rows, ...) knows where the next
// one starts.
// ---------------------------------------------------------------------

// Wraps `rawText` to `width` and draws it line by line, applying the
// block's own text-transform first. `lineHeightMult` matches the Tailwind
// leading-* class the on-screen version uses (1.625 for "leading-relaxed",
// ~1.25 for tight headings).
function drawParagraph(pdf, rawText, { x, y, width, align = 'left', lineHeightMult = 1.5 }) {
  const text = rawText ?? ''
  if (!text.trim()) return 0
  const fontSize = pdf.getFontSize()
  const lines = pdf.splitTextToSize(text, Math.max(10, width))
  const lineHeight = fontSize * lineHeightMult
  let cursorY = y + fontSize * 0.85
  lines.forEach((line) => {
    const drawX = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x
    pdf.text(line, drawX, cursorY, { align })
    cursorY += lineHeight
  })
  return lines.length * lineHeight
}

// A bulleted/numbered list: the marker sits on the first wrapped line of
// each item, continuation lines indent to match (mirrors the browser's
// `pl-5` list padding).
function drawList(pdf, items, { x, y, width, ordered = false, lineHeightMult = 1.625, indent = 16 }) {
  let cursorY = y
  items.forEach((item, i) => {
    const fontSize = pdf.getFontSize()
    const marker = ordered ? `${i + 1}.` : '•'
    pdf.text(marker, x, cursorY + fontSize * 0.85)
    cursorY += drawParagraph(pdf, item, { x: x + indent, y: cursorY, width: width - indent, lineHeightMult })
  })
  return cursorY - y
}

// A section-title line (Contact Info/Leisure/Experience/Education/chart
// title, or a Heading) with its optional underline rule — mirrors
// sectionTitleStyle + the "border-b" class in BlockRenderer.jsx.
function drawSectionTitle(pdf, text, { x, y, width, sizePx, color, fontFamily, rule, align = 'left' }) {
  if (!text) return 0
  setFont(pdf, fontFamily, { bold: true, sizePx })
  setTextColor(pdf, color)
  const height = drawParagraph(pdf, text, { x, y, width, align, lineHeightMult: 1.25 })
  let consumed = height + 6 // pb-1.5 (~6px)
  if (rule !== false) {
    setDrawColor(pdf, '#e2e8f0', SLATE[200])
    pdf.setLineWidth(1)
    pdf.line(x, y + consumed, x + width, y + consumed)
    consumed += 1
  }
  return consumed + 8 // gap below the title before the next element
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function imageFormatFromSrc(src) {
  const m = /^data:image\/(png|jpe?g|webp);/i.exec(src)
  if (m) return m[1].toUpperCase().replace('JPG', 'JPEG')
  return src.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG'
}

// ---------------------------------------------------------------------
// Content resolution (mirrors useResolvedContent / library lookups in
// BlockRenderer.jsx)
// ---------------------------------------------------------------------

function resolveContent(block, library) {
  if (block.contentSlot && block.contentSlot in library) return library[block.contentSlot]
  return block.content
}

// ---------------------------------------------------------------------
// Per-block-type drawing — each returns the height (px) it consumed.
// `ctx` carries { x, y, width, globalStyle, library }; `ctx.height` is
// only present for a top-level (absolute) block and is otherwise
// advisory (content is free to run past it, exactly as it would in the
// browser when a box hasn't been resized to fit its own content).
// ---------------------------------------------------------------------

async function drawBlock(pdf, block, ctx) {
  const { x, y, width, globalStyle, library } = ctx
  switch (block.type) {
    case BLOCK_TYPES.HEADER: {
      const content = applyTextTransform(resolveContent(block, library), block.textTransform)
      setFont(pdf, resolveBodyFont(globalStyle), { bold: block.bold, italic: block.italic, sizePx: 18 })
      setTextColor(pdf, globalStyle.textColor)
      const h = drawParagraph(pdf, content, { x, y, width, align: block.align, lineHeightMult: 1.3 })
      setDrawColor(pdf, '#e2e8f0', SLATE[200])
      pdf.setLineWidth(1)
      pdf.line(x, y + h + 12, x + width, y + h + 12)
      return h + 13
    }

    case BLOCK_TYPES.CV_HEADER: {
      const isStacked = block.layout === 'stacked'
      const resolvedName = block.nameSlot ? library[block.nameSlot] ?? '' : block.name
      const resolvedContacts = block.contactsSlot
        ? (library[block.contactsSlot] || '').split('\n').filter(Boolean)
        : block.contacts
      const resolvedUsp = block.uspSlot ? library[block.uspSlot] || '' : block.usp
      const leftWidth = isStacked ? width : width * 0.6

      setFont(pdf, resolveTitleFont(globalStyle), { bold: true, sizePx: 18 })
      setTextColor(pdf, block.color, hexToRgb(globalStyle.textColor))
      let leftH = drawParagraph(pdf, resolvedName, { x, y, width: leftWidth, lineHeightMult: 1.25 })

      if (block.role) {
        setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 14 })
        setTextColor(pdf, null, SLATE[500])
        leftH += drawParagraph(pdf, block.role, { x, y: y + leftH, width: leftWidth, lineHeightMult: 1.3 })
      }
      if (resolvedUsp) {
        setFont(pdf, resolveBodyFont(globalStyle), { italic: true, sizePx: 14 })
        setTextColor(pdf, null, SLATE[600])
        leftH += 4 + drawParagraph(pdf, resolvedUsp, { x, y: y + leftH + 4, width: leftWidth, lineHeightMult: 1.4 })
      }

      let rightH = 0
      if (resolvedContacts?.length > 0) {
        setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 12 })
        setTextColor(pdf, null, SLATE[500])
        const rightX = isStacked ? x : x + width - leftWidth
        const rightWidth = isStacked ? width : width - leftWidth
        const align = isStacked ? 'right' : 'right'
        if (isStacked) {
          resolvedContacts.forEach((c) => {
            rightH += drawParagraph(pdf, c, { x: rightX, y: y + rightH, width: rightWidth, align, lineHeightMult: 1.4 })
          })
        } else {
          // A single wrapped, right-aligned line — matches the row layout's
          // wrapping contacts, close enough without a full flex-wrap engine.
          rightH = drawParagraph(pdf, resolvedContacts.join('   '), {
            x: rightX,
            y,
            width: rightWidth,
            align,
            lineHeightMult: 1.4,
          })
        }
      }

      const h = Math.max(leftH, rightH)
      setDrawColor(pdf, '#e2e8f0', SLATE[200])
      pdf.setLineWidth(1)
      pdf.line(x, y + h + 14, x + width, y + h + 14)
      return h + 15
    }

    case BLOCK_TYPES.HEADING: {
      const content = applyTextTransform(resolveContent(block, library), block.textTransform)
      const sizePx = block.fontSize || HEADING_SIZE_PX[block.size] || HEADING_SIZE_PX.md
      setFont(pdf, block.fontFamily || resolveTitleFont(globalStyle), { bold: block.bold, italic: block.italic, sizePx })
      setTextColor(pdf, block.color || globalStyle.primaryColor)
      const h = drawParagraph(pdf, content, { x, y, width, align: block.align, lineHeightMult: 1.25 })
      if (block.rule) {
        setDrawColor(pdf, '#e2e8f0', SLATE[200])
        pdf.setLineWidth(1)
        pdf.line(x, y + h + 6, x + width, y + h + 6)
        return h + 7
      }
      return h
    }

    case BLOCK_TYPES.TEXT: {
      const boundSlot = block.contentSlot ? CONTENT_SLOTS.find((s) => s.key === block.contentSlot) : null
      const title = block.showTitle === true && boundSlot?.label ? boundSlot.label : null
      const bodyFont = resolveBodyFont(globalStyle)
      let cursorY = y

      if (title) {
        cursorY += drawSectionTitle(pdf, title, {
          x,
          y: cursorY,
          width,
          sizePx: block.titleFontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md,
          color: block.titleColor || globalStyle.primaryColor,
          fontFamily: resolveTitleFont(globalStyle),
          rule: block.titleRule,
        })
      }

      if (boundSlot?.type === 'entries') {
        const items = parseEntries(library[`${boundSlot.key}Items`], library[boundSlot.key])
        items.forEach((item) => {
          if (item.title) {
            setFont(pdf, resolveTitleFont(globalStyle), { bold: true, sizePx: 16 })
            setTextColor(pdf, null, hexToRgb(globalStyle.textColor))
            cursorY += drawParagraph(pdf, item.title, { x, y: cursorY, width, lineHeightMult: 1.3 })
          }
          const subLine = [item.subtitle, item.location].filter((v) => v?.trim()).join(', ')
          if (subLine) {
            setFont(pdf, bodyFont, { sizePx: 14 })
            setTextColor(pdf, null, SLATE[500])
            cursorY += drawParagraph(pdf, subLine, { x, y: cursorY, width, lineHeightMult: 1.3 })
          }
          if (item.description) {
            setFont(pdf, bodyFont, { sizePx: 14 })
            setTextColor(pdf, null, SLATE[600])
            cursorY += drawParagraph(pdf, item.description, { x, y: cursorY, width, lineHeightMult: 1.5 })
          }
          cursorY += 10
        })
        return cursorY - y
      }

      setFont(pdf, block.fontFamily || bodyFont, {
        bold: block.bold,
        italic: block.italic,
        sizePx: block.fontSize || 14,
      })
      setTextColor(pdf, block.color, hexToRgb(globalStyle.textColor))
      const content = applyTextTransform(resolveContent(block, library), block.textTransform)

      if (block.list) {
        const items = (content || '').split('\n').filter(Boolean).map((l) => applyTextTransform(l, block.textTransform))
        cursorY += drawList(pdf, items, { x, y: cursorY, width, ordered: block.ordered, lineHeightMult: 1.625 })
      } else {
        cursorY += drawParagraph(pdf, content, { x, y: cursorY, width, align: block.align, lineHeightMult: 1.625 })
      }
      return cursorY - y
    }

    case BLOCK_TYPES.IMAGE: {
      const resolvedSrc = block.imageSlot ? library[block.imageSlot] || '' : block.src
      if (!resolvedSrc) return 0
      try {
        const img = await loadImage(resolvedSrc)
        const format = imageFormatFromSrc(resolvedSrc)
        const isCircle = block.shape === 'circle'
        const boxW = ctx.height ? width : width
        const boxH = ctx.height || width
        const boxSize = isCircle ? Math.min(boxW, boxH) : null
        const drawW = isCircle ? boxSize : boxW
        const drawH = isCircle ? boxSize : boxH
        const offsetX = block.align === 'center' ? (width - drawW) / 2 : block.align === 'right' ? width - drawW : 0

        // "object-fit: cover" — scale the source image up so it fully
        // covers the target box on both axes, then center-crop by only
        // drawing the box-sized window (via a clip path for a circle,
        // or by shrinking the drawn image rect to (drawW, drawH) for a
        // rectangle, which addImage already does without distortion since
        // we compute the same aspect-preserving scale ourselves below).
        const scale = Math.max(drawW / img.naturalWidth, drawH / img.naturalHeight)
        const scaledW = img.naturalWidth * scale
        const scaledH = img.naturalHeight * scale
        const imgX = x + offsetX - (scaledW - drawW) / 2
        const imgY = y - (scaledH - drawH) / 2

        pdf.saveGraphicsState()
        if (isCircle) {
          pdf.ellipse(x + offsetX + drawW / 2, y + drawH / 2, drawW / 2, drawH / 2, null)
        } else {
          pdf.rect(x + offsetX, y, drawW, drawH, null)
        }
        pdf.clip()
        pdf.discardPath()
        pdf.addImage(img, format, imgX, imgY, scaledW, scaledH)
        pdf.restoreGraphicsState()
        return drawH
      } catch {
        // Unreadable/broken image source — skip silently, same as the
        // browser showing nothing rather than a broken layout.
        return 0
      }
    }

    case BLOCK_TYPES.DIVIDER: {
      const isVertical = block.orientation === 'vertical'
      const thickness = block.thickness ?? 1
      setDrawColor(pdf, block.color, SLATE[200])
      pdf.setLineWidth(thickness)
      pdf.setLineDashPattern(
        block.lineStyle === 'dashed' ? [thickness * 3, thickness * 2] : block.lineStyle === 'dotted' ? [thickness, thickness * 1.5] : [],
        0,
      )
      if (isVertical) {
        pdf.line(x + width / 2, y, x + width / 2, y + (ctx.height || 20))
      } else {
        pdf.line(x, y + (ctx.height || 20) / 2, x + width, y + (ctx.height || 20) / 2)
      }
      pdf.setLineDashPattern([], 0)
      return ctx.height || 20
    }

    case BLOCK_TYPES.SHAPE: {
      const h = ctx.height || 100
      const isCircleShape = block.shape === 'circle'
      pdf.saveGraphicsState()
      if (block.opacity !== undefined && block.opacity < 1) {
        pdf.setGState(new pdf.GState({ opacity: block.opacity }))
      }
      const drawStyle = block.color ? (block.borderWidth ? 'FD' : 'F') : block.borderWidth ? 'S' : null
      if (drawStyle) {
        if (block.color) setFillColor(pdf, block.color, [226, 232, 240])
        if (block.borderWidth) {
          setDrawColor(pdf, block.borderColor, [148, 163, 184])
          pdf.setLineWidth(block.borderWidth)
        }
        if (isCircleShape) {
          pdf.ellipse(x + width / 2, y + h / 2, width / 2, h / 2, drawStyle)
        } else if (block.borderRadius) {
          pdf.roundedRect(x, y, width, h, block.borderRadius, block.borderRadius, drawStyle)
        } else {
          pdf.rect(x, y, width, h, drawStyle)
        }
      }
      pdf.restoreGraphicsState()
      return h
    }

    case BLOCK_TYPES.QUOTE: {
      const resolvedAuthor = block.authorSlot ? library[block.authorSlot] || '' : block.author
      const content = applyTextTransform(resolveContent(block, library), block.textTransform)
      const barX = x
      const textX = x + 12
      const textWidth = width - 12
      setFont(pdf, block.fontFamily || resolveBodyFont(globalStyle), {
        bold: block.bold,
        italic: block.italic !== false,
        sizePx: block.fontSize || 14,
      })
      setTextColor(pdf, block.color, SLATE[600])
      let h = drawParagraph(pdf, content, { x: textX, y, width: textWidth, align: block.align, lineHeightMult: 1.5 })
      if (resolvedAuthor) {
        setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 12 })
        setTextColor(pdf, null, SLATE[400])
        h += 6 + drawParagraph(pdf, `— ${resolvedAuthor}`, { x: textX, y: y + h + 6, width: textWidth, lineHeightMult: 1.4 })
      }
      setDrawColor(pdf, globalStyle.primaryColor, [37, 99, 235])
      pdf.setLineWidth(3)
      pdf.line(barX, y, barX, y + h)
      return h
    }

    case BLOCK_TYPES.FOOTER: {
      const content = applyTextTransform(resolveContent(block, library), block.textTransform)
      setDrawColor(pdf, '#e2e8f0', SLATE[200])
      pdf.setLineWidth(1)
      pdf.line(x, y, x + width, y)
      setFont(pdf, resolveBodyFont(globalStyle), { bold: block.bold, italic: block.italic, sizePx: 12 })
      setTextColor(pdf, null, SLATE[500])
      return 13 + drawParagraph(pdf, content, { x, y: y + 13, width, align: block.align, lineHeightMult: 1.4 })
    }

    case BLOCK_TYPES.SKILLS_CHART:
    case BLOCK_TYPES.LANGUAGES_CHART: {
      const accentColor = globalStyle.primaryColor
      let items
      if (block.type === BLOCK_TYPES.SKILLS_CHART) {
        const source = block.librarySource || 'skills'
        items = block.useLibrarySkills
          ? parseChecklist(library[`${source}Items`], library[source])
              .filter((i) => i.visible && i.text?.trim())
              .map((i) => ({ label: i.text, level: 75 }))
          : block.items
      } else {
        items = block.useLibraryLanguages
          ? parseLanguages(library.languagesItems, library.languages)
              .filter((i) => i.name?.trim())
              .map((i) => ({ label: i.name, level: i.level }))
          : block.items
      }

      let cursorY = y
      const showTitle = block.title && block.showTitle !== false
      if (showTitle) {
        cursorY += drawSectionTitle(pdf, block.title, {
          x,
          y: cursorY,
          width,
          sizePx: block.fontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md,
          color: block.titleColor || accentColor,
          fontFamily: resolveTitleFont(globalStyle),
          rule: block.titleRule,
        })
      }

      const chartStyle = block.chartStyle || 'bars'
      const color = block.color || accentColor

      if (chartStyle === 'tags') {
        let tagX = x
        let tagY = cursorY
        setFont(pdf, resolveBodyFont(globalStyle), { bold: true, sizePx: 11 })
        items.forEach((item) => {
          const textW = pdf.getTextWidth(item.label)
          const pillW = textW + 16
          if (tagX + pillW > x + width) {
            tagX = x
            tagY += 22
          }
          setFillColor(pdf, color, [37, 99, 235])
          pdf.roundedRect(tagX, tagY, pillW, 18, 9, 9, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.text(item.label, tagX + 8, tagY + 12.5)
          tagX += pillW + 8
        })
        cursorY = tagY + 22
        return cursorY - y
      }

      items.forEach((item) => {
        if (chartStyle === 'dots') {
          const dotSize = block.dotSize || 10
          const dotCount = block.dotCount || 5
          setFont(pdf, resolveBodyFont(globalStyle), { bold: true, sizePx: 11 })
          setTextColor(pdf, null, SLATE[700])
          pdf.text(item.label, x, cursorY + 8)
          const filled = Math.round((Math.max(0, Math.min(100, item.level)) / 100) * dotCount)
          const gap = 4
          let dotX = x + width - dotCount * dotSize - (dotCount - 1) * gap
          for (let i = 0; i < dotCount; i += 1) {
            setFillColor(pdf, i < filled ? color : '#e2e8f0', i < filled ? [37, 99, 235] : SLATE[200])
            pdf.ellipse(dotX + dotSize / 2, cursorY + 5, dotSize / 2, dotSize / 2, 'F')
            dotX += dotSize + gap
          }
          cursorY += Math.max(dotSize, 14) + 8
        } else {
          setFont(pdf, resolveBodyFont(globalStyle), { bold: true, sizePx: 11 })
          setTextColor(pdf, null, SLATE[700])
          pdf.text(item.label, x, cursorY + 8)
          setTextColor(pdf, null, SLATE[400])
          pdf.text(`${item.level}%`, x + width, cursorY + 8, { align: 'right' })
          setFillColor(pdf, '#e2e8f0', SLATE[200])
          pdf.roundedRect(x, cursorY + 12, width, 5, 2.5, 2.5, 'F')
          setFillColor(pdf, color, [37, 99, 235])
          const filledW = Math.max(0, Math.min(100, item.level)) / 100 * width
          if (filledW > 0) pdf.roundedRect(x, cursorY + 12, filledW, 5, 2.5, 2.5, 'F')
          cursorY += 27
        }
      })
      return cursorY - y
    }

    case BLOCK_TYPES.QR_CODE: {
      const value = block.useLibraryValue ? library.qrValue : block.value
      if (!value) return 0
      const captionPosition = block.captionPosition || 'bottom'
      const isHorizontal = captionPosition === 'left' || captionPosition === 'right'
      const h = ctx.height || 160
      const size = isHorizontal ? Math.max(20, h - 16) : Math.max(20, Math.min(width - 16, h - 32))
      const dataUrl = await QRCode.toDataURL(value, { width: size * 3, margin: 1 })
      const qrX = isHorizontal ? (captionPosition === 'left' ? x + width - size : x) : x + (width - size) / 2
      pdf.addImage(dataUrl, 'PNG', qrX, y, size, size)
      if (block.caption) {
        setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 12 })
        setTextColor(pdf, null, SLATE[500])
        if (isHorizontal) {
          const capX = captionPosition === 'left' ? x : x + size + 10
          pdf.text(pdf.splitTextToSize(block.caption, width - size - 10), capX, y + size / 2)
        } else {
          pdf.text(block.caption, x + width / 2, y + size + 14, { align: 'center' })
        }
      }
      return h
    }

    case BLOCK_TYPES.SOCIAL_ICONS: {
      const items = block.useLibraryLinks
        ? parseSocialLinks(library.socialLinks).filter((i) => i.url)
        : block.items.filter((i) => i.url)
      const isStackedSocial = block.layout === 'stacked'
      let cursorX = x
      let cursorY = y
      const rowHeight = 22
      items.forEach((item) => {
        const meta = getPlatformMeta(item.platform)
        setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 12 })
        const textW = pdf.getTextWidth(item.url)
        const itemW = 24 + 6 + Math.min(textW, 130)
        if (!isStackedSocial && cursorX + itemW > x + width) {
          cursorX = x
          cursorY += rowHeight
        }
        setFillColor(pdf, meta.color, [51, 65, 85])
        pdf.ellipse(cursorX + 10, cursorY + 10, 10, 10, 'F')
        setFont(pdf, resolveBodyFont(globalStyle), { bold: true, sizePx: 9 })
        pdf.setTextColor(255, 255, 255)
        pdf.text(meta.badge, cursorX + 10, cursorY + 12.5, { align: 'center' })
        setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 11 })
        setTextColor(pdf, null, SLATE[600])
        pdf.text(item.url.length > 28 ? `${item.url.slice(0, 27)}…` : item.url, cursorX + 24, cursorY + 13)
        if (isStackedSocial) {
          cursorY += rowHeight
        } else {
          cursorX += itemW + 16
        }
      })
      return (isStackedSocial ? cursorY : cursorY + rowHeight) - y
    }

    case BLOCK_TYPES.CONTACT_INFO: {
      const fields = block.useLibraryContact
        ? [
            library.contactAddress,
            library.contactPhone,
            library.contactEmail,
            library.contactWebsite,
          ]
        : [block.address, block.phone, block.email, block.website]
      const visible = fields.filter((v) => v?.trim())
      const isRowContact = block.layout === 'row'
      let cursorY = y

      if (block.title && block.showTitle !== false) {
        cursorY += drawSectionTitle(pdf, block.title, {
          x,
          y: cursorY,
          width,
          sizePx: block.fontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md,
          color: block.titleColor || globalStyle.primaryColor,
          fontFamily: resolveTitleFont(globalStyle),
          rule: block.titleRule,
          align: block.align,
        })
      }

      setFont(pdf, resolveBodyFont(globalStyle), { sizePx: block.bodyFontSize || 14 })
      setTextColor(pdf, null, SLATE[600])
      const lineHeightMult = block.lineSpacing || 1.4

      if (isRowContact) {
        cursorY += drawParagraph(pdf, visible.join('    '), { x, y: cursorY, width, align: block.align, lineHeightMult })
      } else {
        visible.forEach((v) => {
          cursorY += drawParagraph(pdf, v, { x, y: cursorY, width, align: block.align, lineHeightMult })
        })
      }
      return cursorY - y
    }

    case BLOCK_TYPES.LEISURE: {
      const items = block.useLibraryHobbies
        ? parseChecklist(library.hobbiesItems, library.hobbies)
            .filter((i) => i.visible && i.text?.trim())
            .map((i) => i.text)
        : block.items
      let cursorY = y
      if (block.title && block.showTitle !== false) {
        cursorY += drawSectionTitle(pdf, block.title, {
          x,
          y: cursorY,
          width,
          sizePx: block.fontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md,
          color: block.titleColor || globalStyle.primaryColor,
          fontFamily: resolveTitleFont(globalStyle),
          rule: block.titleRule,
          align: block.align,
        })
      }
      setFont(pdf, resolveBodyFont(globalStyle), { sizePx: 14 })
      setTextColor(pdf, null, SLATE[600])
      cursorY += drawList(pdf, items, { x, y: cursorY, width, lineHeightMult: 1.625 })
      return cursorY - y
    }

    case BLOCK_TYPES.EXPERIENCE:
    case BLOCK_TYPES.EDUCATION: {
      const isExperience = block.type === BLOCK_TYPES.EXPERIENCE
      const librarySlot = isExperience ? 'experience' : 'education'
      const usesLibrary = isExperience ? block.useLibraryExperience : block.useLibraryEducation
      const rawItems = usesLibrary
        ? parseEntries(library[`${librarySlot}Items`], library[librarySlot])
        : block.items || []
      const items = block.sortByDate !== false ? sortEntriesByDate(rawItems) : rawItems
      const bodyFont = resolveBodyFont(globalStyle)

      let cursorY = y
      if (block.title && block.showTitle !== false) {
        cursorY += drawSectionTitle(pdf, block.title, {
          x,
          y: cursorY,
          width,
          sizePx: block.fontSize || HEADING_SIZE_PX[block.titleSize || 'md'] || HEADING_SIZE_PX.md,
          color: block.titleColor || globalStyle.primaryColor,
          fontFamily: resolveTitleFont(globalStyle),
          rule: block.titleRule,
          align: block.align,
        })
      }

      items.forEach((item, i) => {
        if (i > 0) cursorY += 10
        const subLine = [item.subtitle, item.location].filter((v) => v?.trim()).join(', ')
        const dateRange = [item.startDate, item.current ? 'Present' : item.endDate].filter((v) => v?.trim()).join(' – ')
        const subAndDate = [subLine, dateRange].filter(Boolean).join(' / ')
        const descriptionLines = (item.description || '').split('\n').filter(Boolean)

        if (item.title) {
          setFont(pdf, block.entryTitleFontFamily || resolveTitleFont(globalStyle), {
            bold: true,
            sizePx: block.entryTitleFontSize || 16,
          })
          setTextColor(pdf, block.entryTitleColor, hexToRgb(globalStyle.textColor))
          cursorY += drawParagraph(pdf, item.title, { x, y: cursorY, width, align: block.align, lineHeightMult: 1.3 })
        }
        if (subAndDate) {
          setFont(pdf, bodyFont, { sizePx: block.bodyFontSize || 14 })
          setTextColor(pdf, null, SLATE[500])
          cursorY += drawParagraph(pdf, subAndDate, { x, y: cursorY, width, align: block.align, lineHeightMult: block.lineSpacing || 1.3 })
        }
        if (descriptionLines.length > 0) {
          setFont(pdf, bodyFont, { sizePx: block.bodyFontSize || 14 })
          setTextColor(pdf, null, SLATE[600])
          cursorY += 2 + drawList(pdf, descriptionLines, { x, y: cursorY + 2, width, lineHeightMult: block.lineSpacing || 1.625 })
        }
      })
      return cursorY - y
    }

    case BLOCK_TYPES.COLUMNS: {
      const gap = 32
      const count = block.columns.length
      const ratios = block.widths?.length === count
        ? block.widths.map((w) => parseFloat(w) || 1)
        : Array(count).fill(1)
      const ratioSum = ratios.reduce((a, b) => a + b, 0)
      const availableWidth = width - gap * (count - 1)
      let colX = x
      for (let colIndex = 0; colIndex < count; colIndex += 1) {
        const colWidth = (ratios[colIndex] / ratioSum) * availableWidth
        let colY = y
        for (const item of block.columns[colIndex].items) {
          const h = await drawBlock(pdf, item, { x: colX, y: colY, width: colWidth, globalStyle, library })
          colY += h + 12
        }
        colX += colWidth + gap
      }
      return 0
    }

    default:
      return 0
  }
}

// ---------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------

export async function generatePdfBlob({ pageCount, blocks, globalStyle, library }) {
  const pdf = new jsPDF({ unit: 'px', format: [SHEET_WIDTH, SHEET_HEIGHT], compress: true })

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) pdf.addPage([SHEET_WIDTH, SHEET_HEIGHT], 'portrait')

    setFillColor(pdf, globalStyle.pageBackground, [255, 255, 255])
    pdf.rect(0, 0, SHEET_WIDTH, SHEET_HEIGHT, 'F')

    const pageBlocks = blocks
      .filter((b) => (b.page ?? 0) === pageIndex && typeof b.x === 'number')
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

    for (const block of pageBlocks) {
      // eslint-disable-next-line no-await-in-loop
      await drawBlock(pdf, block, {
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        globalStyle,
        library,
      })
    }
  }

  return pdf.output('blob')
}
