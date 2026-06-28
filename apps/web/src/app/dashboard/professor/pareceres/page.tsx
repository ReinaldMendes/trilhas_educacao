'use client'
import Cookies from 'js-cookie'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Sparkles, Save, ChevronLeft, Download, ChevronRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Parecer, Registro, Aluno, Turma } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const PERIODS = ['2026-T1', '2026-T2', '2026-T3', '2026-T4']

export default function PareceresPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'list' | 'generate'>('list')
  const [pareceres, setPareceres] = useState<Parecer[]>([])
  const [loading, setLoading] = useState(true)

  // Generate state
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [selectedTurma, setSelectedTurma] = useState('')
  const [selectedAluno, setSelectedAluno] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('2026-T1')
  const [selectedRegistros, setSelectedRegistros] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [iaText, setIaText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [header, setHeader] = useState('')
  const [intro, setIntro] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    Promise.all([api.get('/pareceres'), api.get('/turmas/minhas')])
      .then(([p, t]) => { setPareceres(p.data); setTurmas(t.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedTurma) {
      setSelectedAluno('')
      setRegistros([])
      api.get(`/alunos?turmaId=${selectedTurma}`).then((r) => setAlunos(r.data)).catch(() => {})
    }
  }, [selectedTurma])

  useEffect(() => {
    if (selectedAluno) {
      setSelectedRegistros([])
      api.get(`/registros?alunoId=${selectedAluno}`).then((r) => setRegistros(r.data)).catch(() => {})
    }
  }, [selectedAluno])

  async function gerarParecer() {
    if (selectedRegistros.length === 0) { toast.error('Selecione ao menos um registro'); return }
    setGenerating(true)
    setIaText('')
    setFinalText('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pareceres/gerar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token') || ''}`,
        },
        body: JSON.stringify({ alunoId: selectedAluno, period: selectedPeriod, registroIds: selectedRegistros }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const json = JSON.parse(line.slice(6))
          if (json.delta) {
            accumulated += json.delta
            setIaText(accumulated)
            if (textareaRef.current) {
              textareaRef.current.scrollTop = textareaRef.current.scrollHeight
            }
          }
          if (json.done) { setFinalText(json.fullText); toast.success('Rascunho gerado! Revise e edite. ✨') }
          if (json.error) toast.error(json.error)
        }
      }
    } catch { toast.error('Erro ao gerar parecer') }
    setGenerating(false)
  }

  async function salvarParecer() {
    if (!finalText && !iaText) { toast.error('Gere ou escreva o texto do parecer'); return }
    setSaving(true)
    try {
      await api.post('/pareceres', {
        alunoId: selectedAluno,
        period: selectedPeriod,
        textIa: iaText,
        textFinal: finalText || iaText,
        header,
        intro,
        status: 'rascunho',
      })
      toast.success('Parecer salvo!')
      setTab('list')
      const p = await api.get('/pareceres')
      setPareceres(p.data)
    } catch { toast.error('Erro ao salvar') }
    setSaving(false)
  }

  if (tab === 'generate') return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => setTab('list')} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Gerar Parecer com IA</h1>
          <p className="page-subtitle">Selecione os registros e deixe a IA organizar um rascunho</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Step 1: Select */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-text-primary mb-4">1. Selecionar criança e período</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Turma</label>
                <select value={selectedTurma} onChange={(e) => setSelectedTurma(e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Criança</label>
                <select value={selectedAluno} onChange={(e) => setSelectedAluno(e.target.value)} className="input" disabled={!selectedTurma}>
                  <option value="">Selecione...</option>
                  {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Período</label>
                <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="input">
                  {PERIODS.map((p) => <option key={p} value={p}>{p.replace('-', ' - Trimestre ')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Select registros */}
          {registros.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-text-primary">2. Selecionar registros</h3>
                <button
                  onClick={() => setSelectedRegistros(registros.map(r => r.id))}
                  className="text-xs text-brand-green-dark font-bold hover:underline"
                >
                  Selecionar todos
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {registros.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRegistros((prev) =>
                      prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                    )}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border-2 transition-all text-sm',
                      selectedRegistros.includes(r.id)
                        ? 'bg-brand-green-light border-brand-green text-brand-green-dark'
                        : 'bg-white border-brand-gray-light hover:border-brand-green/40'
                    )}
                  >
                    <p className="font-semibold">{formatDate(r.date)}</p>
                    <p className="text-xs mt-0.5 line-clamp-2 opacity-80">{r.observacao}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">{selectedRegistros.length} selecionado{selectedRegistros.length !== 1 ? 's' : ''}</p>

              <button
                onClick={gerarParecer}
                disabled={generating || selectedRegistros.length === 0}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {generating
                  ? <><span className="spinner border-white/30 border-t-white" /> Gerando...</>
                  : <><Sparkles className="w-4 h-4" /> Gerar com IA</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Step 3: Edit and save */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-text-primary mb-4">3. Revisar e personalizar</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Cabeçalho da instituição</label>
                <input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Ex: CMEI Trilhas da Infância · 2026" className="input" />
              </div>
              <div>
                <label className="label">Introdução (opcional)</label>
                <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} placeholder="Parágrafo de apresentação do parecer..." className="input resize-none" />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  Texto do Parecer
                  {iaText && <span className="badge badge-lavender text-[10px]"><Sparkles className="w-2.5 h-2.5" /> Gerado por IA</span>}
                </label>
                <textarea
                  ref={textareaRef}
                  value={finalText || iaText}
                  onChange={(e) => setFinalText(e.target.value)}
                  rows={12}
                  placeholder={generating ? 'A IA está escrevendo o parecer...' : 'O texto gerado pela IA aparecerá aqui. Você pode editar livremente.'}
                  className="input resize-none font-normal text-sm leading-relaxed"
                />
                {iaText && !finalText && (
                  <p className="text-xs text-brand-green-dark mt-1 font-medium">💡 Edite o texto acima para finalizar o parecer</p>
                )}
              </div>
            </div>
            <button onClick={salvarParecer} disabled={saving || (!iaText && !finalText)} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {saving ? <><span className="spinner border-white/30 border-t-white" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Parecer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Pareceres Descritivos</h1>
          <p className="page-subtitle">Relatórios pedagógicos com apoio da IA</p>
        </div>
        <button onClick={() => setTab('generate')} className="btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Gerar Parecer
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : pareceres.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum parecer ainda</h3>
          <p className="text-sm text-text-muted mb-6">Use a IA para gerar pareceres a partir dos registros das crianças.</p>
          <button onClick={() => setTab('generate')} className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Gerar Primeiro Parecer
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pareceres.map((p) => (
            <div key={p.id} className="card-hover flex items-center gap-4 p-4">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                p.status === 'finalizado' ? 'bg-brand-green-light' : 'bg-brand-lavender-light'
              )}>
                {p.status === 'finalizado' ? <CheckCircle className="w-5 h-5 text-brand-green-dark" /> : <FileText className="w-5 h-5 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-text-primary">{p.aluno?.name}</span>
                  <span className="badge badge-blue">{p.period}</span>
                  <span className={cn('badge', p.status === 'finalizado' ? 'badge-green' : 'badge-lavender')}>
                    {p.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                  </span>
                  {p.geradoEmSubst && <span className="badge badge-yellow">Substituição</span>}
                </div>
                <p className="text-xs text-text-muted">Criado em {formatDate(p.createdAt)}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
