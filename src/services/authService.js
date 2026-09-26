import apiClient, { AUTH_TOKEN_KEY } from './apiClient'

// NOTE: until the real backend is available, the real call is replaced by
// a local simulation that returns the same response shape expected from
// `POST /auth/login` and `POST /auth/register`. Once the backend is ready,
// just remove `mockRequest` and keep the `apiClient` call.
const MOCK_LATENCY_MS = 500

function mockRequest(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          token: `mock-jwt-token.${btoa(payload.email)}.${Date.now()}`,
          user: {
            id: 'mock-user-id',
            name: payload.name || payload.email.split('@')[0],
            email: payload.email,
          },
        },
      })
    }, MOCK_LATENCY_MS)
  })
}

export async function loginRequest({ email, password }) {
  // Real call (once the backend is available):
  // const { data } = await apiClient.post('/auth/login', { email, password })
  const { data } = await mockRequest({ email, password })
  return data
}

export async function registerRequest({ name, email, password }) {
  // Real call (once the backend is available):
  // const { data } = await apiClient.post('/auth/register', { name, email, password })
  const { data } = await mockRequest({ name, email, password })
  return data
}

export function persistToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export { apiClient }
