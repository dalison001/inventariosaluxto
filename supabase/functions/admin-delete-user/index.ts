import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) throw new Error('Não autenticado')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Não autenticado')

    const { data: caller } = await supabaseAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') throw new Error('Apenas administradores podem excluir usuários')

    const { userId } = await req.json()
    if (!userId || typeof userId !== 'string') throw new Error('Usuário inválido')
    if (userId === user.id) throw new Error('Você não pode excluir a própria conta')

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
