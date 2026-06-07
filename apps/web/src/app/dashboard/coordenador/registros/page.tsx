'use client'
import { useEffect, useState } from 'react'
import { Search, BookOpen, CheckCircle, Clock, ChevronRight, MessageSquare, Send } from 'lucide-react'
import api from '@/lib/api'
import { Registro, Turma, Aluno } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CoordenadorRegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [turmaFilter, setTurmaFilter] = useState('')
  const [alunoFilter, setAlunoFilter] = useState('')
  const [selected, setSelected] = useState<Registro | null>(null)
  const [comentario, setComentario] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [r, t] = await Promise.all([api.get('/registros'), api.get('/turmas')])
        setRegistros(r.data)
        setTurmas(t.data)
      } catch { toast.error('Erro ao carregar registros') }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (turmaFilter) {
      api.get(`/alunos?turmaId=${turmaFilter}`).then((r) => setAlunos(r.data)).catch(() => {})
      setAlunoFilter('')
    } else {
      setAlunos([])
    }
  }, [turmaFilter])

  const filtered = registros.filter((r) => {
    const matchTurma = !turmaFilter || r.turmaId === turmaFilter
    const matchAluno = !alunoFilter || r.alunoId === alunoFilter
    const matchSearch = !search ||
      r.aluno?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.observacao.toLowerCase().includes(search.toLowerCase())
    return matchTurma && matchAluno && matchSearch
  })

  async function salvarComentario() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await api.patch(`/registros/${selected.id}/comentario`, {
        coordenadorObs: comentario,
        vistado: true,
      })
      setRegistros((prev) => prev.map((r) => r.id === selected.id ? { ...r, ...updated.data } : r))
      setSelected((prev) => prev ? { ...prev, coordenadorObs: comentario, vistado: true } : null)
      toast.success('Comentário salvo e professora notificada!')
    } catch { toast.error('Erro ao salvar comentário') }
    setSaving(false)
  }

  // Detail view
  if (selected) return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => { setSelected(null); setComentario('') }} className="btn-ghost p-2">← Voltar</button>
        <div>
          <h1 className="page-title">{selected.aluno?.name}</h1>
          <p className="page-subtitle">{selected.turma?.name} · {formatDate(selected.date)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Observation */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-text-primary">Observação da Professora</h3>
            <span className="text-xs text-text-muted">{selected.professor?.name}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{selected.observacao}</p>
        </div>

        {/* Attachments */}
        {selected.anexos && selected.anexos.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-text-primary mb-3">Anexos ({selected.anexos.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selected.anexos.map((a) => (
                <a key={a.id} href={a.storageUrl} target="_blank" rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-brand-gray-light hover:shadow-card transition-all">
                  {a.mimeType.startsWith('image/') ? (
                    <img src={a.storageUrl} alt={a.filename} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="h-24 bg-brand-cream flex items-center justify-center">
                      <span className="text-3xl">{a.mimeType === 'application/pdf' ? '📄' : '🎥'}</span>
                    </div>
                  )}
                  <p className="text-xs font-medium text-text-secondary p-2 truncate">{a.filename}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Coordinator comment */}
        <div className={cn('card border-2', selected.coordenadorObs ? 'border-brand-green bg-brand-green-light/20' : 'border-brand-blue')}>
          <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-green-dark" />
            {selected.coordenadorObs ? 'Comentário da Coordenação' : 'Adicionar Comentário'}
          </h3>

          {selected.coordenadorObs && (
            <div className="mb-3 p-3 bg-white rounded-xl border border-brand-green">
              <p className="text-sm text-brand-green-dark leading-relaxed italic">"{selected.coordenadorObs}"</p>
            </div>
          )}

          <label className="label">{selected.coordenadorObs ? 'Atualizar comentário' : 'Seu comentário para a professora'}</label>
          <textarea
            value={comentario || selected.coordenadorObs || ''}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            placeholder="Escreva orientações, devolutivas ou incentivos sobre este registro..."
            className="input resize-none mb-3"
          />
          <p className="text-xs text-text-muted mb-3 italic">
            ⚠️ Seu comentário não altera o conteúdo original da professora — aparece em área separada.
          </p>
          <button onClick={salvarComentario} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving
              ? <><span className="spinner border-white/30 border-t-white" /> Salvando...</>
              : <><Send className="w-4 h-4" /> Salvar e Notificar Professora</>
            }
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Registros das Crianças</h1>
        <p className="page-subtitle">Visualize e comente os registros das professoras</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por criança ou observação..." className="input pl-10" />
        </div>
        <select value={turmaFilter} onChange={(e) => setTurmaFilter(e.target.value)} className="input sm:w-44">
          <option value="">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {alunos.length > 0 && (
          <select value={alunoFilter} onChange={(e) => setAlunoFilter(e.target.value)} className="input sm:w-44">
            <option value="">Todas as crianças</option>
            {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>

      {/* Stats strip */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="font-semibold text-text-secondary">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        <span className="text-brand-green-dark font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> {filtered.filter(r => r.vistado).length} vistados
        </span>
        <span className="text-yellow-600 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> {filtered.filter(r => !r.vistado).length} pendentes
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum registro encontrado</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => { setSelected(r); setComentario(r.coordenadorObs || '') }}
              className="card-hover flex items-start gap-4 p-4 w-full text-left">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg',
                r.vistado ? 'bg-brand-green-light text-brand-green-dark' : 'bg-brand-blue-light text-blue-700'
              )}>
                {r.aluno?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-text-primary">{r.aluno?.name}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{r.turma?.name}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{formatDate(r.date)}</span>
                  {r.vistado && <span className="badge badge-green text-[10px]">✓ Vistado</span>}
                </div>
                <p className="text-sm text-text-secondary line-clamp-2">{r.observacao}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-text-muted">{r.professor?.name}</span>
                  {r.coordenadorObs && (
                    <span className="text-xs text-brand-green-dark font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Comentado
                    </span>
                  )}
                  {r.anexos && r.anexos.length > 0 && (
                    <span className="text-xs text-text-muted">📎 {r.anexos.length}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
