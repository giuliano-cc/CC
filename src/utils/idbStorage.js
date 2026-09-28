import { get, set } from 'idb-keyval'

// Everything the app saves (templates, Content Library) used to live in
// localStorage, capped around 5-10MB per origin — easy to blow through
// with a handful of photos even after they're downscaled (see
// utils/imageResize.js), and a write past that limit used to fail
// silently. IndexedDB's quota is a share of free disk space (typically
// hundreds of MB to several GB), so this moves persistence there instead
// — no folder to pick, nothing the user has to do, and photos no longer
// need to be shrunk just to fit.
//
// Falls back to localStorage if IndexedDB itself is unavailable (some
// private-browsing modes, very old browsers) so nothing breaks outright;
// that fallback is still capped the same as before, but is now the rare
// exception instead of the default.
export async function idbGet(key) {
  try {
    const value = await get(key)
    if (value !== undefined) return value
  } catch {
    // IndexedDB unavailable — fall through to the localStorage fallback.
  }
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export async function idbSet(key, value) {
  try {
    await set(key, value)
    return true
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }
}
