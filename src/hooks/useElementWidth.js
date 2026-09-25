import { useEffect, useState } from 'react'

export function useElementWidth(ref) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return width
}
