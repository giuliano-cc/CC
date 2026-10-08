import { useEffect, useState } from 'react'
import { geocodeLocations } from '../../utils/geocode'

// The dot-grid basemap (~13k points, land areas only, derived from
// Natural Earth's 110m land data) and this component itself are both
// dynamically imported — see geocode.js's own note on why: a document
// that never uses this block shouldn't pay for ~1MB of bundled map/city
// data.
let worldDotsPromise = null
function loadWorldDots() {
  if (!worldDotsPromise) worldDotsPromise = import('../../data/worldDots.json').then((m) => m.default)
  return worldDotsPromise
}

// Plain equirectangular projection (lng/lat straight onto x/y) — same
// projection the dot basemap itself was generated with, and the same
// kind of flat, unprojected world map the reference screenshots use.
function project(lng, lat) {
  return { x: lng + 180, y: 90 - lat }
}

const MAP_WIDTH = 360
const MAP_HEIGHT = 180

// Crops the basemap to the region the markers actually sit in, with
// some breathing room around them — otherwise a handful of locations
// clustered in one region (the common case: most CVs don't have
// projects on every continent) render as a few tiny dots lost in an
// otherwise-empty world map. Padding is proportional to the cluster's
// own size, with a floor so a single location (or several right on
// top of each other) still shows enough surrounding geography for
// context instead of a blank close-up, and clamped to the world's own
// bounds so the crop never asks for space outside the actual map.
function computeMapBounds(markers) {
  if (markers.length === 0) return { minX: 0, maxX: MAP_WIDTH, minY: 0, maxY: MAP_HEIGHT }
  const xs = markers.map((m) => m.x)
  const ys = markers.map((m) => m.y)
  const spanX = Math.max(...xs) - Math.min(...xs)
  const spanY = Math.max(...ys) - Math.min(...ys)
  const padX = Math.max(spanX * 0.3, 18)
  const padY = Math.max(spanY * 0.3, 18)
  return {
    minX: Math.max(0, Math.min(...xs) - padX),
    maxX: Math.min(MAP_WIDTH, Math.max(...xs) + padX),
    minY: Math.max(0, Math.min(...ys) - padY),
    maxY: Math.min(MAP_HEIGHT, Math.max(...ys) + padY),
  }
}

export default function WorldMap({ items, accentColor, legendStyle = 'numbered', leaderDirection = 'sides', bodyFont }) {
  const [worldDots, setWorldDots] = useState(null)
  const [points, setPoints] = useState(null)

  const locationsKey = items.map((i) => i.location || '').join('|')

  useEffect(() => {
    let cancelled = false
    loadWorldDots().then((dots) => {
      if (!cancelled) setWorldDots(dots)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    geocodeLocations(items.map((i) => i.location)).then((resolved) => {
      if (!cancelled) setPoints(resolved)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey])

  if (!worldDots || !points) {
    return <div className="flex aspect-[2/1] w-full items-center justify-center rounded-md bg-slate-50 text-xs text-slate-400">Loading map…</div>
  }

  const markers = items
    .map((item, i) => {
      const point = points[i]
      if (!point) return null
      const { x, y } = project(point.lng, point.lat)
      return { item, index: i, x, y }
    })
    .filter(Boolean)

  if (legendStyle === 'leader') {
    return (
      <LeaderMap
        markers={markers}
        worldDots={worldDots}
        accentColor={accentColor}
        bodyFont={bodyFont}
        direction={leaderDirection}
      />
    )
  }
  return <NumberedMap markers={markers} worldDots={worldDots} accentColor={accentColor} bodyFont={bodyFont} />
}

// Several markers often sit close enough together (not exactly the same
// point, but close at the map's own scale) that their number labels
// would otherwise land right on top of each other — groups markers
// within a small distance of one another (relative to the visible
// map's own size, so it scales with however tightly cropped the map
// is) and gives each such group one combined label ("1,7") near their
// shared position instead of several overlapping ones. The dots
// themselves stay at their own true positions either way — only the
// number labels merge.
function clusterMarkers(markers, viewWidth, viewHeight) {
  const threshold = Math.max(viewWidth, viewHeight) * 0.035
  const clusters = []
  for (const marker of markers) {
    const existing = clusters.find((c) => Math.hypot(c.x - marker.x, c.y - marker.y) < threshold)
    if (existing) {
      existing.members.push(marker)
      existing.x = existing.members.reduce((sum, m) => sum + m.x, 0) / existing.members.length
      existing.y = existing.members.reduce((sum, m) => sum + m.y, 0) / existing.members.length
    } else {
      clusters.push({ x: marker.x, y: marker.y, members: [marker] })
    }
  }
  return clusters
}

function NumberedMap({ markers, worldDots, accentColor }) {
  const bounds = computeMapBounds(markers)
  const viewWidth = bounds.maxX - bounds.minX
  const viewHeight = bounds.maxY - bounds.minY
  const visibleDots = worldDots
    .map(([lng, lat]) => project(lng, lat))
    .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)
  const clusters = clusterMarkers(markers, viewWidth, viewHeight)
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`${bounds.minX} ${bounds.minY} ${viewWidth} ${viewHeight}`} className="w-full" style={{ display: 'block' }}>
        {visibleDots.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r={0.45} fill="#cbd5e1" />
        ))}
        {markers.map(({ item, index, x, y }) => (
          <circle key={item.id || index} cx={x} cy={y} r={1.4} fill={accentColor} />
        ))}
        {clusters.map((cluster, ci) => (
          <text key={ci} x={cluster.x + 2} y={cluster.y - 1.5} fontSize={4.2} fontWeight={700} fill={accentColor}>
            {cluster.members.map((m) => m.index + 1).join(',')}
          </text>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {markers.map(({ item, index }) => (
          <div key={item.id || index} className="flex gap-2">
            <span className="shrink-0 text-xs font-bold" style={{ color: accentColor }}>
              {index + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold" style={{ color: accentColor }}>
                {item.title}
              </span>
              {item.location && <span className="text-xs opacity-60">{item.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Labels stacked in two groups, each connected to its marker by a
// leader line — `direction: 'sides'` splits left/right of the map's
// own horizontal center (columns stacked top-to-bottom, the reference
// layout's own grouping); `direction: 'topBottom'` splits above/below
// its vertical center instead (rows stacked left-to-right). Font sizes
// are fixed in viewBox units (not scaled to the crop), so the room
// labels need is roughly constant regardless of how tightly the map
// is cropped — a fixed margin on whichever side holds the labels,
// added directly to the cropped viewBox rather than reserved inside
// the map's own 0..360/0..180 range like the original fixed-world
// version needed.
const SIDE_LABEL_MARGIN = 110
const TOP_BOTTOM_LABEL_MARGIN = 28

// Splits into two roughly equal-sized groups by count, not by which
// side of the crop's own midpoint each marker falls on — several
// projects often sit in the very same city (or two nearby ones), and a
// pure midpoint split would then dump every marker into one single
// overloaded group while the other sits empty, cramming far more
// labels into one row/column than it has room for (illegible overlap).
function splitBalanced(markers, axisKey) {
  const sorted = [...markers].sort((a, b) => a[axisKey] - b[axisKey])
  const half = Math.ceil(sorted.length / 2)
  return [sorted.slice(0, half), sorted.slice(half)]
}

function LeaderMap({ markers, worldDots, accentColor, bodyFont, direction = 'sides' }) {
  const bounds = computeMapBounds(markers)
  const visibleDots = worldDots
    .map(([lng, lat]) => project(lng, lat))
    .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)

  if (direction === 'topBottom') {
    const [topRaw, bottomRaw] = splitBalanced(markers, 'y')
    const top = [...topRaw].sort((a, b) => a.x - b.x)
    const bottom = [...bottomRaw].sort((a, b) => a.x - b.x)

    // Each label needs a minimum width to not overlap its neighbors,
    // regardless of how tightly the markers themselves are cropped —
    // several projects often sit right on top of each other (same
    // city), which would otherwise squeeze an entire row of labels
    // into a sliver of a crop only wide enough for the dots
    // themselves. Widens the viewBox (recentered on the actual crop)
    // instead of the crop itself, so the map portion stays accurate to
    // where the markers are, with label the room added around it.
    const MIN_SLOT_WIDTH = 85
    const maxRowCount = Math.max(top.length, bottom.length, 1)
    const cropWidth = bounds.maxX - bounds.minX
    const viewWidth = Math.max(cropWidth, MIN_SLOT_WIDTH * maxRowCount)
    const viewMinX = (bounds.minX + bounds.maxX) / 2 - viewWidth / 2

    function layoutRow(row) {
      if (row.length === 0) return []
      const slot = viewWidth / row.length
      return row.map((m, i) => ({ ...m, labelX: viewMinX + slot * i + slot / 2 }))
    }

    function renderLabel({ item, x, y, labelX }, pos) {
      const labelY = pos === 'top' ? bounds.minY - TOP_BOTTOM_LABEL_MARGIN + 6 : bounds.maxY + TOP_BOTTOM_LABEL_MARGIN - 2
      const lineEndY = pos === 'top' ? bounds.minY - TOP_BOTTOM_LABEL_MARGIN + 10 : bounds.maxY + TOP_BOTTOM_LABEL_MARGIN - 10
      return (
        <g key={item.id}>
          <line x1={x} y1={y} x2={labelX} y2={lineEndY} stroke="#94a3b8" strokeWidth={0.4} />
          <line x1={labelX} y1={lineEndY} x2={labelX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
          <circle cx={x} cy={y} r={1.1} fill={accentColor} />
          <text x={labelX} y={labelY} fontSize={4.8} fontWeight={700} fill={accentColor} textAnchor="middle" fontFamily={bodyFont}>
            {item.title}
          </text>
          {item.location && (
            <text
              x={labelX}
              y={labelY + (pos === 'top' ? -5 : 5)}
              fontSize={3.6}
              fill="currentColor"
              opacity={0.6}
              textAnchor="middle"
              fontFamily={bodyFont}
            >
              {item.location}
            </text>
          )}
        </g>
      )
    }

    const topLaid = layoutRow(top)
    const bottomLaid = layoutRow(bottom)
    const viewBox = `${viewMinX} ${bounds.minY - TOP_BOTTOM_LABEL_MARGIN} ${viewWidth} ${
      bounds.maxY - bounds.minY + TOP_BOTTOM_LABEL_MARGIN * 2
    }`
    return (
      <svg viewBox={viewBox} className="w-full" style={{ display: 'block' }}>
        {visibleDots.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r={0.45} fill="#cbd5e1" />
        ))}
        {topLaid.map((m) => renderLabel(m, 'top'))}
        {bottomLaid.map((m) => renderLabel(m, 'bottom'))}
      </svg>
    )
  }

  const [leftRaw, rightRaw] = splitBalanced(markers, 'x')
  const left = [...leftRaw].sort((a, b) => a.y - b.y)
  const right = [...rightRaw].sort((a, b) => a.y - b.y)

  // Same reasoning as the top/bottom direction's own MIN_SLOT_WIDTH:
  // each label needs a minimum height (it's two lines of text) to not
  // overlap its neighbors, regardless of how tightly the markers
  // themselves are cropped vertically.
  const MIN_SLOT_HEIGHT = 20
  const maxColumnCount = Math.max(left.length, right.length, 1)
  const cropHeight = bounds.maxY - bounds.minY
  const viewHeight = Math.max(cropHeight, MIN_SLOT_HEIGHT * maxColumnCount)
  const viewMinY = (bounds.minY + bounds.maxY) / 2 - viewHeight / 2

  function layoutColumn(column) {
    if (column.length === 0) return []
    const slot = viewHeight / column.length
    return column.map((m, i) => ({ ...m, labelY: viewMinY + slot * i + slot / 2 }))
  }

  const leftLaid = layoutColumn(left)
  const rightLaid = layoutColumn(right)

  function renderLabel({ item, x, y, labelY }, side) {
    const labelX = side === 'left' ? bounds.minX - SIDE_LABEL_MARGIN + 4 : bounds.maxX + SIDE_LABEL_MARGIN - 4
    const anchor = side === 'left' ? 'start' : 'end'
    const lineEndX = side === 'left' ? bounds.minX - 6 : bounds.maxX + 6
    return (
      <g key={item.id}>
        <line x1={x} y1={y} x2={lineEndX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
        <line x1={lineEndX} y1={labelY} x2={labelX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
        <circle cx={x} cy={y} r={1.1} fill={accentColor} />
        <text x={labelX} y={labelY - 2} fontSize={4.8} fontWeight={700} fill={accentColor} textAnchor={anchor} fontFamily={bodyFont}>
          {item.title}
        </text>
        {item.location && (
          <text x={labelX} y={labelY + 3} fontSize={3.6} fill="currentColor" opacity={0.6} textAnchor={anchor} fontFamily={bodyFont}>
            {item.location}
          </text>
        )}
      </g>
    )
  }

  const viewBox = `${bounds.minX - SIDE_LABEL_MARGIN} ${viewMinY} ${
    bounds.maxX - bounds.minX + SIDE_LABEL_MARGIN * 2
  } ${viewHeight}`
  return (
    <svg viewBox={viewBox} className="w-full" style={{ display: 'block' }}>
      {visibleDots.map(({ x, y }, i) => (
        <circle key={i} cx={x} cy={y} r={0.45} fill="#cbd5e1" />
      ))}
      {leftLaid.map((m) => renderLabel(m, 'left'))}
      {rightLaid.map((m) => renderLabel(m, 'right'))}
    </svg>
  )
}
