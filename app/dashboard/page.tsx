'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Circle,
  Flame,
  ListTodo,
  NotebookPen,
  Wallet,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { colorDot } from '@/lib/constants'
import { cn, dayKey, fmtDate, fmtTime } from '@/lib/utils'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <motion.div variants={item}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function OverviewPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const today = dayKey(new Date())

  const tasks = useQuery({ queryKey: ['tasks'], queryFn: api.tasks.list })
  const habits = useQuery({ queryKey: ['habits'], queryFn: api.habits.list })
  const events = useQuery({ queryKey: ['events'], queryFn: api.events.list })
  const notes = useQuery({
    queryKey: ['notes'],
    queryFn: async () => (await api.notes.list()).slice(0, 4),
  })
  const groups = useQuery({ queryKey: ['groups'], queryFn: api.expenses.groups })

  const toggleTask = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.tasks.update(id, {
        status: done ? 'done' : 'todo',
        completed_at: done ? new Date().toISOString() : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const doneTasks = (tasks.data ?? []).filter((t) => t.status === 'done')
  const todayTasks = (tasks.data ?? [])
    .filter((t) => t.status !== 'done' && t.due_date && t.due_date <= today)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, 6)

  const habitList = habits.data ?? []
  const habitsDoneToday = habitList.filter((h) =>
    h.habit_logs.some((l) => l.log_date === today)
  ).length

  const weekAhead = (events.data ?? []).filter((e) => e.event_date >= today).slice(0, 5)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListTodo}
          label="Tasks done"
          value={`${doneTasks.length}/${tasks.data?.length ?? 0}`}
          sub="all time"
        />
        <StatCard
          icon={Flame}
          label="Habits today"
          value={`${habitsDoneToday}/${habitList.length}`}
          sub="check-ins"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming"
          value={String(weekAhead.length)}
          sub="events ahead"
        />
        <StatCard
          icon={Wallet}
          label="Groups"
          value={String(groups.data?.length ?? 0)}
          sub="shared expenses"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Due today &amp; overdue</CardTitle>
              <Link
                href="/dashboard/tasks"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                All tasks
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {todayTasks.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing due. Enjoy the calm.
                </p>
              )}
              {todayTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTask.mutate({ id: t.id, done: true })}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  {t.due_date && t.due_date < today && (
                    <Badge variant="danger">overdue</Badge>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtDate(t.due_date)}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Coming up</CardTitle>
              <Link
                href="/dashboard/planner"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Planner
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {weekAhead.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No upcoming events.
                </p>
              )}
              {weekAhead.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <span
                    className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', colorDot[e.color])}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(e.event_date)}
                      {e.start_time ? ` · ${fmtTime(e.start_time)}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Recent notes</CardTitle>
            <Link
              href="/dashboard/notes"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              All notes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {(notes.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No notes yet — capture your first idea.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(notes.data ?? []).map((n) => (
                  <Link
                    key={n.id}
                    href="/dashboard/notes"
                    className="rounded-lg border p-3.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-center gap-2">
                      <NotebookPen className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{n.title}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {n.content || 'Empty note'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
