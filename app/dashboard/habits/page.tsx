'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Flame, Loader2, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/empty-state'
import { addDays, cn, computeStreak, dayKey, startOfWeek } from '@/lib/utils'
import { accentColors, colorDot } from '@/lib/constants'
import type { AccentColor } from '@/lib/types'

interface HabitDialogState {
  name: string
  icon: string
  color: AccentColor
  target: number
}

export default function HabitsPage() {
  const qc = useQueryClient()
  const [dialog, setDialog] = React.useState<HabitDialogState | null>(null)

  const habits = useQuery({ queryKey: ['habits'], queryFn: api.habits.list })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['habits'] })

  const createHabit = useMutation({
    mutationFn: (state: HabitDialogState) =>
      api.habits.create({
        name: state.name.trim(),
        icon: state.icon || '🔥',
        color: state.color,
        target_per_week: state.target,
      }),
    onSuccess: () => {
      toast('Habit created')
      setDialog(null)
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteHabit = useMutation({
    mutationFn: (id: string) => api.habits.remove(id),
    onSuccess: () => {
      toast('Habit removed')
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const toggleLog = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      api.habits.toggleLog(habitId, date),
    onSuccess: invalidate,
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const todayKey = dayKey(new Date())
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6))
  const weekStartKey = dayKey(startOfWeek(new Date()))

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          onClick={() => setDialog({ name: '', icon: '🔥', color: 'emerald', target: 7 })}
        >
          <Plus className="h-4 w-4" />
          New habit
        </Button>
      </div>

      {habits.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : (habits.data ?? []).length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No habits yet"
          description="Small daily actions compound. Start with one habit and protect the streak."
          action={
            <Button onClick={() => setDialog({ name: '', icon: '🔥', color: 'emerald', target: 7 })}>
              <Plus className="h-4 w-4" />
              Create your first habit
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(habits.data ?? []).map((habit, i) => {
            const logDates = habit.habit_logs.map((l) => l.log_date)
            const streak = computeStreak(logDates)
            const weekCount = logDates.filter((d) => d >= weekStartKey && d <= todayKey).length
            const progress = Math.min(1, weekCount / habit.target_per_week)
            return (
              <motion.article
                key={habit.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{habit.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold tracking-tight">{habit.name}</h3>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className={cn('h-3.5 w-3.5', streak > 0 ? 'text-orange-500' : '')} />
                      {streak} day streak · target {habit.target_per_week}×/week
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Delete habit"
                    onClick={() => {
                      if (confirm(`Delete "${habit.name}" and its history?`))
                        deleteHabit.mutate(habit.id)
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-1">
                  {last7.map((day) => {
                    const key = dayKey(day)
                    const logged = logDates.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={toggleLog.isPending}
                        onClick={() => toggleLog.mutate({ habitId: habit.id, date: key })}
                        className="group flex flex-1 flex-col items-center gap-1.5"
                        title={day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      >
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                        <span
                          className={cn(
                            'h-8 w-full max-w-9 rounded-lg border transition-all',
                            logged
                              ? cn(colorDot[habit.color], 'border-transparent')
                              : 'bg-background group-hover:border-primary/50',
                            key === todayKey && !logged && 'border-primary/60'
                          )}
                        />
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>This week</span>
                    <span>
                      {weekCount}/{habit.target_per_week}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn('h-full rounded-full', colorDot[habit.color])}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title="New habit"
        description="Pick something so small you can't say no."
      >
        {dialog && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!dialog.name.trim()) return
              createHabit.mutate(dialog)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="habit-icon">Icon</Label>
                <Input
                  id="habit-icon"
                  value={dialog.icon}
                  onChange={(e) => setDialog({ ...dialog, icon: e.target.value.slice(0, 2) })}
                  className="text-center text-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="habit-name">Name</Label>
                <Input
                  id="habit-name"
                  placeholder="Read 10 pages"
                  value={dialog.name}
                  onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Select
                  value={dialog.color}
                  onChange={(e) => setDialog({ ...dialog, color: e.target.value as AccentColor })}
                >
                  {accentColors.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="habit-target">Days per week</Label>
                <Select
                  id="habit-target"
                  value={String(dialog.target)}
                  onChange={(e) => setDialog({ ...dialog, target: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      {n}× per week
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dialog.name.trim() || createHabit.isPending}>
                {createHabit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create habit
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
