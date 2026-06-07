'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, BookOpen, FileText, BarChart3, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { formatDate, getMonday } from '@/lib/utils'
import { Planejamento, Registro, STATUS_PLANEJAMENTO_COLORS, STATUS_PLANEJAMENTO_LABELS } from '@/types'
import { cn } from '@/lib/utils'

export default function ProfessorHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ planejamentos: 0, registros: 0, pareceres: 0 })
  const [recentPlanejamentos, setRecentPlanejamentos] = useState<Planejamento[]>([])
  const [recentRegistros, setRecentRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, r, pa] = await Promise.all([
          api.get('/planejamentos'),
          api.get('/registros'),
          api.get('/pareceres'),
        ])
        setStats({ planejamentos: p.data.length, registros: r.data.length, pareceres: pa.data.length })
        setRecentPlanejamentos(p.data.slice(0, 3))
        setRecentRegistros(r.data.slice(0, 4))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date()
  const weekStart = getMonday(today)
  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl animate-float">🌿</span>
          <div>
            <h1 className="page-title">{greeting}, {user?.name.split(' ')[0]}!</h1>
            <p className="page-subtitle">
              {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick action banner */}
      <div className="bg-gradient-trilhas rounded-2xl p-6 mb-8 relative overflow-hidden shadow-card">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute right-16 bottom-0 w-20 h-20 bg-white/10 rounded-full translate-y-4" />
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-semibold mb-1">Semana atual · {formatDate(weekStart)} – {formatDate(new Date(weekStart.getTime() + 4 * 86400000))}</p>
          <h2 className="text-white text-xl font-black mb-4">O que vamos registrar hoje?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/professor/planejamentos/novo" className="bg-white text-brand-green-dark font-bold px-4 py-2 rounded-xl text-sm hover:bg-brand-cream transition-colors flex items-center gap-2 shadow-soft">
              <Plus className="w-4 h-4" /> Novo Planejamento
            </Link>
            <Link href="/dashboard/professor/registros/novo" className="bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors flex items-center gap-2 backdrop-blur-sm">
              <Plus className="w-4 h-4" /> Novo Registro
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Planejamentos', value: stats.planejamentos, icon: CalendarDays, color: 'bg-brand-green-light text-brand-green-dark', href: '/dashboard/professor/planejamentos' },
          { label: 'Registros', value: stats.registros, icon: BookOpen, color: 'bg-brand-blue-light text-blue-700', href: '/dashboard/professor/registros' },
          { label: 'Pareceres', value: stats.pareceres, icon: FileText, color: 'bg-brand-lavender-light text-purple-700', href: '/dashboard/professor/pareceres' },
          { label: 'Autoavaliação', value: '→', icon: BarChart3, color: 'bg-brand-yellow-light text-yellow-700', href: '/dashboard/professor/graficos' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href} className="card-hover flex flex-col gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
                <Icon className="w-5 h-5" />
              </div>
              {loading ? (
                <div className="h-7 w-12 bg-brand-gray-light rounded-lg animate-pulse" />
              ) : (
                <p className="text-2xl font-black text-text-primary">{s.value}</p>
              )}
              <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent planejamentos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Planejamentos recentes</h3>
            <Link href="/dashboard/professor/planejamentos" className="text-xs text-brand-green-dark font-bold hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-brand-gray-light rounded-xl animate-pulse" />)}
            </div>
          ) : recentPlanejamentos.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-brand-gray-mid mx-auto mb-2" />
              <p className="text-sm text-text-muted">Nenhum planejamento ainda</p>
              <Link href="/dashboard/professor/planejamentos/novo" className="btn-secondary text-sm mt-3 inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Criar agora
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPlanejamentos.map((p) => (
                <Link key={p.id} href={`/dashboard/professor/planejamentos/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream transition-colors border border-transparent hover:border-brand-gray-light">
                  <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-brand-green-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{p.turma?.name}</p>
                    <p className="text-xs text-text-muted">Semana de {formatDate(p.weekStart)}</p>
                  </div>
                  <span className={cn('badge text-xs', STATUS_PLANEJAMENTO_COLORS[p.status])}>
                    {STATUS_PLANEJAMENTO_LABELS[p.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent registros */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Registros recentes</h3>
            <Link href="/dashboard/professor/registros" className="text-xs text-brand-green-dark font-bold hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-brand-gray-light rounded-xl animate-pulse" />)}
            </div>
          ) : recentRegistros.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-brand-gray-mid mx-auto mb-2" />
              <p className="text-sm text-text-muted">Nenhum registro ainda</p>
              <Link href="/dashboard/professor/registros/novo" className="btn-secondary text-sm mt-3 inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Criar agora
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRegistros.map((r) => (
                <Link key={r.id} href={`/dashboard/professor/registros/${r.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream transition-colors border border-transparent hover:border-brand-gray-light">
                  <div className="w-10 h-10 bg-brand-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{r.aluno?.name}</p>
                    <p className="text-xs text-text-muted line-clamp-1">{r.observacao}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs text-text-muted whitespace-nowrap">{formatDate(r.date)}</p>
                    {r.vistado
                      ? <CheckCircle className="w-3 h-3 text-brand-green-dark" />
                      : <Clock className="w-3 h-3 text-brand-gray-mid" />
                    }
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
