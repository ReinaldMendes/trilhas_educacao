'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, TrendingUp, BookOpen, CalendarDays } from 'lucide-react'
import api from '@/lib/api'
import { CAMPOS_EXPERIENCIA_COLORS } from '@/types'
import { cn } from '@/lib/utils'

const MODALIDADE_COLORS: Record<string, string> = {
  dirigida: '#A8C5B5',
  livre:    '#BBD7E8',
  externa:  '#FAD9A6',
}

const MODALIDADE_LABELS: Record<string, string> = {
  dirigida: 'Dirigida',
  livre:    'Livre',
  externa:  'Externa',
}

export default function GraficosPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboards/professor')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Autoavaliação</h1></div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="card h-64 animate-pulse bg-brand-gray-light" />)}
      </div>
    </div>
  )

  const camposData = data?.camposExperiencia?.map((c: any) => ({
    name: c.label.split(',')[0].slice(0, 28) + (c.label.length > 28 ? '...' : ''),
    fullLabel: c.label,
    count: c.count,
    fill: CAMPOS_EXPERIENCIA_COLORS[c.id] || '#A8C5B5',
  })) ?? []

  const modalidadesData = data?.modalidades?.map((m: any) => ({
    name: MODALIDADE_LABELS[m.modalidade] ?? m.modalidade,
    value: m.count,
    fill: MODALIDADE_COLORS[m.modalidade] ?? '#E6E4E1',
  })) ?? []

  const tiposData = data?.tiposProposta?.slice(0, 8).map((t: any) => ({
    name: t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1).replace('_', ' '),
    count: t.count,
  })) ?? []

  const alunosData = data?.registrosPorAluno?.sort((a: any, b: any) => b.count - a.count) ?? []

  const statCards = [
    { label: 'Planejamentos', value: data?.totalPlanejamentos ?? 0, icon: CalendarDays, color: 'bg-brand-green-light text-brand-green-dark' },
    { label: 'Registros', value: data?.totalRegistros ?? 0, icon: BookOpen, color: 'bg-brand-blue-light text-blue-700' },
    { label: 'Crianças', value: data?.totalAlunos ?? 0, icon: TrendingUp, color: 'bg-brand-yellow-light text-yellow-700' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Autoavaliação Pedagógica</h1>
        <p className="page-subtitle">Indicadores formativos do seu trabalho — para caminhar juntos 🌿</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card flex flex-col gap-2">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-text-primary">{s.value}</p>
              <p className="text-xs font-semibold text-text-secondary">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Campos de experiência */}
        <div className="card">
          <h3 className="section-title mb-6">Campos de Experiência Trabalhados</h3>
          {camposData.every((c: any) => c.count === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem planejamentos ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={camposData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fontFamily: 'Nunito' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }}
                  formatter={(v, _, p) => [v, p.payload.fullLabel]}
                />
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
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem propostas ainda</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={modalidadesData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {modalidadesData.map((m: any, i: number) => <Cell key={i} fill={m.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: 'Nunito', fontSize: 12 }} />
              </PieChart>
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

        {/* Frequência por criança */}
        <div className="card">
          <h3 className="section-title mb-4">Frequência de Registros por Criança</h3>
          {alunosData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">Sem registros ainda</div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {alunosData.map((a: any) => {
                const max = Math.max(...alunosData.map((x: any) => x.count), 1)
                const pct = (a.count / max) * 100
                return (
                  <div key={a.id}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-text-primary">{a.name}</span>
                      <span className="text-text-muted">{a.count} reg.</span>
                    </div>
                    <div className="h-2 bg-brand-gray-light rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: pct > 66 ? '#A8C5B5' : pct > 33 ? '#FAD9A6' : '#F7BFAE' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-xs text-text-muted mt-3 italic">
            Gráficos formativos, não avaliativos. Use como apoio à sua reflexão pedagógica. 🌱
          </p>
        </div>
      </div>
    </div>
  )
}
