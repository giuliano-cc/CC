import toast from 'react-hot-toast'
import apiClient from './apiClient'
import { CV_TEMPLATES } from '../utils/cvTemplates'
import { idbGet, idbSet } from '../utils/idbStorage'

// Sample data used until the real backend is available.
// The backend, via the token sent by apiClient's interceptor, will
// automatically filter results based on the authenticated user.
//
// Persisted to IndexedDB (like the Content Library — see
// utils/idbStorage.js) so edits survive a page reload/reopen instead of
// resetting to the built-in defaults on every fresh load of this module.
const STORAGE_KEY = 'printflow.templates'

// Starts as the built-in defaults so every export below has something to
// work with synchronously; `ready` (below) replaces its contents in place
// once the real saved data has loaded, and every exported function awaits
// `ready` first so nothing reads/writes the placeholder defaults instead.
const MOCK_TEMPLATES = structuredClone(CV_TEMPLATES)

// One-time load, with a fallback to any pre-existing localStorage data
// left over from before this moved off it, so upgrading never wipes an
// existing set of templates.
const ready = (async () => {
  const stored = await idbGet(STORAGE_KEY)
  if (Array.isArray(stored)) {
    MOCK_TEMPLATES.splice(0, MOCK_TEMPLATES.length, ...stored)
    return
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) {
      MOCK_TEMPLATES.splice(0, MOCK_TEMPLATES.length, ...parsed)
    }
  } catch {
    // Corrupted or unavailable: stays at the built-in defaults.
  }
})()

// Tracked across calls (not just try/catch) so the error toast fires once
// per continuous failure streak instead of on every single edit.
let lastPersistOk = true

async function persistTemplates() {
  const ok = await idbSet(STORAGE_KEY, MOCK_TEMPLATES)
  if (ok) {
    if (!lastPersistOk) {
      toast.success('Templates are saving again.')
      lastPersistOk = true
    }
  } else if (lastPersistOk) {
    // Both IndexedDB and its localStorage fallback failed — rare
    // (IndexedDB's quota is a share of free disk space, far larger than
    // localStorage's flat ~5-10MB), but still surfaced rather than
    // silently dropping the save, which otherwise looks exactly like "my
    // changes keep getting lost" with nothing to explain why.
    toast.error("This template isn't saving — your browser's storage is unavailable or full.", {
      duration: 8000,
    })
    lastPersistOk = false
  }
}

const USE_MOCK = true

export async function getTemplates() {
  if (USE_MOCK) {
    await ready
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_TEMPLATES]), 400))
  }

  const { data } = await apiClient.get('/templates')
  return data
}

export async function getTemplateById(id) {
  if (USE_MOCK) {
    await ready
    const template = MOCK_TEMPLATES.find((t) => t.id === id)
    return new Promise((resolve) =>
      setTimeout(() => resolve(template ? structuredClone(template) : null), 300),
    )
  }

  const { data } = await apiClient.get(`/templates/${id}`)
  return data
}

export async function createTemplate(payload) {
  if (USE_MOCK) {
    await ready
    const newTemplate = { id: String(Date.now()), updatedAt: new Date().toISOString(), ...payload }
    MOCK_TEMPLATES.unshift(newTemplate)
    await persistTemplates()
    return new Promise((resolve) => setTimeout(() => resolve(newTemplate), 300))
  }

  // The backend associates the template with the authenticated user via the JWT token.
  const { data } = await apiClient.post('/templates', payload)
  return data
}

export async function updateTemplate(id, payload) {
  if (USE_MOCK) {
    await ready
    const index = MOCK_TEMPLATES.findIndex((t) => t.id === id)
    const updated = {
      ...(index !== -1 ? MOCK_TEMPLATES[index] : {}),
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    }
    if (index !== -1) MOCK_TEMPLATES[index] = updated
    await persistTemplates()
    return new Promise((resolve) => setTimeout(() => resolve(structuredClone(updated)), 300))
  }

  const { data } = await apiClient.put(`/templates/${id}`, payload)
  return data
}

export async function duplicateTemplate(id) {
  if (USE_MOCK) {
    await ready
    const original = MOCK_TEMPLATES.find((t) => t.id === id)
    // A deep clone, not a shallow spread — `blocks`/`globalStyle` are
    // nested objects/arrays, and a shallow copy would leave the
    // duplicate sharing those same references with the original until
    // the very first edit replaces them, which is a needless landmine.
    const copy = {
      ...structuredClone(original),
      id: String(Date.now()),
      title: `${original.title} (copy)`,
      updatedAt: new Date().toISOString(),
    }
    MOCK_TEMPLATES.unshift(copy)
    await persistTemplates()
    return new Promise((resolve) => setTimeout(() => resolve(copy), 300))
  }

  const { data } = await apiClient.post(`/templates/${id}/duplicate`)
  return data
}

export async function deleteTemplate(id) {
  if (USE_MOCK) {
    await ready
    const index = MOCK_TEMPLATES.findIndex((t) => t.id === id)
    if (index !== -1) MOCK_TEMPLATES.splice(index, 1)
    await persistTemplates()
    return new Promise((resolve) => setTimeout(resolve, 300))
  }

  await apiClient.delete(`/templates/${id}`)
}

// Every template a user builds lives only in this browser (see
// STORAGE_KEY above) — there's no backend yet, so clearing site data,
// switching browsers, or moving to a new machine loses it all with no way
// back. This is the safety net: a full downloadable copy, and the reverse
// to restore it (here, or in a different browser entirely).
export async function exportTemplates() {
  await ready
  return JSON.stringify(MOCK_TEMPLATES, null, 2)
}

export async function importTemplates(json) {
  await ready
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Not a valid templates backup')
  MOCK_TEMPLATES.splice(0, MOCK_TEMPLATES.length, ...parsed)
  await persistTemplates()
}

export async function renderTemplate(id, blocks) {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ previewUrl: null, blocksCount: blocks.length }), 400),
    )
  }

  const { data } = await apiClient.post(`/render/${id}`, { blocks })
  return data
}
