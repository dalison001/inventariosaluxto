import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Equipamento, TipoEquipamento, Hospital } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import {
  Search, Plus, QrCode, Download, FileSpreadsheet,
  Edit2, Trash2, Loader2, Filter, Building2, Send, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

type EquipRow = Equipamento & {
  tipos_equipamento: TipoEquipamento | null
  hospitais: Hospital | null
}

export default function InventarioPage() {
  const { profile, currentHospitalId, isAdmin } = useAppStore()
  const [equipamentos, setEquipamentos] = useState<EquipRow[]>([])
  const [filtered, setFiltered] = useState<EquipRow[]>([])
  const [tipos, setTipos] = useState<TipoEquipamento[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [validatingId, setValidatingId] = useState<string | null>(null)

  // Filtros
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState<'' | 'pendente' | 'validado'>('')
  const [filterTipo, setFilterTipo]       = useState('')
  const [filterHospital, setFilterHospital] = useState(currentHospitalId ?? '')

  // Modal editar
  const [editTarget, setEditTarget] = useState<EquipRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EquipRow | null>(null)

  useEffect(() => { loadData() }, [currentHospitalId])

  useEffect(() => {
    let list = [...equipamentos]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.nome.toLowerCase().includes(q) ||
        e.patrimonio.toLowerCase().includes(q) ||
        (e.numero_serie?.toLowerCase().includes(q) ?? false)
      )
    }
    if (filterStatus) list = list.filter(e => e.status === filterStatus)
    if (filterTipo)   list = list.filter(e => e.tipo_id === filterTipo)
    if (filterHospital && isAdmin()) list = list.filter(e => e.hospital_id === filterHospital)
    setFiltered(list)
  }, [search, filterStatus, filterTipo, filterHospital, equipamentos])

  async function loadData() {
    setIsLoading(true)
    const query = supabase
      .from('equipamentos')
      .select(`*, tipos_equipamento(*), hospitais(*)`)
      .order('criado_em', { ascending: false })

    if (!isAdmin() && currentHospitalId) {
      query.eq('hospital_id', currentHospitalId)
    } else if (isAdmin() && filterHospital) {
      query.eq('hospital_id', filterHospital)
    }

    const { data } = await query
    setEquipamentos((data ?? []) as EquipRow[])
    setFiltered((data ?? []) as EquipRow[])

    const [{ data: tiposData }, { data: hospData }] = await Promise.all([
      supabase.from('tipos_equipamento').select('*').order('nome'),
      supabase.from('hospitais').select('*').eq('ativo', true).order('nome'),
    ])
    setTipos(tiposData ?? [])
    setHospitais(hospData ?? [])
    setIsLoading(false)
  }

  async function handleDelete(equip: EquipRow) {
    const { error } = await supabase.from('equipamentos').delete().eq('id', equip.id)
    if (error) { toast.error('Erro ao excluir.'); return }
    toast.success('Equipamento excluído.')
    setEquipamentos(prev => prev.filter(e => e.id !== equip.id))
    setDeleteTarget(null)
  }

  async function handleValidar(equip: EquipRow) {
    setValidatingId(equip.id)
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({ status: 'validado' })
        .eq('id', equip.id)
      if (error) throw error
      setEquipamentos(prev => prev.map(item =>
        item.id === equip.id ? { ...item, status: 'validado' } : item
      ))
      toast.success(`"${equip.nome}" validado!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao validar equipamento.')
    } finally {
      setValidatingId(null)
    }
  }

  // ── Exportação PDF ─────────────────────────────
  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const hospitalNome = filtered[0]?.hospitais?.nome ?? 'Todos os Hospitais'
    const now = new Date().toLocaleDateString('pt-BR')

    doc.setFontSize(14)
    doc.text(`Inventário TI — ${hospitalNome}`, 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Gerado em ${now} · Total: ${filtered.length} equipamentos`, 14, 26)

    autoTable(doc, {
      startY: 32,
      head: [['Nome', 'Patrimônio', 'Tipo', 'Nº Série', 'Status', 'Hospital', 'Cadastrado em']],
      body: filtered.map(e => [
        e.nome,
        e.patrimonio,
        e.tipos_equipamento?.nome ?? '—',
        e.numero_serie ?? '—',
        e.status === 'validado' ? 'Validado' : 'Pendente',
        e.hospitais?.nome ?? '—',
        formatDate(e.criado_em),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    })

    doc.save(`inventario_${now.replace(/\//g, '-')}.pdf`)
    toast.success('PDF gerado!')
  }

  // ── Exportação Excel ─────────────────────────────
  function exportExcel() {
    const rows = filtered.map(e => ({
      'Nome':           e.nome,
      'Patrimônio':     e.patrimonio,
      'Tipo':           e.tipos_equipamento?.nome ?? '',
      'Nº de Série':    e.numero_serie ?? '',
      'Status':         e.status === 'validado' ? 'Validado' : 'Pendente',
      'Hospital':       e.hospitais?.nome ?? '',
      'Cadastrado em':  formatDate(e.criado_em),
      'Validado em':    formatDate(e.validado_em),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventário')

    // Auto-width
    const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r] ?? '').length))
    }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `inventario_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
    toast.success('Excel gerado!')
  }

  // ── Enviar para planilha Microsoft ─────────────────
  async function sendToMicrosoft() {
    setIsSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-to-excel', {
        body: { equipamentos: filtered },
      })
      if (error) throw error
      if (data?.integracaoNaoConfigurada) {
        toast.error('Integração com Microsoft não configurada. Acesse Admin > Configurações.')
        return
      }
      toast.success('Dados enviados para a planilha Microsoft!')
    } catch {
      toast.error('Erro ao enviar para planilha. Verifique as configurações.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventário</h1>
          <p className="text-sm text-text-muted">
            {filtered.length} equipamento{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/scanner" className="btn-secondary btn-sm">
            <QrCode className="w-4 h-4" />
            Escanear
          </Link>
          <Link to="/cadastro" className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Busca */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
              <input
                type="search"
                placeholder="Nome, patrimônio, série..."
                className="input pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Tipo */}
            <select className="input" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>

            {/* Status */}
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as '')}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="validado">Validado</option>
            </select>

            {/* Hospital (admin) */}
            {isAdmin() && (
              <select className="input" value={filterHospital} onChange={e => setFilterHospital(e.target.value)}>
                <option value="">Todos os hospitais</option>
                {hospitais.map(h => <option key={h.id} value={h.id}>{h.nome}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Exportação */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={exportPDF}   className="btn-secondary btn-sm"><Download className="w-4 h-4" />PDF</button>
        <button onClick={exportExcel} className="btn-secondary btn-sm"><FileSpreadsheet className="w-4 h-4" />Excel</button>
        <button onClick={sendToMicrosoft} disabled={isSending} className="btn-secondary btn-sm">
          {isSending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
            : <><Send className="w-4 h-4" />Enviar para Planilha</>
          }
        </button>
      </div>

      {/* Tabela */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Filter className="empty-state-icon" />
            <p className="empty-state-title">Nenhum equipamento encontrado</p>
            <p className="empty-state-desc">Tente ajustar os filtros ou{' '}
              <Link to="/cadastro" className="text-primary">cadastre um novo</Link>
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Patrimônio</th>
                <th>Tipo</th>
                <th>Nº Série</th>
                {isAdmin() && <th>Hospital</th>}
                <th>Status</th>
                <th>Cadastrado</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td className="font-medium max-w-[180px]">
                    <span className="truncate block">{e.nome}</span>
                  </td>
                  <td>
                    <code className="text-xs bg-surface-active px-1.5 py-0.5 rounded font-mono">
                      {e.patrimonio}
                    </code>
                  </td>
                  <td className="text-text-muted">{e.tipos_equipamento?.nome ?? '—'}</td>
                  <td className="text-text-muted text-xs">{e.numero_serie || '—'}</td>
                  {isAdmin() && (
                    <td>
                      <div className="flex items-center gap-1 text-text-muted text-xs">
                        <Building2 className="w-3 h-3" />
                        {e.hospitais?.nome ?? '—'}
                      </div>
                    </td>
                  )}
                  <td><StatusBadge status={e.status} /></td>
                  <td className="text-text-muted text-xs">{formatDate(e.criado_em)}</td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <Link to={`/cadastro?edit=${e.id}`} className="btn-icon btn-sm text-text-muted hover:text-primary">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      {e.status === 'pendente' && (
                        <button
                          onClick={() => handleValidar(e)}
                          disabled={validatingId === e.id}
                          className="btn-icon btn-sm text-text-muted hover:text-status-validado"
                          title="Validar equipamento"
                        >
                          {validatingId === e.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {e.status === 'pendente' && (
                        <button
                          onClick={() => setDeleteTarget(e)}
                          className="btn-icon btn-sm text-text-muted hover:text-status-danger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Confirmar Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-sm w-full animate-slide-up">
            <div className="card-body space-y-4">
              <div className="text-center">
                <Trash2 className="w-10 h-10 text-status-danger mx-auto mb-3" />
                <h3 className="text-base font-semibold text-text">Excluir equipamento?</h3>
                <p className="text-sm text-text-muted mt-1">
                  <strong className="text-text">{deleteTarget.nome}</strong> (Pat. {deleteTarget.patrimonio})
                  será removido permanentemente.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={() => handleDelete(deleteTarget)} className="btn-danger flex-1">Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
