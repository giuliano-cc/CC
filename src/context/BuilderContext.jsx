import { arrayMove } from '@dnd-kit/sortable'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createBlockInstance } from '../utils/blockTypes'

const DEFAULT_GLOBAL_STYLE = {
  primaryColor: '#2563eb',
  textColor: '#1e293b',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const BuilderContext = createContext(null)

export function BuilderProvider({ children, initialBlocks = [] }) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [globalStyle, setGlobalStyle] = useState(DEFAULT_GLOBAL_STYLE)

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  )

  const addBlock = useCallback((type, index) => {
    const newBlock = createBlockInstance(type)
    setBlocks((prev) => {
      const next = [...prev]
      const insertAt = index === undefined ? next.length : index
      next.splice(insertAt, 0, newBlock)
      return next
    })
    setSelectedBlockId(newBlock.id)
    return newBlock
  }, [])

  const updateBlock = useCallback((id, patch) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    )
  }, [])

  const removeBlock = useCallback(
    (id) => {
      setBlocks((prev) => prev.filter((block) => block.id !== id))
      setSelectedBlockId((current) => (current === id ? null : current))
    },
    [],
  )

  const reorderBlocks = useCallback((activeId, overId) => {
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId)
      const newIndex = prev.findIndex((b) => b.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const selectBlock = useCallback((id) => {
    setSelectedBlockId(id)
  }, [])

  const value = {
    blocks,
    setBlocks,
    selectedBlock,
    selectedBlockId,
    selectBlock,
    addBlock,
    updateBlock,
    removeBlock,
    reorderBlocks,
    globalStyle,
    setGlobalStyle,
  }

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  )
}

export function useBuilder() {
  const context = useContext(BuilderContext)
  if (!context) {
    throw new Error('useBuilder deve essere usato dentro un BuilderProvider')
  }
  return context
}
