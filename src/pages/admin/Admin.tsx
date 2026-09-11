import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Equipamento, Hospital, TipoEquipamento } from '@/types/database.types'
import {
  Clock, FileText, Activity, Building2, Users,
  Settings, ChevronRight, Shield, Server, CheckCircle2,
  AlertTriangle, MapPin, Package, Loader2, PieChart
} from 'lucide-react'

type EquipRow = Equipamento & {
  hospitais: Hospital | null
  tipos_equipamento: TipoEquipamento | null
}

interface CidadeStat {
  cidade: string
  total: number
  validados: number
  pendentes: number
  hospitaisCount: number
}

interface TipoStat {
  nome: string
  total: number
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [equipamentos, setEquipamentos] = useState<EquipRow[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [cidadesStats, setCidadesStats] = useState<CidadeStat[]>([])
  const [tiposStats, setTiposStats] = useState<TipoStat[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setIsLoading(true)

    const [{ data: equipData }, { data: hospData }] = await Promise.all([
      supabase.from('equipamentos').select('*, hospitais(*), tipos_equipamento(*)'),
      supabase.from('hospitais').select('*').eq('ativo', true),
    ])

    const equips = (equipData ?? []) as EquipRow[]
    const hosps = (hospData ?? []) as Hospital[]

    setEquipamentos(equips)
    setHospitais(hosps)

    // Agrupar por Cidade
    const cidadeMap = new Map<string, { total: number; validados: number; pendentes: number; hospitaisSet: Set<string> }>()

    equips.forEach(e => {
      const cidade = e.hospitais?.cidade || 'Não informada'
      const existing = cidadeMap.get(cidade) || { total: 0, validados: 0, pendentes: 0, hospitaisSet: new Set<string>() }
      existing.total += 1
      if (e.status === 'validado') existing.validados += 1
      else existing.pendentes += 1
      if (e.hospital_id) existing.hospitaisSet.add(e.hospital_id)
      cidadeMap.set(cidade, existing)
    })

    // Adicionar cidades de hospitais cadastrados mesmo sem equipamentos
    hosps.forEach(h => {
      const cidade = h.cidade || 'Não informada'
      if (!cidadeMap.has(cidade)) {
        cidadeMap.set(cidade, { total: 0, validados: 0, pendentes: 0, hospitaisSet: new Set([h.id]) })
      } else {
        cidadeMap.get(cidade)!.hospitaisSet.add(h.id)
      }
    })

    const cStats: CidadeStat[] = Array.from(cidadeMap.entries()).map(([cidade, stat]) => ({
      cidade,
      total: stat.total,
      validados: stat.validados,
      pendentes: stat.pendentes,
      hospitaisCount: stat.hospitaisSet.size,
    })).sort((a, b) => b.total - a.total)

    setCidadesStats(cStats)

    // Agrupar por Tipo de Equipamento
    const tipoMap = new Map<string, number>()
    equips.forEach(e => {
      const tipoNome = e.tipos_equipamento?.nome || 'Outros'
      tipoMap.set(tipoNome, (tipoMap.get(tipoNome) || 0) + 1)
    })

    const tStats: TipoStat[] = Array.from(tipoMap.entries()).map(([nome, total]) => ({
      nome,
      total,
    })).sort((a, b) => b.total - a.total)

    setTiposStats(tStats)
    setIsLoading(false)
  }

  const totalEquipamentos = equipamentos.length
  const totalValidados = equipamentos.filter(e => e.status === 'validado').length
  const totalPendentes = equipamentos.filter(e => e.status === 'pendente').length
  const percentValidado = totalEquipamentos > 0 ? Math.round((totalValidados / totalEquipamentos) * 100) : 0

  const maxCidadeTotal = Math.max(...cidadesStats.map(c => c.total), 1)
  const maxTipoTotal = Math.max(...tiposStats.map(t => t.total), 1)

  const adminLinks = [
    { to: '/admin/pendentes',     icon: Clock,     label: 'Pendentes',     desc: `${totalPendentes} aguardando validação` },
    { to: '/admin/auditoria',     icon: FileText,  label: 'Auditoria',     desc: 'Histórico de ações do sistema' },
    { to: '/admin/atividade',     icon: Activity,  label: 'Atividade',     desc: 'Resumo de atividade dos usuários' },
    { to: '/admin/hospitais',     icon: Building2, label: 'Hospitais',     desc: `${hospitais.length} hospitais ativos` },
    { to: '/admin/usuarios',      icon: Users,     label: 'Usuários',      desc: 'Vincular hospital e função' },
    { to: '/admin/configuracoes', icon: Settings,  label: 'Configurações', desc: 'Integração Microsoft Excel' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">Dashboard & Administração Central</h1>
            <p className="text-sm text-text-muted">Visão geral e controle visual da rede de hospitais</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">Total Geral</p>
                <p className="text-2xl font-bold text-text">{totalEquipamentos}</p>
                <p className="text-2xs text-text-subtle">{hospitais.length} hospitais</p>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-status-validadoBg border border-status-validado/30 flex items-center justify-center flex-shrink-0 text-status-validado">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">Validados</p>
                <p className="text-2xl font-bold text-status-validado">{totalValidados}</p>
                <p className="text-2xs text-text-subtle">{percentValidado}% do inventário</p>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-status-pendenteBg border border-status-pendente/30 flex items-center justify-center flex-shrink-0 text-status-pendente">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">Pendentes</p>
                <p className="text-2xl font-bold text-status-pendente">{totalPendentes}</p>
                <p className="text-2xs text-text-subtle">Aguardam aprovação</p>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-accent">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">Cidades</p>
                <p className="text-2xl font-bold text-text">{cidadesStats.length}</p>
                <p className="text-2xs text-text-subtle">Municípios com unidade</p>
              </div>
            </div>
          </div>

          {/* Gráficos em 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controle Visual por Cidade */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-text">Equipamentos por Cidade</h2>
                </div>
                <span className="text-xs text-text-muted">{cidadesStats.length} cidades</span>
              </div>
              <div className="card-body space-y-4 max-h-[380px] overflow-y-auto">
                {cidadesStats.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-6">Nenhum dado cadastrado.</p>
                ) : (
                  cidadesStats.map(cs => {
                    const pct = Math.round((cs.total / maxCidadeTotal) * 100)
                    return (
                      <div key={cs.cidade} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {cs.cidade}
                            <span className="text-2xs text-text-subtle font-normal">
                              ({cs.hospitaisCount} {cs.hospitaisCount === 1 ? 'hospital' : 'hospitais'})
                            </span>
                          </span>
                          <span className="font-mono text-text font-bold">
                            {cs.total} <span className="text-2xs text-text-muted font-normal">equip.</span>
                          </span>
                        </div>

                        {/* Barra de Progresso por Cidade */}
                        <div className="h-3 w-full bg-surface-active rounded-full overflow-hidden flex">
                          <div
                            className="bg-primary transition-all duration-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-2xs text-text-subtle pt-0.5">
                          <span className="text-status-validado">{cs.validados} validados</span>
                          {cs.pendentes > 0 && (
                            <span className="text-status-pendente">{cs.pendentes} pendentes</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Controle Visual por Tipo de Equipamento */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-text">Tipos de Equipamento</h2>
                </div>
                <span className="text-xs text-text-muted">{tiposStats.length} categorias</span>
              </div>
              <div className="card-body space-y-4 max-h-[380px] overflow-y-auto">
                {tiposStats.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-6">Nenhum dado cadastrado.</p>
                ) : (
                  tiposStats.map(ts => {
                    const pct = Math.round((ts.total / maxTipoTotal) * 100)
                    const percentOfTotal = totalEquipamentos > 0 ? Math.round((ts.total / totalEquipamentos) * 100) : 0
                    return (
                      <div key={ts.nome} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text">{ts.nome}</span>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-text font-bold">{ts.total}</span>
                            <span className="text-2xs text-text-subtle font-normal">({percentOfTotal}%)</span>
                          </div>
                        </div>

                        {/* Barra por tipo */}
                        <div className="h-3 w-full bg-surface-active rounded-full overflow-hidden">
                          <div
                            className="bg-accent transition-all duration-500 rounded-full h-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Links Rápidos da Administração */}
          <div>
            <h2 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">Gestão e Ferramentas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {adminLinks.map(({ to, icon: Icon, label, desc }) => (
                <Link key={to} to={to} className="card-hover group">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20
                                    flex items-center justify-center flex-shrink-0
                                    group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-subtle group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
