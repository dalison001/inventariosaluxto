import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Stepper } from '@/components/ui/Stepper'
import type { TipoEquipamento } from '@/types/database.types'
import {
  Tag, Package, CheckCircle2, AlertCircle,
  Plus, ChevronLeft, ChevronRight, Loader2, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { debounce } from '@/lib/utils'

const steps = [
  { label: 'Identificação', description: 'Nome e patrimônio do equipamento' },
  { label: 'Tipo e Série',  description: 'Tipo e número de série' },
  { label: 'Revisão',       description: 'Confirme as informações' },
]

const schema = z.object({
  nome:         z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  patrimonio:   z.string().min(1, 'Patrimônio obrigatório'),
  tipo_id:      z.string().uuid('Selecione um tipo'),
  numero_serie: z.string().optional(),
  status:       z.enum(['pendente', 'validado']),
})

type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentHospitalId, profile } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [tipos, setTipos] = useState<TipoEquipamento[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patrimonioStatus, setPatrimonioStatus] = useState<'idle' | 'checking' | 'ok' | 'duplicate'>('idle')

  // Novo tipo inline
  const [showNewTipo, setShowNewTipo] = useState(false)
  const [newTipoNome, setNewTipoNome] = useState('')
  const [isCreatingTipo, setIsCreatingTipo] = useState(false)

  const nomeRef = useRef<HTMLInputElement>(null)

  const prefilledPatrimonio = searchParams.get('patrimonio') ?? ''

  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patrimonio: prefilledPatrimonio,
      nome: '',
      tipo_id: '',
      numero_serie: '',
      status: 'pendente',
    },
  })

  const watchedPatrimonio = watch('patrimonio')
  const watchedNome       = watch('nome')
  const watchedTipoId     = watch('tipo_id')
  const watchedSerie      = watch('numero_serie')
  const watchedStatus     = watch('status')

  useEffect(() => {
    loadTipos()
    // Foco automático no campo nome
    setTimeout(() => nomeRef.current?.focus(), 100)
  }, [])

  // Valida patrimônio em tempo real
  const checkPatrimonio = useCallback(
    debounce(async (valor: string) => {
      if (!valor || !currentHospitalId) return
      setPatrimonioStatus('checking')
      const { data } = await supabase
        .from('equipamentos')
        .select('id')
        .eq('hospital_id', currentHospitalId)
        .eq('patrimonio', valor)
        .maybeSingle()
      setPatrimonioStatus(data ? 'duplicate' : 'ok')
    }, 500),
    [currentHospitalId]
  )

  useEffect(() => {
    if (watchedPatrimonio) checkPatrimonio(watchedPatrimonio)
    else setPatrimonioStatus('idle')
  }, [watchedPatrimonio, checkPatrimonio])

  async function loadTipos() {
    const { data } = await supabase.from('tipos_equipamento').select('*').order('nome')
    setTipos(data ?? [])
  }

  async function createTipo() {
    if (!newTipoNome.trim()) return
    setIsCreatingTipo(true)
    try {
      const { data, error } = await supabase
        .from('tipos_equipamento')
        .insert({ nome: newTipoNome.trim(), criado_por: profile?.id })
        .select()
        .single()
      if (error) throw error
      setTipos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setValue('tipo_id', data.id)
      setShowNewTipo(false)
      setNewTipoNome('')
      toast.success(`Tipo "${data.nome}" criado!`)
    } catch {
      toast.error('Erro ao criar tipo. O nome pode já existir.')
    } finally {
      setIsCreatingTipo(false)
    }
  }

  async function nextStep() {
    let fieldsToValidate: (keyof FormData)[] = []
    if (currentStep === 0) fieldsToValidate = ['nome', 'patrimonio']
    if (currentStep === 1) fieldsToValidate = ['tipo_id']

    const valid = await trigger(fieldsToValidate)
    if (!valid) return
    if (currentStep === 0 && patrimonioStatus === 'duplicate') {
      toast.error('Este patrimônio já está cadastrado neste hospital.')
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  async function onSubmit(data: FormData) {
    if (patrimonioStatus === 'duplicate') {
      toast.error('Patrimônio duplicado. Corrija antes de salvar.')
      return
    }
    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('equipamentos').insert({
        nome:         data.nome,
        tipo_id:      data.tipo_id,
        numero_serie: data.numero_serie || null,
        patrimonio:   data.patrimonio,
        hospital_id:  currentHospitalId!,
        criado_por:   profile?.id,
        status:       data.status,
      })
      if (error) {
        if (error.code === '23505') throw new Error('Patrimônio duplicado neste hospital.')
        throw error
      }
      toast.success('Equipamento cadastrado com sucesso!')
      navigate('/inventario')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTipo = tipos.find(t => t.id === watchedTipoId)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {prefilledPatrimonio ? 'Cadastro via Scanner' : 'Novo Equipamento'}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {prefilledPatrimonio
              ? `Patrimônio ${prefilledPatrimonio} detectado`
              : 'Preencha as informações do equipamento'}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Step 0: Identificação ────────────────────────── */}
        {currentStep === 0 && (
          <div className="card animate-slide-up">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text">Identificação</h2>
              </div>
            </div>
            <div className="card-body space-y-4">
              {/* Nome */}
              <div className="form-group">
                <label className="label" htmlFor="nome">Nome / Descrição *</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: PC da Recepção, Monitor Sala 2..."
                  className={`input ${errors.nome ? 'input-error' : ''}`}
                  autoComplete="off"
                  {...register('nome')}
                  ref={(el) => { nomeRef.current = el; register('nome').ref(el) }}
                />
                {errors.nome && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.nome.message}</p>
                )}
              </div>

              {/* Patrimônio */}
              <div className="form-group">
                <label className="label" htmlFor="patrimonio">Nº de Patrimônio *</label>
                <div className="relative">
                  <input
                    id="patrimonio"
                    type="text"
                    placeholder="Código de patrimônio (etiqueta)"
                    className={`input pr-10 ${
                      errors.patrimonio || patrimonioStatus === 'duplicate' ? 'input-error' : ''
                    } ${patrimonioStatus === 'ok' ? 'border-status-validado focus:border-status-validado' : ''}`}
                    autoComplete="off"
                    {...register('patrimonio')}
                  />
                  {/* Ícone status patrimônio */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {patrimonioStatus === 'checking' && (
                      <Loader2 className="w-4 h-4 text-text-subtle animate-spin" />
                    )}
                    {patrimonioStatus === 'ok' && (
                      <CheckCircle2 className="w-4 h-4 text-status-validado" />
                    )}
                    {patrimonioStatus === 'duplicate' && (
                      <AlertCircle className="w-4 h-4 text-status-danger" />
                    )}
                  </div>
                </div>
                {errors.patrimonio && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.patrimonio.message}</p>
                )}
                {patrimonioStatus === 'duplicate' && (
                  <p className="error-msg">
                    <AlertCircle className="w-3 h-3" />
                    Este patrimônio já está cadastrado neste hospital.
                  </p>
                )}
                {patrimonioStatus === 'ok' && (
                  <p className="text-xs text-status-validado mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Patrimônio disponível.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Tipo e Série ────────────────────────── */}
        {currentStep === 1 && (
          <div className="card animate-slide-up">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text">Tipo e Série</h2>
              </div>
            </div>
            <div className="card-body space-y-4">
              {/* Tipo */}
              <div className="form-group">
                <label className="label">Tipo de equipamento *</label>
                <Controller
                  name="tipo_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`input ${errors.tipo_id ? 'input-error' : ''}`}
                    >
                      <option value="">Selecione um tipo...</option>
                      {tipos.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.tipo_id && (
                  <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.tipo_id.message}</p>
                )}
              </div>

              {/* Criar novo tipo */}
              {!showNewTipo ? (
                <button
                  type="button"
                  onClick={() => setShowNewTipo(true)}
                  className="btn-ghost w-full text-primary hover:bg-primary/5 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Criar novo tipo de equipamento
                </button>
              ) : (
                <div className="bg-surface-active rounded-xl p-3 space-y-3 border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text">Novo tipo</p>
                    <button type="button" onClick={() => { setShowNewTipo(false); setNewTipoNome('') }}
                      className="btn-icon btn-sm text-text-muted">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTipoNome}
                      onChange={e => setNewTipoNome(e.target.value)}
                      placeholder="Nome do tipo (ex: Tablet)"
                      className="input flex-1"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), createTipo())}
                    />
                    <button
                      type="button"
                      onClick={createTipo}
                      disabled={!newTipoNome.trim() || isCreatingTipo}
                      className="btn-primary btn-sm px-4"
                    >
                      {isCreatingTipo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Nº de Série */}
              <div className="form-group">
                <label className="label" htmlFor="numero_serie">Número de série</label>
                <input
                  id="numero_serie"
                  type="text"
                  placeholder="Opcional"
                  className="input"
                  autoComplete="off"
                  {...register('numero_serie')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Revisão ──────────────────────────────── */}
        {currentStep === 2 && (
          <div className="card animate-slide-up">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text">Revisão — confirme as informações</h2>
              </div>
            </div>
            <div className="card-body space-y-3">
              {[
                { label: 'Nome / Descrição', value: watchedNome },
                { label: 'Patrimônio',       value: watchedPatrimonio },
                { label: 'Tipo',             value: selectedTipo?.nome ?? '—' },
                { label: 'Número de série',  value: watchedSerie || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5 border-b border-border/50 last:border-0">
                  <span className="text-xs text-text-muted sm:w-36 flex-shrink-0">{label}</span>
                  <span className="text-sm text-text font-medium break-words">{value}</span>
                </div>
              ))}

              <fieldset className="pt-2">
                <legend className="label mb-2">Status ao salvar</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`flex items-center gap-3 border rounded-lg px-3 py-3 cursor-pointer transition-colors ${
                    watchedStatus === 'pendente' ? 'border-status-pendente bg-status-pendenteBg' : 'border-border hover:bg-surface-hover'
                  }`}>
                    <input type="radio" value="pendente" {...register('status')} />
                    <span className="text-sm text-text">Pendente</span>
                  </label>
                  <label className={`flex items-center gap-3 border rounded-lg px-3 py-3 cursor-pointer transition-colors ${
                    watchedStatus === 'validado' ? 'border-status-validado bg-status-validadoBg' : 'border-border hover:bg-surface-hover'
                  }`}>
                    <input type="radio" value="validado" {...register('status')} />
                    <span className="text-sm text-text">Validado</span>
                  </label>
                </div>
              </fieldset>

              <div className="bg-status-infoBg border border-status-info/30 rounded-xl p-3 mt-2">
                <p className="text-xs text-status-info text-center">
                  {watchedStatus === 'validado'
                    ? <>O equipamento será salvo como <strong>Validado</strong>.</>
                    : <>O equipamento será salvo como <strong>Pendente</strong> e poderá ser validado por qualquer usuário do mesmo hospital.</>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navegação ────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-6 gap-3">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
              Cancelar
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={patrimonioStatus === 'duplicate' && currentStep === 0}
              className="btn-primary"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || patrimonioStatus === 'duplicate'}
              className="btn-primary btn-lg"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                : <><CheckCircle2 className="w-4 h-4" />Confirmar Cadastro</>
              }
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
