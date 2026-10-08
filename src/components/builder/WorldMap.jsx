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

// The `sides` direction's margins are almost entirely text — unlike
// topBottom (where label overflow is a modest addition on top of a
// geography-driven crop width). Because the SVG always renders at
// `viewportWidthPx / naturalWidthUnits` px per unit by construction, a
// label sized as `targetPx * (naturalWidthUnits/viewportWidthPx)`
// units renders at EXACTLY targetPx, no matter what naturalWidthUnits
// turns out to be — so the margin (in px) must itself be derived from
// that same final size, or the two drift apart. Solving
// `naturalWidth = crop + 2*margin(naturalWidth)` directly (closed
// form, not an iterative re-guess) keeps them consistent in one step.
// When a title is so long that giving it the full page-matching size
// on both sides would leave the map crop under a floor fraction of the
// width, every target size shrinks by the one scale factor that
// exactly restores that floor — the text still reads at a single
// coherent size, just a little smaller than the rest of the page,
// rather than silently overflowing into the map.
function computeSidesMetrics(cropWidthUnits, viewportWidthPx, titleFontSizePx, bodyFontSizePx, markers, titleFont, bodyFont, titleBold) {
  const titlePx = titleFontSizePx || 16
  const subtitlePx = bodyFontSizePx || 14
  if (!(viewportWidthPx > 0)) {
    const metrics = computeLabelMetrics(cropWidthUnits, viewportWidthPx, titleFontSizePx, bodyFontSizePx)
    const sideLabelMargin =
      Math.max(...markers.map((m) => measureLabelWidth(m.item, titleFont, bodyFont, metrics.titleSize, metrics.subtitleSize, titleBold)), metrics.titleSize * 3) +
      metrics.subtitleSize
    return { ...metrics, sideLabelMargin }
  }
  const maxLabelPx = Math.max(
    ...markers.map((m) => Math.max(measureTextWidth(m.item.title, titlePx, titleFont, titleBold !== false), measureTextWidth(labelSubtitle(m.item), subtitlePx, bodyFont, false))),
    titlePx * 3,
  )
  const marginPxAtFullSize = maxLabelPx + subtitlePx
  // Leaves at least 15% of the width for the map crop itself.
  const minCropFraction = 0.15
  const scale = Math.min(1, ((1 - minCropFraction) * viewportWidthPx) / (2 * marginPxAtFullSize))
  const marginPx = marginPxAtFullSize * scale
  const denom = 1 - (2 * marginPx) / viewportWidthPx
  const naturalWidthUnits = cropWidthUnits / denom
  const unitsPerPx = naturalWidthUnits / viewportWidthPx
  const titleSize = titlePx * scale * unitsPerPx
  const subtitleSize = subtitlePx * scale * unitsPerPx
  const blockHeight = titleSize * 1.1 + subtitleSize * 1.25 + subtitleSize * 0.5
  const step = blockHeight + subtitleSize * 0.7
  const sideLabelMargin = (naturalWidthUnits - cropWidthUnits) / 2
  return { titleSize, subtitleSize, step, sideLabelMargin }
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
  targetAspect,
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
        titleFont={titleFont}
        titleColor={titleColor}
        titleFontSizePx={titleFontSizePx}
        titleBold={titleBold}
        direction={leaderDirection}
        targetAspect={targetAspect}
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

function NumberedMap({ markers, worldDots, accentColor, bodyFont, titleFont, textColor, titleColor, titleFontSizePx, titleBold }) {
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
                  color: titleColor || accentColor,
                  fontFamily: titleFont,
                  fontSize: titleFontSizePx ? `${titleFontSizePx}px` : undefined,
                  fontWeight: titleBold === false ? 400 : 700,
                }}
              >
                {item.title}
              </span>
              {labelSubtitle(item) && (
                <span className="text-sm opacity-70" style={{ color: textColor, fontFamily: bodyFont }}>
                  {labelSubtitle(item)}
                </span>
              )}
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
function assignTiers(row, titleFont, bodyFont, metrics, titleBold) {
  const sorted = [...row].sort((a, b) => a.x - b.x)
  const n = sorted.length
  return sorted.map((m, i) => {
    const width = measureLabelWidth(m.item, titleFont, bodyFont, metrics.titleSize, metrics.subtitleSize, titleBold)
    return { ...m, labelX: m.x, left: m.x, right: m.x + metrics.dashLen + 2 + width, tier: n - 1 - i }
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

// Lays out the top/bottom tiers for a given set of label metrics,
// returning the resulting view width along with everything needed to
// render — split out so the real font-size scale (which depends on
// that final width, not just the markers' own tight crop) can be
// solved by computing this twice: once with a first guess, once more
// with the width that guess actually produced.
function computeTopBottomLayout(markers, bounds, titleFont, bodyFont, metrics, titleBold) {
  const [topRaw, bottomRaw] = splitBalanced(markers, 'y')
  const top = assignTiers(topRaw, titleFont, bodyFont, metrics, titleBold)
  const bottom = assignTiers(bottomRaw, titleFont, bodyFont, metrics, titleBold)
  const allLaid = [...top, ...bottom]
  const labelMinX = Math.min(...allLaid.map((m) => m.labelX))
  const labelMaxX = Math.max(...allLaid.map((m) => m.labelX + (m.right - m.left)))
  const minX = Math.min(bounds.minX, labelMinX)
  const maxX = Math.max(bounds.maxX, labelMaxX)
  return { top, bottom, topTiers: top.length, bottomTiers: bottom.length, minX, maxX, viewWidth: maxX - minX }
}

function LeaderMap({
  markers,
  worldDots,
  accentColor,
  bodyFont,
  titleFont,
  titleColor,
  titleFontSizePx,
  titleBold,
  direction = 'sides',
  targetAspect,
  viewportWidthPx,
  bodyFontSizePx,
}) {
  const bounds = computeMapBounds(markers)

  if (direction === 'topBottom') {
    // The real pixel size the label text ends up at depends on the
    // FINAL view width (crop plus however much labels overflow it),
    // not just the markers' own tight crop — guessing with the tight
    // crop alone under-sizes the font whenever the label overflow
    // that guess produced turns out to dominate the width (a handful
    // of long titles on a very tight crop). One extra pass, re-scaling
    // against the width the first guess actually produced, settles on
    // the real match to the page's own type scale.
    let metrics = computeLabelMetrics(bounds.maxX - bounds.minX, viewportWidthPx, titleFontSizePx, bodyFontSizePx)
    let layout = computeTopBottomLayout(markers, bounds, titleFont, bodyFont, metrics, titleBold)
    if (viewportWidthPx > 0) {
      metrics = computeLabelMetrics(layout.viewWidth, viewportWidthPx, titleFontSizePx, bodyFontSizePx)
      layout = computeTopBottomLayout(markers, bounds, titleFont, bodyFont, metrics, titleBold)
    }
    const { top, bottom, topTiers, bottomTiers, minX, viewWidth } = layout
    const baseMargin = metrics.step * 0.6
    const cropHeight = bounds.maxY - bounds.minY

    // The block can be resized to any height, independent of what the
    // content actually needs — and when it's made taller than the
    // natural minimum, the extra room should go into spacing the labels
    // further apart (so a tall block doesn't look like a small map
    // glued to the top with blank space below it), never into the map
    // itself growing past the tight crop it already has. Each tier's
    // own height only grows beyond metrics.step when there's a target
    // aspect ratio taller than what the natural layout would produce.
    const naturalHeight = cropHeight + baseMargin * 2 + (topTiers + bottomTiers) * metrics.step
    const naturalAspect = viewWidth / naturalHeight
    let topStep = metrics.step
    let bottomStep = metrics.step
    if (targetAspect > 0 && targetAspect < naturalAspect) {
      const requiredHeight = viewWidth / targetAspect
      const extraHeight = requiredHeight - naturalHeight
      const totalTiers = topTiers + bottomTiers || 1
      if (topTiers > 0) topStep = metrics.step + (extraHeight * (topTiers / totalTiers)) / topTiers
      if (bottomTiers > 0) bottomStep = metrics.step + (extraHeight * (bottomTiers / totalTiers)) / bottomTiers
    }
    const topMargin = baseMargin + topTiers * topStep
    const bottomMargin = baseMargin + bottomTiers * bottomStep

    const visibleDots = worldDots
      .map(([lng, lat]) => project(lng, lat))
      .filter(({ x, y }) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY)

    // Straight leader line from the marker up/down to its own tier,
    // ending in a short dash before the text — "— Dublin", left-aligned,
    // title then address below it — reading like a real map callout
    // instead of a centered floating label.
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
          <line x1={x} y1={y} x2={labelX} y2={rail} stroke="#94a3b8" strokeWidth={0.4} />
          <line x1={labelX} y1={rail} x2={labelX + metrics.dashLen} y2={rail} stroke="#94a3b8" strokeWidth={0.4} />
          <circle cx={x} cy={y} r={1.1} fill={accentColor} />
          <text
            x={textX}
            y={titleY}
            fontSize={metrics.titleSize}
            fontWeight={titleBold === false ? 400 : 700}
            fill={titleColor || accentColor}
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

    const viewBox = `${minX} ${bounds.minY - topMargin} ${viewWidth} ${cropHeight + topMargin + bottomMargin}`
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
  const metrics = computeSidesMetrics(bounds.maxX - bounds.minX, viewportWidthPx, titleFontSizePx, bodyFontSizePx, markers, titleFont, bodyFont, titleBold)
  const sideLabelMargin = metrics.sideLabelMargin

  // Same reasoning, on the vertical axis: each label needs a minimum
  // height (it's two lines of text) to not overlap its neighbors,
  // regardless of how tightly the markers themselves are cropped
  // vertically.
  const maxColumnCount = Math.max(left.length, right.length, 1)
  const cropHeight = bounds.maxY - bounds.minY
  let viewHeight = Math.max(cropHeight, metrics.step * maxColumnCount)
  // As with the topBottom direction, a block resized taller than this
  // natural minimum should spread the column's labels further apart —
  // not stretch the map crop itself — to fill the extra room.
  const naturalWidth = bounds.maxX - bounds.minX + sideLabelMargin * 2
  const naturalAspect = naturalWidth / viewHeight
  if (targetAspect > 0 && targetAspect < naturalAspect) {
    viewHeight = naturalWidth / targetAspect
  }
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
        <text
          x={labelX}
          y={labelY - metrics.subtitleSize * 0.55}
          fontSize={metrics.titleSize}
          fontWeight={titleBold === false ? 400 : 700}
          fill={titleColor || accentColor}
          textAnchor={anchor}
          fontFamily={titleFont}
        >
          {item.title}
        </text>
        {labelSubtitle(item) && (
          <text
            x={labelX}
            y={labelY + metrics.subtitleSize * 0.85}
            fontSize={metrics.subtitleSize}
            fill="currentColor"
            opacity={0.6}
            textAnchor={anchor}
            fontFamily={bodyFont}
          >
            {labelSubtitle(item)}
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
