'use client'
// Diretora: registros view-only
import { useEffect, useState } from 'react'
import { Search, BookOpen, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { Registro, Turma } from '@/types'
import { formatDate, cn } from '@/lib/utils'

export default function DiretoraRegistros() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [turmaFilter, setTurmaFilter] = useState('')
  const [selected, setSelected] = useState<Registro | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [r, t] = await Promise.all([api.get('/registros'), api.get('/turmas')])
        setRegistros(r.data)
        setTurmas(t.data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const filtered = registros.filter((r) => {
    const matchTurma = !turmaFilter || r.turmaId === turmaFilter
    const matchSearch = !search || r.aluno?.name.toLowerCase().includes(search.toLowerCase())
    return matchTurma && matchSearch
  })

  if (selected) return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="btn-ghost p-2">← Voltar</button>
        <div>
          <h1 className="page-title">{selected.aluno?.name}</h1>
          <p className="page-subtitle">{selected.turma?.name} · {formatDate(selected.date)}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card">
          <p className="text-xs font-bold text-text-muted mb-2">{selected.professor?.name}</p>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{selected.observacao}</p>
        </div>
        {selected.anexos && selected.anexos.length > 0 && (
          <div className="card">
            <h3 className="font-bold mb-3">Anexos</h3>
            <div className="grid grid-cols-3 gap-3">
              {selected.anexos.map((a) => (
                <a key={a.id} href={a.storageUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-brand-gray-light">
                  {a.mimeType.startsWith('image/') ? (
                    <img src={a.storageUrl} alt={a.filename} className="w-full h-20 object-cover" />
                  ) : (
                    <div className="h-20 bg-brand-cream flex items-center justify-center text-2xl">📄</div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
        {selected.coordenadorObs && (
          <div className="card bg-brand-green-light border border-brand-green">
            <p className="text-xs font-bold text-brand-green-dark mb-1">Observação da Coordenação</p>
            <p className="text-sm text-brand-green-dark italic">"{selected.coordenadorObs}"</p>
          </div>
        )}
        <div className="card bg-brand-lavender-light border border-brand-lavender">
          <p className="text-xs text-purple-600 font-semibold">👁️ Somente visualização — comentários são feitos pela Coordenação</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Registros das Crianças</h1>
        <p className="page-subtitle">Acompanhe os registros de observação da unidade</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar criança..." className="input pl-10" />
        </div>
        <select value={turmaFilter} onChange={(e) => setTurmaFilter(e.target.value)} className="input sm:w-44">
          <option value="">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => setSelected(r)} className="card-hover flex items-start gap-4 p-4 w-full text-left">
              <div className="w-10 h-10 bg-brand-blue-light rounded-2xl flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                {r.aluno?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-text-primary">{r.aluno?.name}</span>
                  <span className="text-xs text-text-muted">· {r.turma?.name} · {formatDate(r.date)}</span>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2">{r.observacao}</p>
              </div>
              {r.vistado ? <CheckCircle className="w-4 h-4 text-brand-green-dark flex-shrink-0 mt-1" /> : <Clock className="w-4 h-4 text-brand-gray-mid flex-shrink-0 mt-1" />}
              <ChevronRight className="w-4 h-4 text-brand-gray-mid flex-shrink-0 mt-1" />
            </button>
          ))}
          {filtered.length === 0 && <div className="card text-center py-12 text-text-muted">Nenhum registro encontrado</div>}
        </div>
      )}
    </div>
  )
}
