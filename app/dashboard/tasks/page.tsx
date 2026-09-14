'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Circle, ListTodo, Loader2, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { EmptyState } from '@/components/empty-state'
import { cn, dayKey, fmtDate } from '@/lib/utils'
import { priorityVariant } from '@/lib/constants'
import type { Priority, Task, TaskStatus } from '@/lib/types'

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
]

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

export default function TasksPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [title, setTitle] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('medium')
  const [dueDate, setDueDate] = React.useState('')
  const [filter, setFilter] = React.useState('all')

  const tasks = useQuery({ queryKey: ['tasks'], queryFn: api.tasks.list })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] })

  const createTask = useMutation({
    mutationFn: () =>
      api.tasks.create({
        title: title.trim(),
        priority,
        due_date: dueDate || null,
      }),
    onSuccess: () => {
      setTitle('')
      setDueDate('')
      setPriority('medium')
      toast('Task added')
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      api.tasks.update(id, patch),
    onSuccess: invalidate,
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.tasks.remove(id),
    onSuccess: () => {
      toast('Task deleted')
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const today = dayKey(new Date())
  const all = tasks.data ?? []
  const filtered = all.filter((t) => {
    if (filter === 'today') return t.due_date !== null && t.due_date <= today && t.status !== 'done'
    if (filter === 'high') return t.priority === 'high' && t.status !== 'done'
    return true
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createTask.mutate()
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-48 flex-1"
        />
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="w-32"
          aria-label="Priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-40"
          aria-label="Due date"
        />
        <Button type="submit" disabled={!title.trim() || createTask.isPending}>
          {createTask.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </Button>
      </form>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'all', label: 'All', count: all.length },
          {
            value: 'today',
            label: 'Due today',
            count: all.filter((t) => t.due_date && t.due_date <= today && t.status !== 'done')
              .length,
          },
          {
            value: 'high',
            label: 'High priority',
            count: all.filter((t) => t.priority === 'high' && t.status !== 'done').length,
          },
        ]}
      />

      {tasks.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks here"
          description="Add your first task above and start clearing the deck."
        />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const items = filtered.filter((t) => t.status === col.status)
            return (
              <div key={col.status} className="rounded-xl border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((t, i) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.03 }}
                      className="group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          aria-label="Toggle done"
                          onClick={() =>
                            updateTask.mutate({
                              id: t.id,
                              patch:
                                t.status === 'done'
                                  ? { status: 'todo', completed_at: null }
                                  : { status: 'done', completed_at: new Date().toISOString() },
                            })
                          }
                          className="mt-0.5 shrink-0"
                        >
                          <Circle
                            className={cn(
                              'h-4 w-4 transition-colors',
                              t.status === 'done'
                                ? 'fill-emerald-500 text-emerald-500'
                                : 'text-muted-foreground hover:text-primary'
                            )}
                          />
                        </button>
                        <p
                          className={cn(
                            'min-w-0 flex-1 break-words text-sm',
                            t.status === 'done' && 'text-muted-foreground line-through'
                          )}
                        >
                          {t.title}
                        </p>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => deleteTask.mutate(t.id)}
                          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-[26px]">
                        <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                        {t.due_date && (
                          <span
                            className={cn(
                              'text-xs',
                              t.due_date < today && t.status !== 'done'
                                ? 'font-medium text-destructive'
                                : 'text-muted-foreground'
                            )}
                          >
                            {fmtDate(t.due_date)}
                          </span>
                        )}
                        {t.status !== 'done' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateTask.mutate({
                                id: t.id,
                                patch: { status: nextStatus[t.status] },
                              })
                            }
                            className="ml-auto text-xs text-primary hover:underline"
                          >
                            {nextStatus[t.status] === 'done' ? 'Complete' : 'Start'} →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">Empty</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
