import apiClient, { AUTH_TOKEN_KEY } from './apiClient'

// NOTA: finché il backend non è disponibile, la chiamata reale viene
// sostituita da una simulazione locale che restituisce la stessa forma di
// risposta che ci si aspetta da `POST /auth/login` e `POST /auth/register`.
// Quando il backend sarà pronto basterà rimuovere `mockRequest` e lasciare
// solo la chiamata `apiClient`.
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
  // Chiamata reale (quando il backend sarà disponibile):
  // const { data } = await apiClient.post('/auth/login', { email, password })
  const { data } = await mockRequest({ email, password })
  return data
}

export async function registerRequest({ name, email, password }) {
  // Chiamata reale (quando il backend sarà disponibile):
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
