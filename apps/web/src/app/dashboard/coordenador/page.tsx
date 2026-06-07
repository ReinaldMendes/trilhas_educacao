'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, BookOpen, FileText, BarChart3, Users, GraduationCap, Clock, CheckCircle, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import { Planejamento, STATUS_PLANEJAMENTO_COLORS, STATUS_PLANEJAMENTO_LABELS } from '@/types'

export default function CoordenadorHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>({})
  const [pendentes, setPendentes] = useState<Planejamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [dash, planos] = await Promise.all([
          api.get('/dashboards/unidade'),
          api.get('/planejamentos?status=enviado'),
        ])
        setStats(dash.data)
        setPendentes(planos.data.slice(0, 5))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  const statCards = [
    { label: 'Turmas', value: stats.totalTurmas, icon: GraduationCap, color: 'bg-brand-green-light text-brand-green-dark', href: '/dashboard/coordenador/turmas' },
    { label: 'Crianças', value: stats.totalAlunos, icon: Users, color: 'bg-brand-blue-light text-blue-700', href: '/dashboard/coordenador/turmas' },
    { label: 'Planejamentos', value: stats.totalPlanejamentos, icon: CalendarDays, color: 'bg-brand-yellow-light text-yellow-700', href: '/dashboard/coordenador/planejamentos' },
    { label: 'Registros', value: stats.totalRegistros, icon: BookOpen, color: 'bg-brand-salmon-light text-red-600', href: '/dashboard/coordenador/registros' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{greeting}, {user?.name.split(' ')[0]}! 🌿</h1>
        <p className="page-subtitle">Acompanhe, oriente e apoie as professoras da sua unidade</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href} className="card-hover flex flex-col gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
                <Icon className="w-5 h-5" />
              </div>
              {loading ? <div className="h-7 w-10 bg-brand-gray-light rounded-lg animate-pulse" /> : (
                <p className="text-2xl font-black text-text-primary">{s.value ?? '—'}</p>
              )}
              <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Planejamentos pendentes de visto */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Aguardando Visto</h3>
            <Link href="/dashboard/coordenador/planejamentos" className="text-xs text-brand-green-dark font-bold hover:underline">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-brand-gray-light rounded-xl animate-pulse" />)}</div>
          ) : pendentes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-brand-green mx-auto mb-2" />
              <p className="text-sm font-semibold text-text-secondary">Tudo em dia! ✓</p>
              <p className="text-xs text-text-muted">Nenhum planejamento aguardando visto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendentes.map((p) => (
                <Link key={p.id} href={`/dashboard/coordenador/planejamentos/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream transition-colors border border-transparent hover:border-brand-gray-light">
                  <div className="w-9 h-9 bg-brand-yellow-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{p.professor?.name}</p>
                    <p className="text-xs text-text-muted">{p.turma?.name} · {formatDate(p.weekStart)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-gray-mid" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="section-title mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Cadastrar Aluno', href: '/dashboard/coordenador/turmas', icon: Plus, color: 'bg-brand-green-light text-brand-green-dark' },
              { label: 'Ver Registros', href: '/dashboard/coordenador/registros', icon: BookOpen, color: 'bg-brand-blue-light text-blue-700' },
              { label: 'Gerar Parecer', href: '/dashboard/coordenador/pareceres', icon: FileText, color: 'bg-brand-lavender-light text-purple-700' },
              { label: 'Indicadores', href: '/dashboard/coordenador/graficos', icon: BarChart3, color: 'bg-brand-yellow-light text-yellow-700' },
            ].map((a) => {
              const Icon = a.icon
              return (
                <Link key={a.label} href={a.href} className="card-hover flex flex-col items-center gap-2 p-4 text-center">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', a.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-text-primary">{a.label}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
