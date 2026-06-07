'use client'
import { useEffect, useState } from 'react'
import { Building2, Search } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export default function SmeUnidades() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/dashboards/rede').then((r) => setData(r.data.porUnidade ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = data.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Unidades da Rede</h1>
        <p className="page-subtitle">Todas as unidades escolares municipais</p>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar unidade..." className="input pl-10 max-w-sm" />
      </div>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div key={u.id} className="card-hover flex items-center gap-4 p-4">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                u.type === 'cmei' ? 'bg-brand-blue-light' : 'bg-brand-green-light'
              )}>
                <Building2 className={cn('w-6 h-6', u.type === 'cmei' ? 'text-blue-700' : 'text-brand-green-dark')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary truncate">{u.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('badge', u.type === 'cmei' ? 'badge-blue' : 'badge-green')}>{u.type.toUpperCase()}</span>
                  <span className="text-xs text-text-muted">{u._count.turmas} turma{u._count.turmas !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="card text-center py-12 col-span-3 text-text-muted">Nenhuma unidade encontrada</div>}
        </div>
      )}
    </div>
  )
}
