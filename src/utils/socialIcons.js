// Lucide dropped brand/logo icons a while ago, so social platforms are
// rendered as small outlined letter badges instead of official logos —
// simple, dependency-free, avoids using trademarked marks, and (an
// outline with no fill, like the Contact Info block's Mail/Phone/Globe
// icons) matches the rest of the app's icon style.
export const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', badge: 'in', color: '#0a66c2' },
  { key: 'github', label: 'GitHub', badge: 'gh', color: '#24292f' },
  { key: 'twitter', label: 'X / Twitter', badge: 'X', color: '#000000' },
  { key: 'instagram', label: 'Instagram', badge: 'ig', color: '#e4405f' },
  { key: 'facebook', label: 'Facebook', badge: 'f', color: '#1877f2' },
  { key: 'dribbble', label: 'Dribbble', badge: 'dr', color: '#ea4c89' },
  { key: 'behance', label: 'Behance', badge: 'be', color: '#1769ff' },
  { key: 'website', label: 'Website', badge: '🌐', color: '#334155' },
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
