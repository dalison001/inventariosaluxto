import { useState, useEffect } from 'react'
import { supabase, getConfig, setConfig } from '@/lib/supabase'
import type { Hospital } from '@/types/database.types'
import {
  Settings, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle,
  RefreshCw, Eye, EyeOff, Save, CloudOff, Cloud, Link2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SheetTab {
  name: string
  mappedHospitalId: string | null
}

export default function ConfiguracoesPage() {
  // Credenciais Microsoft
  const [tenantId, setTenantId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [driveId, setDriveId] = useState('')
  const [planilhaPath, setPlanilhaPath] = useState('')
  const [integracaoAtiva, setIntegracaoAtiva] = useState(false)

  // Mapeamento de abas → hospitais
  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({})  // tab_name → hospital_id

  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isReadingSheets, setIsReadingSheets] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    setIsLoading(true)
    try {
      const [tenant, client, secret, drive, path, ativa] = await Promise.all([
        getConfig('ms_tenant_id'),
        getConfig('ms_client_id'),
        getConfig('ms_client_secret'),
        getConfig('ms_drive_id'),
        getConfig('ms_planilha_path'),
        getConfig('ms_integracao_ativa'),
      ])
      setTenantId(tenant ?? '')
      setClientId(client ?? '')
      setClientSecret(secret ?? '')
      setDriveId(drive ?? '')
      setPlanilhaPath(path ?? '')
      setIntegracaoAtiva(ativa === 'true')

      // Carregar mapeamento salvo
      const mappingStr = await getConfig('ms_tab_mapping')
      if (mappingStr) {
        try {
          setMapeamento(JSON.parse(mappingStr))
        } catch { /* ignore */ }
      }

      // Carregar abas salvas
      const tabsStr = await getConfig('ms_sheet_tabs')
      if (tabsStr) {
        try {
          const savedTabs = JSON.parse(tabsStr) as string[]
          const mapping = mappingStr ? JSON.parse(mappingStr) : {}
          setSheetTabs(savedTabs.map(name => ({
            name,
            mappedHospitalId: mapping[name] ?? null,
          })))
        } catch { /* ignore */ }
      }

      // Carregar hospitais
      const { data: hospData } = await supabase
        .from('hospitais')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      setHospitais(hospData ?? [])
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    }
    setIsLoading(false)
  }

  async function handleSaveCredentials() {
    setIsSaving(true)
    try {
      await Promise.all([
        setConfig('ms_tenant_id', tenantId),
        setConfig('ms_client_id', clientId),
        setConfig('ms_client_secret', clientSecret),
        setConfig('ms_drive_id', driveId),
        setConfig('ms_planilha_path', planilhaPath),
        setConfig('ms_integracao_ativa', integracaoAtiva ? 'true' : 'false'),
      ])
      toast.success('Credenciais salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar credenciais.')
    }
    setIsSaving(false)
  }

  // Lê as abas/páginas da planilha Microsoft via Edge Function
  async function handleReadSheets() {
    if (!tenantId || !clientId || !clientSecret || !planilhaPath) {
      toast.error('Preencha todas as credenciais e o caminho da planilha primeiro.')
      return
    }

    setIsReadingSheets(true)
    setTestStatus('testing')

    try {
      const { data, error } = await supabase.functions.invoke('read-spreadsheet-tabs', {
        body: {
          tenant_id: tenantId,
          client_id: clientId,
          client_secret: clientSecret,
          drive_id: driveId,
          planilha_path: planilhaPath,
        },
      })

      if (error) throw error

      if (data?.tabs && Array.isArray(data.tabs)) {
        const tabs: SheetTab[] = data.tabs.map((tabName: string) => ({
          name: tabName,
          mappedHospitalId: mapeamento[tabName] ?? autoMatchHospital(tabName),
        }))
        setSheetTabs(tabs)
        setTestStatus('ok')

        // Salvar lista de abas
        await setConfig('ms_sheet_tabs', JSON.stringify(data.tabs))

        toast.success(`${tabs.length} aba(s) encontrada(s) na planilha!`)
      } else {
        throw new Error('Nenhuma aba encontrada.')
      }
    } catch (err) {
      setTestStatus('error')
      const msg = err instanceof Error ? err.message : 'Erro ao ler planilha.'
      toast.error(msg)
    }
    setIsReadingSheets(false)
  }

  // Tenta fazer match automático: aba com sigla do hospital
  function autoMatchHospital(tabName: string): string | null {
    const normalizedTab = tabName.trim().toUpperCase()
    const match = hospitais.find(h =>
      h.codigo.toUpperCase() === normalizedTab ||
      h.nome.toUpperCase().includes(normalizedTab) ||
      normalizedTab.includes(h.codigo.toUpperCase())
    )
    return match?.id ?? null
  }

  function updateTabMapping(tabName: string, hospitalId: string) {
    const newMapping = { ...mapeamento, [tabName]: hospitalId }
    setMapeamento(newMapping)
    setSheetTabs(prev =>
      prev.map(tab => tab.name === tabName
        ? { ...tab, mappedHospitalId: hospitalId || null }
        : tab
      )
    )
  }

  async function handleSaveMapping() {
    setIsSaving(true)
    try {
      await setConfig('ms_tab_mapping', JSON.stringify(mapeamento))
      toast.success('Mapeamento salvo!')
    } catch {
      toast.error('Erro ao salvar mapeamento.')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="text-sm text-text-muted">Integração com Microsoft Excel / OneDrive</p>
        </div>
      </div>

      {/* ── Seção 1: Credenciais ────────────────────────────── */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Credenciais Microsoft Azure</h2>
          </div>
          {integracaoAtiva
            ? <span className="badge-validado"><Cloud className="w-3 h-3" />Ativa</span>
            : <span className="badge-danger"><CloudOff className="w-3 h-3" />Inativa</span>
          }
        </div>
        <div className="card-body space-y-4">
          <div className="bg-status-infoBg border border-status-info/30 rounded-xl p-3">
            <p className="text-xs text-status-info leading-relaxed">
              Para configurar, crie um <strong>App Registration</strong> no portal Azure
              (portal.azure.com), adicione a permissão <code>Files.ReadWrite.All</code>
              (Application) e gere um Client Secret.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Tenant ID</label>
              <input type="text" className="input font-mono text-xs" value={tenantId}
                onChange={e => setTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-..." />
            </div>
            <div className="form-group">
              <label className="label">Client ID</label>
              <input type="text" className="input font-mono text-xs" value={clientId}
                onChange={e => setClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-..." />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Client Secret</label>
            <div className="relative">
              <input type={showSecret ? 'text' : 'password'} className="input font-mono text-xs pr-10"
                value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="•••••••••••••" />
              <button type="button" onClick={() => setShowSecret(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text" tabIndex={-1}>
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Drive ID (opcional)</label>
              <input type="text" className="input font-mono text-xs" value={driveId}
                onChange={e => setDriveId(e.target.value)} placeholder="Deixe vazio para OneDrive pessoal" />
            </div>
            <div className="form-group">
              <label className="label">Caminho da Planilha</label>
              <input type="text" className="input text-xs" value={planilhaPath}
                onChange={e => setPlanilhaPath(e.target.value)} placeholder="/Documentos/Inventario.xlsx" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="label mb-0">Integração ativa</label>
            <button type="button" onClick={() => setIntegracaoAtiva(!integracaoAtiva)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                integracaoAtiva ? 'bg-primary' : 'bg-border'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                integracaoAtiva ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSaveCredentials} disabled={isSaving} className="btn-primary btn-sm">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Salvar Credenciais</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Seção 2: Ler Abas da Planilha ────────────────── */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Abas da Planilha</h2>
          </div>
          {testStatus === 'ok' && <span className="badge-validado"><CheckCircle2 className="w-3 h-3" />Conectado</span>}
          {testStatus === 'error' && <span className="badge-danger"><AlertCircle className="w-3 h-3" />Erro</span>}
        </div>
        <div className="card-body space-y-4">
          <p className="text-sm text-text-muted">
            Clique em <strong>"Ler Planilha"</strong> para buscar as abas (páginas) do arquivo Excel.
            Cada aba deve conter a <strong>sigla do hospital</strong>. O sistema tentará mapear automaticamente.
          </p>

          <button onClick={handleReadSheets} disabled={isReadingSheets} className="btn-secondary btn-sm">
            {isReadingSheets
              ? <><Loader2 className="w-4 h-4 animate-spin" />Lendo planilha...</>
              : <><RefreshCw className="w-4 h-4" />Ler Planilha</>
            }
          </button>

          {/* Lista de abas com mapeamento */}
          {sheetTabs.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <Link2 className="w-3 h-3" />
                Mapeamento: Aba → Hospital
              </div>

              {sheetTabs.map((tab) => (
                <div key={tab.name}
                  className="flex items-center gap-3 p-3 bg-surface-active rounded-xl border border-border/50">
                  <div className="flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-status-validado" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{tab.name}</p>
                    <p className="text-2xs text-text-subtle">Aba da planilha</p>
                  </div>
                  <span className="text-text-subtle text-xs">→</span>
                  <select
                    className="input w-48 text-xs"
                    value={mapeamento[tab.name] ?? tab.mappedHospitalId ?? ''}
                    onChange={e => updateTabMapping(tab.name, e.target.value)}
                  >
                    <option value="">Não mapeado</option>
                    {hospitais.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.nome} ({h.codigo})
                      </option>
                    ))}
                  </select>
                  {(mapeamento[tab.name] || tab.mappedHospitalId) && (
                    <CheckCircle2 className="w-4 h-4 text-status-validado flex-shrink-0" />
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveMapping} disabled={isSaving} className="btn-primary btn-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Salvar Mapeamento</>}
                </button>
              </div>

              <div className="bg-status-pendenteBg border border-status-pendente/30 rounded-xl p-3 mt-2">
                <p className="text-xs text-status-pendente leading-relaxed">
                  <strong>Importante:</strong> Ao enviar dados para a planilha, o sistema usará este
                  mapeamento para adicionar os equipamentos na aba correta de cada hospital.
                  Abas não mapeadas serão ignoradas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
