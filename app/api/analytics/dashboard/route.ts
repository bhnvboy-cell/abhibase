import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const totalEvents = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM analytics_events WHERE user_id = $1`,
    [g.user.id]
  )

  const eventsByType = await query<{ event_type: string; count: number }>(
    `SELECT event_type, COUNT(*)::int as count
     FROM analytics_events WHERE user_id = $1
     GROUP BY event_type ORDER BY count DESC`,
    [g.user.id]
  )

  const eventsByDay = await query<{ date: string; count: number }>(
    `SELECT DATE(created_at) as date, COUNT(*)::int as count
     FROM analytics_events WHERE user_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY DATE(created_at) ORDER BY date`,
    [g.user.id]
  )

  const totalSessions = await one<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM analytics_sessions WHERE user_id = $1`,
    [g.user.id]
  )

  const avgSessionDuration = await one<{ avg_ms: number }>(
    `SELECT COALESCE(AVG(duration_ms), 0)::numeric as avg_ms
     FROM analytics_sessions WHERE user_id = $1 AND ended_at IS NOT NULL`,
    [g.user.id]
  )

  const recentEvents = await query<{ event_type: string; properties: Record<string, unknown>; created_at: string }>(
    `SELECT event_type, properties, created_at
     FROM analytics_events WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 10`,
    [g.user.id]
  )

  const topProperties = await query<{ event_type: string; key: string; value_count: number }>(
    `SELECT event_type, key, COUNT(*)::int as value_count
     FROM analytics_events, jsonb_object_keys(properties) AS key
     WHERE user_id = $1
     GROUP BY event_type, key
     ORDER BY value_count DESC LIMIT 10`,
    [g.user.id]
  )

  return NextResponse.json({
    total_events: totalEvents?.count ?? 0,
    events_by_type: eventsByType,
    events_by_day: eventsByDay,
    total_sessions: totalSessions?.count ?? 0,
    avg_session_duration_ms: Number(avgSessionDuration?.avg_ms ?? 0),
    recent_events: recentEvents,
    top_properties: topProperties,
  })
}
