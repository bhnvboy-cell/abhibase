import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const tasksTotal = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM tasks WHERE user_id = $1`,
    [g.user.id]
  )

  const tasksCompleted = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM tasks WHERE user_id = $1 AND status = 'done'`,
    [g.user.id]
  )

  const tasksByStatus = await query<{ status: string; count: number }>(
    `SELECT status, COUNT(*)::int as count FROM tasks WHERE user_id = $1 GROUP BY status`,
    [g.user.id]
  )

  const tasksByPriority = await query<{ priority: string; count: number }>(
    `SELECT priority, COUNT(*)::int as count FROM tasks WHERE user_id = $1 GROUP BY priority`,
    [g.user.id]
  )

  const notesCount = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM notes WHERE user_id = $1`,
    [g.user.id]
  )

  const eventsCount = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM planner_events WHERE user_id = $1`,
    [g.user.id]
  )

  const habitsCount = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM habits WHERE user_id = $1 AND archived = false`,
    [g.user.id]
  )

  const habitLogsWeek = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM habit_logs
     WHERE user_id = $1 AND log_date >= CURRENT_DATE - INTERVAL '7 days'`,
    [g.user.id]
  )

  const projectsCount = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM project_members WHERE user_id = $1`,
    [g.user.id]
  )

  const expensesTotal = await one<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0)::numeric as total
     FROM expenses e
     JOIN group_members gm ON gm.group_id = e.group_id
     WHERE gm.user_id = $1`,
    [g.user.id]
  )

  const activityByDay = await query<{ date: string; count: number }>(
    `SELECT DATE(created_at) as date, COUNT(*)::int as count
     FROM activity_logs WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY DATE(created_at) ORDER BY date`,
    [g.user.id]
  )

  const recentActivity = await query<{ action: string; entity_type: string; created_at: string }>(
    `SELECT action, entity_type, created_at
     FROM activity_logs WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [g.user.id]
  )

  return NextResponse.json({
    tasks_total: tasksTotal?.count ?? 0,
    tasks_completed: tasksCompleted?.count ?? 0,
    tasks_by_status: tasksByStatus,
    tasks_by_priority: tasksByPriority,
    notes_count: notesCount?.count ?? 0,
    events_count: eventsCount?.count ?? 0,
    habits_count: habitsCount?.count ?? 0,
    habit_logs_week: habitLogsWeek?.count ?? 0,
    projects_count: projectsCount?.count ?? 0,
    expenses_total: Number(expensesTotal?.total ?? 0),
    activity_by_day: activityByDay,
    recent_activity: recentActivity,
  })
}
