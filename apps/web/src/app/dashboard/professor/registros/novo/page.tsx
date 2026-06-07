'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Save, Paperclip, X, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Turma, Aluno } from '@/types'
import { cn, fileSizeLabel } from '@/lib/utils'

const schema = z.object({
  turmaId:    z.string().uuid('Selecione uma turma'),
  alunoId:    z.string().uuid('Selecione uma criança'),
  date:       z.string().min(1, 'Selecione a data'),
  observacao: z.string().min(10, 'A observação deve ter ao menos 10 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function NovoRegistroPage() {
  const router = useRouter()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })
  const turmaId = watch('turmaId')

  useEffect(() => {
    api.get('/turmas/minhas').then((r) => setTurmas(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (turmaId) {
      setValue('alunoId', '')
      api.get(`/alunos?turmaId=${turmaId}`).then((r) => setAlunos(r.data)).catch(() => {})
    }
  }, [turmaId, setValue])

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const arr = Array.from(newFiles)
    const tooBig = arr.filter((f) => f.size > 10 * 1024 * 1024)
    if (tooBig.length) { toast.error('Arquivo muito grande. Máximo 10MB.'); return }
    setFiles((prev) => [...prev, ...arr].slice(0, 5))
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const form = new FormData()
      Object.entries(data).forEach(([k, v]) => form.append(k, v as string))
      files.forEach((f) => form.append('anexos', f))
      await api.post('/registros', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Registro salvo! 📸')
      router.push('/dashboard/professor/registros')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar registro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Novo Registro</h1>
          <p className="page-subtitle">Registre uma observação de uma criança</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Turma *</label>
              <select {...register('turmaId')} className={cn('input', errors.turmaId && 'input-error')}>
                <option value="">Selecione a turma</option>
                {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.turmaId && <p className="text-xs text-red-500 mt-1">{errors.turmaId.message}</p>}
            </div>
            <div>
              <label className="label">Criança *</label>
              <select {...register('alunoId')} className={cn('input', errors.alunoId && 'input-error')} disabled={!turmaId}>
                <option value="">Selecione a criança</option>
                {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {errors.alunoId && <p className="text-xs text-red-500 mt-1">{errors.alunoId.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Data do registro *</label>
            <input type="date" {...register('date')} className={cn('input', errors.date && 'input-error')} />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="label">Observação *</label>
            <textarea
              {...register('observacao')}
              rows={6}
              placeholder="Descreva o que você observou sobre esta criança — suas descobertas, interações, conquistas, hipóteses, modo de se expressar..."
              className={cn('input resize-none', errors.observacao && 'input-error')}
            />
            {errors.observacao && <p className="text-xs text-red-500 mt-1">{errors.observacao.message}</p>}
          </div>
        </div>

        {/* File upload */}
        <div className="card">
          <h3 className="text-sm font-bold text-text-primary mb-3">Anexos (fotos, documentos)</h3>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-brand-gray-light rounded-xl p-8 text-center cursor-pointer hover:border-brand-green hover:bg-brand-green-light/10 transition-all"
          >
            <Image className="w-8 h-8 text-brand-gray-mid mx-auto mb-2" />
            <p className="text-sm font-semibold text-text-secondary">Arraste arquivos ou clique para selecionar</p>
            <p className="text-xs text-text-muted mt-1">JPG, PNG, GIF, PDF, MP4 · Máximo 10MB por arquivo · Até 5 arquivos</p>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,video/mp4" className="hidden" onChange={(e) => addFiles(e.target.files)} />

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-brand-cream rounded-xl">
                  <Paperclip className="w-4 h-4 text-brand-green-dark flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                    <p className="text-xs text-text-muted">{fileSizeLabel(f.size)}</p>
                  </div>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pb-8">
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
            {saving ? <><span className="spinner border-white/30 border-t-white" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Registro</>}
          </button>
        </div>
      </form>
    </div>
  )
}
