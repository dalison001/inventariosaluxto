import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Hospital } from '@/types/database.types'
import { Building2, Search, AlertTriangle, CheckCircle2, Loader2, Server } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'

export default function SelectHospitalPage() {
  const { selectHospital } = useAuth()
  const { profile } = useAppStore()
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [filtered, setFiltered] = useState<Hospital[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Hospital | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    loadHospitais()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? hospitais.filter(h =>
            h.nome.toLowerCase().includes(q) ||
            h.codigo.toLowerCase().includes(q) ||
            h.cidade.toLowerCase().includes(q)
          )
        : hospitais
    )
  }, [search, hospitais])

  async function loadHospitais() {
    const { data } = await supabase
      .from('hospitais')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    setHospitais(data ?? [])
    setFiltered(data ?? [])
    setIsLoading(false)
  }

  async function handleConfirm() {
    if (!selected) return
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    try {
      setIsSaving(true)
      await selectHospital(selected.id)
      toast.success(`Hospital "${selected.nome}" vinculado com sucesso!`)
      // O hook useAuth irá recarregar o perfil e redirecionar automaticamente
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.'
      toast.error(msg)
      setConfirmed(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-primary/10 border border-primary/30 mb-3">
            <Server className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-text">Selecione seu Hospital</h1>
          <p className="text-sm text-text-muted mt-1">
            Olá, <span className="text-text font-medium">{profile?.nome}</span>!
          </p>
        </div>

        <div className="card">
          <div className="card-body space-y-4">
            {/* Aviso permanente */}
            <div className="flex items-start gap-3 bg-status-pendenteBg border border-status-pendente/30
                            rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-status-pendente flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-pendente leading-relaxed">
                <strong>Atenção:</strong> Esta seleção é <strong>permanente</strong>.
                Somente um administrador poderá alterar o hospital vinculado à sua conta.
              </p>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
              <input
                type="search"
                placeholder="Buscar hospital por nome, código ou cidade..."
                className="input pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Lista de hospitais */}
            <div className="space-y-1 max-h-64 overflow-y-auto -mx-2 px-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">
                  Nenhum hospital encontrado.
                </div>
              ) : (
                filtered.map(hospital => (
                  <button
                    key={hospital.id}
                    onClick={() => { setSelected(hospital); setConfirmed(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                text-left transition-all duration-150 border
                                ${selected?.id === hospital.id
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'border-transparent hover:bg-surface-hover text-text'
                                }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${selected?.id === hospital.id
                                      ? 'bg-primary/20'
                                      : 'bg-surface-active'
                                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{hospital.nome}</p>
                      <p className="text-xs text-text-muted">{hospital.codigo} · {hospital.cidade}</p>
                    </div>
                    {selected?.id === hospital.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Confirmação dupla */}
            {selected && confirmed && (
              <div className="bg-status-dangerBg border border-status-danger/30 rounded-xl p-3">
                <p className="text-sm text-status-danger text-center leading-relaxed">
                  Confirmar vínculo com<br />
                  <strong>"{selected.nome}"</strong>?<br />
                  <span className="text-xs opacity-80">Esta ação não poderá ser desfeita por você.</span>
                </p>
              </div>
            )}

            {/* Botão */}
            <button
              onClick={handleConfirm}
              disabled={!selected || isSaving}
              className={`btn w-full btn-lg ${confirmed ? 'btn-danger' : 'btn-primary'}`}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
              ) : confirmed ? (
                'Sim, confirmar este hospital'
              ) : selected ? (
                `Continuar com "${selected.nome}"`
              ) : (
                'Selecione um hospital'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
