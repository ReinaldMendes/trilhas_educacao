'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import api from './api'
import { User, Role } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      api.get('/auth/me')
        .then((r) => setUser(r.data))
        .catch(() => {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    Cookies.set('access_token', data.accessToken, { expires: 1/3, sameSite: 'strict' })
    Cookies.set('refresh_token', data.refreshToken, { expires: 7, sameSite: 'strict' })
    setUser(data.user)
    redirectByRole(data.user.role)
  }

  async function logout() {
    const refreshToken = Cookies.get('refresh_token')
    try { await api.post('/auth/logout', { refreshToken }) } catch {}
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setUser(null)
    router.push('/auth/login')
  }

  function redirectByRole(role: Role) {
    const routes: Record<Role, string> = {
      professor:   '/dashboard/professor',
      corregente:  '/dashboard/professor',
      coordenador: '/dashboard/coordenador',
      diretora:    '/dashboard/diretora',
      sme:         '/dashboard/sme',
    }
    router.push(routes[role] || '/auth/login')
  }

  function isRole(...roles: Role[]) {
    return !!user && roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
