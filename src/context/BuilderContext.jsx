import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createBlockInstance, createNestedBlockInstance } from '../utils/blockTypes'
import { findBlockById, removeBlockById, updateBlockById } from '../utils/blockTree'
import { clamp, seedFreeLayout, SHEET_HEIGHT, SHEET_WIDTH } from '../utils/layout'
import { alignToPage, alignToSelection, distribute } from '../utils/align'

const DEFAULT_GLOBAL_STYLE = {
  primaryColor: '#2563eb',
  textColor: '#1e293b',
  fontFamily: 'Inter, system-ui, sans-serif',
  margin: 48,
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
  // cursor position at drop time from the palette) and page.
  const addBlock = useCallback((type, position, page = 0) => {
    const newBlock = createBlockInstance(type)
    if (position) {
      // Clamped so the block (and its delete/resize handles, which sit just
      // outside its own box) can never land partly beyond the page edge —
      // the page clips overflow, which made those controls unreachable.
      newBlock.x = clamp(position.x, 0, Math.max(0, SHEET_WIDTH - newBlock.width))
      newBlock.y = clamp(position.y, 0, Math.max(0, SHEET_HEIGHT - newBlock.height))
    }
    newBlock.page = page
    newBlock.zIndex = zCounter.current++
    setBlocks((prev) => [...prev, newBlock])
    setSelectedIds([newBlock.id])
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

  // Adds a simple block (heading/text) inside a column of a COLUMNS
  // block: a column's items stay in vertical flow (they aren't free on the
  // sheet), but they're still selectable/editable like all the others.
  const addNestedItem = useCallback((columnsBlockId, columnIndex, type) => {
    const newItem = createNestedBlockInstance(type)
    setBlocks((prev) =>
      updateBlockById(prev, columnsBlockId, (block) => ({
        ...block,
        columns: block.columns.map((column, index) =>
          index === columnIndex
            ? { ...column, items: [...column.items, newItem] }
            : column,
        ),
      })),
    )
    setSelectedIds([newItem.id])
  }, [])

  const updateBlock = useCallback((id, patch) => {
    setBlocks((prev) => updateBlockById(prev, id, patch))
  }, [])

  const removeBlock = useCallback((id) => {
    setBlocks((prev) => removeBlockById(prev, id))
    setSelectedIds((current) => current.filter((sid) => sid !== id))
  }, [])

  // Brings a block to the front when selected/dragged, so two overlapping
  // blocks on the sheet behave predictably.
  const bringToFront = useCallback((id) => {
    const nextZ = zCounter.current++
    setBlocks((prev) => updateBlockById(prev, id, { zIndex: nextZ }))
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
      if (options?.additive) {
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
        )
      } else {
        setSelectedIds([id])
      }
      bringToFront(id)
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
        let next = prev
        updates.forEach(({ id, patch }) => {
          next = updateBlockById(next, id, patch)
        })
        return next
      })
    },
    [blocks, selectedIds],
  )

  const value = {
    blocks,
    setBlocks,
    selectedBlock,
    selectedBlockId,
    selectedIds,
    selectBlock,
    addBlock,
    addNestedItem,
    updateBlock,
    removeBlock,
    bringToFront,
    alignSelection,
    globalStyle,
    setGlobalStyle,
    pageCount,
    addPage,
    removeLastPage,
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
