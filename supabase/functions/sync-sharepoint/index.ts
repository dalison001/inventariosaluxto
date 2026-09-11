import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookUrl = Deno.env.get('POWER_AUTOMATE_WEBHOOK_URL')
    if (!webhookUrl) {
      console.warn('[sync-sharepoint] POWER_AUTOMATE_WEBHOOK_URL não configurado — sync ignorado.')
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'webhook not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json() as {
      nome:          string
      tipo:          string
      patrimonio:    string
      numero_serie:  string | null
      status:        string
      hospital_nome: string
    }

    // Chama o webhook do Power Automate com os dados do equipamento
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        nome:          body.nome,
        tipo:          body.tipo,
        patrimonio:    body.patrimonio,
        numero_serie:  body.numero_serie ?? '',
        status:        body.status === 'validado' ? 'Validado' : 'Pendente',
        hospital_nome: body.hospital_nome,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Power Automate retornou ${res.status}: ${text}`)
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sync-sharepoint]', msg)
    // Retorna 200 mesmo em erro para não bloquear o fluxo do app
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
