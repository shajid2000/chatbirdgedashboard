import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { saveTokens, saveUser, clearTokens, getUser, getRefreshToken, isAuthenticated } from '@/lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = getUser()
    if (stored && isAuthenticated()) {
      setUser(stored)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    saveTokens(data.tokens)
    saveUser(data.user)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register/', payload)
    saveTokens(data.tokens)
    saveUser(data.user)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refresh = getRefreshToken()
    if (refresh) {
      try {
        await api.post('/auth/logout/', { refresh })
      } catch {
        // Blacklist failure is non-blocking — clear locally regardless
      }
    }
    clearTokens()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
