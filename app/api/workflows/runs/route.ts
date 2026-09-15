import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query } from '@/lib/db'

export const runtime = 'nodejs'

interface WorkflowRun {
  id: string
  workflow_id: string
  status: string
  input_payload: Record<string, unknown>
  output: Record<string, unknown>[] | null
  error: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  workflow_name: string
  trigger_type: string
}

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const workflowId = url.searchParams.get('workflow_id')
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)

  let whereClause = 'WHERE wr.user_id = $1'
  const params: unknown[] = [g.user.id]
  let paramIndex = 2

  if (workflowId) {
    whereClause += ` AND wr.workflow_id = $${paramIndex}`
    params.push(workflowId)
    paramIndex++
  }

  if (status) {
    whereClause += ` AND wr.status = $${paramIndex}`
    params.push(status)
    paramIndex++
  }

  params.push(limit, offset)

  const runs = await query<WorkflowRun>(
    `SELECT wr.id, wr.workflow_id, wr.status, wr.input_payload, wr.output, wr.error,
            wr.started_at, wr.completed_at, wr.duration_ms,
            w.name AS workflow_name, w.trigger_type
     FROM workflow_runs wr
     JOIN workflows w ON w.id = wr.workflow_id
     ${whereClause}
     ORDER BY wr.started_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  )

  return NextResponse.json({ runs })
}
