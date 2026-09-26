import axios from 'axios'
import toast from 'react-hot-toast'

export const AUTH_TOKEN_KEY = 'printflow_token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically injects the JWT token on every request, when present.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Centrally handles expired sessions (401) and unauthorized access (403).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      toast.error('Your session has expired. Please sign in again.')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    } else if (status === 403) {
      toast.error("You don't have permission to perform this action.")
    } else if (!error.response) {
      toast.error('Unable to reach the server. Please try again later.')
    }

    return Promise.reject(error)
  },
)

export default apiClient
