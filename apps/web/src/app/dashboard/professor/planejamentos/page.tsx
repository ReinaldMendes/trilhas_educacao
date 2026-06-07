'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, CalendarDays, Search, Filter, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { Planejamento, Turma, STATUS_PLANEJAMENTO_COLORS, STATUS_PLANEJAMENTO_LABELS } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PlanejamentosPage() {
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [turmaFilter, setTurmaFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [p, t] = await Promise.all([
          api.get('/planejamentos'),
          api.get('/turmas/minhas'),
        ])
        setPlanejamentos(p.data)
        setTurmas(t.data)
      } catch { toast.error('Erro ao carregar planejamentos') }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = planejamentos.filter((p) => {
    const matchTurma = !turmaFilter || p.turmaId === turmaFilter
    const matchSearch = !search || p.turma?.name.toLowerCase().includes(search.toLowerCase())
    return matchTurma && matchSearch
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Planejamentos</h1>
          <p className="page-subtitle">Crie e gerencie seus planejamentos semanais</p>
        </div>
        <Link href="/dashboard/professor/planejamentos/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por turma..."
            className="input pl-10"
          />
        </div>
        <select
          value={turmaFilter}
          onChange={(e) => setTurmaFilter(e.target.value)}
          className="input sm:w-48"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum planejamento encontrado</h3>
          <p className="text-sm text-text-muted mb-6">Comece criando seu primeiro planejamento semanal.</p>
          <Link href="/dashboard/professor/planejamentos/novo" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar Planejamento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/dashboard/professor/planejamentos/${p.id}`}
              className="card-hover flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-brand-green-light rounded-2xl flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-6 h-6 text-brand-green-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-text-primary">{p.turma?.name}</p>
                  <span className={cn('badge', STATUS_PLANEJAMENTO_COLORS[p.status])}>
                    {STATUS_PLANEJAMENTO_LABELS[p.status]}
                  </span>
                  {p.coordenadorVisto && <span className="badge badge-green">✓ Vistado por {p.vistadoPor}</span>}
                </div>
                <p className="text-sm text-text-muted mt-0.5">
                  Semana de {formatDate(p.weekStart)} · {(p.camposExperiencia as string[]).length} campo(s) de experiência · {p.propostas?.length ?? 0} proposta(s)
                </p>
                {p.coordenadorObs && (
                  <p className="text-xs text-brand-green-dark bg-brand-green-light rounded-lg px-2 py-1 mt-1 inline-block">
                    💬 Obs: {p.coordenadorObs.slice(0, 80)}{p.coordenadorObs.length > 80 ? '...' : ''}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
