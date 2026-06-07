'use client'
import { useEffect, useState } from 'react'
import { Plus, GraduationCap, Users, Search, ChevronDown, ChevronUp, Trash2, Link2, X, Edit } from 'lucide-react'
import api from '@/lib/api'
import { Turma, Aluno, User, ProfessorTurma } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'turmas' | 'alunos' | 'vinculos'

export default function TurmasPage() {
  const [tab, setTab] = useState<Tab>('turmas')
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [professores, setProfessores] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedTurma, setExpandedTurma] = useState<string | null>(null)

  // Modals
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [showAlunoModal, setShowAlunoModal] = useState(false)
  const [showVinculoModal, setShowVinculoModal] = useState(false)
  const [selectedTurmaId, setSelectedTurmaId] = useState('')

  // Form state
  const [turmaNome, setTurmaNome] = useState('')
  const [turmaAno, setTurmaAno] = useState('2026')
  const [alunoNome, setAlunoNome] = useState('')
  const [alunoDt, setAlunoDt] = useState('')
  const [alunoTurmaId, setAlunoTurmaId] = useState('')
  const [vinculoProfId, setVinculoProfId] = useState('')
  const [vinculoTipo, setVinculoTipo] = useState<'regente' | 'corregente'>('regente')
  const [vinculoFim, setVinculoFim] = useState('')
  const [saving, setSaving] = useState(false)

  // Temp: use first unidade from user context
  const UNIDADE_DEMO = 'unidade-demo-001'

  useEffect(() => {
    async function load() {
      try {
        const [t, a, p] = await Promise.all([
          api.get('/turmas'),
          api.get('/alunos'),
          api.get('/users?role=professor'),
        ])
        setTurmas(t.data)
        setAlunos(a.data)
        // Merge professores + corregentes
        const corr = await api.get('/users?role=corregente')
        setProfessores([...p.data, ...corr.data])
      } catch { toast.error('Erro ao carregar dados') }
      setLoading(false)
    }
    load()
  }, [])

  const filteredTurmas = turmas.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  )

  async function criarTurma() {
    if (!turmaNome.trim()) return
    setSaving(true)
    try {
      const r = await api.post('/turmas', { name: turmaNome, year: parseInt(turmaAno), unidadeId: UNIDADE_DEMO })
      setTurmas((prev) => [...prev, r.data])
      setTurmaNome(''); setShowTurmaModal(false)
      toast.success('Turma criada!')
    } catch { toast.error('Erro ao criar turma') }
    setSaving(false)
  }

  async function criarAluno() {
    if (!alunoNome.trim() || !alunoTurmaId) return
    setSaving(true)
    try {
      const r = await api.post('/alunos', { name: alunoNome, turmaId: alunoTurmaId, birthDate: alunoDt || undefined })
      setAlunos((prev) => [...prev, r.data])
      setAlunoNome(''); setAlunoDt(''); setAlunoTurmaId(''); setShowAlunoModal(false)
      toast.success('Aluno(a) cadastrado(a)!')
    } catch { toast.error('Erro ao cadastrar aluno') }
    setSaving(false)
  }

  async function criarVinculo() {
    if (!vinculoProfId || !selectedTurmaId) return
    setSaving(true)
    try {
      await api.post(`/turmas/${selectedTurmaId}/vinculos`, {
        professorId: vinculoProfId,
        tipoVinculo: vinculoTipo,
        dataFim: vinculoTipo === 'corregente' && vinculoFim ? vinculoFim : null,
      })
      const t = await api.get('/turmas')
      setTurmas(t.data)
      setVinculoProfId(''); setVinculoFim(''); setShowVinculoModal(false)
      toast.success('Vínculo criado!')
    } catch { toast.error('Erro ao criar vínculo') }
    setSaving(false)
  }

  async function encerrarVinculo(turmaId: string, vinculoId: string) {
    try {
      await api.delete(`/turmas/${turmaId}/vinculos/${vinculoId}`)
      const t = await api.get('/turmas')
      setTurmas(t.data)
      toast.success('Vínculo encerrado')
    } catch { toast.error('Erro ao encerrar vínculo') }
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'turmas', label: 'Turmas', count: turmas.length },
    { id: 'alunos', label: 'Alunos', count: alunos.length },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Gestão de Cadastros</h1>
          <p className="page-subtitle">Turmas, alunos e vínculos de professores</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAlunoModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-3 h-3" /> Aluno
          </button>
          <button onClick={() => setShowTurmaModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-3 h-3" /> Turma
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-brand-gray-light p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === t.id ? 'bg-white text-text-primary shadow-soft' : 'text-text-muted hover:text-text-secondary'
            )}>
            {t.label} <span className="ml-1 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'turmas' ? 'Buscar turma...' : 'Buscar aluno...'}
          className="input pl-10 max-w-sm" />
      </div>

      {/* TURMAS TAB */}
      {tab === 'turmas' && (
        loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
        ) : filteredTurmas.length === 0 ? (
          <div className="card text-center py-12">
            <GraduationCap className="w-12 h-12 text-brand-gray-mid mx-auto mb-3" />
            <p className="font-bold text-text-primary">Nenhuma turma cadastrada</p>
            <button onClick={() => setShowTurmaModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar Turma
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTurmas.map((t) => {
              const isOpen = expandedTurma === t.id
              const turmaAlunos = alunos.filter((a) => a.turmaId === t.id)
              return (
                <div key={t.id} className="card p-0 overflow-hidden">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-brand-cream transition-colors"
                    onClick={() => setExpandedTurma(isOpen ? null : t.id)}>
                    <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-brand-green-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary">{t.name}</p>
                      <p className="text-xs text-text-muted">{t._count?.alunos ?? turmaAlunos.length} criança(s) · {t.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedTurmaId(t.id); setShowVinculoModal(true) }}
                        className="btn-ghost p-2 text-xs flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Vincular
                      </button>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-brand-gray-light p-4">
                      {/* Vinculos */}
                      {t.vinculos && t.vinculos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Professores</p>
                          <div className="space-y-2">
                            {t.vinculos.map((v) => (
                              <div key={v.id} className="flex items-center justify-between p-2 bg-brand-cream rounded-xl">
                                <div>
                                  <p className="text-sm font-semibold text-text-primary">{v.professor?.name}</p>
                                  <p className="text-xs text-text-muted">
                                    {v.tipoVinculo === 'corregente' ? '🔄 Corregente' : '👩‍🏫 Regente'}
                                    {v.dataFim ? ` · até ${formatDate(v.dataFim)}` : ''}
                                  </p>
                                </div>
                                <button onClick={() => encerrarVinculo(t.id, v.id)} className="text-red-400 hover:text-red-600 p-1">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alunos */}
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Crianças</p>
                      {turmaAlunos.length === 0 ? (
                        <p className="text-xs text-text-muted italic">Nenhum aluno nesta turma ainda</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {turmaAlunos.map((a) => (
                            <div key={a.id} className="flex items-center gap-2 p-2 bg-brand-blue-light rounded-lg">
                              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                                {a.name.charAt(0)}
                              </div>
                              <p className="text-xs font-semibold text-text-primary truncate">{a.name.split(' ')[0]}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => { setAlunoTurmaId(t.id); setShowAlunoModal(true) }}
                        className="mt-3 text-xs text-brand-green-dark font-semibold hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Adicionar criança
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ALUNOS TAB */}
      {tab === 'alunos' && (
        loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Nome</th><th>Turma</th><th>Nascimento</th><th>Status</th></tr></thead>
              <tbody>
                {alunos.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase())).map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold">{a.name}</td>
                    <td>{a.turma?.name ?? '—'}</td>
                    <td>{a.birthDate ? formatDate(a.birthDate) : '—'}</td>
                    <td><span className={cn('badge', a.active ? 'badge-green' : 'badge-gray')}>{a.active ? 'Ativo' : 'Inativo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Modal: Nova Turma ── */}
      {showTurmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTurmaModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-float p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-bold text-text-primary text-lg mb-4">Nova Turma</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nome da turma *</label>
                <input value={turmaNome} onChange={(e) => setTurmaNome(e.target.value)} placeholder="Ex: Maternal II - A" className="input" />
              </div>
              <div>
                <label className="label">Ano</label>
                <input type="number" value={turmaAno} onChange={(e) => setTurmaAno(e.target.value)} className="input" min="2020" max="2030" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowTurmaModal(false)} className="btn-outline flex-1">Cancelar</button>
              <button onClick={criarTurma} disabled={saving || !turmaNome.trim()} className="btn-primary flex-1">
                {saving ? <span className="spinner border-white/30 border-t-white mx-auto" /> : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Novo Aluno ── */}
      {showAlunoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAlunoModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-float p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-bold text-text-primary text-lg mb-4">Cadastrar Criança</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nome completo *</label>
                <input value={alunoNome} onChange={(e) => setAlunoNome(e.target.value)} placeholder="Nome da criança" className="input" />
              </div>
              <div>
                <label className="label">Turma *</label>
                <select value={alunoTurmaId} onChange={(e) => setAlunoTurmaId(e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data de nascimento</label>
                <input type="date" value={alunoDt} onChange={(e) => setAlunoDt(e.target.value)} className="input" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAlunoModal(false)} className="btn-outline flex-1">Cancelar</button>
              <button onClick={criarAluno} disabled={saving || !alunoNome.trim() || !alunoTurmaId} className="btn-primary flex-1">
                {saving ? <span className="spinner border-white/30 border-t-white mx-auto" /> : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Vincular Professor ── */}
      {showVinculoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowVinculoModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-float p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-bold text-text-primary text-lg mb-1">Vincular Professora</h3>
            <p className="text-xs text-text-muted mb-4">Turma: {turmas.find(t => t.id === selectedTurmaId)?.name}</p>
            <div className="space-y-3">
              <div>
                <label className="label">Professora *</label>
                <select value={vinculoProfId} onChange={(e) => setVinculoProfId(e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.role === 'corregente' ? 'Corregente' : 'Regente'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tipo de vínculo</label>
                <select value={vinculoTipo} onChange={(e) => setVinculoTipo(e.target.value as any)} className="input">
                  <option value="regente">Regente (permanente)</option>
                  <option value="corregente">Corregente (temporário)</option>
                </select>
              </div>
              {vinculoTipo === 'corregente' && (
                <div>
                  <label className="label">Data de encerramento</label>
                  <input type="date" value={vinculoFim} onChange={(e) => setVinculoFim(e.target.value)} className="input" />
                  <p className="text-xs text-text-muted mt-1">Deixe em branco para vínculo sem data definida</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowVinculoModal(false)} className="btn-outline flex-1">Cancelar</button>
              <button onClick={criarVinculo} disabled={saving || !vinculoProfId} className="btn-primary flex-1">
                {saving ? <span className="spinner border-white/30 border-t-white mx-auto" /> : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
