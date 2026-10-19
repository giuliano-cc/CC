import { CHART_STYLES } from '../../../utils/blockTypes'
import { translateSectionTitle } from '../../../utils/sectionTitles'
import { RefreshCw } from 'lucide-react'
import { sectionTitleStyle, titleTextTransformValue } from './shared'

// `levelDisplay` ('visual' | 'text' | 'both', default 'both') is the
// explicit choice from LevelDisplayField in PropertiesPanel — showing the
// bar/dots/pill AND the level text together used to be forced the moment a
// custom level text was set, which crowded a plain percentage bar with
// redundant text; now it's opt-in.
function SkillBar({ label, level, levelText, levelDisplay = 'both', color, labelStyle }) {
  const showText = levelDisplay !== 'visual'
  const showBar = levelDisplay !== 'text'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium" style={labelStyle}>{label}</span>
        {showText && <span className="opacity-60">{levelText || `${level}%`}</span>}
      </div>
      {showBar && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, level))}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  )
}

function SkillDots({ label, level, levelText, levelDisplay = 'both', color, dotSize = 10, dotCount = 5, labelStyle }) {
  const filled = Math.round((Math.max(0, Math.min(100, level)) / 100) * dotCount)
  const showText = levelDisplay !== 'visual'
  const showDots = levelDisplay !== 'text'
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium" style={labelStyle}>{label}</span>
      <div className="flex items-center gap-2">
        {showText && <span className="opacity-60">{levelText || `${level}%`}</span>}
        {showDots && (
          <div className="flex items-center gap-1">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: i < filled ? color : '#e2e8f0',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SkillTag({ label, levelText, levelDisplay = 'both', color, labelStyle }) {
  const showText = levelDisplay !== 'visual' && levelText
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
      // The tag's own text is always white for contrast against its
      // colored fill — only the font (not the color) follows labelStyle.
      style={{ backgroundColor: color, fontFamily: labelStyle?.fontFamily, fontSize: labelStyle?.fontSize }}
    >
      {showText ? `${label}: ${levelText}` : label}
    </span>
  )
}

// Shared by the Technical Skills and Languages chart blocks: same three
// styles (bars/dots/tags), same "cycle style" hover button, same dot-size
// control — only the underlying items differ.
// Bars have always defaulted to showing their percentage alongside the
// bar; dots and tags have always defaulted to visual-only (no numeric or
// custom text). Only used when the block has no explicit levelDisplay of
// its own yet, so existing templates keep looking exactly as they did
// before this setting existed — LevelDisplayField's own default value
// ('both') is a deliberate, separate choice for once someone actually
// opens that dropdown.
function defaultLevelDisplay(chartStyle) {
  return chartStyle === 'bars' ? 'both' : 'visual'
}

export default function Chart({ block, items, onUpdateBlock, accentColor, titleFont, lang, titleOverrides, labelStyle }) {
  const chartStyle = block.chartStyle || 'bars'
  const levelDisplay = block.levelDisplay || defaultLevelDisplay(chartStyle)
  const showTitle = block.title && block.showTitle !== false
  return (
    <div className="group/chart flex flex-col gap-3">
      <div className={`flex items-end justify-between ${showTitle && block.titleRule !== false ? 'border-b border-slate-200 pb-1.5' : ''}`}>
        {showTitle && (
          <p style={sectionTitleStyle(block, block.titleColor || accentColor, titleFont)}>
            {titleTextTransformValue(translateSectionTitle(block.title, lang, titleOverrides), block, 'title')}
          </p>
        )}
        {onUpdateBlock && (
          <button
            type="button"
            data-no-drag
            title="Switch chart style"
            onClick={(event) => {
              event.stopPropagation()
              const next = CHART_STYLES[(CHART_STYLES.indexOf(chartStyle) + 1) % CHART_STYLES.length]
              onUpdateBlock({ chartStyle: next })
            }}
            className="invisible flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary group-hover/chart:visible"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>
      {chartStyle === 'tags' ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <SkillTag
              key={i}
              label={item.label}
              levelText={item.levelText}
              levelDisplay={levelDisplay}
              color={block.color || accentColor}
              labelStyle={labelStyle}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item, i) =>
            chartStyle === 'dots' ? (
              <SkillDots
                key={i}
                label={item.label}
                level={item.level}
                levelText={item.levelText}
                levelDisplay={levelDisplay}
                color={block.color || accentColor}
                dotSize={block.dotSize}
                dotCount={block.dotCount || 5}
                labelStyle={labelStyle}
              />
            ) : (
              <SkillBar
                key={i}
                label={item.label}
                level={item.level}
                levelText={item.levelText}
                levelDisplay={levelDisplay}
                color={block.color || accentColor}
                labelStyle={labelStyle}
              />
            ),
          )}
        </div>
      )}
    </div>
  )
}
