'use client'
import { useEffect, useState } from 'react'
import { CalendarDays, Search, ChevronRight, CheckCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { Planejamento, CAMPOS_EXPERIENCIA, STATUS_PLANEJAMENTO_COLORS, STATUS_PLANEJAMENTO_LABELS } from '@/types'
import { formatDate, cn } from '@/lib/utils'

export default function DiretoraPlanos() {
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Planejamento | null>(null)

  useEffect(() => {
    api.get('/planejamentos').then((r) => setPlanejamentos(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = planejamentos.filter((p) =>
    !search || p.professor?.name.toLowerCase().includes(search.toLowerCase()) || p.turma?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (selected) return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="btn-ghost p-2">← Voltar</button>
        <div>
          <h1 className="page-title">{selected.turma?.name}</h1>
          <p className="page-subtitle">{selected.professor?.name} · Semana {formatDate(selected.weekStart)}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card">
          <h3 className="font-bold mb-3">Campos de Experiência</h3>
          <div className="flex flex-wrap gap-2">
            {(selected.camposExperiencia as string[]).map((id) => {
              const c = CAMPOS_EXPERIENCIA.find((x) => x.id === id)
              return c ? <span key={id} className="badge badge-green">{c.label}</span> : null
            })}
          </div>
        </div>
        {[
          { label: 'Objetivos', value: selected.objetivos },
          { label: 'Conteúdos', value: selected.conteudos },
          { label: 'Mobilização', value: selected.mobilizacao },
          { label: 'Desenvolvimento das Propostas', value: selected.desenvolvimentoPropostas },
          { label: 'Anotações Finais', value: selected.anotacoesFinais },
        ].filter(f => f.value).map((f) => (
          <div key={f.label} className="card">
            <h3 className="font-bold mb-2">{f.label}</h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{f.value}</p>
          </div>
        ))}
        {selected.coordenadorObs && (
          <div className="card bg-brand-green-light border border-brand-green">
            <p className="text-xs font-bold text-brand-green-dark mb-1">Observação da Coordenação</p>
            <p className="text-sm text-brand-green-dark italic">"{selected.coordenadorObs}"</p>
          </div>
        )}
        <div className="card bg-brand-lavender-light border border-brand-lavender">
          <p className="text-xs text-purple-600 font-semibold">👁️ Visualização apenas — edições são feitas pela Coordenação Pedagógica</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Planejamentos da Unidade</h1>
        <p className="page-subtitle">Acompanhe os planejamentos de todas as turmas</p>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por professora ou turma..." className="input pl-10 max-w-sm" />
      </div>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="card-hover flex items-center gap-4 p-4 w-full text-left">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                p.status === 'vistado' ? 'bg-brand-green-light' : 'bg-brand-yellow-light'
              )}>
                {p.status === 'vistado' ? <CheckCircle className="w-5 h-5 text-brand-green-dark" /> : <Clock className="w-5 h-5 text-yellow-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-text-primary">{p.professor?.name}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{p.turma?.name}</span>
                  <span className={cn('badge', STATUS_PLANEJAMENTO_COLORS[p.status])}>{STATUS_PLANEJAMENTO_LABELS[p.status]}</span>
                </div>
                <p className="text-xs text-text-muted">Semana de {formatDate(p.weekStart)}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid" />
            </button>
          ))}
          {filtered.length === 0 && <div className="card text-center py-12 text-text-muted">Nenhum planejamento encontrado</div>}
        </div>
      )}
    </div>
  )
}
