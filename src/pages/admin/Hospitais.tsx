import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Hospital, HospitalInsert } from '@/types/database.types'
import {
  Building2, Plus, Edit2, Loader2, AlertCircle,
  CheckCircle2, X, Power, PowerOff, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function HospitaisPage() {
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Hospital | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Hospital | null>(null)

  // Form
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [cidade, setCidade] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase
      .from('hospitais')
      .select('*')
      .order('nome')
    setHospitais(data ?? [])
    setIsLoading(false)
  }

  function openForm(hospital?: Hospital) {
    if (hospital) {
      setEditTarget(hospital)
      setNome(hospital.nome)
      setCodigo(hospital.codigo)
      setCidade(hospital.cidade)
      setAtivo(hospital.ativo)
    } else {
      setEditTarget(null)
      setNome('')
      setCodigo('')
      setCidade('')
      setAtivo(true)
    }
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditTarget(null)
  }

  async function handleSave() {
    if (!nome.trim() || !codigo.trim()) {
      toast.error('Nome e código são obrigatórios.')
      return
    }
    setIsSaving(true)
    try {
      if (editTarget) {
        const { error } = await supabase
          .from('hospitais')
          .update({ nome: nome.trim(), codigo: codigo.trim(), cidade: cidade.trim(), ativo })
          .eq('id', editTarget.id)
        if (error) throw error
        toast.success('Hospital atualizado!')
      } else {
        const { error } = await supabase
          .from('hospitais')
          .insert({ nome: nome.trim(), codigo: codigo.trim(), cidade: cidade.trim(), ativo })
        if (error) {
          if (error.code === '23505') throw new Error('Já existe um hospital com este código.')
          throw error
        }
        toast.success('Hospital cadastrado!')
      }
      closeForm()
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleAtivo(hospital: Hospital) {
    const newAtivo = !hospital.ativo
    const { error } = await supabase
      .from('hospitais')
      .update({ ativo: newAtivo })
      .eq('id', hospital.id)
    if (error) { toast.error('Erro.'); return }
    toast.success(newAtivo ? 'Hospital ativado.' : 'Hospital desativado.')
    await loadData()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('hospitais')
        .delete()
        .eq('id', deleteTarget.id)
      if (error?.code === '23503') {
        throw new Error('Este hospital possui equipamentos vinculados e não pode ser excluído.')
      }
      if (error) throw error
      toast.success('Hospital excluído.')
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir hospital.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospitais</h1>
          <p className="text-sm text-text-muted">{hospitais.length} hospitais cadastrados</p>
        </div>
        <button onClick={() => openForm()} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          Novo Hospital
        </button>
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
                <th>Nome</th>
                <th>Código</th>
                <th>Cidade</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {hospitais.map(h => (
                <tr key={h.id}>
                  <td className="font-medium">{h.nome}</td>
                  <td>
                    <code className="text-xs bg-surface-active px-1.5 py-0.5 rounded font-mono">
                      {h.codigo}
                    </code>
                  </td>
                  <td className="text-text-muted">{h.cidade || '—'}</td>
                  <td>
                    {h.ativo
                      ? <span className="badge-validado"><Power className="w-3 h-3" />Ativo</span>
                      : <span className="badge-danger"><PowerOff className="w-3 h-3" />Inativo</span>
                    }
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openForm(h)} className="btn-icon btn-sm text-text-muted hover:text-primary">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleAtivo(h)} className="btn-icon btn-sm text-text-muted hover:text-status-pendente">
                        {h.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setDeleteTarget(h)} className="btn-icon btn-sm text-text-muted hover:text-status-danger" title="Excluir hospital">
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
                <h3 className="text-base font-semibold text-text">Excluir hospital?</h3>
                <p className="text-sm text-text-muted mt-1">
                  <strong className="text-text">{deleteTarget.nome}</strong> será removido permanentemente.
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

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full animate-slide-up">
            <div className="card-header">
              <h3 className="text-base font-semibold text-text">
                {editTarget ? 'Editar Hospital' : 'Novo Hospital'}
              </h3>
              <button onClick={closeForm} className="btn-icon btn-sm text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="label">Nome *</label>
                <input type="text" className="input" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Nome do hospital" autoFocus />
              </div>
              <div className="form-group">
                <label className="label">Código (sigla) *</label>
                <input type="text" className="input" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ex: HSP-001" />
                <p className="text-2xs text-text-subtle mt-1">Este código será usado para identificar a aba na planilha Microsoft.</p>
              </div>
              <div className="form-group">
                <label className="label">Cidade</label>
                <input type="text" className="input" value={cidade} onChange={e => setCidade(e.target.value)}
                  placeholder="Cidade" />
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0">Ativo</label>
                <button type="button" onClick={() => setAtivo(!ativo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ativo ? 'bg-primary' : 'bg-border'
                  }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ativo ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeForm} className="btn-secondary flex-1">Cancelar</button>
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
