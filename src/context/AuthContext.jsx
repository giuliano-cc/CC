import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  clearToken,
  getStoredToken,
  loginRequest,
  persistToken,
  registerRequest,
} from '../services/authService'

const AUTH_USER_KEY = 'printflow_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = getStoredToken()
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  async function login({ email, password }) {
    const data = await loginRequest({ email, password })
    persistToken(data.token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    toast.success('Login riuscito')
    return data.user
  }

  async function register({ name, email, password }) {
    const data = await registerRequest({ name, email, password })
    persistToken(data.token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    toast.success('Registrazione completata')
    return data.user
  }

  function logout() {
    clearToken()
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
    toast.success('Logout effettuato')
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve essere usato dentro un AuthProvider')
  }
  return context
}
