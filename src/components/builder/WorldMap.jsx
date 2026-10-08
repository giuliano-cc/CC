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

// Measures real rendered text width (in viewBox units — font sizes
// throughout this file are already in those same units, so a canvas
// using the exact same font-size/weight/family gives an exact match)
// instead of guessing a fixed width per label — a label is "Nine Elms
// Parkside" for one project and "MIND - Milan Innovation District
// Masterplan" for another, and a single fixed slot width can only fit
// one of those without either overlapping or wasting space.
let _measureCanvas = null
function measureTextWidth(text, fontSizePx, fontFamily, bold) {
  if (!text) return 0
  try {
    if (!_measureCanvas) _measureCanvas = document.createElement('canvas')
    const ctx = _measureCanvas.getContext('2d')
    ctx.font = `${bold ? '700 ' : ''}${fontSizePx}px ${fontFamily || 'sans-serif'}`
    return ctx.measureText(text).width
  } catch {
    // Canvas unavailable for some reason — a rough average-character-width
    // estimate so layout still degrades gracefully instead of crashing.
    return text.length * fontSizePx * 0.55
  }
}

function measureLabelWidth(item, bodyFont) {
  return Math.max(
    measureTextWidth(item.title, 4.8, bodyFont, true),
    measureTextWidth(item.location || '', 3.6, bodyFont, false),
  )
}

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
// would otherwise land right on top of each other and on top of the
// dots themselves. Instead of merging close markers into one combined
// label ("1,7"), each marker keeps its own number — close ones are
// fanned out in a small circle around their shared center (each still
// connected by its own thin leader line back to its true dot), and
// isolated ones get a short offset stub, matching the reference
// callout-map style where every point gets its own number and line.
function layoutNumberLabels(markers, viewWidth, viewHeight) {
  const threshold = Math.max(viewWidth, viewHeight) * 0.035
  const clusters = []
  for (const marker of markers) {
    const existing = clusters.find((c) => Math.hypot(c.cx - marker.x, c.cy - marker.y) < threshold)
    if (existing) {
      existing.members.push(marker)
    } else {
      clusters.push({ cx: marker.x, cy: marker.y, members: [marker] })
    }
  }
  const radius = threshold * 1.4
  const labels = []
  for (const cluster of clusters) {
    const n = cluster.members.length
    const cx = cluster.members.reduce((sum, m) => sum + m.x, 0) / n
    const cy = cluster.members.reduce((sum, m) => sum + m.y, 0) / n
    cluster.members.forEach((m, i) => {
      if (n === 1) {
        labels.push({ marker: m, labelX: m.x + radius * 0.6, labelY: m.y - radius * 0.6 })
      } else {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2
        labels.push({ marker: m, labelX: cx + Math.cos(angle) * radius, labelY: cy + Math.sin(angle) * radius })
      }
    })
  }
  return labels
}

function NumberedMap({ markers, worldDots, accentColor }) {
  const bounds = computeMapBounds(markers)
  const viewWidth = bounds.maxX - bounds.minX
  const viewHeight = bounds.maxY - bounds.minY
  const visibleDots = worldDots
    .map(([lng, lat]) => project(lng, lat))
    .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)
  const labels = layoutNumberLabels(markers, viewWidth, viewHeight)
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`${bounds.minX} ${bounds.minY} ${viewWidth} ${viewHeight}`} className="w-full" style={{ display: 'block' }}>
        {visibleDots.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r={0.45} fill="#cbd5e1" />
        ))}
        {markers.map(({ item, index, x, y }) => (
          <circle key={item.id || index} cx={x} cy={y} r={1.4} fill={accentColor} />
        ))}
        {labels.map(({ marker, labelX, labelY }) => (
          <g key={marker.item.id || marker.index}>
            <line x1={marker.x} y1={marker.y} x2={labelX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
            <text x={labelX} y={labelY} fontSize={4.2} fontWeight={700} fill={accentColor} textAnchor="middle" dominantBaseline="middle">
              {marker.index + 1}
            </text>
          </g>
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
const TOP_BOTTOM_LABEL_MARGIN = 20
const TIER_HEIGHT = 14
const LABEL_GAP = 6

// Assigns each label (sorted by its marker's x) to the lowest
// horizontal "tier" (row of labels, stacked further from the map the
// higher the tier) whose last-placed label doesn't overlap it — the
// same greedy interval-coloring used for calendar/timeline labels.
// This lets labels that are close together in x spread out vertically
// instead of fighting for room on one shared horizontal line, so the
// map's own crop never has to grow just to fit a long row of text.
function assignTiers(row, bodyFont) {
  const tierRightEdge = []
  return row.map((m) => {
    const width = measureLabelWidth(m.item, bodyFont)
    const left = m.x - width / 2
    const right = m.x + width / 2
    let tier = 0
    while (tierRightEdge[tier] !== undefined && left < tierRightEdge[tier] + LABEL_GAP) {
      tier += 1
    }
    tierRightEdge[tier] = right
    return { ...m, labelX: m.x, left, right, tier }
  })
}

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

  if (direction === 'topBottom') {
    const [topRaw, bottomRaw] = splitBalanced(markers, 'y')
    const top = assignTiers([...topRaw].sort((a, b) => a.x - b.x), bodyFont)
    const bottom = assignTiers([...bottomRaw].sort((a, b) => a.x - b.x), bodyFont)
    const topTiers = Math.max(0, ...top.map((m) => m.tier), -1) + 1
    const bottomTiers = Math.max(0, ...bottom.map((m) => m.tier), -1) + 1

    // The view only grows beyond the markers' own tight crop when a
    // label actually overflows it (e.g. a wide title centered on a
    // marker near the crop's edge) — never to fit an entire row on one
    // line, since tiering already spreads same-row labels vertically
    // instead of needing more horizontal room.
    const allLaid = [...top, ...bottom]
    const minX = Math.min(bounds.minX, ...allLaid.map((m) => m.left))
    const maxX = Math.max(bounds.maxX, ...allLaid.map((m) => m.right))
    const topMargin = TOP_BOTTOM_LABEL_MARGIN + topTiers * TIER_HEIGHT
    const bottomMargin = TOP_BOTTOM_LABEL_MARGIN + bottomTiers * TIER_HEIGHT

    const visibleDots = worldDots
      .map(([lng, lat]) => project(lng, lat))
      .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)

    function renderLabel({ item, x, y, labelX, tier }, pos) {
      const nearOffset = TOP_BOTTOM_LABEL_MARGIN + tier * TIER_HEIGHT
      const rail = pos === 'top' ? bounds.minY - nearOffset : bounds.maxY + nearOffset
      const labelY = pos === 'top' ? rail - 8 : rail + 8
      return (
        <g key={item.id}>
          <line x1={x} y1={y} x2={labelX} y2={rail} stroke="#94a3b8" strokeWidth={0.4} />
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

    const viewBox = `${minX} ${bounds.minY - topMargin} ${maxX - minX} ${bounds.maxY - bounds.minY + topMargin + bottomMargin}`
    return (
      <svg viewBox={viewBox} className="w-full" style={{ display: 'block' }}>
        {visibleDots.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r={0.45} fill="#cbd5e1" />
        ))}
        {top.map((m) => renderLabel(m, 'top'))}
        {bottom.map((m) => renderLabel(m, 'bottom'))}
      </svg>
    )
  }

  const visibleDots = worldDots
    .map(([lng, lat]) => project(lng, lat))
    .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)

  const [leftRaw, rightRaw] = splitBalanced(markers, 'x')
  const left = [...leftRaw].sort((a, b) => a.y - b.y)
  const right = [...rightRaw].sort((a, b) => a.y - b.y)

  // The side margin needs to fit the widest label actually present —
  // a fixed guess clips long titles like "MIND - Milan Innovation
  // District Masterplan" against the block's own edge.
  const sideLabelMargin = Math.max(...markers.map((m) => measureLabelWidth(m.item, bodyFont)), 40) + 14

  // Same reasoning, on the vertical axis: each label needs a minimum
  // height (it's two lines of text) to not overlap its neighbors,
  // regardless of how tightly the markers themselves are cropped
  // vertically.
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
    const labelX = side === 'left' ? bounds.minX - sideLabelMargin + 4 : bounds.maxX + sideLabelMargin - 4
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

  const viewBox = `${bounds.minX - sideLabelMargin} ${viewMinY} ${
    bounds.maxX - bounds.minX + sideLabelMargin * 2
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
