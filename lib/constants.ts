import type { AccentColor } from '@/lib/types'

export const colorDot: Record<AccentColor, string> = {
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

export const colorBar: Record<AccentColor, string> = {
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

export const colorText: Record<AccentColor, string> = {
  violet: 'text-violet-600 dark:text-violet-400',
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
}

export const accentColors: AccentColor[] = ['violet', 'blue', 'emerald', 'amber', 'rose']

export const priorityVariant = {
  low: 'secondary',
  medium: 'warning',
  high: 'danger',
} as const
