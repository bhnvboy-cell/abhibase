'use client'

import { cn } from '@/lib/utils'

interface TabsProps {
  tabs: { value: string; label: string; count?: number }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border bg-muted/50 p-1',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === tab.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
