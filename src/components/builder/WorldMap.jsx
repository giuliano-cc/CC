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

export default function WorldMap({ items, accentColor, legendStyle = 'numbered', bodyFont }) {
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
    return <LeaderMap markers={markers} worldDots={worldDots} accentColor={accentColor} bodyFont={bodyFont} />
  }
  return <NumberedMap markers={markers} worldDots={worldDots} accentColor={accentColor} bodyFont={bodyFont} />
}

// Basemap is derived from Natural Earth (public domain, no attribution
// required); place names/coordinates are GeoNames data via the
// `all-the-cities` package, under GeoNames' own CC BY 4.0 license,
// which does require it — shown the same unobtrusive way the reference
// examples credit their own basemap source.
function MapAttribution() {
  return <p className="text-[8px] text-slate-400">Map: Natural Earth · Places: GeoNames (CC BY 4.0)</p>
}

function NumberedMap({ markers, worldDots, accentColor }) {
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full" style={{ display: 'block' }}>
        {worldDots.map(([lng, lat], i) => {
          const { x, y } = project(lng, lat)
          return <circle key={i} cx={x} cy={y} r={0.45} fill="#cbd5e1" />
        })}
        {markers.map(({ item, index, x, y }) => (
          <g key={item.id || index}>
            <circle cx={x} cy={y} r={1.4} fill={accentColor} />
            <text x={x + 2} y={y - 1.5} fontSize={4.2} fontWeight={700} fill={accentColor}>
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
      <MapAttribution />
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

// Labels stacked in two columns (left/right of the map, split by which
// side of the map's own horizontal center each marker falls on — the
// same rough left/right grouping the reference layout uses), each
// connected to its marker by a straight leader line. A wider viewBox
// than the map itself reserves room on both sides for the label text,
// so the whole thing — dots, markers, lines, and labels — is one SVG
// in a single coordinate space (what makes the leader lines land
// exactly on the label they belong to, however the container is
// eventually scaled).
const LABEL_MARGIN = 130
const LEADER_VIEW_WIDTH = MAP_WIDTH + LABEL_MARGIN * 2

function LeaderMap({ markers, worldDots, accentColor, bodyFont }) {
  const mapCenterX = MAP_WIDTH / 2
  const left = markers.filter((m) => m.x < mapCenterX).sort((a, b) => a.y - b.y)
  const right = markers.filter((m) => m.x >= mapCenterX).sort((a, b) => a.y - b.y)

  function layoutColumn(column) {
    if (column.length === 0) return []
    const slot = MAP_HEIGHT / column.length
    return column.map((m, i) => ({ ...m, labelY: slot * i + slot / 2 }))
  }

  const leftLaid = layoutColumn(left)
  const rightLaid = layoutColumn(right)

  function renderLabel({ item, x, y, labelY }, side) {
    const labelX = side === 'left' ? 4 : LEADER_VIEW_WIDTH - 4
    const anchor = side === 'left' ? 'start' : 'end'
    const lineEndX = side === 'left' ? LABEL_MARGIN - 6 : LABEL_MARGIN + MAP_WIDTH + 6
    return (
      <g key={item.id}>
        <line x1={x + LABEL_MARGIN} y1={y} x2={lineEndX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
        <line x1={lineEndX} y1={labelY} x2={labelX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
        <circle cx={x + LABEL_MARGIN} cy={y} r={1.1} fill={accentColor} />
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

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${LEADER_VIEW_WIDTH} ${MAP_HEIGHT}`} className="w-full" style={{ display: 'block' }}>
        {worldDots.map(([lng, lat], i) => {
          const { x, y } = project(lng, lat)
          return <circle key={i} cx={x + LABEL_MARGIN} cy={y} r={0.45} fill="#cbd5e1" />
        })}
        {leftLaid.map((m) => renderLabel(m, 'left'))}
        {rightLaid.map((m) => renderLabel(m, 'right'))}
      </svg>
      <MapAttribution />
    </div>
  )
}
