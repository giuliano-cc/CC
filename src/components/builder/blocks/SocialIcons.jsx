import { getPlatformMeta, normalizeUrl, parseSocialLinks } from '../../../utils/socialIcons'

function SocialBadge({ platform, url }) {
  const meta = getPlatformMeta(platform)
  const safeUrl = normalizeUrl(url)
  const badge = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-slate-400 bg-transparent text-[10px] font-bold text-slate-400">
      {meta.badge}
    </span>
  )
  // `normalizeUrl` returns undefined for anything outside the
  // http(s)/mailto/tel scheme allow-list (most notably "javascript:",
  // which would otherwise run on click) — rendered as plain, inert text
  // instead of a link rather than silently dropping the item.
  if (!safeUrl) {
    return (
      <span className="flex items-center gap-1.5" title="Not a valid link">
        {badge}
        <span className="max-w-[9rem] truncate text-xs text-red-500">{url}</span>
      </span>
    )
  }
  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer"
      title={url}
      data-no-drag
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 no-underline hover:opacity-80"
    >
      {badge}
      <span className="max-w-[9rem] truncate text-xs underline">{url}</span>
    </a>
  )
}

export default function renderSocialIconsBlock({ block, library }) {
  const items = block.useLibraryLinks
    ? parseSocialLinks(library.socialLinks).filter((i) => i.url)
    : block.items.filter((i) => i.url)
  const isStackedSocial = block.layout === 'stacked'
  const justify = isStackedSocial
    ? block.align === 'center'
      ? 'items-center'
      : block.align === 'right'
        ? 'items-end'
        : 'items-start'
    : block.align === 'center'
      ? 'justify-center'
      : block.align === 'right'
        ? 'justify-end'
        : 'justify-start'
  return (
    <div
      className={`flex gap-4 ${isStackedSocial ? `flex-col ${justify}` : `flex-wrap items-center ${justify}`}`}
    >
      {items.map((item, i) => (
        <SocialBadge key={i} platform={item.platform} url={item.url} />
      ))}
    </div>
  )
}
