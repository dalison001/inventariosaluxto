import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Equipamento, TipoEquipamento, Hospital, Perfil } from '@/types/database.types'
import { formatDate, formatRelative } from '@/lib/utils'
import {
  CheckCircle2, Loader2, Building2, User, Clock,
  Filter, Search
} from 'lucide-react'
import toast from 'react-hot-toast'

type PendenteRow = Equipamento & {
  tipos_equipamento: TipoEquipamento | null
  hospitais: Hospital | null
  criador: Perfil | null
}

export default function PendentesPage() {
  const { isAdmin } = useAppStore()
  const [items, setItems] = useState<PendenteRow[]>([])
  const [filtered, setFiltered] = useState<PendenteRow[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)
  const [filterHospital, setFilterHospital] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let list = [...items]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.nome.toLowerCase().includes(q) ||
        e.patrimonio.toLowerCase().includes(q)
      )
    }
    if (filterHospital) list = list.filter(e => e.hospital_id === filterHospital)
    setFiltered(list)
  }, [search, filterHospital, items])

  async function loadData() {
    setIsLoading(true)
    const { data } = await supabase
      .from('equipamentos')
      .select(`*, tipos_equipamento(*), hospitais(*), criador:criado_por(*)`)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false })
    setItems((data ?? []) as PendenteRow[])

    const { data: hospData } = await supabase
      .from('hospitais')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    setHospitais(hospData ?? [])
    setIsLoading(false)
  }

  async function handleValidar(equip: PendenteRow) {
    setValidating(equip.id)
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({ status: 'validado' })
        .eq('id', equip.id)
      if (error) throw error
      toast.success(`"${equip.nome}" validado!`)
      setItems(prev => prev.filter(e => e.id !== equip.id))
    } catch {
      toast.error('Erro ao validar equipamento.')
    } finally {
      setValidating(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipamentos Pendentes</h1>
          <p className="text-sm text-text-muted">
            {filtered.length} pendente{filtered.length !== 1 ? 's' : ''} para validação
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="search"
            placeholder="Buscar por nome ou patrimônio..."
            className="input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-56" value={filterHospital} onChange={e => setFilterHospital(e.target.value)}>
          <option value="">Todos os hospitais</option>
          {hospitais.map(h => <option key={h.id} value={h.id}>{h.nome}</option>)}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 className="empty-state-icon text-status-validado" />
          <p className="empty-state-title">Nenhum equipamento pendente!</p>
          <p className="empty-state-desc">Todos os equipamentos foram validados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(equip => (
            <div key={equip.id} className="card-hover">
              <div className="flex items-center gap-4 p-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-text truncate">{equip.nome}</span>
                    <code className="text-xs bg-surface-active px-1.5 py-0.5 rounded font-mono text-text-muted">
                      {equip.patrimonio}
                    </code>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {equip.hospitais?.nome ?? '—'}
                    </span>
                    <span>{equip.tipos_equipamento?.nome ?? '—'}</span>
                    {equip.numero_serie && <span>S/N: {equip.numero_serie}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelative(equip.criado_em)}
                    </span>
                  </div>
                </div>

                {/* Botão Validar */}
                <button
                  onClick={() => handleValidar(equip)}
                  disabled={validating === equip.id}
                  className="btn-primary btn-sm flex-shrink-0"
                >
                  {validating === equip.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" />Validar</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
