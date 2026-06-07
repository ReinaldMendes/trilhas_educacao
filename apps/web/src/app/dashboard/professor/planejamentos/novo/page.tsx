'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Save, ChevronLeft, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Turma, CAMPOS_EXPERIENCIA, TIPO_PROPOSTA_LABELS, MODALIDADE_LABELS, TipoProposta, ModalidadeProposta } from '@/types'
import { cn, getMonday } from '@/lib/utils'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

const propostaSchema = z.object({
  dayOfWeek:  z.number().int().min(1).max(5),
  tipo:       z.string(),
  descricao:  z.string().min(1, 'Descreva a proposta'),
  modalidade: z.string(),
})

const schema = z.object({
  turmaId:                  z.string().uuid('Selecione uma turma'),
  weekStart:                z.string().min(1, 'Selecione a semana'),
  camposExperiencia:        z.array(z.string()).min(1, 'Selecione ao menos um campo'),
  objetivos:                z.string().optional(),
  conteudos:                z.string().optional(),
  mobilizacao:              z.string().optional(),
  desenvolvimentoPropostas: z.string().optional(),
  anotacoesFinais:          z.string().optional(),
  propostas:                z.array(propostaSchema).default([]),
})

type FormData = z.infer<typeof schema>

export default function NovoPlanejamentoPage() {
  const router = useRouter()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/turmas/minhas').then((r) => setTurmas(r.data)).catch(() => {})
  }, [])

  const monday = getMonday()
  const mondayStr = monday.toISOString().split('T')[0]

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      weekStart: mondayStr,
      camposExperiencia: [],
      propostas: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'propostas' })
  const selectedCampos = watch('camposExperiencia') || []

  function toggleCampo(id: string) {
    const curr = selectedCampos
    if (curr.includes(id)) setValue('camposExperiencia', curr.filter((c) => c !== id), { shouldValidate: true })
    else setValue('camposExperiencia', [...curr, id], { shouldValidate: true })
  }

  function addProposta(dayOfWeek: number) {
    append({ dayOfWeek, tipo: 'brincadeira', descricao: '', modalidade: 'livre' })
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      await api.post('/planejamentos', data)
      toast.success('Planejamento enviado com sucesso! 🌿')
      router.push('/dashboard/professor/planejamentos')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Novo Planejamento</h1>
          <p className="page-subtitle">Preencha as informações da semana pedagógica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Turma + Semana */}
        <div className="card">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center text-xs font-black">1</span>
            Identificação
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Turma *</label>
              <select {...register('turmaId')} className={cn('input', errors.turmaId && 'input-error')}>
                <option value="">Selecione a turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.unidade?.name}</option>
                ))}
              </select>
              {errors.turmaId && <p className="text-xs text-red-500 mt-1">{errors.turmaId.message}</p>}
            </div>
            <div>
              <label className="label">Semana (início na segunda) *</label>
              <input type="date" {...register('weekStart')} className={cn('input', errors.weekStart && 'input-error')} />
              {errors.weekStart && <p className="text-xs text-red-500 mt-1">{errors.weekStart.message}</p>}
            </div>
          </div>
        </div>

        {/* Campos de experiência BNCC */}
        <div className="card">
          <h2 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-blue text-white rounded-full flex items-center justify-center text-xs font-black">2</span>
            Campos de Experiência (BNCC) *
          </h2>
          <p className="text-xs text-text-muted mb-4 ml-8">Selecione os campos contemplados nesta semana</p>
          {errors.camposExperiencia && (
            <p className="text-xs text-red-500 mb-3 ml-8">{errors.camposExperiencia.message as string}</p>
          )}
          <div className="space-y-2">
            {CAMPOS_EXPERIENCIA.map((c) => {
              const active = selectedCampos.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCampo(c.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 font-medium text-sm',
                    active
                      ? 'bg-brand-green-light border-brand-green text-brand-green-dark'
                      : 'bg-white border-brand-gray-light text-text-secondary hover:border-brand-green/40'
                  )}
                >
                  <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    active ? 'bg-brand-green-dark border-brand-green-dark' : 'border-brand-gray-mid'
                  )}>
                    {active && <span className="text-white text-xs">✓</span>}
                  </div>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Planejamento textual */}
        <div className="card">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-yellow text-white rounded-full flex items-center justify-center text-xs font-black">3</span>
            Planejamento Pedagógico
          </h2>
          <div className="space-y-4">
            {([
              { name: 'objetivos',                label: 'Objetivos de Aprendizagem', placeholder: 'Quais objetivos pedagógicos guiam esta semana?' },
              { name: 'conteudos',                label: 'Conteúdos',                 placeholder: 'Quais conteúdos serão trabalhados?' },
              { name: 'mobilizacao',              label: 'Mobilização',               placeholder: 'Como você vai mobilizar as crianças?' },
              { name: 'desenvolvimentoPropostas', label: 'Desenvolvimento das Propostas', placeholder: 'Descreva o desenvolvimento geral das propostas da semana...' },
              { name: 'anotacoesFinais',          label: 'Anotações Finais',          placeholder: 'Observações, ajustes ou reflexões ao final da semana...' },
            ] as const).map((field) => (
              <div key={field.name}>
                <label className="label">{field.label}</label>
                <textarea
                  {...register(field.name)}
                  rows={field.name === 'desenvolvimentoPropostas' || field.name === 'anotacoesFinais' ? 4 : 2}
                  placeholder={field.placeholder}
                  className="input resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Propostas por dia */}
        <div className="card">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-salmon text-white rounded-full flex items-center justify-center text-xs font-black">4</span>
            Propostas por Dia
          </h2>
          <div className="space-y-6">
            {DAYS.map((day, idx) => {
              const dayNum = idx + 1
              const dayFields = fields.map((f, i) => ({ ...f, index: i })).filter((f) => (watch(`propostas.${f.index}.dayOfWeek`) as number) === dayNum)
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-text-secondary">{day}</h3>
                    <button type="button" onClick={() => addProposta(dayNum)}
                      className="text-xs text-brand-green-dark font-semibold flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Adicionar proposta
                    </button>
                  </div>
                  {dayFields.length === 0 ? (
                    <p className="text-xs text-text-muted italic px-2">Nenhuma proposta para {day}</p>
                  ) : (
                    <div className="space-y-3">
                      {dayFields.map((f) => (
                        <div key={f.id} className="flex gap-3 bg-brand-cream rounded-xl p-3 border border-brand-gray-light">
                          <div className="flex-1 grid sm:grid-cols-3 gap-2">
                            <div>
                              <label className="label text-[11px]">Tipo</label>
                              <select {...register(`propostas.${f.index}.tipo`)} className="input text-sm py-2">
                                {Object.entries(TIPO_PROPOSTA_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label text-[11px]">Modalidade</label>
                              <select {...register(`propostas.${f.index}.modalidade`)} className="input text-sm py-2">
                                {Object.entries(MODALIDADE_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="label text-[11px]">Descrição *</label>
                              <input {...register(`propostas.${f.index}.descricao`)} placeholder="Descreva a proposta..." className="input text-sm py-2" />
                            </div>
                          </div>
                          <button type="button" onClick={() => remove(f.index)} className="text-red-400 hover:text-red-600 p-1 self-start mt-5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end pb-8">
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
            {saving ? <><span className="spinner border-white/30 border-t-white" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar e Enviar</>}
          </button>
        </div>
      </form>
    </div>
  )
}
