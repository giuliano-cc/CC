import { useRef } from 'react'
import { FileText } from 'lucide-react'
import { useElementWidth } from '../../hooks/useElementWidth'
import BlockRenderer from '../builder/BlockRenderer'

// Dimensioni del "foglio" usate come sorgente nel Canvas del builder
// (vedi components/builder/Canvas.jsx): la miniatura riproduce lo stesso
// foglio scalato in base alla larghezza reale della card.
const SHEET_WIDTH = 794
const SHEET_HEIGHT = 1123
const SHEET_PADDING = 48

export default function TemplateThumbnail({ template }) {
  const containerRef = useRef(null)
  const containerWidth = useElementWidth(containerRef)
  const scale = containerWidth ? containerWidth / SHEET_WIDTH : 0

  if (!template.blocks?.length) {
    return (
      <div
        ref={containerRef}
        className="flex h-40 w-full items-center justify-center bg-slate-50 text-slate-300"
      >
        <FileText size={40} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-40 w-full overflow-hidden bg-slate-100"
      style={{ fontFamily: template.globalStyle?.fontFamily, color: template.globalStyle?.textColor }}
    >
      {scale > 0 && (
        <div
          style={{
            width: SHEET_WIDTH,
            height: SHEET_HEIGHT,
            padding: SHEET_PADDING,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: 'white',
          }}
          className="pointer-events-none flex flex-col gap-4"
        >
          {template.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  )
}
