import { useRef } from 'react'
import { FileText } from 'lucide-react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { seedFreeLayout, SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import BlockRenderer from '../builder/BlockRenderer'

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

  // Blocks are positioned exactly like on the real builder canvas (see
  // components/builder/Canvas.jsx): the thumbnail reproduces the same
  // sheet, scaled down to the card's actual width. `seedFreeLayout` gives
  // legacy blocks without x/y/width/height a stacked position too. Only
  // page 1 is shown — templates can have more than one page (e.g. a resume
  // + matching cover letter).
  const positionedBlocks = seedFreeLayout(template.blocks).filter((b) => (b.page ?? 0) === 0)

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
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: 'white',
          }}
          className="pointer-events-none relative"
        >
          {positionedBlocks.map((block) => (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                overflow: 'hidden',
              }}
            >
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
