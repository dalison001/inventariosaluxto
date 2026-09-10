import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata data em pt-BR */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

/** Formata distância relativa (ex: "há 2 horas") */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })
  } catch {
    return '—'
  }
}

/** Formata só a data */
export function formatDateOnly(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

/** Sanitiza string para exibição (sem HTML) */
export function sanitize(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Trunca string */
export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}

/** Calcula força da senha */
export function passwordStrength(password: string): {
  score: number  // 0–4
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const normalized = Math.min(4, score)
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']
  const colors = [
    'bg-status-danger',
    'bg-status-pendente',
    'bg-yellow-400',
    'bg-primary',
    'bg-status-validado',
  ]

  return { score: normalized, label: labels[normalized], color: colors[normalized] }
}

/** Debounce simples */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** Gera nome de arquivo com timestamp */
export function generateFilename(prefix: string, ext: string): string {
  const ts = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR })
  return `${prefix}_${ts}.${ext}`
}
