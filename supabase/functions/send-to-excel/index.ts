// supabase/functions/send-to-excel/index.ts
// Edge Function: envia dados dos equipamentos para a planilha Microsoft
// Cada hospital é enviado para a aba correspondente (via mapeamento tab_name → hospital_id)
// Deploy: supabase functions deploy send-to-excel

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar configurações via service role (ignora RLS)
    async function getConfigValue(chave: string): Promise<string | null> {
      const { data } = await supabaseAdmin
        .from('configuracoes')
        .select('valor')
        .eq('chave', chave)
        .single()
      return data?.valor ?? null
    }

    const [tenantId, clientId, clientSecret, driveId, planilhaPath, integracaoAtiva, tabMappingStr] =
      await Promise.all([
        getConfigValue('ms_tenant_id'),
        getConfigValue('ms_client_id'),
        getConfigValue('ms_client_secret'),
        getConfigValue('ms_drive_id'),
        getConfigValue('ms_planilha_path'),
        getConfigValue('ms_integracao_ativa'),
        getConfigValue('ms_tab_mapping'),
      ])

    // Verificar integração ativa
    if (integracaoAtiva !== 'true' || !tenantId || !clientId || !clientSecret || !planilhaPath) {
      return new Response(JSON.stringify({ integracaoNaoConfigurada: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse mapeamento
    let tabMapping: Record<string, string> = {}  // tab_name → hospital_id
    try {
      if (tabMappingStr) tabMapping = JSON.parse(tabMappingStr)
    } catch { /* ignore */ }

    // Inverter: hospital_id → tab_name
    const hospitalToTab: Record<string, string> = {}
    for (const [tabName, hospitalId] of Object.entries(tabMapping)) {
      hospitalToTab[hospitalId] = tabName
    }

    const body = await req.json()
    const equipamentos = body.equipamentos || []

    if (equipamentos.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum equipamento para enviar' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Token via Client Credentials
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    )

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Falha na autenticação Azure' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accessToken = tokenData.access_token
    const encodedPath = encodeURIComponent(planilhaPath).replace(/%2F/g, '/')

    // 2. Agrupar equipamentos por hospital_id
    const groups: Record<string, typeof equipamentos> = {}
    for (const equip of equipamentos) {
      const hid = equip.hospital_id
      if (!hid) continue
      if (!groups[hid]) groups[hid] = []
      groups[hid].push(equip)
    }

    const results: { tab: string; hospitalId: string; count: number; status: string }[] = []

    // 3. Para cada grupo, enviar para a aba correspondente
    for (const [hospitalId, equips] of Object.entries(groups)) {
      const tabName = hospitalToTab[hospitalId]
      if (!tabName) {
        results.push({ tab: '?', hospitalId, count: equips.length, status: 'sem_mapeamento' })
        continue
      }

      // Montar dados como linhas da planilha
      // Header: Nome | Patrimônio | Tipo | Nº Série | Status | Cadastrado em
      const rows = equips.map((e: any) => [
        e.nome || '',
        e.patrimonio || '',
        e.tipos_equipamento?.nome || '',
        e.numero_serie || '',
        e.status === 'validado' ? 'Validado' : 'Pendente',
        e.criado_em ? new Date(e.criado_em).toLocaleDateString('pt-BR') : '',
      ])

      // Primeiro: verificar quantas linhas já existem na aba
      const encodedTab = encodeURIComponent(tabName)
      let baseUrl: string
      if (driveId) {
        baseUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:${encodedPath}:/workbook/worksheets('${encodedTab}')`
      } else {
        baseUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${encodedPath}:/workbook/worksheets('${encodedTab}')`
      }

      // Ler range usado para saber a próxima linha livre
      const usedRangeRes = await fetch(`${baseUrl}/usedRange`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      let startRow = 2  // padrão: logo após o header
      if (usedRangeRes.ok) {
        const usedRange = await usedRangeRes.json()
        // O range vem como "Sheet!A1:G45" — extraímos o row number
        const address = usedRange.address || ''
        const match = address.match(/:.*?(\d+)$/)
        if (match) {
          startRow = parseInt(match[1]) + 1
        }
      }

      // Inserir os dados na próxima linha livre
      const endRow = startRow + rows.length - 1
      const rangeAddress = `A${startRow}:F${endRow}`

      const patchRes = await fetch(`${baseUrl}/range(address='${rangeAddress}')`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      })

      if (patchRes.ok) {
        results.push({ tab: tabName, hospitalId, count: rows.length, status: 'ok' })
      } else {
        const errText = await patchRes.text()
        results.push({ tab: tabName, hospitalId, count: rows.length, status: `erro: ${errText.slice(0, 200)}` })
      }
    }

    // 4. Log de auditoria
    await supabaseAdmin.from('logs_auditoria').insert({
      usuario_id: user.id,
      acao: 'exportou',
      hospital_id: null,
      dados_depois: { destino: 'microsoft_excel', resultados: results, total: equipamentos.length },
    })

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
