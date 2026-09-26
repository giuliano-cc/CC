import { SHEET_HEIGHT, SHEET_WIDTH } from './layout'

// Pure geometry helpers for aligning/distributing free-form blocks. There
// isn't really an off-the-shelf library for this — it's inherently tied to
// our own block model (each block just has x/y/width/height) — so this is
// the same math any design tool (Figma, Sketch, ...) does under the hood,
// written directly against that model. Each function takes the *selected*
// top-level blocks and returns `{ id, patch }` updates to apply.

export function alignToPage(blocks, mode) {
  return blocks.map((b) => {
    switch (mode) {
      case 'page-left':
        return { id: b.id, patch: { x: 0 } }
      case 'page-center-h':
        return { id: b.id, patch: { x: (SHEET_WIDTH - b.width) / 2 } }
      case 'page-right':
        return { id: b.id, patch: { x: SHEET_WIDTH - b.width } }
      case 'page-top':
        return { id: b.id, patch: { y: 0 } }
      case 'page-middle':
        return { id: b.id, patch: { y: (SHEET_HEIGHT - b.height) / 2 } }
      case 'page-bottom':
        return { id: b.id, patch: { y: SHEET_HEIGHT - b.height } }
      default:
        return { id: b.id, patch: {} }
    }
  })
}

export function alignToSelection(blocks, mode) {
  const minX = Math.min(...blocks.map((b) => b.x))
  const maxX = Math.max(...blocks.map((b) => b.x + b.width))
  const minY = Math.min(...blocks.map((b) => b.y))
  const maxY = Math.max(...blocks.map((b) => b.y + b.height))

  return blocks.map((b) => {
    switch (mode) {
      case 'left':
        return { id: b.id, patch: { x: minX } }
      case 'center-h':
        return { id: b.id, patch: { x: (minX + maxX) / 2 - b.width / 2 } }
      case 'right':
        return { id: b.id, patch: { x: maxX - b.width } }
      case 'top':
        return { id: b.id, patch: { y: minY } }
      case 'middle':
        return { id: b.id, patch: { y: (minY + maxY) / 2 - b.height / 2 } }
      case 'bottom':
        return { id: b.id, patch: { y: maxY - b.height } }
      default:
        return { id: b.id, patch: {} }
    }
  })
}

// Spreads 3+ blocks with equal gaps between them along one axis, keeping
// the first and last block (by position) fixed in place.
export function distribute(blocks, axis) {
  if (blocks.length < 3) return []

  const sorted = [...blocks].sort((a, b) => (axis === 'h' ? a.x - b.x : a.y - b.y))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const size = (b) => (axis === 'h' ? b.width : b.height)
  const start = (b) => (axis === 'h' ? b.x : b.y)

  const totalSpan = start(last) + size(last) - start(first)
  const totalSize = sorted.reduce((sum, b) => sum + size(b), 0)
  const gap = (totalSpan - totalSize) / (sorted.length - 1)

  const updates = []
  let cursor = start(first) + size(first) + gap
  sorted.forEach((b, i) => {
    if (i === 0 || i === sorted.length - 1) return
    updates.push({ id: b.id, patch: axis === 'h' ? { x: cursor } : { y: cursor } })
    cursor += size(b) + gap
  })
  return updates
}
