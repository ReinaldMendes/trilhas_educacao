// @ts-nocheck
'use client'
// Re-uses coordenador graficos logic but with diretora context
import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '@/lib/api'
import { CAMPOS_EXPERIENCIA_COLORS } from '@/types'

const MODALIDADE_COLORS: Record<string, string> = { dirigida: '#A8C5B5', livre: '#BBD7E8', externa: '#FAD9A6' }
const MODALIDADE_LABELS: Record<string, string> = { dirigida: 'Dirigida', livre: 'Livre', externa: 'Externa' }

export default function DiretoraGraficos() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboards/unidade').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Indicadores da Unidade</h1></div>
      <div className="grid md:grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="card h-64 animate-pulse bg-brand-gray-light" />)}</div>
    </div>
  )

  const camposData = (data?.camposExperiencia ?? []).map((c: any) => ({
    name: c.label.split(',')[0].slice(0, 26) + '…',
    fullLabel: c.label,
    count: c.count,
    fill: CAMPOS_EXPERIENCIA_COLORS[c.id] || '#A8C5B5',
  }))

  const modalidadesData = (data?.modalidades ?? []).map((m: any) => ({
    name: MODALIDADE_LABELS[m.modalidade] ?? m.modalidade,
    value: m.count,
    fill: MODALIDADE_COLORS[m.modalidade] ?? '#E6E4E1',
  }))

  const turmasData = (data?.planejamentosPorTurma ?? []).map((t: any) => ({
    name: t.turma.split(' ').slice(0, 3).join(' '),
    count: t.count,
  }))

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Indicadores da Unidade</h1>
        <p className="page-subtitle">Acompanhe o trabalho pedagógico da sua unidade</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Turmas', value: data?.totalTurmas ?? 0 },
          { label: 'Crianças', value: data?.totalAlunos ?? 0 },
          { label: 'Planejamentos', value: data?.totalPlanejamentos ?? 0 },
          { label: 'Registros', value: data?.totalRegistros ?? 0 },
        ].map((s) => (
          <div key={s.label} className="card flex flex-col gap-2">
            <p className="text-2xl font-black text-text-primary">{s.value}</p>
            <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-6">Campos de Experiência</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={camposData} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
              <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} formatter={(v, _, p) => [v, p.payload.fullLabel]} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {camposData.map((c: any, i: number) => <Cell key={i} fill={c.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="section-title mb-6">Equilíbrio das Propostas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modalidadesData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {modalidadesData.map((m: any, i: number) => <Cell key={i} fill={m.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: 'Nunito', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card md:col-span-2">
          <h3 className="section-title mb-6">Planejamentos por Turma</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={turmasData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
              <Bar dataKey="count" fill="#A8C5B5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
