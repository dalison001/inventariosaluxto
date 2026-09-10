import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AcaoBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { LogAuditoria, Perfil, Hospital } from '@/types/database.types'
import {
  FileText, Search, Loader2, ChevronDown, ChevronUp,
  Building2, User, Calendar
} from 'lucide-react'

type LogRow = LogAuditoria & {
  perfis: Pick<Perfil, 'nome' | 'email'> | null
  hospitais: Pick<Hospital, 'nome' | 'codigo'> | null
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterAcao, setFilterAcao] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadLogs() }, [filterAcao])

  async function loadLogs() {
    setIsLoading(true)
    let query = supabase
      .from('logs_auditoria')
      .select(`*, perfis!usuario_id(nome, email), hospitais(nome, codigo)`)
      .order('criado_em', { ascending: false })
      .limit(200)

    if (filterAcao) query = query.eq('acao', filterAcao)

    const { data } = await query
    setLogs((data ?? []) as LogRow[])
    setIsLoading(false)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoria</h1>
          <p className="text-sm text-text-muted">Histórico completo de ações no sistema</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-3 mb-4">
        <select className="input sm:w-48" value={filterAcao} onChange={e => setFilterAcao(e.target.value)}>
          <option value="">Todas as ações</option>
          <option value="criou">Criou</option>
          <option value="editou">Editou</option>
          <option value="excluiu">Excluiu</option>
          <option value="validou">Validou</option>
          <option value="exportou">Exportou</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" />
          <p className="empty-state-title">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map(log => (
            <div key={log.id} className="card">
              <button
                onClick={() => toggleExpand(log.id)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-surface-hover transition-colors rounded-2xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <AcaoBadge acao={log.acao} />
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.perfis?.nome ?? 'Sistema'}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {log.hospitais?.nome ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-subtle">
                    <Calendar className="w-3 h-3" />
                    {formatDate(log.criado_em)}
                    {log.equipamento_id && (
                      <span className="text-text-muted">
                        · Equip. {log.equipamento_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>
                {(log.dados_antes || log.dados_depois) && (
                  expanded === log.id
                    ? <ChevronUp className="w-4 h-4 text-text-subtle flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-text-subtle flex-shrink-0" />
                )}
              </button>

              {/* Dados expandidos */}
              {expanded === log.id && (log.dados_antes || log.dados_depois) && (
                <div className="px-4 pb-4 pt-0 border-t border-border mx-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {log.dados_antes && (
                      <div>
                        <p className="text-xs font-semibold text-status-danger mb-1">Antes</p>
                        <pre className="text-xs bg-background rounded-xl p-3 overflow-x-auto max-h-48 text-text-muted">
                          {JSON.stringify(log.dados_antes, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.dados_depois && (
                      <div>
                        <p className="text-xs font-semibold text-status-validado mb-1">Depois</p>
                        <pre className="text-xs bg-background rounded-xl p-3 overflow-x-auto max-h-48 text-text-muted">
                          {JSON.stringify(log.dados_depois, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
