'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Sparkles, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { Parecer } from '@/types'
import { formatDate, cn } from '@/lib/utils'

export default function CoordenadorPareceresPage() {
  const [pareceres, setPareceres] = useState<Parecer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pareceres').then((r) => setPareceres(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Pareceres</h1>
          <p className="page-subtitle">Gere pareceres em substituição quando necessário</p>
        </div>
        <Link href="/dashboard/professor/pareceres" className="btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Gerar Parecer
        </Link>
      </div>

      {/* Info banner */}
      <div className="bg-brand-yellow-light border border-brand-yellow rounded-2xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-yellow-800 text-sm">Geração em Substituição</p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Pareceres gerados pela coordenação ficam identificados com a nota "Gerado em substituição". 
            A professora pode revisá-los ao retornar.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : pareceres.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum parecer ainda</h3>
          <p className="text-sm text-text-muted mb-6">Use o botão acima para gerar pareceres quando necessário.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pareceres.map((p) => (
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
                  {p.geradoEmSubst && (
                    <span className="badge badge-yellow">🔄 Substituição · {p.substitutoPor}</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">Criado em {formatDate(p.createdAt)} · {p.professor?.name}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-gray-mid flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
