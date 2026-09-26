import apiClient from './apiClient'

const MOCK_DOCUMENTS = [
  { id: 'd1', name: 'Invoice_2026_001.pdf', type: 'Invoice', createdAt: '2026-09-22T08:00:00Z', status: 'completed' },
  { id: 'd2', name: 'Report_September.pdf', type: 'Report', createdAt: '2026-09-20T16:45:00Z', status: 'completed' },
  { id: 'd3', name: 'CV_Candidate.pdf', type: 'Resume', createdAt: '2026-09-19T12:10:00Z', status: 'processing' },
  { id: 'd4', name: 'Vendor_Contract.pdf', type: 'Contract', createdAt: '2026-09-17T09:00:00Z', status: 'failed' },
]

const USE_MOCK = true

export async function getDocuments() {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_DOCUMENTS]), 400))
  }

  const { data } = await apiClient.get('/documents')
  return data
}

export async function deleteDocument(id) {
  if (USE_MOCK) {
    const index = MOCK_DOCUMENTS.findIndex((d) => d.id === id)
    if (index !== -1) MOCK_DOCUMENTS.splice(index, 1)
    return new Promise((resolve) => setTimeout(resolve, 300))
  }

  await apiClient.delete(`/documents/${id}`)
}
