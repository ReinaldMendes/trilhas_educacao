'use client'
import { useEffect, useState } from 'react'
import { Building2, Plus, Users, BookOpen, ChevronRight, X, Check, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface Unidade {
  id: string
  name: string
  type: 'cmei' | 'escola'
  address?: string
  active: boolean
  _count: { turmas: number; coordenadores: number }
}

interface UsuarioOpt {
  id: string
  name: string
  email: string
  role: string
}

const TIPO_LABEL = { cmei: 'CMEI', escola: 'Escola' }

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Unidade | null>(null)
  const [form, setForm] = useState({ name: '', type: 'cmei' as 'cmei' | 'escola', address: '' })
  const [saving, setSaving] = useState(false)

  // Modal de vincular coordenador
  const [vinculoModal, setVinculoModal] = useState<Unidade | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioOpt[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [vinculando, setVinculando] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/unidades')
      setUnidades(data)
    } catch { toast.error('Erro ao carregar unidades') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function abrirNova() {
    setEditando(null)
    setForm({ name: '', type: 'cmei', address: '' })
    setShowModal(true)
  }

  function abrirEditar(u: Unidade) {
    setEditando(u)
    setForm({ name: u.name, type: u.type, address: u.address || '' })
    setShowModal(true)
  }

  async function salvar() {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      if (editando) {
        await api.patch(`/unidades/${editando.id}`, form)
        toast.success('Unidade atualizada!')
      } else {
        await api.post('/unidades', form)
        toast.success('Unidade criada!')
      }
      setShowModal(false)
      load()
    } catch { toast.error('Erro ao salvar unidade') }
    finally { setSaving(false) }
  }

  async function abrirVinculo(u: Unidade) {
    setVinculoModal(u)
    setSelectedUser('')
    try {
      const { data } = await api.get('/users?role=coordenador')
      const { data: dirs } = await api.get('/users?role=diretora')
      setUsuarios([...data, ...dirs])
    } catch { toast.error('Erro ao carregar usuários') }
  }

  async function vincular() {
    if (!selectedUser || !vinculoModal) return
    setVinculando(true)
    try {
      await api.post(`/unidades/${vinculoModal.id}/coordenadores`, { userId: selectedUser })
      toast.success('Usuário vinculado!')
      setVinculoModal(null)
      load()
    } catch { toast.error('Erro ao vincular usuário') }
    finally { setVinculando(false) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Unidades</h1>
          <p className="page-subtitle">Gerencie CMEIs e Escolas da rede municipal</p>
        </div>
        <button onClick={abrirNova} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Unidade
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-soft" />)}</div>
      ) : unidades.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 className="w-14 h-14 text-brand-gray-mid mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Nenhuma unidade cadastrada</h3>
          <p className="text-sm text-text-muted mb-6">Crie a primeira unidade da rede.</p>
          <button onClick={abrirNova} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar Unidade
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {unidades.map((u) => (
            <div key={u.id} className="card-hover flex items-center gap-4 p-4">
              <div className="w-11 h-11 rounded-2xl bg-brand-green-light flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-brand-green-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-text-primary">{u.name}</span>
                  <span className="badge badge-blue">{TIPO_LABEL[u.type]}</span>
                  {!u.active && <span className="badge badge-yellow">Inativa</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  {u.address && <span>{u.address}</span>}
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{u._count.turmas} turmas</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{u._count.coordenadores} gestores</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => abrirVinculo(u)} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Gestores
                </button>
                <button onClick={() => abrirEditar(u)} className="btn-ghost p-2">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">{editando ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nome da Unidade *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: CMEI Jardim das Flores" className="input" />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="input">
                  <option value="cmei">CMEI</option>
                  <option value="escola">Escola</option>
                </select>
              </div>
              <div>
                <label className="label">Endereço</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Rua, número - Bairro/Cidade" className="input" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <span className="spinner border-white/30 border-t-white" /> : <Check className="w-4 h-4" />}
                {editando ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal vincular gestor */}
      {vinculoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Vincular Gestor</h2>
                <p className="text-xs text-text-muted mt-0.5">{vinculoModal.name}</p>
              </div>
              <button onClick={() => setVinculoModal(null)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Coordenador ou Diretora</label>
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="input">
                  <option value="">Selecione um usuário...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role}) — {u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setVinculoModal(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={vincular} disabled={vinculando || !selectedUser} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {vinculando ? <span className="spinner border-white/30 border-t-white" /> : <Users className="w-4 h-4" />}
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
