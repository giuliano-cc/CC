// "Text flow" / "autoflow": when a Text block's content is longer than its
// box, split it at the point where it stops fitting and push the rest into
// another (usually newly created) Text block — the classic desktop-
// publishing "threaded text frames" idea, scoped down to a single manual
// action rather than a live-recomputing layout engine. Clicking the button
// again after editing re-splits and re-applies; nothing here runs
// automatically on every keystroke.

// Kept atomic so a split never lands inside an inline link (see
// BlockRenderer's INLINE_LINK_PATTERN) or swallows/duplicates whitespace —
// each match is either a whole "[label](url)", a run of non-space
// characters, or a run of whitespace.
const FLOW_TOKEN_PATTERN = /\[[^\]]+\]\((?:https?:\/\/|mailto:)[^\s)]+\)|\S+|\s+/g

function tokenize(text) {
  return text.match(FLOW_TOKEN_PATTERN) || []
}

// `node` is the live block-content element (the one carrying
// data-block-content, already sized/clipped to the block's current box) —
// cloned (deep, so its inner <p>/<ul> structure and every class/inline
// style comes with it) and measured off-screen so the search never
// disturbs what's actually on screen. Returns null if the content already
// fits (nothing to flow).
export function splitTextToFit(text, node) {
  const tokens = tokenize(text)
  if (tokens.length === 0) return null

  const maxHeight = node.getBoundingClientRect().height

  const clone = node.cloneNode(true)
  clone.style.position = 'fixed'
  clone.style.top = '-99999px'
  clone.style.left = '0'
  clone.style.visibility = 'hidden'
  clone.style.pointerEvents = 'none'
  clone.style.height = 'auto'
  clone.style.maxHeight = 'none'
  clone.style.overflow = 'visible'
  document.body.appendChild(clone)
  const textNode = clone.querySelector('p, li') || clone

  function heightFor(tokenCount) {
    textNode.textContent = tokens.slice(0, tokenCount).join('')
    return clone.getBoundingClientRect().height
  }

  try {
    if (heightFor(tokens.length) <= maxHeight) return null

    let lo = 0
    let hi = tokens.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      if (heightFor(mid) <= maxHeight) lo = mid
      else hi = mid - 1
    }

    const fits = tokens.slice(0, lo).join('').replace(/\s+$/, '')
    const remainder = tokens.slice(lo).join('').replace(/^\s+/, '')
    // `lo === 0` means even a single word doesn't fit (box far too small) —
    // nothing usable to split, leave the block alone rather than emptying it.
    if (!fits) return null
    return { fits, remainder }
  } finally {
    document.body.removeChild(clone)
  }
}
