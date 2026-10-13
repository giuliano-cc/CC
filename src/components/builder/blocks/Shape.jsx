export default function renderShapeBlock({ block }) {
  const isCircleShape = block.shape === 'circle'
  const style = {
    width: '100%',
    height: '100%',
    backgroundColor: block.color || 'transparent',
    borderRadius: isCircleShape ? '9999px' : block.borderRadius || 0,
    opacity: block.opacity ?? 1,
    borderStyle: block.borderWidth ? 'solid' : undefined,
    borderWidth: block.borderWidth || undefined,
    borderColor: block.borderColor || undefined,
  }
  return <div style={style} />
}
