// supabase/functions/read-spreadsheet-tabs/index.ts
// Edge Function para ler as abas da planilha Microsoft via Graph API
// Deploy: supabase functions deploy read-spreadsheet-tabs

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
    // Verificar autenticação
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

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Apenas administradores' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { tenant_id, client_id, client_secret, drive_id, planilha_path } = body

    if (!tenant_id || !client_id || !client_secret || !planilha_path) {
      return new Response(JSON.stringify({ error: 'Credenciais incompletas' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Obter token via Client Credentials
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id,
          client_secret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    )

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({
        error: 'Falha na autenticação com Azure. Verifique Tenant ID, Client ID e Client Secret.',
        details: tokenData.error_description,
      }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accessToken = tokenData.access_token

    // 2. Ler as worksheets (abas) da planilha
    const encodedPath = encodeURIComponent(planilha_path).replace(/%2F/g, '/')
    let graphUrl: string

    if (drive_id) {
      graphUrl = `https://graph.microsoft.com/v1.0/drives/${drive_id}/root:${encodedPath}:/workbook/worksheets`
    } else {
      // OneDrive pessoal
      graphUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${encodedPath}:/workbook/worksheets`
    }

    const sheetsRes = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!sheetsRes.ok) {
      const errText = await sheetsRes.text()
      return new Response(JSON.stringify({
        error: `Erro ao acessar planilha (${sheetsRes.status}). Verifique o caminho e permissões.`,
        details: errText,
      }), {
        status: sheetsRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const sheetsData = await sheetsRes.json()
    const tabs = (sheetsData.value || []).map((ws: any) => ws.name)

    return new Response(JSON.stringify({ tabs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
