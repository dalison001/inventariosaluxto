import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { PasswordStrength } from '@/components/ui/PasswordStrength'
import { Eye, EyeOff, Server, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  nome:            z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email:           z.string().email('E-mail inválido'),
  password:        z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [watchedPassword, setWatchedPassword] = useState('')

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      await signUp(data.email, data.password, data.nome)
      toast.success('Conta criada com sucesso!')
      navigate('/selecionar-hospital')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.'
      setError('root', { message: msg })
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-primary/10 border border-primary/30 mb-3">
            <Server className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-text">Criar conta</h1>
          <p className="text-text-muted text-sm mt-1">Preencha os dados para solicitar acesso</p>
        </div>

        <div className="card">
          <div className="card-body space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {errors.root && (
                <div className="flex items-center gap-2 text-sm text-status-danger
                                bg-status-dangerBg border border-status-danger/30
                                rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.root.message}
                </div>
              )}

              {/* Nome */}
              <div className="form-group">
                <label className="label" htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  autoFocus
                  autoComplete="name"
                  placeholder="Seu nome"
                  className={`input ${errors.nome ? 'input-error' : ''}`}
                  {...register('nome')}
                />
                {errors.nome && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.nome.message}</p>
                )}
              </div>

              {/* E-mail */}
              <div className="form-group">
                <label className="label" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>
                )}
              </div>

              {/* Senha */}
              <div className="form-group">
                <label className="label" htmlFor="password">Senha</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    {...register('password', {
                      onChange: (e) => setWatchedPassword(e.target.value)
                    })}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors"
                    tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={watchedPassword} className="mt-2" />
                {errors.password && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar senha */}
              <div className="form-group">
                <label className="label" htmlFor="confirmPassword">Confirmar senha</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    {...register('confirmPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors"
                    tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full btn-lg">
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</>
                  : 'Criar conta'}
              </button>
            </form>

            <div className="divider" />
            <p className="text-center text-sm text-text-muted">
              Já tem acesso?{' '}
              <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
