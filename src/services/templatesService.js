import toast from 'react-hot-toast'
import apiClient from './apiClient'
import { CV_TEMPLATES } from '../utils/cvTemplates'

// Sample data used until the real backend is available.
// The backend, via the token sent by apiClient's interceptor, will
// automatically filter results based on the authenticated user.
//
// Persisted to localStorage (like the Content Library) so edits survive
// a page reload/reopen instead of resetting to the built-in defaults on
// every fresh load of this module.
const STORAGE_KEY = 'printflow.templates'

function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // localStorage unavailable or corrupted entry: fall back to defaults.
  }
  return structuredClone(CV_TEMPLATES)
}

const MOCK_TEMPLATES = loadTemplates()

// Tracked across calls (not just try/catch) so the error toast fires once
// per continuous failure streak instead of on every single edit.
let lastPersistOk = true

function persistTemplates() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TEMPLATES))
    if (!lastPersistOk) {
      toast.success('Templates are saving again.')
      lastPersistOk = true
    }
  } catch {
    // Almost always quota exceeded (embedded images across your templates
    // pushed the total past the browser's ~5-10MB per-origin storage
    // limit) rather than localStorage being unavailable. The edit still
    // works in this tab for this session, it just silently stops
    // persisting — on the next reload (or in a new tab) you're back to
    // whatever last actually made it to disk, which looks exactly like
    // "my changes keep getting lost" with nothing to explain why.
    if (lastPersistOk) {
      toast.error("This template isn't saving — your browser's storage is full. Try removing or replacing a large image.", {
        duration: 8000,
      })
      lastPersistOk = false
    }
  }
}

const USE_MOCK = true

export async function getTemplates() {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_TEMPLATES]), 400))
  }

  const { data } = await apiClient.get('/templates')
  return data
}

export async function getTemplateById(id) {
  if (USE_MOCK) {
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
    const newTemplate = { id: String(Date.now()), updatedAt: new Date().toISOString(), ...payload }
    MOCK_TEMPLATES.unshift(newTemplate)
    persistTemplates()
    return new Promise((resolve) => setTimeout(() => resolve(newTemplate), 300))
  }

  // The backend associates the template with the authenticated user via the JWT token.
  const { data } = await apiClient.post('/templates', payload)
  return data
}

export async function updateTemplate(id, payload) {
  if (USE_MOCK) {
    const index = MOCK_TEMPLATES.findIndex((t) => t.id === id)
    const updated = {
      ...(index !== -1 ? MOCK_TEMPLATES[index] : {}),
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    }
    if (index !== -1) MOCK_TEMPLATES[index] = updated
    persistTemplates()
    return new Promise((resolve) => setTimeout(() => resolve(structuredClone(updated)), 300))
  }

  const { data } = await apiClient.put(`/templates/${id}`, payload)
  return data
}

export async function duplicateTemplate(id) {
  if (USE_MOCK) {
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
    persistTemplates()
    return new Promise((resolve) => setTimeout(() => resolve(copy), 300))
  }

  const { data } = await apiClient.post(`/templates/${id}/duplicate`)
  return data
}

export async function deleteTemplate(id) {
  if (USE_MOCK) {
    const index = MOCK_TEMPLATES.findIndex((t) => t.id === id)
    if (index !== -1) MOCK_TEMPLATES.splice(index, 1)
    persistTemplates()
    return new Promise((resolve) => setTimeout(resolve, 300))
  }

  await apiClient.delete(`/templates/${id}`)
}

// Every template a user builds lives only in this browser's localStorage
// (see STORAGE_KEY above) — there's no backend yet, so clearing site
// data, switching browsers, or moving to a new machine loses it all with
// no way back. This is the safety net: a full downloadable copy, and the
// reverse to restore it (here, or in a different browser entirely).
export function exportTemplates() {
  return JSON.stringify(MOCK_TEMPLATES, null, 2)
}

export function importTemplates(json) {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Not a valid templates backup')
  MOCK_TEMPLATES.splice(0, MOCK_TEMPLATES.length, ...parsed)
  persistTemplates()
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
