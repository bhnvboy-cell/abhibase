'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/empty-state'
import { addDays, cn, dayKey, fmtTime, isSameDay, startOfWeek } from '@/lib/utils'
import { accentColors, colorDot } from '@/lib/constants'
import type { AccentColor } from '@/lib/types'

interface EventDialogState {
  date: string
  title: string
  startTime: string
  endTime: string
  color: AccentColor
}

export default function PlannerPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [weekOffset, setWeekOffset] = React.useState(0)
  const [dialog, setDialog] = React.useState<EventDialogState | null>(null)

  const events = useQuery({ queryKey: ['events'], queryFn: api.events.list })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['events'] })

  const createEvent = useMutation({
    mutationFn: (state: EventDialogState) =>
      api.events.create({
        title: state.title.trim(),
        event_date: state.date,
        start_time: state.startTime || null,
        end_time: state.endTime || null,
        color: state.color,
      }),
    onSuccess: () => {
      toast('Event added')
      setDialog(null)
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteEvent = useMutation({
    mutationFn: (id: string) => api.events.remove(id),
    onSuccess: () => {
      toast('Event removed')
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const rangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm font-medium text-muted-foreground">{rangeLabel}</span>
        </div>
        <Button
          onClick={() =>
            setDialog({
              date: dayKey(today),
              title: '',
              startTime: '',
              endTime: '',
              color: 'violet',
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add event
        </Button>
      </div>

      {events.isLoading ? (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {days.map((day, i) => {
            const key = dayKey(day)
            const dayEvents = (events.data ?? []).filter((e) => e.event_date === key)
            const isToday = isSameDay(day, today)
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className={cn(
                  'flex min-h-44 flex-col rounded-xl border p-2.5',
                  isToday && 'border-primary/50 bg-primary/5'
                )}
              >
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={cn('text-sm font-semibold', isToday && 'text-primary')}>
                      {day.getDate()}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Add event on ${key}`}
                    onClick={() =>
                      setDialog({ date: key, title: '', startTime: '', endTime: '', color: 'violet' })
                    }
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 space-y-1.5">
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className="group relative rounded-lg border bg-card px-2 py-1.5 shadow-sm"
                    >
                      <span
                        className={cn(
                          'absolute left-0 top-1.5 h-[calc(100%-12px)] w-0.5 rounded-full',
                          colorDot[e.color]
                        )}
                      />
                      <p className="truncate pl-2 pr-4 text-xs font-medium leading-tight">
                        {e.title}
                      </p>
                      {e.start_time && (
                        <p className="pl-2 pr-4 text-[10px] text-muted-foreground">
                          {fmtTime(e.start_time)}
                        </p>
                      )}
                      <button
                        type="button"
                        title="Delete event"
                        onClick={() => deleteEvent.mutate(e.id)}
                        className="absolute right-1 top-1 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {(events.data ?? []).length === 0 && !events.isLoading && (
        <EmptyState
          icon={CalendarDays}
          title="Your week is clear"
          description="Schedule events to see them appear across your weekly planner."
        />
      )}

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title="New event"
        description={dialog?.date}
      >
        {dialog && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!dialog.title.trim()) return
              createEvent.mutate(dialog)
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                placeholder="Team standup"
                value={dialog.title}
                onChange={(e) => setDialog({ ...dialog, title: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-start">Start</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={dialog.startTime}
                  onChange={(e) => setDialog({ ...dialog, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end">End</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={dialog.endTime}
                  onChange={(e) => setDialog({ ...dialog, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {accentColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => setDialog({ ...dialog, color: c })}
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform',
                      colorDot[c],
                      dialog.color === c
                        ? 'scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background'
                        : 'opacity-60 hover:opacity-100'
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dialog.title.trim() || createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add event
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
