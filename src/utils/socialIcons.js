// Lucide dropped brand/logo icons a while ago, so social platforms are
// rendered as small outlined letter badges instead of official logos —
// simple, dependency-free, avoids using trademarked marks, and (an
// outline with no fill, all in the same neutral gray) matches the
// Contact Info block's Mail/Phone/Globe icons exactly, rather than each
// platform showing its own brand color.
export const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', badge: 'in' },
  { key: 'github', label: 'GitHub', badge: 'gh' },
  { key: 'twitter', label: 'X / Twitter', badge: 'X' },
  { key: 'instagram', label: 'Instagram', badge: 'ig' },
  { key: 'facebook', label: 'Facebook', badge: 'f' },
  { key: 'tiktok', label: 'TikTok', badge: 'tt' },
  { key: 'dribbble', label: 'Dribbble', badge: 'dr' },
  { key: 'behance', label: 'Behance', badge: 'be' },
  { key: 'website', label: 'Website', badge: '🌐' },
]

export function getPlatformMeta(key) {
  return SOCIAL_PLATFORMS.find((p) => p.key === key) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]
}

// Parses lines formatted as "platform|url" (one per line) into
// { platform, url } objects, skipping blank lines. Rows with an empty
// url are kept (so they can still be edited); callers that render the
// links for display should filter those out themselves.
export function parseSocialLinks(text) {
  return (text || '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [platform, ...rest] = line.split('|')
      return { platform: (platform || '').trim().toLowerCase(), url: rest.join('|').trim() }
    })
}

export function formatSocialLinks(items) {
  return items.map((item) => `${item.platform}|${item.url}`).join('\n')
}

// So a link typed as "linkedin.com/in/you" (no scheme) still opens
// correctly when clicked, instead of being treated as a relative path.
export function normalizeUrl(url) {
  if (!url) return url
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`
}
