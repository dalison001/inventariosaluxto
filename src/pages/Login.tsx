import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Server, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      await signIn(data.email, data.password)
      // onAuthStateChange irá redirecionar
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login.'
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-primary/10 border border-primary/30 mb-4 shadow-glow-blue">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-text">Inventário TI</h1>
          <p className="text-text-muted text-sm mt-1">Saluxx · Rede Hospitalar</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-body space-y-5">
            <div>
              <h2 className="text-base font-semibold text-text">Entrar na plataforma</h2>
              <p className="text-sm text-text-muted mt-0.5">Digite suas credenciais de acesso</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Erro global */}
              {errors.root && (
                <div className="flex items-center gap-2 text-sm text-status-danger
                                bg-status-dangerBg border border-status-danger/30
                                rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.root.message}
                </div>
              )}

              {/* E-mail */}
              <div className="form-group">
                <label className="label" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="seu@email.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="error-msg">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div className="form-group">
                <label className="label" htmlFor="password">Senha</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="error-msg">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full btn-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="divider" />

            <p className="text-center text-sm text-text-muted">
              Não tem acesso?{' '}
              <Link to="/registro" className="text-primary hover:text-primary-light font-medium transition-colors">
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-subtle mt-6">
          Sistema interno · Saluxx © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
