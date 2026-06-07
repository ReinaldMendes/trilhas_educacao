'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, Search, CheckCircle, Clock, ChevronRight, Paperclip } from 'lucide-react'
import api from '@/lib/api'
import { Registro, Aluno, Turma } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [alunoFilter, setAlunoFilter] = useState('')
  const [turmaFilter, setTurmaFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [r, t] = await Promise.all([
          api.get('/registros'),
          api.get('/turmas/minhas'),
        ])
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
    } else {
      setAlunos([])
      setAlunoFilter('')
    }
  }, [turmaFilter])

  const filtered = registros.filter((r) => {
    const matchTurma = !turmaFilter || r.turmaId === turmaFilter
    const matchAluno = !alunoFilter || r.alunoId === alunoFilter
    const matchSearch = !search || r.aluno?.name.toLowerCase().includes(search.toLowerCase()) || r.observacao.toLowerCase().includes(search.toLowerCase())
    return matchTurma && matchAluno && matchSearch
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Registros de Observação</h1>
          <p className="page-subtitle">Acompanhe o percurso de cada criança</p>
        </div>
        <Link href="/dashboard/professor/registros/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Registro
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por criança ou observação..." className="input pl-10" />
        </div>
        <select value={turmaFilter} onChange={(e) => setTurmaFilter(e.target.value)} className="input sm:w-44">
          <option value="">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {alunos.length > 0 && (
          <select value={alunoFilter} onChange={(e) => setAlunoFilter(e.target.value)} className="input sm:w-44">
            <option value="">Todos os alunos</option>
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
        <span className="text-text-muted font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> {filtered.filter(r => !r.vistado).length} aguardando
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum registro encontrado</h3>
          <p className="text-sm text-text-muted mb-6">Comece registrando observações das crianças.</p>
          <Link href="/dashboard/professor/registros/novo" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar Registro
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link key={r.id} href={`/dashboard/professor/registros/${r.id}`} className="card-hover flex items-start gap-4 p-4">
              <div className="w-11 h-11 bg-brand-blue-light rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-blue-700">
                {r.aluno?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-text-primary">{r.aluno?.name}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{r.turma?.name}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{formatDate(r.date)}</span>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2">{r.observacao}</p>
                <div className="flex items-center gap-3 mt-2">
                  {r.vistado
                    ? <span className="text-xs text-brand-green-dark font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Vistado</span>
                    : <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Aguardando visto</span>
                  }
                  {r.anexos && r.anexos.length > 0 && (
                    <span className="text-xs text-text-muted flex items-center gap-1"><Paperclip className="w-3 h-3" /> {r.anexos.length} anexo{r.anexos.length > 1 ? 's' : ''}</span>
                  )}
                  {r.coordenadorObs && (
                    <span className="text-xs text-brand-green-dark font-semibold">💬 Comentário da coordenação</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
