import { passwordStrength } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  if (!password) return null

  const { score, label, color } = passwordStrength(password)
  const bars = [0, 1, 2, 3]

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex gap-1">
        {bars.map((bar) => (
          <div
            key={bar}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              bar < score ? color : 'bg-border'
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-xs',
        score <= 1 && 'text-status-danger',
        score === 2 && 'text-yellow-400',
        score === 3 && 'text-primary',
        score === 4 && 'text-status-validado',
      )}>
        Força da senha: {label}
      </p>
    </div>
  )
}
