import axios from 'axios'
import toast from 'react-hot-toast'

export const AUTH_TOKEN_KEY = 'printflow_token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inietta automaticamente il token JWT su ogni richiesta, se presente.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gestisce centralmente sessione scaduta (401) e accessi non autorizzati (403).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      toast.error('Sessione scaduta. Effettua di nuovo il login.')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    } else if (status === 403) {
      toast.error('Non hai i permessi per eseguire questa azione.')
    } else if (!error.response) {
      toast.error('Impossibile contattare il server. Riprova più tardi.')
    }

    return Promise.reject(error)
  },
)

export default apiClient
