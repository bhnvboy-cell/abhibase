'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, TrendingUp, CheckCircle2, StickyNote, Calendar, Flame, FolderOpen, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444']

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color || '#7c3aed'}15` }}>
          <Icon className="h-5 w-5" style={{ color: color || '#7c3aed' }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const completionRate = data?.tasks_total
    ? Math.round((data.tasks_completed / data.tasks_total) * 100)
    : 0

  const taskStatusData = (data?.tasks_by_status ?? []).map((s: { status: string; count: number }) => ({
    name: s.status === 'todo' ? 'To Do' : s.status === 'in_progress' ? 'In Progress' : 'Done',
    value: s.count,
  }))

  const taskPriorityData = (data?.tasks_by_priority ?? []).map((p: { priority: string; count: number }) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your productivity insights at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Tasks Done" value={`${data?.tasks_completed ?? 0}/${data?.tasks_total ?? 0}`} color="#22c55e" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${completionRate}%`} color="#3b82f6" />
        <StatCard icon={Flame} label="Habits This Week" value={`${data?.habit_logs_week ?? 0}/${(data?.habits_count ?? 0) * 7}`} color="#f59e0b" />
        <StatCard icon={Wallet} label="Total Expenses" value={`₹${(data?.expenses_total ?? 0).toLocaleString()}`} color="#ef4444" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={StickyNote} label="Notes" value={data?.notes_count ?? 0} color="#7c3aed" />
        <StatCard icon={Calendar} label="Events" value={data?.events_count ?? 0} color="#3b82f6" />
        <StatCard icon={Flame} label="Active Habits" value={data?.habits_count ?? 0} color="#22c55e" />
        <StatCard icon={FolderOpen} label="Projects" value={data?.projects_count ?? 0} color="#f59e0b" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {taskStatusData.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No task data yet</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {taskStatusData.map((item: { name: string; value: number }, index: number) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {item.name}: {item.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {taskPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskPriorityData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No task data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.activity_by_day ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.activity_by_day}>
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: string) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Start using AbhiBase to see your activity over time.
            </p>
          )}
        </CardContent>
      </Card>

      {(data?.recent_activity ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_activity.map((a: { action: string; entity_type: string; created_at: string }, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{a.entity_type}</span>{' '}
                    <span className="text-muted-foreground">{a.action}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
