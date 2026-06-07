'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, CheckCircle, Clock, ChevronRight, Search, MessageSquare } from 'lucide-react'
import api from '@/lib/api'
import { Planejamento, STATUS_PLANEJAMENTO_COLORS, STATUS_PLANEJAMENTO_LABELS, CAMPOS_EXPERIENCIA } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CoordenadorPlanejamentosPage() {
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Planejamento | null>(null)
  const [obs, setObs] = useState('')
  const [vistando, setVistando] = useState(false)

  useEffect(() => {
    api.get('/planejamentos').then((r) => setPlanejamentos(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = planejamentos.filter((p) => {
    const matchSearch = !search || p.professor?.name.toLowerCase().includes(search.toLowerCase()) || p.turma?.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  async function darVisto() {
    if (!selected) return
    setVistando(true)
    try {
      await api.post(`/planejamentos/${selected.id}/visto`, { obs })
      toast.success('Visto registrado!')
      setPlanejamentos((prev) => prev.map((p) => p.id === selected.id ? { ...p, status: 'vistado', coordenadorVisto: true, coordenadorObs: obs } : p))
      setSelected(null)
      setObs('')
    } catch { toast.error('Erro ao registrar visto') }
    setVistando(false)
  }

  // Side detail panel
  if (selected) return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => { setSelected(null); setObs('') }} className="btn-ghost p-2">← Voltar</button>
        <div>
          <h1 className="page-title">Planejamento — {selected.turma?.name}</h1>
          <p className="page-subtitle">{selected.professor?.name} · Semana {formatDate(selected.weekStart)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <h3 className="font-bold text-text-primary mb-3">Campos de Experiência</h3>
          <div className="flex flex-wrap gap-2">
            {(selected.camposExperiencia as string[]).map((id) => {
              const campo = CAMPOS_EXPERIENCIA.find((c) => c.id === id)
              return campo ? <span key={id} className="badge badge-green">{campo.label}</span> : null
            })}
          </div>
        </div>

        {[
          { label: 'Objetivos', value: selected.objetivos },
          { label: 'Conteúdos', value: selected.conteudos },
          { label: 'Mobilização', value: selected.mobilizacao },
          { label: 'Desenvolvimento das Propostas', value: selected.desenvolvimentoPropostas },
          { label: 'Anotações Finais', value: selected.anotacoesFinais },
        ].filter((f) => f.value).map((f) => (
          <div key={f.label} className="card">
            <h3 className="font-bold text-text-primary mb-2">{f.label}</h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{f.value}</p>
          </div>
        ))}

        {selected.propostas && selected.propostas.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-text-primary mb-3">Propostas ({selected.propostas.length})</h3>
            <div className="space-y-2">
              {selected.propostas.map((prop, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-brand-cream rounded-xl">
                  <span className="badge badge-green text-xs">{['Seg','Ter','Qua','Qui','Sex'][prop.dayOfWeek - 1]}</span>
                  <div>
                    <p className="text-xs font-bold text-text-secondary">{prop.tipo} · {prop.modalidade}</p>
                    <p className="text-sm text-text-primary">{prop.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visto panel */}
        {selected.status !== 'vistado' ? (
          <div className="card border-2 border-brand-green">
            <h3 className="font-bold text-brand-green-dark mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Registrar Visto
            </h3>
            <label className="label">Observação para a professora (opcional)</label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Escreva um comentário, sugestão ou feedback..."
              className="input resize-none mb-4"
            />
            <button onClick={darVisto} disabled={vistando} className="btn-primary flex items-center gap-2">
              {vistando ? <><span className="spinner border-white/30 border-t-white" /> Registrando...</> : <><CheckCircle className="w-4 h-4" /> Dar Visto</>}
            </button>
          </div>
        ) : (
          <div className="card bg-brand-green-light border border-brand-green">
            <p className="font-bold text-brand-green-dark flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Planejamento vistado por {selected.vistadoPor}</p>
            {selected.coordenadorObs && <p className="text-sm text-brand-green-dark mt-2 italic">"{selected.coordenadorObs}"</p>}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Planejamentos da Unidade</h1>
        <p className="page-subtitle">Acompanhe e viste os planejamentos das professoras</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por professora ou turma..." className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-40">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_PLANEJAMENTO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-14 h-14 text-brand-gray-mid mx-auto mb-3" />
          <h3 className="text-lg font-bold">Nenhum planejamento encontrado</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="card-hover flex items-center gap-4 p-4 w-full text-left">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                p.status === 'vistado' ? 'bg-brand-green-light' : p.status === 'enviado' ? 'bg-brand-yellow-light' : 'bg-brand-gray-light'
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
                <p className="text-xs text-text-muted">Semana de {formatDate(p.weekStart)} · {(p.camposExperiencia as string[]).length} campo(s)</p>
              </div>
              {p.coordenadorObs && <MessageSquare className="w-4 h-4 text-brand-green-dark flex-shrink-0" />}
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
