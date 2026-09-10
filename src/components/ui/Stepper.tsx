import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number  // 0-based
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center w-full">
        {steps.map((step, index) => {
          const isDone   = index < currentStep
          const isActive = index === currentStep

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              {/* Círculo */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={cn(
                    'stepper-circle',
                    isDone   && 'stepper-circle-done',
                    isActive && 'stepper-circle-active',
                    !isDone && !isActive && 'stepper-circle-inactive'
                  )}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isActive && 'text-primary',
                    isDone   && 'text-primary/70',
                    !isDone && !isActive && 'text-text-subtle'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Linha conectora */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'stepper-line mx-2 mb-5',
                    isDone ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: progress bar + label atual */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="text-xs font-medium text-primary">
            {steps[currentStep]?.label}
          </span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        {steps[currentStep]?.description && (
          <p className="text-xs text-text-subtle mt-1">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  )
}
