import { cn, initials } from '@/lib/utils'

const palette = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-600',
]

function hashIndex(seed: string): number {
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return sum % palette.length
}

interface AvatarProps {
  name: string
  className?: string
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-card',
        palette[hashIndex(name || '?')],
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
