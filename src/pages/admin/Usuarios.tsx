import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Perfil, Hospital } from '@/types/database.types'
import { formatDate, formatRelative } from '@/lib/utils'
import {
  Users, Building2, Shield, Loader2, Edit2, X, Search, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

type PerfilRow = Perfil & {
  hospitais: Hospital | null
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<PerfilRow[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<PerfilRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PerfilRow | null>(null)

  // Form
  const [editHospitalId, setEditHospitalId] = useState('')
  const [editRole, setEditRole] = useState<'tecnico' | 'admin'>('tecnico')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setIsLoading(true)
    const [{ data: perfisData }, { data: hospData }] = await Promise.all([
      supabase.from('perfis').select('*, hospitais(*)').order('criado_em', { ascending: false }),
      supabase.from('hospitais').select('*').eq('ativo', true).order('nome'),
    ])
    setUsuarios((perfisData ?? []) as PerfilRow[])
    setHospitais(hospData ?? [])
    setIsLoading(false)
  }

  function openEdit(user: PerfilRow) {
    setEditTarget(user)
    setEditHospitalId(user.hospital_id ?? '')
    setEditRole(user.role)
  }

  async function handleSave() {
    if (!editTarget) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('perfis')
        .update({
          hospital_id: editHospitalId || null,
          role: editRole,
          hospital_selecionado_em: editHospitalId ? new Date().toISOString() : null,
        })
        .eq('id', editTarget.id)
      if (error) throw error
      toast.success(`Perfil de "${editTarget.nome}" atualizado!`)
      setEditTarget(null)
      await loadData()
    } catch {
      toast.error('Erro ao salvar perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: deleteTarget.id },
      })
      if (error) throw error
      toast.success(`Usuário "${deleteTarget.nome}" excluído.`)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir usuário.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = search
    ? usuarios.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : usuarios

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="text-sm text-text-muted">{usuarios.length} usuários registrados</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
        <input type="search" placeholder="Buscar por nome ou e-mail..." className="input pl-9"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Hospital</th>
                <th>Função</th>
                <th>Último acesso</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xs font-bold text-primary">
                          {u.nome?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{u.nome}</p>
                        <p className="text-2xs text-text-subtle">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-sm text-text-muted">
                      <Building2 className="w-3 h-3" />
                      {u.hospitais?.nome ?? <em className="text-status-pendente">Sem hospital</em>}
                    </span>
                  </td>
                  <td>
                    {u.role === 'admin'
                      ? <span className="badge-info"><Shield className="w-3 h-3" />Admin</span>
                      : <span className="badge bg-surface-active text-text-muted border border-border">Técnico</span>
                    }
                  </td>
                  <td className="text-xs text-text-muted">
                    {u.ultimo_acesso ? formatRelative(u.ultimo_acesso) : '—'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)}
                        className="btn-icon btn-sm text-text-muted hover:text-primary" title="Editar usuário">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)}
                        className="btn-icon btn-sm text-text-muted hover:text-status-danger" title="Excluir usuário">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-sm w-full animate-slide-up">
            <div className="card-body space-y-4">
              <div className="text-center">
                <Trash2 className="w-10 h-10 text-status-danger mx-auto mb-3" />
                <h3 className="text-base font-semibold text-text">Excluir usuário?</h3>
                <p className="text-sm text-text-muted mt-1">
                  A conta de <strong className="text-text">{deleteTarget.nome}</strong> será removida permanentemente.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleDelete} disabled={isDeleting} className="btn-danger flex-1">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full animate-slide-up">
            <div className="card-header">
              <h3 className="text-base font-semibold text-text">Editar Perfil</h3>
              <button onClick={() => setEditTarget(null)} className="btn-icon btn-sm text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-3 bg-surface-active rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {editTarget.nome?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{editTarget.nome}</p>
                  <p className="text-xs text-text-subtle">{editTarget.email}</p>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Hospital vinculado</label>
                <select className="input" value={editHospitalId} onChange={e => setEditHospitalId(e.target.value)}>
                  <option value="">Sem hospital</option>
                  {hospitais.map(h => <option key={h.id} value={h.id}>{h.nome} ({h.codigo})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Função</label>
                <select className="input" value={editRole} onChange={e => setEditRole(e.target.value as 'tecnico' | 'admin')}>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditTarget(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
