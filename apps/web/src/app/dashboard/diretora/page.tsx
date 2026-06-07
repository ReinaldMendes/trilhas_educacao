'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, BookOpen, FileText, BarChart3, Users, CheckCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { Planejamento, STATUS_PLANEJAMENTO_COLORS, STATUS_PLANEJAMENTO_LABELS } from '@/types'

export default function DiretoraHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>({})
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [dash, planos] = await Promise.all([
          api.get('/dashboards/unidade'),
          api.get('/planejamentos'),
        ])
        setStats(dash.data)
        setPlanejamentos(planos.data.slice(0, 5))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{greeting}, {user?.name.split(' ')[0]}! 🏫</h1>
        <p className="page-subtitle">Acompanhe o trabalho pedagógico da sua unidade</p>
      </div>

      {/* Info banner */}
      <div className="bg-brand-lavender-light border border-brand-lavender rounded-2xl p-4 mb-8 flex items-start gap-3">
        <span className="text-2xl">👁️</span>
        <div>
          <p className="font-bold text-purple-700 text-sm">Modo Visualização</p>
          <p className="text-xs text-purple-600">Você tem acesso completo de visualização à unidade. Para edições, contate a Coordenação Pedagógica.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Turmas', value: stats.totalTurmas, icon: Users, color: 'bg-brand-green-light text-brand-green-dark', href: '/dashboard/diretora/planejamentos' },
          { label: 'Crianças', value: stats.totalAlunos, icon: Users, color: 'bg-brand-blue-light text-blue-700', href: '/dashboard/diretora/planejamentos' },
          { label: 'Planejamentos', value: stats.totalPlanejamentos, icon: CalendarDays, color: 'bg-brand-yellow-light text-yellow-700', href: '/dashboard/diretora/planejamentos' },
          { label: 'Registros', value: stats.totalRegistros, icon: BookOpen, color: 'bg-brand-salmon-light text-red-600', href: '/dashboard/diretora/registros' },
        ].map((s) => {
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

      {/* Recent planejamentos */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Planejamentos Recentes</h3>
          <Link href="/dashboard/diretora/planejamentos" className="text-xs text-brand-green-dark font-bold hover:underline">Ver todos</Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-brand-gray-light rounded-xl animate-pulse" />)}</div>
        ) : planejamentos.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">Nenhum planejamento ainda</p>
        ) : (
          <div className="space-y-3">
            {planejamentos.map((p) => (
              <Link key={p.id} href={`/dashboard/diretora/planejamentos/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream transition-colors">
                <div className="w-9 h-9 bg-brand-green-light rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-brand-green-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{p.professor?.name} · {p.turma?.name}</p>
                  <p className="text-xs text-text-muted">Semana {formatDate(p.weekStart)}</p>
                </div>
                <span className={cn('badge', STATUS_PLANEJAMENTO_COLORS[p.status])}>{STATUS_PLANEJAMENTO_LABELS[p.status]}</span>
                <ChevronRight className="w-4 h-4 text-brand-gray-mid" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
