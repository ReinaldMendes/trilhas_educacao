'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '@/lib/api'
import { CAMPOS_EXPERIENCIA_COLORS, CAMPOS_EXPERIENCIA } from '@/types'
import { cn } from '@/lib/utils'

const MODALIDADE_COLORS: Record<string, string> = { dirigida: '#A8C5B5', livre: '#BBD7E8', externa: '#FAD9A6' }
const MODALIDADE_LABELS: Record<string, string> = { dirigida: 'Dirigida', livre: 'Livre', externa: 'Externa' }

export default function CoordenadorGraficosPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboards/unidade').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Indicadores da Unidade</h1></div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="card h-64 animate-pulse bg-brand-gray-light" />)}
      </div>
    </div>
  )

  const camposData = (data?.camposExperiencia ?? []).map((c: any) => ({
    name: c.label.split(',')[0].slice(0, 26) + (c.label.length > 26 ? '…' : ''),
    fullLabel: c.label,
    count: c.count,
    fill: CAMPOS_EXPERIENCIA_COLORS[c.id] || '#A8C5B5',
  }))

  const modalidadesData = (data?.modalidades ?? []).map((m: any) => ({
    name: MODALIDADE_LABELS[m.modalidade] ?? m.modalidade,
    value: m.count,
    fill: MODALIDADE_COLORS[m.modalidade] ?? '#E6E4E1',
  }))

  const tiposData = (data?.tiposProposta ?? []).slice(0, 8).map((t: any) => ({
    name: t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1).replace('_', ' '),
    count: t.count,
  }))

  const turmasData = (data?.planejamentosPorTurma ?? []).map((t: any) => ({
    name: t.turma.split(' ').slice(0, 3).join(' '),
    count: t.count,
  }))

  const totals = [
    { label: 'Turmas', value: data?.totalTurmas ?? 0, color: 'bg-brand-green-light text-brand-green-dark' },
    { label: 'Crianças', value: data?.totalAlunos ?? 0, color: 'bg-brand-blue-light text-blue-700' },
    { label: 'Planejamentos', value: data?.totalPlanejamentos ?? 0, color: 'bg-brand-yellow-light text-yellow-700' },
    { label: 'Registros', value: data?.totalRegistros ?? 0, color: 'bg-brand-salmon-light text-red-600' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Indicadores da Unidade</h1>
        <p className="page-subtitle">Gráficos formativos para apoiar decisões pedagógicas 🌱</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {totals.map((t) => (
          <div key={t.label} className="card flex flex-col gap-2">
            <p className={cn('text-2xl font-black', t.color.split(' ')[1])}>{t.value}</p>
            <p className="text-xs font-semibold text-text-secondary">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Campos de experiência */}
        <div className="card">
          <h3 className="section-title mb-6">Campos de Experiência — Unidade</h3>
          {camposData.every((c: any) => c.count === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem dados ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={camposData} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
                <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }}
                  formatter={(v, _, p) => [v, p.payload.fullLabel]} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {camposData.map((c: any, i: number) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Modalidades */}
        <div className="card">
          <h3 className="section-title mb-6">Equilíbrio das Propostas</h3>
          {modalidadesData.every((m: any) => m.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem dados ainda</div>
          ) : (
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
          )}
        </div>

        {/* Planejamentos por turma */}
        <div className="card">
          <h3 className="section-title mb-6">Planejamentos por Turma</h3>
          {turmasData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem dados ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={turmasData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
                <Bar dataKey="count" fill="#DCC7E7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tipos de proposta */}
        <div className="card">
          <h3 className="section-title mb-6">Tipos de Proposta Mais Utilizados</h3>
          {tiposData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem dados ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tiposData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
                <Bar dataKey="count" fill="#BBD7E8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <p className="text-xs text-text-muted text-center mt-6 italic">
        Gráficos formativos, não avaliativos. Indicadores para caminhar juntos! 🌿
      </p>
    </div>
  )
}
