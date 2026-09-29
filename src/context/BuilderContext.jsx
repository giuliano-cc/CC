import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from 'react'
import {
  BLOCK_TYPES,
  cloneBlockWithNewIds,
  createBlockInstance,
  createNestedBlockInstance,
  matchNewBlockToSiblings,
} from '../utils/blockTypes'
import { findBlockById, removeBlockById, updateBlockById } from '../utils/blockTree'
import { clamp, seedFreeLayout, SHEET_HEIGHT, SHEET_WIDTH } from '../utils/layout'
import { alignToPage, alignToSelection, distribute } from '../utils/align'

// `fontFamily` is kept as the legacy single-font value (a template saved
// before titles and body text had independent fonts still has only
// this), and both `titleFontFamily`/`bodyFontFamily` fall back to it
// wherever they're not set — see resolveTitleFont/resolveBodyFont in
// BlockRenderer.jsx — so nothing needs migrating and a template that's
// never touched the new fields keeps looking exactly the same.
// A ready-to-edit typographic scale every new template starts with —
// H1/H2/H3 map onto Heading's existing size presets (xl/lg/md — see
// HEADING_SIZE_PX and the fontSize fallback chain in BlockRenderer.jsx),
// so setting these here reshapes every Heading using that size across
// the template immediately, the same way editing
// a row in "Text styles used in this template" already does. P1 is body
// text's own default size (everywhere a block's own bodyFontSize/fontSize
// is left unset); P2/P3 are available to reference or apply to a
// specific block's own Body text size field, without a body-wide effect
// of their own — only P1 has one, since nothing defaults to P2/P3.
const DEFAULT_TYPOGRAPHY_SCALE = {
  h1: { sizePx: 48, bold: true, color: null, fontFamily: null },
  h2: { sizePx: 30, bold: true, color: null, fontFamily: null },
  h3: { sizePx: 24, bold: true, color: null, fontFamily: null },
  p1: { sizePx: 14, bold: false, color: null, fontFamily: null },
  p2: { sizePx: 12, bold: false, color: null, fontFamily: null },
  p3: { sizePx: 11, bold: false, color: null, fontFamily: null },
}

const DEFAULT_GLOBAL_STYLE = {
  primaryColor: '#2563eb',
  textColor: '#1e293b',
  pageBackground: '#ffffff',
  // A page background image sits on top of pageBackground (visible
  // through any transparent part of the image, e.g. a PNG watermark) —
  // 'cover'/'contain'/'repeat' picks how it fills the page.
  pageBackgroundImage: '',
  pageBackgroundSize: 'cover',
  // Lets an uploaded image be hidden without losing it (and its fit
  // setting) — toggling it back on doesn't require re-uploading.
  pageBackgroundImageVisible: true,
  fontFamily: 'Inter, system-ui, sans-serif',
  titleFontFamily: null,
  bodyFontFamily: null,
  margin: 48,
  typographyScale: DEFAULT_TYPOGRAPHY_SCALE,
  // Which Content Library language this document reads (see
  // ContentLibraryContext.jsx's getLibrary) — a per-document choice, not a
  // single global one, so an English and a German CV built from the same
  // library content can exist side by side.
  contentLanguage: 'en',
}

const BuilderContext = createContext(null)

export function BuilderProvider({
  children,
  initialBlocks = [],
  initialGlobalStyle,
  initialPageCount,
}) {
  const [blocks, setBlocks] = useState(() => seedFreeLayout(initialBlocks))
  const [selectedIds, setSelectedIds] = useState([])
  // Which page a paste (or a block dropped without a specific position)
  // targets — the page the user last clicked into, whether that landed on
  // a block or empty canvas, so copying a block on page 1 and then
  // clicking onto page 2 (even without selecting anything there) pastes
  // onto page 2, not back onto page 1.
  const [activePage, setActivePage] = useState(0)

  // Undo/redo history, tracked at the `blocks` level. Discrete actions
  // (add/remove/align) always push a snapshot; continuous ones (dragging,
  // resizing, typing — all funneled through `updateBlock`) coalesce into a
  // single snapshot per block while they're rapid/on the same block, so a
  // whole drag or typing burst undoes as one step instead of hundreds.
  //
  // Kept as plain refs (not React state): React 18 StrictMode invokes a
  // functional setState updater twice to catch impure ones, and undo/redo
  // need to trigger a second setState (setBlocks) as a side effect of
  // popping the stack — nesting that inside another updater got silently
  // double-applied in dev and cancelled itself out. `historyVersion` is
  // the only piece of state, bumped after each change purely to force a
  // re-render so the Undo/Redo buttons' disabled state stays in sync.
  const pastRef = useRef([])
  const futureRef = useRef([])
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks
  const activePageRef = useRef(activePage)
  activePageRef.current = activePage
  const lastEditRef = useRef({ id: null, time: 0 })
  const [, bumpHistoryVersion] = useReducer((v) => v + 1, 0)
  const HISTORY_LIMIT = 50
  const COALESCE_MS = 800

  function pushHistory(prevBlocks) {
    pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), prevBlocks]
    futureRef.current = []
    bumpHistoryVersion()
  }
  const [globalStyle, setGlobalStyle] = useState({
    ...DEFAULT_GLOBAL_STYLE,
    ...initialGlobalStyle,
  })
  const [pageCount, setPageCount] = useState(() => {
    const maxPage = Math.max(0, ...initialBlocks.map((b) => b.page ?? 0))
    return Math.max(initialPageCount || 1, maxPage + 1)
  })
  const zCounter = useRef(Math.max(1, ...blocks.map((b) => b.zIndex || 0)) + 1)

  const selectedBlockId = selectedIds.length === 1 ? selectedIds[0] : null

  const selectedBlock = useMemo(
    () => findBlockById(blocks, selectedBlockId),
    [blocks, selectedBlockId],
  )

  // Creates a free block on the sheet, at a given position (typically the
  // cursor position at drop time from the palette) and page. `extraProps`
  // (from a Content Library palette preset — see BlockPalette/PaletteItem)
  // are merged in after the type's own defaults, e.g. to pre-bind a Text
  // block to a library slot. Its title/heading size, if any, is matched to
  // whatever sibling heading/section-title block already exists on this
  // page (recursing into a Columns block among them), same as a nested
  // item added inside a Columns column — otherwise a block dropped next to
  // a template's smaller ('sm') page headings always came in at the
  // hardcoded default ('md') and visibly didn't match.
  const addBlock = useCallback((type, position, page = 0, extraProps) => {
    let newBlock = createBlockInstance(type)
    if (extraProps) newBlock = { ...newBlock, ...extraProps }
    if (position) {
      // Clamped so the block (and its delete/resize handles, which sit just
      // outside its own box) can never land partly beyond the page edge —
      // the page clips overflow, which made those controls unreachable.
      newBlock.x = clamp(position.x, 0, Math.max(0, SHEET_WIDTH - newBlock.width))
      newBlock.y = clamp(position.y, 0, Math.max(0, SHEET_HEIGHT - newBlock.height))
    }
    newBlock.page = page
    setBlocks((prev) => {
      pushHistory(prev)
      const pageSiblings = prev.filter((b) => (b.page ?? 0) === page)
      // A Shape is almost always meant as a decorative backdrop for other
      // content, so it starts out behind every existing block on the page
      // instead of on top of them like a normal drop — otherwise every
      // freshly-dropped shape would immediately cover whatever was already
      // there, needing a manual "send to back" just to see the content
      // again.
      newBlock.zIndex =
        type === BLOCK_TYPES.SHAPE
          ? Math.min(0, ...pageSiblings.map((b) => b.zIndex || 0)) - 1
          : zCounter.current++
      return [...prev, matchNewBlockToSiblings(newBlock, pageSiblings)]
    })
    setSelectedIds([newBlock.id])
    setActivePage(page)
    return newBlock
  }, [])

  // Adds one more page, side by side with the existing ones.
  const addPage = useCallback(() => {
    setPageCount((prev) => prev + 1)
  }, [])

  // Removes the last page and any blocks on it (can't remove page 1).
  const removeLastPage = useCallback(() => {
    setPageCount((prev) => {
      if (prev <= 1) return prev
      const removedPage = prev - 1
      setBlocks((blocksPrev) => blocksPrev.filter((b) => (b.page ?? 0) !== removedPage))
      setSelectedIds([])
      return prev - 1
    })
  }, [])

  // Inserts a copy of `pageIndex` right after it: every later page shifts
  // up by one to make room, and every block on `pageIndex` is cloned (with
  // fresh ids — see cloneBlockWithNewIds) onto the new page.
  const duplicatePage = useCallback((pageIndex) => {
    setBlocks((prev) => {
      pushHistory(prev)
      const shifted = prev.map((b) => {
        const p = b.page ?? 0
        return p > pageIndex ? { ...b, page: p + 1 } : b
      })
      const clones = prev
        .filter((b) => (b.page ?? 0) === pageIndex)
        .map((b) => ({ ...cloneBlockWithNewIds(b), page: pageIndex + 1 }))
      return [...shifted, ...clones]
    })
    setPageCount((prev) => prev + 1)
    setSelectedIds([])
    setActivePage(pageIndex + 1)
  }, [])

  // Reorders pages by re-labelling every block's own `page` field — pages
  // themselves are just that field's distinct values, not a separate
  // array, so "moving a page" means shifting everything between the old
  // and new position by one slot and relabelling the moved page itself.
  const movePage = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    setBlocks((prev) => {
      pushHistory(prev)
      return prev.map((b) => {
        const p = b.page ?? 0
        let nextPage = p
        if (p === fromIndex) nextPage = toIndex
        else if (fromIndex < toIndex && p > fromIndex && p <= toIndex) nextPage = p - 1
        else if (fromIndex > toIndex && p >= toIndex && p < fromIndex) nextPage = p + 1
        return nextPage !== p ? { ...b, page: nextPage } : b
      })
    })
    setActivePage(toIndex)
  }, [])

  // Adds a simple block (heading/text) inside a column of a COLUMNS
  // block: a column's items stay in vertical flow (they aren't free on the
  // sheet), but they're still selectable/editable like all the others.
  const addNestedItem = useCallback((columnsBlockId, columnIndex, type, extraProps) => {
    let newItem = createNestedBlockInstance(type)
    if (extraProps) newItem = { ...newItem, ...extraProps }
    setBlocks((prev) => {
      pushHistory(prev)
      return updateBlockById(prev, columnsBlockId, (block) => ({
        ...block,
        columns: block.columns.map((column, index) =>
          index === columnIndex
            ? {
                ...column,
                items: [
                  ...column.items,
                  matchNewBlockToSiblings(newItem, block.columns.flatMap((c) => c.items)),
                ],
              }
            : column,
        ),
      }))
    })
    setSelectedIds([newItem.id])
  }, [])

  const updateBlock = useCallback((id, patch) => {
    const now = Date.now()
    const last = lastEditRef.current
    const shouldCheckpoint = last.id !== id || now - last.time > COALESCE_MS
    setBlocks((prev) => {
      if (shouldCheckpoint) pushHistory(prev)
      return updateBlockById(prev, id, patch)
    })
    lastEditRef.current = { id, time: now }
  }, [])

  const removeBlock = useCallback((id) => {
    setBlocks((prev) => {
      pushHistory(prev)
      return removeBlockById(prev, id)
    })
    setSelectedIds((current) => current.filter((sid) => sid !== id))
  }, [])

  // Brings a block to the front when selected/dragged, so two overlapping
  // blocks on the sheet behave predictably.
  const bringToFront = useCallback((id) => {
    const nextZ = zCounter.current++
    setBlocks((prev) => updateBlockById(prev, id, { zIndex: nextZ }))
  }, [])

  // The opposite: drops a block behind every other block on its page —
  // used both for the manual "Send to back" action and, together with
  // skipping the auto-bring-to-front below, to let a background Shape stay
  // behind the content it's decorating even while it's being selected and
  // edited.
  const sendToBack = useCallback((id) => {
    setBlocks((prev) => {
      const block = findBlockById(prev, id)
      const siblings = prev.filter(
        (b) => b.id !== id && (b.page ?? 0) === (block?.page ?? 0) && typeof b.zIndex === 'number',
      )
      const minZ = Math.min(0, ...siblings.map((b) => b.zIndex || 0))
      return updateBlockById(prev, id, { zIndex: minZ - 1 })
    })
  }, [])

  // `additive: true` (shift-click) adds/removes the block from the current
  // selection instead of replacing it, so several free blocks can be
  // selected together for aligning/distributing them as a group.
  const selectBlock = useCallback(
    (id, options) => {
      if (id === null) {
        setSelectedIds([])
        return
      }
      const block = findBlockById(blocksRef.current, id)
      if (block && typeof block.page === 'number') setActivePage(block.page)
      if (options?.additive) {
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
        )
      } else {
        setSelectedIds([id])
      }
      // A background Shape is deliberately placed behind other content (see
      // addBlock/sendToBack) — auto-fronting it on every select/drag would
      // undo that the moment you click it to change its color.
      if (block?.type !== BLOCK_TYPES.SHAPE) bringToFront(id)
    },
    [bringToFront],
  )

  // Aligns/distributes the selected top-level (free) blocks. `mode` is one
  // of: page-left/page-center-h/page-right/page-top/page-middle/page-bottom
  // (relative to the sheet), left/center-h/right/top/middle/bottom
  // (relative to the selection's own bounding box, 2+ blocks), or
  // distribute-h/distribute-v (evenly spaced, 3+ blocks).
  const alignSelection = useCallback(
    (mode) => {
      const targets = blocks.filter(
        (b) => selectedIds.includes(b.id) && typeof b.x === 'number',
      )
      if (targets.length === 0) return

      let updates
      if (mode.startsWith('page-')) {
        updates = alignToPage(targets, mode)
      } else if (mode === 'distribute-h') {
        updates = distribute(targets, 'h')
      } else if (mode === 'distribute-v') {
        updates = distribute(targets, 'v')
      } else {
        updates = alignToSelection(targets, mode)
      }

      setBlocks((prev) => {
        pushHistory(prev)
        let next = prev
        updates.forEach(({ id, patch }) => {
          next = updateBlockById(next, id, patch)
        })
        return next
      })
    },
    [blocks, selectedIds],
  )

  // Arrow-key nudging: moves every selected free (top-level) block by the
  // same delta, clamped to the sheet like a drag would be. Repeated nudges
  // in quick succession (holding an arrow key down) coalesce into a single
  // history entry, the same way a drag or a typing burst does — otherwise
  // one held key press could blow through the whole undo stack.
  const nudgeSelection = useCallback(
    (dx, dy) => {
      const now = Date.now()
      const last = lastEditRef.current
      const shouldCheckpoint = last.id !== 'nudge' || now - last.time > COALESCE_MS
      setBlocks((prev) => {
        if (shouldCheckpoint) pushHistory(prev)
        let next = prev
        prev.forEach((b) => {
          if (!selectedIds.includes(b.id) || typeof b.x !== 'number') return
          next = updateBlockById(next, b.id, {
            x: clamp(b.x + dx, 0, Math.max(0, SHEET_WIDTH - b.width)),
            y: clamp(b.y + dy, 0, Math.max(0, SHEET_HEIGHT - b.height)),
          })
        })
        return next
      })
      lastEditRef.current = { id: 'nudge', time: now }
    },
    [selectedIds],
  )

  // Copy/paste for free (top-level) blocks: copying stores a deep clone of
  // the currently selected blocks (kept in a ref, not state — the
  // clipboard isn't part of the document and shouldn't be undoable or
  // trigger a re-render on its own); pasting drops fresh-id copies of them
  // slightly offset from the originals, on the same page, and selects the
  // new copies so a repeated paste keeps stepping down/right instead of
  // stacking exactly on top of the last paste.
  const clipboardRef = useRef([])
  const copySelection = useCallback(() => {
    const targets = blocks.filter((b) => selectedIds.includes(b.id) && typeof b.x === 'number')
    if (targets.length > 0) clipboardRef.current = structuredClone(targets)
  }, [blocks, selectedIds])

  const pasteSelection = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    const offset = 24
    // Pastes onto whichever page the user last clicked into (selecting a
    // block there, or just clicking its empty canvas) — not necessarily
    // the page the copied block(s) came from — so copying on page 1 and
    // clicking over to page 2 pastes there instead of bouncing back.
    const targetPage = activePageRef.current
    const copies = clipboardRef.current.map((b) => {
      const clone = cloneBlockWithNewIds(b)
      clone.x = clamp(b.x + offset, 0, Math.max(0, SHEET_WIDTH - clone.width))
      clone.y = clamp(b.y + offset, 0, Math.max(0, SHEET_HEIGHT - clone.height))
      clone.page = targetPage
      clone.zIndex = zCounter.current++
      return clone
    })
    // Each paste is nudged further than the last, so pasting the same
    // clipboard repeatedly fans the copies out instead of dropping every
    // one in an identical spot.
    clipboardRef.current = clipboardRef.current.map((b) => ({ ...b, x: b.x + offset, y: b.y + offset }))
    setBlocks((prev) => {
      pushHistory(prev)
      return [...prev, ...copies]
    })
    setSelectedIds(copies.map((c) => c.id))
  }, [])

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    const previous = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [...futureRef.current.slice(-(HISTORY_LIMIT - 1)), blocksRef.current]
    setBlocks(previous)
    lastEditRef.current = { id: null, time: 0 }
    bumpHistoryVersion()
  }, [])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), blocksRef.current]
    setBlocks(next)
    lastEditRef.current = { id: null, time: 0 }
    bumpHistoryVersion()
  }, [])

  const value = {
    blocks,
    setBlocks,
    selectedBlock,
    selectedBlockId,
    selectedIds,
    selectBlock,
    activePage,
    setActivePage,
    addBlock,
    addNestedItem,
    updateBlock,
    removeBlock,
    bringToFront,
    sendToBack,
    alignSelection,
    nudgeSelection,
    copySelection,
    pasteSelection,
    undo,
    redo,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads refs kept in sync by historyVersion bumps
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    globalStyle,
    setGlobalStyle,
    pageCount,
    setPageCount,
    addPage,
    removeLastPage,
    duplicatePage,
    movePage,
    // Replaces the whole sheet at once (blocks/style/page count) — used to
    // restore a built-in template to its shipped defaults, discarding
    // whatever's accumulated in it (including from an older, buggier
    // version of the app, since templates persist across reloads).
    resetTo: (nextBlocks, nextGlobalStyle, nextPageCount) => {
      pushHistory(blocksRef.current)
      setBlocks(seedFreeLayout(nextBlocks))
      setGlobalStyle(nextGlobalStyle)
      setPageCount(nextPageCount)
      setSelectedIds([])
    },
  }

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  )
}

export function useBuilder() {
  const context = useContext(BuilderContext)
  if (!context) {
    throw new Error('useBuilder must be used within a BuilderProvider')
  }
  return context
}
