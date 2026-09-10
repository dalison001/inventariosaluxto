import { cn } from '@/lib/utils'
import { Clock, CheckCircle2 } from 'lucide-react'

interface StatusBadgeProps {
  status: 'pendente' | 'validado'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'validado') {
    return (
      <span className={cn('badge-validado', className)}>
        <CheckCircle2 className="w-3 h-3" />
        Validado
      </span>
    )
  }
  return (
    <span className={cn('badge-pendente', className)}>
      <Clock className="w-3 h-3" />
      Pendente
    </span>
  )
}

interface AcaoBadgeProps {
  acao: 'criou' | 'editou' | 'excluiu' | 'validou' | 'exportou'
  className?: string
}

const acaoConfig = {
  criou:    { cls: 'badge-info',     label: 'Criou' },
  editou:   { cls: 'badge',          label: 'Editou' },
  excluiu:  { cls: 'badge-danger',   label: 'Excluiu' },
  validou:  { cls: 'badge-validado', label: 'Validou' },
  exportou: { cls: 'badge',          label: 'Exportou' },
}

export function AcaoBadge({ acao, className }: AcaoBadgeProps) {
  const cfg = acaoConfig[acao] ?? acaoConfig.editou
  return (
    <span
      className={cn(
        cfg.cls,
        acao === 'editou'   && 'bg-primary/10 text-primary border border-primary/30',
        acao === 'exportou' && 'bg-accent/10 text-accent border border-accent/30',
        className
      )}
    >
      {cfg.label}
    </span>
  )
}
