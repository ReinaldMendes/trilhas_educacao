'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'
import { User, Role, ROLE_LABELS, ROLE_COLORS } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SmeUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'coordenador' as Role })

  useEffect(() => {
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  async function criarUsuario() {
    setSaving(true)
    try {
      const r = await api.post('/users', form)
      setUsers((prev) => [...prev, r.data])
      setForm({ name: '', email: '', password: '', role: 'coordenador' })
      setShowModal(false)
      toast.success('Usuário criado!')
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Erro ao criar') }
    setSaving(false)
  }

  const roles: Role[] = ['professor', 'corregente', 'coordenador', 'diretora', 'sme']

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Usuários da Rede</h1>
          <p className="page-subtitle">Gerencie todos os acessos da rede municipal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-10" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input sm:w-52">
          <option value="">Todos os perfis</option>
          {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-green-light rounded-full flex items-center justify-center font-bold text-brand-green-dark text-sm">{u.name.charAt(0)}</div>
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-text-muted text-xs">{u.email}</td>
                  <td><span className={cn('badge', ROLE_COLORS[u.role])}>{ROLE_LABELS[u.role]}</span></td>
                  <td><span className={cn('badge', u.active ? 'badge-green' : 'badge-gray')}>{u.active ? 'Ativo' : 'Inativo'}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-text-muted">Nenhum usuário encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-float p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-bold text-text-primary text-lg mb-4">Novo Usuário</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nome completo" />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="email@rede.edu.br" />
              </div>
              <div>
                <label className="label">Senha *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pr-12" placeholder="Mínimo 8 caracteres" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Perfil *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="input">
                  {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
              <button onClick={criarUsuario} disabled={saving || !form.name || !form.email || !form.password} className="btn-primary flex-1">
                {saving ? <span className="spinner border-white/30 border-t-white mx-auto" /> : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
