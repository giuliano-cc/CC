export default function renderDividerBlock({ block }) {
  const isVertical = block.orientation === 'vertical'
  const thickness = block.thickness ?? 1
  const style = isVertical
    ? {
        width: 0,
        height: '100%',
        marginInline: 'auto',
        borderLeftWidth: thickness,
        borderLeftStyle: block.lineStyle || 'solid',
        borderLeftColor: block.color || '#e2e8f0',
      }
    : {
        width: '100%',
        height: 0,
        marginBlock: 'auto',
        borderTopWidth: thickness,
        borderTopStyle: block.lineStyle || 'solid',
        borderTopColor: block.color || '#e2e8f0',
      }
  return <div style={style} />
}
