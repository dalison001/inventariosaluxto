import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HOSPITAL_TO_SHEET: Record<string, string> = {
  'xambioa':         'HRX',
  'xambioá':         'HRX',
  'palmas':          'HGP',
  'dona regina':     'HMDR',
  'gurupi':          'HRGUR',
  'araguaina':       'HRA',
  'araguaína':       'HRA',
  'augustinopolis':  'HRAUG',
  'augustinópolis':  'HRAUG',
  'porto nacional':  'HRPN',
  'paraiso':         'HRPT',
  'paraíso':         'HRPT',
  'miracema':        'HRM',
  'tia dede':        'HMITD',
  'tia dedé':        'HMITD',
  'guarai':          'HRGUA',
  'guaraí':          'HRGUA',
  'arraias':         'HRARR',
  'pedro afonso':    'HRPA',
  'alvorada':        'HRAT',
  'arapoema':        'HMIR',
  'dianopolis':      'HRD',
  'dianópolis':      'HRD',
  'araguacu':        'HRTCL',
  'araguaçu':        'HRTCL',
}

function detectSheet(hospitalNome: string): string {
  const lower = hospitalNome.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  for (const [key, sheet] of Object.entries(HOSPITAL_TO_SHEET)) {
    const normalKey = key.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (lower.includes(normalKey)) return sheet
  }
  return 'Geral' // Fallback se não achar
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookUrl = Deno.env.get('POWER_AUTOMATE_WEBHOOK_URL')
    if (!webhookUrl) {
      console.warn('[sync-sharepoint] Webhook não configurado — sync ignorado.')
      return new Response(
        JSON.stringify({ ok: true, skipped: true }),
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

    const abaExcel = detectSheet(body.hospital_nome)

    // Chama o webhook do Make.com com os dados do equipamento
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
        aba_excel:     abaExcel
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
