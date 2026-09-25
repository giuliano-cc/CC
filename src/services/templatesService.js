import apiClient from './apiClient'
import { CV_TEMPLATES } from '../utils/cvTemplates'

// Dati di esempio usati finché il backend reale non è disponibile.
// Il backend, tramite il token inviato dall'interceptor di apiClient,
// filtrerà autonomamente i risultati in base all'utente autenticato.
const MOCK_TEMPLATES = structuredClone(CV_TEMPLATES)

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
    return new Promise((resolve) => setTimeout(() => resolve(newTemplate), 300))
  }

  // Il backend associa il template all'utente autenticato tramite il token JWT.
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
    return new Promise((resolve) => setTimeout(() => resolve(structuredClone(updated)), 300))
  }

  const { data } = await apiClient.put(`/templates/${id}`, payload)
  return data
}

export async function duplicateTemplate(id) {
  if (USE_MOCK) {
    const original = MOCK_TEMPLATES.find((t) => t.id === id)
    const copy = {
      ...original,
      id: String(Date.now()),
      title: `${original.title} (copia)`,
      updatedAt: new Date().toISOString(),
    }
    MOCK_TEMPLATES.unshift(copy)
    return new Promise((resolve) => setTimeout(() => resolve(copy), 300))
  }

  const { data } = await apiClient.post(`/templates/${id}/duplicate`)
  return data
}

export async function deleteTemplate(id) {
  if (USE_MOCK) {
    const index = MOCK_TEMPLATES.findIndex((t) => t.id === id)
    if (index !== -1) MOCK_TEMPLATES.splice(index, 1)
    return new Promise((resolve) => setTimeout(resolve, 300))
  }

  await apiClient.delete(`/templates/${id}`)
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
