import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatRelative } from '@/lib/utils'
import { Activity, Loader2, User, Building2, Clock } from 'lucide-react'

interface AtividadeRow {
  usuario_id: string
  usuario_nome: string
  usuario_email: string
  hospital_nome: string
  total_acoes: number
  ultima_atividade: string
}

export default function AtividadePage() {
  const [data, setData] = useState<AtividadeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setIsLoading(true)

    // Query agrupada: total de ações por usuário
    const { data: logsData } = await supabase
      .from('logs_auditoria')
      .select('usuario_id, criado_em')
      .order('criado_em', { ascending: false })

    // Buscar perfis e hospitais
    const { data: perfisData } = await supabase
      .from('perfis')
      .select('id, nome, email, hospital_id, hospitais(nome)')

    if (!logsData || !perfisData) {
      setIsLoading(false)
      return
    }

    // Agrupar
    const groups = new Map<string, { count: number; last: string }>()
    for (const log of logsData) {
      if (!log.usuario_id) continue
      const existing = groups.get(log.usuario_id)
      if (!existing) {
        groups.set(log.usuario_id, { count: 1, last: log.criado_em })
      } else {
        existing.count++
        if (log.criado_em > existing.last) existing.last = log.criado_em
      }
    }

    // Combinar com perfis
    const result: AtividadeRow[] = []
    for (const [userId, { count, last }] of groups) {
      const perfil = perfisData.find(p => p.id === userId) as any
      result.push({
        usuario_id: userId,
        usuario_nome: perfil?.nome ?? '—',
        usuario_email: perfil?.email ?? '—',
        hospital_nome: perfil?.hospitais?.nome ?? '—',
        total_acoes: count,
        ultima_atividade: last,
      })
    }

    // Ordenar por última atividade
    result.sort((a, b) => b.ultima_atividade.localeCompare(a.ultima_atividade))
    setData(result)
    setIsLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Atividade dos Usuários</h1>
          <p className="text-sm text-text-muted">Resumo de quem está realizando o inventário</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <Activity className="empty-state-icon" />
          <p className="empty-state-title">Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Hospital</th>
                <th>Total de Ações</th>
                <th>Última Atividade</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.usuario_id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xs font-bold text-primary">
                          {row.usuario_nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{row.usuario_nome}</p>
                        <p className="text-2xs text-text-subtle">{row.usuario_email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-sm text-text-muted">
                      <Building2 className="w-3 h-3" />
                      {row.hospital_nome}
                    </span>
                  </td>
                  <td>
                    <span className="badge-info font-semibold">{row.total_acoes}</span>
                  </td>
                  <td>
                    <div>
                      <p className="text-sm text-text-muted">{formatRelative(row.ultima_atividade)}</p>
                      <p className="text-2xs text-text-subtle">{formatDate(row.ultima_atividade)}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
