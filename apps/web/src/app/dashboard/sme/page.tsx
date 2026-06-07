'use client'
import { useEffect, useState } from 'react'
import { Building2, Users, GraduationCap, CalendarDays, BookOpen, FileText, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function SmePage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboards/rede').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  const totais = data?.totais ?? {}
  const statCards = [
    { label: 'Unidades', value: totais.unidades, icon: Building2, color: 'bg-brand-green-light text-brand-green-dark' },
    { label: 'Turmas', value: totais.turmas, icon: GraduationCap, color: 'bg-brand-blue-light text-blue-700' },
    { label: 'Crianças', value: totais.alunos, icon: Users, color: 'bg-brand-yellow-light text-yellow-700' },
    { label: 'Planejamentos', value: totais.planejamentos, icon: CalendarDays, color: 'bg-brand-salmon-light text-red-600' },
    { label: 'Registros', value: totais.registros, icon: BookOpen, color: 'bg-brand-lavender-light text-purple-700' },
    { label: 'Pareceres', value: totais.pareceresFinalizados, icon: FileText, color: 'bg-brand-green-light text-brand-green-dark' },
  ]

  const unidadesData = (data?.porUnidade ?? []).map((u: any) => ({
    name: u.name.split(' ').slice(0,3).join(' '),
    turmas: u._count.turmas,
  }))

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🏛️</span>
          <div>
            <h1 className="page-title">{greeting}, {user?.name.split(' ')[0]}!</h1>
            <p className="page-subtitle">Visão estratégica da rede municipal de Educação Infantil</p>
          </div>
        </div>
      </div>

      {/* Big stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card flex flex-col gap-2">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.color)}>
                <Icon className="w-4 h-4" />
              </div>
              {loading ? <div className="h-6 w-10 bg-brand-gray-light rounded-lg animate-pulse" /> : (
                <p className="text-xl font-black text-text-primary">{s.value ?? 0}</p>
              )}
              <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Turmas por unidade chart */}
      <div className="card mb-6">
        <h3 className="section-title mb-6">Turmas por Unidade Escolar</h3>
        {loading ? (
          <div className="h-48 bg-brand-gray-light rounded-xl animate-pulse" />
        ) : unidadesData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-text-muted">Nenhuma unidade cadastrada</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={unidadesData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
              <Bar dataKey="turmas" radius={[6,6,0,0]}>
                {unidadesData.map((_: any, i: number) => (
                  <Cell key={i} fill={['#A8C5B5','#BBD7E8','#FAD9A6','#F7BFAE','#DCC7E7'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Unidades table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Unidades da Rede</h3>
          <Link href="/dashboard/sme/unidades" className="text-xs text-brand-green-dark font-bold hover:underline">Ver todas</Link>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-brand-gray-light rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Tipo</th>
                  <th>Turmas</th>
                </tr>
              </thead>
              <tbody>
                {(data?.porUnidade ?? []).map((u: any) => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.name}</td>
                    <td><span className={cn('badge', u.type === 'cmei' ? 'badge-blue' : 'badge-green')}>{u.type.toUpperCase()}</span></td>
                    <td>{u._count.turmas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
