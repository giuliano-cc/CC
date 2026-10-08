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

// SVG <text> never wraps, so only the description's first line (its
// summary, when it's written as a lead-in sentence plus bullet points)
// is usable as a one-line subtitle under the title.
function labelSubtitle(item) {
  return (item.description || '').split('\n')[0].trim()
}

// Shortens text with a trailing "…" until it measures within maxWidth —
// used only where a label's own width genuinely has nowhere left to
// grow (the 'sides' style's two columns share the map's width between
// them, unlike 'numbered'/'topBottom' where a label can freely claim as
// much of the full width as it needs). Without this, a long title or a
// full-sentence description routinely ran clear across the map into the
// opposite column's text, overlapping it into illegibility. Binary
// search over substring length rather than trimming one character at a
// time — the same number of measureText calls whether the text is 20
// characters or 200.
function truncateToWidth(text, maxWidth, fontSizePx, fontFamily, bold) {
  if (!text || maxWidth <= 0) return ''
  if (measureTextWidth(text, fontSizePx, fontFamily, bold) <= maxWidth) return text
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const candidate = `${text.slice(0, mid).trimEnd()}…`
    if (measureTextWidth(candidate, fontSizePx, fontFamily, bold) <= maxWidth) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  return lo <= 0 ? '…' : `${text.slice(0, lo).trimEnd()}…`
}

function measureLabelWidth(item, titleFont, bodyFont, titleSize, subtitleSize, titleBold) {
  return Math.max(
    measureTextWidth(item.title, titleSize, titleFont, titleBold !== false),
    measureTextWidth(labelSubtitle(item), subtitleSize, bodyFont, false),
  )
}

// SVG font sizes live in viewBox units, not pixels — a fixed "4.8" reads
// huge when the crop is tight (few units across the whole render width)
// and tiny when it's wide (many units across that same width). Scales
// the block's own configured title/body sizes (so the label text
// matches whatever the Properties panel set, as if it were plain HTML)
// into whatever number of viewBox units currently render at that many
// pixels, using the crop's own natural width (before any label-driven
// overflow) as the conversion rate — that rate only shifts with how
// much of the world is in view, not with the text itself.
function computeLabelMetrics(cropWidthUnits, viewportWidthPx, titleFontSizePx, bodyFontSizePx) {
  const unitsPerPx = viewportWidthPx > 0 ? cropWidthUnits / viewportWidthPx : 0.6
  const titleSize = (titleFontSizePx || 16) * unitsPerPx
  const subtitleSize = (bodyFontSizePx || 14) * unitsPerPx
  // One tier/column step: both text lines plus a little breathing room,
  // so consecutive labels never collide regardless of how big the
  // scaled fonts turn out to be.
  const blockHeight = titleSize * 1.1 + subtitleSize * 1.25 + subtitleSize * 0.5
  const step = blockHeight + subtitleSize * 0.7
  const dashLen = Math.max(4, subtitleSize * 1.2)
  return { titleSize, subtitleSize, step, dashLen }
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

export default function WorldMap({
  items,
  accentColor,
  legendStyle = 'numbered',
  leaderDirection = 'sides',
  bodyFont,
  titleFont,
  textColor,
  titleColor,
  titleFontSizePx,
  titleBold,
  viewportWidthPx,
  bodyFontSizePx,
}) {
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

  // `index` numbers the markers that actually made it onto the map, not
  // the item's own position in the full entries list — an entry whose
  // location is empty or couldn't be geocoded is dropped (no `point`),
  // and numbering by its original position would leave a gap (2, 3, 4…
  // instead of 1, 2, 3…) where that entry used to be.
  const markers = items
    .map((item, i) => {
      const point = points[i]
      if (!point) return null
      const { x, y } = project(point.lng, point.lat)
      return { item, x, y }
    })
    .filter(Boolean)
    .map((marker, index) => ({ ...marker, index }))

  if (legendStyle === 'leader') {
    return (
      <LeaderMap
        markers={markers}
        worldDots={worldDots}
        accentColor={accentColor}
        bodyFont={bodyFont}
        titleFont={titleFont}
        titleColor={titleColor}
        textColor={textColor}
        titleFontSizePx={titleFontSizePx}
        titleBold={titleBold}
        direction={leaderDirection}
        viewportWidthPx={viewportWidthPx}
        bodyFontSizePx={bodyFontSizePx}
      />
    )
  }
  return (
    <NumberedMap
      markers={markers}
      worldDots={worldDots}
      accentColor={accentColor}
      bodyFont={bodyFont}
      titleFont={titleFont}
      textColor={textColor}
      titleColor={titleColor}
      titleFontSizePx={titleFontSizePx}
      titleBold={titleBold}
      bodyFontSizePx={bodyFontSizePx}
    />
  )
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

function NumberedMap({ markers, worldDots, accentColor, bodyFont, titleFont, textColor, titleColor, titleFontSizePx, titleBold, bodyFontSizePx }) {
  const bounds = computeMapBounds(markers)
  const viewWidth = bounds.maxX - bounds.minX
  const viewHeight = bounds.maxY - bounds.minY
  const visibleDots = worldDots
    .map(([lng, lat]) => project(lng, lat))
    .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)
  const labels = layoutNumberLabels(markers, viewWidth, viewHeight)

  // Split the legend above/below the map (rather than all of it in one
  // block below) so the map itself sits in the middle of the block
  // instead of pinned to the top — same "map stays centered" goal as
  // the leader styles, reached here by framing it with text on both
  // sides instead of a flex wrapper alone (a legend twice as tall as
  // the map would otherwise still leave it looking stuck at the top).
  const half = Math.ceil(markers.length / 2)
  const topMarkers = markers.slice(0, half)
  const bottomMarkers = markers.slice(half)

  function renderLegend(list) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {list.map(({ item, index }) => (
          <div key={item.id || index} className="flex gap-2">
            {/* Only the number carries the accent color — title and
                description follow the block's own configurable text
                styling (Properties panel), same as any other entries
                list, so the legend reads as part of the document
                rather than a separately-styled widget. */}
            <span className="shrink-0 text-xs font-bold" style={{ color: accentColor, fontFamily: bodyFont }}>
              {index + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  color: titleColor || textColor,
                  fontFamily: titleFont,
                  fontSize: titleFontSizePx ? `${titleFontSizePx}px` : undefined,
                  fontWeight: titleBold === false ? 400 : 700,
                }}
              >
                {item.title}
              </span>
              {labelSubtitle(item) && (
                <span
                  className="opacity-70"
                  style={{
                    color: textColor,
                    fontFamily: bodyFont,
                    fontSize: bodyFontSizePx ? `${bodyFontSizePx}px` : undefined,
                  }}
                >
                  {labelSubtitle(item)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {topMarkers.length > 0 && renderLegend(topMarkers)}
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
      {bottomMarkers.length > 0 && renderLegend(bottomMarkers)}
    </div>
  )
}

// Labels stacked in two groups, each connected to its marker by a
// leader line — `direction: 'sides'` splits left/right of the map's
// own horizontal center (columns stacked top-to-bottom, the reference
// layout's own grouping); `direction: 'topBottom'` splits above/below
// its vertical center instead (rows stacked left-to-right). The margin
// reserved for labels is added directly to the cropped viewBox, rather
// than reserved inside the map's own 0..360/0..180 range like the
// original fixed-world version needed.

// Assigns each label a tier purely by its marker's rank along x — not
// by where it happens to fit — so the whole row reads as one
// deterministic staircase instead of whatever order a collision search
// landed on: the leftmost marker's label sits in the tier farthest
// from the map, the rightmost sits right next to it (tier 0), with
// every other one stepping evenly between. Since no two labels ever
// share a tier, there's no need to check for overlap — the picture is
// legible by construction, not by accident.
// Clamped so the label's own text never extends past the map's own
// crop edges (bounds.minX/maxX) — the map's width must stay identical
// to the numbered style's (same bounds, same viewportWidthPx), so
// there's no separate margin to grow into for an overflowing label;
// it just slides inward from the marker's own x instead, same as the
// sides direction already insets its labels from the crop's edges.
function assignTiers(row, titleFont, bodyFont, metrics, titleBold, bounds) {
  const sorted = [...row].sort((a, b) => a.x - b.x)
  const n = sorted.length
  return sorted.map((m, i) => {
    const width = measureLabelWidth(m.item, titleFont, bodyFont, metrics.titleSize, metrics.subtitleSize, titleBold) + metrics.dashLen + 2
    const labelX = Math.min(Math.max(m.x, bounds.minX), Math.max(bounds.minX, bounds.maxX - width))
    return { ...m, labelX, tier: n - 1 - i }
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

function computeTopBottomLayout(markers, bounds, titleFont, bodyFont, metrics, titleBold) {
  const [topRaw, bottomRaw] = splitBalanced(markers, 'y')
  const top = assignTiers(topRaw, titleFont, bodyFont, metrics, titleBold, bounds)
  const bottom = assignTiers(bottomRaw, titleFont, bodyFont, metrics, titleBold, bounds)
  return { top, bottom, topTiers: top.length, bottomTiers: bottom.length }
}

function LeaderMap({
  markers,
  worldDots,
  accentColor,
  bodyFont,
  titleFont,
  titleColor,
  textColor,
  titleFontSizePx,
  titleBold,
  direction = 'sides',
  viewportWidthPx,
  bodyFontSizePx,
}) {
  const bounds = computeMapBounds(markers)

  if (direction === 'topBottom') {
    // The map's own width must be identical to the numbered style's —
    // same bounds, same viewportWidthPx — so labels are clamped to fit
    // within that fixed crop (assignTiers, above) instead of widening
    // it; the font scale is a single direct conversion, the same one
    // the numbered style and the crop itself already use.
    const viewWidth = bounds.maxX - bounds.minX
    const metrics = computeLabelMetrics(viewWidth, viewportWidthPx, titleFontSizePx, bodyFontSizePx)
    const { top, bottom, topTiers, bottomTiers } = computeTopBottomLayout(markers, bounds, titleFont, bodyFont, metrics, titleBold)
    const baseMargin = metrics.step * 0.6
    const cropHeight = bounds.maxY - bounds.minY

    // The block can be resized to any height, independent of what the
    // content actually needs — but stretching each tier's own spacing to
    // fill that extra room (as this used to) distorts badly whenever the
    // top/bottom split is uneven: the smaller side's few tiers each
    // absorb a huge share of the extra height, opening a large blank gap
    // before a cramped cluster rather than anything resembling a
    // centered map. The layout instead always stays at its natural,
    // compact size — any extra height a resized block leaves over is
    // just centered blank space around it (see the flex wrapper around
    // this component in BlockRenderer.jsx), never a reason to stretch.
    const topStep = metrics.step
    const bottomStep = metrics.step
    const topMargin = baseMargin + topTiers * topStep
    const bottomMargin = baseMargin + bottomTiers * bottomStep

    const visibleDots = worldDots
      .map(([lng, lat]) => project(lng, lat))
      .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)

    // Orthogonal leader line from the marker to its own tier — a
    // straight vertical run up/down from the marker to the tier's own
    // rail, then a straight horizontal run into the text — same
    // right-angle construction as the 'sides' style's leaders, not a
    // single diagonal line crossing straight from the marker to the
    // label.
    function renderLabel({ item, x, y, labelX, tier }, pos) {
      const step = pos === 'top' ? topStep : bottomStep
      const nearOffset = baseMargin + tier * step
      const rail = pos === 'top' ? bounds.minY - nearOffset : bounds.maxY + nearOffset
      const textX = labelX + metrics.dashLen + 2
      const pad = metrics.subtitleSize * 0.5
      const titleY = pos === 'top' ? rail - pad - metrics.subtitleSize * 1.1 : rail + pad + metrics.titleSize * 0.85
      const locY = pos === 'top' ? rail - pad : titleY + metrics.subtitleSize * 1.15
      return (
        <g key={item.id}>
          <line x1={x} y1={y} x2={x} y2={rail} stroke="#94a3b8" strokeWidth={0.4} />
          <line x1={x} y1={rail} x2={labelX + metrics.dashLen} y2={rail} stroke="#94a3b8" strokeWidth={0.4} />
          <circle cx={x} cy={y} r={1.1} fill={accentColor} />
          <text
            x={textX}
            y={titleY}
            fontSize={metrics.titleSize}
            fontWeight={titleBold === false ? 400 : 700}
            fill={titleColor || textColor}
            textAnchor="start"
            fontFamily={titleFont}
          >
            {item.title}
          </text>
          {labelSubtitle(item) && (
            <text
              x={textX}
              y={locY}
              fontSize={metrics.subtitleSize}
              fill="currentColor"
              opacity={0.6}
              textAnchor="start"
              fontFamily={bodyFont}
            >
              {labelSubtitle(item)}
            </text>
          )}
        </g>
      )
    }

    const viewBox = `${bounds.minX} ${bounds.minY - topMargin} ${viewWidth} ${cropHeight + topMargin + bottomMargin}`
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

  // Same font-size scale the numbered style and topBottom both use — the
  // map's own width must match the numbered style's exactly, so there's
  // no separate side margin to size a font against; labels are inset
  // from the (fixed) crop's own edges instead (below), same width as
  // the numbered style, always.
  const viewWidthFixed = bounds.maxX - bounds.minX
  const metrics = computeLabelMetrics(viewWidthFixed, viewportWidthPx, titleFontSizePx, bodyFontSizePx)
  const inset = metrics.subtitleSize * 0.8
  // The two columns split the map's width between them — unlike
  // 'numbered'/'topBottom', where a label can freely claim the full
  // width, a long title or a full-sentence description here has nowhere
  // left to grow into once it reaches the opposite column. Capped at
  // half the map's width (minus the inset and a small gutter) so left
  // and right labels can never run into each other regardless of how
  // long the underlying text is.
  const maxTextWidth = Math.max(0, viewWidthFixed / 2 - inset - metrics.subtitleSize * 0.6)

  // Each label anchors as close as possible to its own marker's true
  // y — sliding down only as far as it has to, to clear the previous
  // (already-placed) label in the same column — instead of being
  // spread evenly across however tall the view ends up being. Evenly
  // spreading ignored where the markers actually are, so a label could
  // land far from its own marker even when nothing forced it to;
  // anchoring first (and only pushing when two would truly collide)
  // keeps the leader line short and close to straight whenever the
  // marker's own spacing already leaves room, the same "move only when
  // something would otherwise overlap" principle topBottom's tiers use.
  function layoutColumn(column, gap) {
    if (column.length === 0) return { laid: [], top: null, bottom: null }
    let cursor = -Infinity
    const laid = column.map((m) => {
      const labelY = Math.max(m.y, cursor)
      cursor = labelY + gap
      return { ...m, labelY }
    })
    return { laid, top: laid[0].labelY, bottom: cursor - gap }
  }

  // Stays at its natural, compact gap always — stretching it to fill a
  // resized-taller block (as this used to) distorts badly whenever the
  // left/right split is uneven, same reason topBottom no longer stretches
  // its own tiers either: any leftover height is just centered blank
  // space around the natural layout (see the flex wrapper in
  // BlockRenderer.jsx), never a reason to spread labels further apart.
  const gap = metrics.step
  const { laid: leftLaid, top: leftTop, bottom: leftBottom } = layoutColumn(left, gap)
  const { laid: rightLaid, top: rightTop, bottom: rightBottom } = layoutColumn(right, gap)

  const viewMinY = Math.min(bounds.minY, leftTop ?? Infinity, rightTop ?? Infinity)
  const viewHeight = Math.max(bounds.maxY, leftBottom ?? -Infinity, rightBottom ?? -Infinity) - viewMinY

  // Labels sit inside the map's own width (inset from its edges) rather
  // than in a separate reserved margin — the crop stays exactly the
  // numbered style's width either way. The leader is orthogonal (a
  // straight vertical run from the marker to the label's own row, then
  // a straight horizontal run into the label), not a single diagonal
  // line — same right-angle construction as topBottom's rail-and-dash.
  function renderLabel({ item, x, y, labelY }, side) {
    const labelX = side === 'left' ? bounds.minX + inset : bounds.maxX - inset
    const anchor = side === 'left' ? 'start' : 'end'
    const titleBoldValue = titleBold !== false
    const title = truncateToWidth(item.title, maxTextWidth, metrics.titleSize, titleFont, titleBoldValue)
    const subtitle = truncateToWidth(labelSubtitle(item), maxTextWidth, metrics.subtitleSize, bodyFont, false)
    return (
      <g key={item.id}>
        <line x1={x} y1={y} x2={x} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
        <line x1={x} y1={labelY} x2={labelX} y2={labelY} stroke="#94a3b8" strokeWidth={0.4} />
        <circle cx={x} cy={y} r={1.1} fill={accentColor} />
        <text
          x={labelX}
          y={labelY - metrics.subtitleSize * 0.55}
          fontSize={metrics.titleSize}
          fontWeight={titleBoldValue ? 700 : 400}
          fill={titleColor || textColor}
          textAnchor={anchor}
          fontFamily={titleFont}
        >
          {title}
        </text>
        {subtitle && (
          <text
            x={labelX}
            y={labelY + metrics.subtitleSize * 0.85}
            fontSize={metrics.subtitleSize}
            fill="currentColor"
            opacity={0.6}
            textAnchor={anchor}
            fontFamily={bodyFont}
          >
            {subtitle}
          </text>
        )}
      </g>
    )
  }

  const viewBox = `${bounds.minX} ${viewMinY} ${viewWidthFixed} ${viewHeight}`
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
