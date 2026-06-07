'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, BookOpen, FileText,
  BarChart3, Users, GraduationCap, Bell, LogOut,
  Menu, X, Footprints, ChevronRight, Building2, School
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn, formatDateTime } from '@/lib/utils'
import { Role, ROLE_LABELS, Notificacao } from '@/types'
import api from '@/lib/api'

// ── Nav config per role ──────────────────────────────────
const NAV_ITEMS: Record<Role, { href: string; label: string; icon: any }[]> = {
  professor: [
    { href: '/dashboard/professor',               label: 'Início',         icon: LayoutDashboard },
    { href: '/dashboard/professor/planejamentos', label: 'Planejamentos',  icon: CalendarDays },
    { href: '/dashboard/professor/registros',     label: 'Registros',      icon: BookOpen },
    { href: '/dashboard/professor/pareceres',     label: 'Pareceres',      icon: FileText },
    { href: '/dashboard/professor/graficos',      label: 'Autoavaliação',  icon: BarChart3 },
  ],
  corregente: [
    { href: '/dashboard/professor',               label: 'Início',         icon: LayoutDashboard },
    { href: '/dashboard/professor/planejamentos', label: 'Planejamentos',  icon: CalendarDays },
    { href: '/dashboard/professor/registros',     label: 'Registros',      icon: BookOpen },
    { href: '/dashboard/professor/pareceres',     label: 'Pareceres',      icon: FileText },
    { href: '/dashboard/professor/graficos',      label: 'Autoavaliação',  icon: BarChart3 },
  ],
  coordenador: [
    { href: '/dashboard/coordenador',                label: 'Início',         icon: LayoutDashboard },
    { href: '/dashboard/coordenador/planejamentos',  label: 'Planejamentos',  icon: CalendarDays },
    { href: '/dashboard/coordenador/registros',      label: 'Registros',      icon: BookOpen },
    { href: '/dashboard/coordenador/pareceres',      label: 'Pareceres',      icon: FileText },
    { href: '/dashboard/coordenador/graficos',       label: 'Indicadores',    icon: BarChart3 },
    { href: '/dashboard/coordenador/turmas',         label: 'Turmas',         icon: GraduationCap },
    { href: '/dashboard/coordenador/usuarios',       label: 'Usuários',       icon: Users },
  ],
  diretora: [
    { href: '/dashboard/diretora',                label: 'Início',         icon: LayoutDashboard },
    { href: '/dashboard/diretora/planejamentos',  label: 'Planejamentos',  icon: CalendarDays },
    { href: '/dashboard/diretora/registros',      label: 'Registros',      icon: BookOpen },
    { href: '/dashboard/diretora/pareceres',      label: 'Pareceres',      icon: FileText },
    { href: '/dashboard/diretora/graficos',       label: 'Indicadores',    icon: BarChart3 },
  ],
  sme: [
    { href: '/dashboard/sme',           label: 'Início',     icon: LayoutDashboard },
    { href: '/dashboard/sme/unidades',  label: 'Unidades',   icon: Building2 },
    { href: '/dashboard/sme/graficos',  label: 'Indicadores',icon: BarChart3 },
    { href: '/dashboard/sme/usuarios',  label: 'Usuários',   icon: Users },
  ],
}

const ROLE_BADGE_COLORS: Record<Role, string> = {
  professor:   'bg-brand-green-light text-brand-green-dark',
  corregente:  'bg-brand-blue-light text-blue-700',
  coordenador: 'bg-brand-salmon-light text-red-700',
  diretora:    'bg-brand-lavender-light text-purple-700',
  sme:         'bg-brand-yellow-light text-yellow-700',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [loading, user, router])

  useEffect(() => {
    if (user) {
      api.get('/dashboards/notificacoes')
        .then((r) => setNotifs(r.data))
        .catch(() => {})
      const interval = setInterval(() => {
        api.get('/dashboards/notificacoes')
          .then((r) => setNotifs(r.data))
          .catch(() => {})
      }, 30000) // poll every 30s
      return () => clearInterval(interval)
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-trilhas rounded-2xl flex items-center justify-center shadow-float animate-float">
            <Footprints className="w-8 h-8 text-white" />
          </div>
          <div className="spinner w-6 h-6" />
        </div>
      </div>
    )
  }

  const role = user.role as Role
  const navItems = NAV_ITEMS[role] || []
  const unread = notifs.filter((n) => !n.read).length

  async function markRead(id: string) {
    await api.patch(`/dashboards/notificacoes/${id}/lida`)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-brand-gray-light flex flex-col h-full shadow-soft">
      {/* Logo */}
      <div className="p-5 border-b border-brand-gray-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-trilhas rounded-xl flex items-center justify-center shadow-soft">
            <Footprints className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-sm text-brand-green-dark leading-tight">Trilhas da</p>
            <p className="font-black text-sm text-brand-green-dark leading-tight">Infância</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-brand-gray-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-warm rounded-full flex items-center justify-center font-bold text-white text-sm shadow-soft">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ROLE_BADGE_COLORS[role])}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard/professor' && item.href !== '/dashboard/coordenador' && item.href !== '/dashboard/diretora' && item.href !== '/dashboard/sme' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(active ? 'nav-item-active' : 'nav-item')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-brand-gray-light">
        <button
          onClick={logout}
          className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 flex flex-col animate-slide-up">
            <Sidebar />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-card"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-brand-gray-light px-4 lg:px-6 py-3 flex items-center gap-4 shadow-soft">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-brand-gray-light transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl hover:bg-brand-gray-light transition-colors"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-salmon text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-float border border-brand-gray-light z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-brand-gray-light">
                  <p className="font-bold text-text-primary">Notificações</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="p-6 text-center text-sm text-text-muted">Nenhuma notificação</p>
                  ) : (
                    notifs.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => { markRead(n.id); if (n.link) router.push(n.link); setShowNotifs(false) }}
                        className={cn(
                          'p-4 border-b border-brand-gray-light cursor-pointer hover:bg-brand-cream transition-colors',
                          !n.read && 'bg-brand-green-light/30'
                        )}
                      >
                        <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                        <p className="text-xs text-text-muted mt-1">{formatDateTime(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 bg-gradient-warm rounded-full flex items-center justify-center font-bold text-white text-sm shadow-soft">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
