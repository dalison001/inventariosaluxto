import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Perfil } from '@/types/database.types'
import toast from 'react-hot-toast'

interface UseAuthOptions {
  initialize?: boolean
}

export function useAuth({ initialize = false }: UseAuthOptions = {}) {
  const { setUser, setProfile, setLoadingAuth, clear } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialize) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
          await establishSession(session.user, event === 'SIGNED_IN')
        } else if (event === 'INITIAL_SESSION') {
          setLoadingAuth(false)
        } else if (event === 'SIGNED_OUT') {
          clear()
          navigate('/login', { replace: true })
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialize])

  async function fetchProfile(userId: string): Promise<Perfil | null> {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
      return data
    } catch (err) {
      console.error('Erro ao buscar perfil:', err)
      return null
    } finally {
      setLoadingAuth(false)
    }
  }

  async function establishSession(
    user: { id: string; email?: string },
    redirect: boolean,
  ) {
    setLoadingAuth(true)
    setUser({ id: user.id, email: user.email ?? '' })
    const profile = await fetchProfile(user.id)

    if (redirect && profile) {
      navigate('/inventario', { replace: true })
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = mapAuthError(error.message)
      throw new Error(msg)
    }
    if (data.user) await establishSession(data.user, true)
  }

  async function signUp(email: string, password: string, nome: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) {
      const msg = mapAuthError(error.message)
      throw new Error(msg)
    }
    if (data.session?.user) {
      await establishSession(data.session.user, true)
      return { requiresEmailConfirmation: false }
    }
    return { requiresEmailConfirmation: true }
  }

  async function signOut() {
    await supabase.auth.signOut()
    clear()
    toast.success('Sessão encerrada.')
    navigate('/login', { replace: true })
  }

  async function selectHospital(hospitalId: string) {
    const userId = useAppStore.getState().user?.id
    if (!userId) return

    const { error } = await supabase
      .from('perfis')
      .update({
        hospital_id: hospitalId,
        hospital_selecionado_em: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)

    // Recarrega perfil
    await fetchProfile(userId)
  }

  return { signIn, signUp, signOut, selectHospital, fetchProfile }
}

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials'))
    return 'E-mail ou senha incorretos.'
  if (message.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de entrar.'
  if (message.includes('User already registered'))
    return 'Este e-mail já está cadastrado. Faça login.'
  if (message.includes('Password should be at least'))
    return 'A senha deve ter pelo menos 8 caracteres.'
  if (message.includes('rate limit'))
    return 'Muitas tentativas. Aguarde alguns minutos.'
  if (message.includes('Database error saving new user'))
    return 'O Supabase não conseguiu criar o perfil do usuário. Verifique se a migration 003_triggers.sql foi aplicada.'
  if (message.includes('Email address') || message.includes('email'))
    return 'O Supabase recusou este e-mail. Verifique as configurações de autenticação do projeto.'
  return `Erro na autenticação: ${message}`
}
