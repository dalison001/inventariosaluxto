import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas. ' +
    'Copie .env.example para .env e preencha os valores.'
  )
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'inventario-saluxx/1.0.0',
    },
  },
})

// Helper: busca configuração do sistema (apenas admin via RLS)
export async function getConfig(chave: string): Promise<string | null> {
  const { data } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', chave)
    .single()
  return data?.valor ?? null
}

// Helper: atualiza configuração do sistema (apenas admin via RLS)
export async function setConfig(chave: string, valor: string): Promise<void> {
  await supabase
    .from('configuracoes')
    .update({ valor, atualizado_em: new Date().toISOString() })
    .eq('chave', chave)
}
