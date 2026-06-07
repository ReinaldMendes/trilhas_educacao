'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '@/lib/api'

export default function SmeGraficos() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboards/rede').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Indicadores da Rede</h1></div>
      <div className="grid md:grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="card h-64 animate-pulse bg-brand-gray-light" />)}</div>
    </div>
  )

  const unidadesData = (data?.porUnidade ?? []).map((u: any) => ({
    name: u.name.split(' ').slice(0, 3).join(' '),
    turmas: u._count.turmas,
  }))

  const totals = data?.totais ?? {}
  const resumo = [
    { label: 'Unidades', value: totals.unidades ?? 0 },
    { label: 'Turmas', value: totals.turmas ?? 0 },
    { label: 'Crianças', value: totals.alunos ?? 0 },
    { label: 'Planejamentos', value: totals.planejamentos ?? 0 },
    { label: 'Registros', value: totals.registros ?? 0 },
    { label: 'Pareceres', value: totals.pareceresFinalizados ?? 0 },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Indicadores da Rede</h1>
        <p className="page-subtitle">Visão consolidada de toda a rede municipal</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {resumo.map((s) => (
          <div key={s.label} className="card flex flex-col gap-2">
            <p className="text-2xl font-black text-text-primary">{s.value}</p>
            <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="section-title mb-6">Turmas por Unidade Escolar</h3>
        {unidadesData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem dados ainda</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={unidadesData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
              <Bar dataKey="turmas" radius={[6, 6, 0, 0]}>
                {unidadesData.map((_: any, i: number) => (
                  <Cell key={i} fill={['#A8C5B5','#BBD7E8','#FAD9A6','#F7BFAE','#DCC7E7'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
