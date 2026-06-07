'use client'
import { useEffect, useState } from 'react'
import { FileText, CheckCircle, ChevronRight, Search } from 'lucide-react'
import api from '@/lib/api'
import { Parecer } from '@/types'
import { formatDate, cn } from '@/lib/utils'

export default function DiretoraPareceres() {
  const [pareceres, setPareceres] = useState<Parecer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/pareceres').then((r) => setPareceres(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = pareceres.filter((p) =>
    !search || p.aluno?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Pareceres da Unidade</h1>
        <p className="page-subtitle">Acompanhe os pareceres gerados pelas professoras</p>
      </div>

      <div className="bg-brand-lavender-light border border-brand-lavender rounded-2xl p-4 mb-6 flex items-start gap-3">
        <span className="text-xl">👁️</span>
        <p className="text-xs text-purple-600 font-semibold">
          Somente visualização — a geração e edição de pareceres é feita pelas professoras e pela coordenação.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por criança..." className="input pl-10 max-w-sm" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum parecer encontrado</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="card-hover flex items-center gap-4 p-4">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                p.status === 'finalizado' ? 'bg-brand-green-light' : 'bg-brand-lavender-light'
              )}>
                {p.status === 'finalizado'
                  ? <CheckCircle className="w-5 h-5 text-brand-green-dark" />
                  : <FileText className="w-5 h-5 text-purple-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-text-primary">{p.aluno?.name}</span>
                  <span className="badge badge-blue">{p.period}</span>
                  <span className={cn('badge', p.status === 'finalizado' ? 'badge-green' : 'badge-lavender')}>
                    {p.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                  </span>
                  {p.geradoEmSubst && <span className="badge badge-yellow">🔄 Substituição</span>}
                </div>
                <p className="text-xs text-text-muted">
                  {p.professor?.name} · {formatDate(p.createdAt)}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
