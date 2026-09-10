import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

export function useAuth() {
  const { setUser, setProfile, setLoadingAuth, clear } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' })
        fetchProfile(session.user.id)
      } else {
        setLoadingAuth(false)
      }
    })

    // Listener de mudanças de estado auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' })
          await fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          clear()
          navigate('/login', { replace: true })
        } else if (event === 'TOKEN_REFRESHED') {
          // Silencioso
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Erro ao buscar perfil:', err)
    } finally {
      setLoadingAuth(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = mapAuthError(error.message)
      throw new Error(msg)
    }
  }

  async function signUp(email: string, password: string, nome: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) {
      const msg = mapAuthError(error.message)
      throw new Error(msg)
    }
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

    if (error) throw new Error('Não foi possível salvar o hospital. Tente novamente.')

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
  return 'Erro na autenticação. Tente novamente.'
}
