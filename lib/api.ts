import type {
  Activity,
  Attachment,
  Automation,
  BoardColumn,
  Branch,
  Card,
  CardComment,
  Expense,
  ExpenseGroup,
  HabitWithLogs,
  Integration,
  Notification,
  NotificationPreference,
  Note,
  PlannerEvent,
  Profile,
  Project,
  ProjectMember,
  Settlement,
  Task,
  Template,
} from '@/lib/types'

interface AnalyticsOverview {
  tasks_completed: number
  tasks_total: number
  habits_streak_avg: number
  notes_count: number
  events_count: number
  activity_by_day: { date: string; count: number }[]
}

interface UserPayload {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
}

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: options?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  }
  return data as T
}

const del = (url: string) => request<{ ok: boolean }>(url, { method: 'DELETE' })

export const api = {
  auth: {
    async me(): Promise<{ user: UserPayload | null }> {
      return request('/api/auth/me')
    },
    signUp(input: { fullName: string; email: string; password: string }) {
      return request<{ user: UserPayload }>('/api/auth/signup', {
        method: 'POST',
        body: input,
      })
    },
    signIn(input: { email: string; password: string }) {
      return request<{ user: UserPayload | null }>('/api/auth/signin', {
        method: 'POST',
        body: input,
      })
    },
    signOut() {
      return request<{ ok: boolean }>('/api/auth/signout', { method: 'POST', body: {} })
    },
  },

  notes: {
    async list(): Promise<Note[]> {
      const data = await request<{ notes: Note[] }>('/api/notes')
      return data.notes
    },
    create(input: { title: string; content: string; tags: string[] }) {
      return request<{ note: Note }>('/api/notes', { method: 'POST', body: input })
    },
    update(id: string, patch: Partial<Note>) {
      return request<{ note: Note }>('/api/notes', {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    remove(id: string) {
      return del(`/api/notes?id=${encodeURIComponent(id)}`)
    },
  },

  tasks: {
    async list(): Promise<Task[]> {
      const data = await request<{ tasks: Task[] }>('/api/tasks')
      return data.tasks
    },
    create(input: { title: string; priority: string; due_date: string | null }) {
      return request<{ task: Task }>('/api/tasks', { method: 'POST', body: input })
    },
    update(id: string, patch: Partial<Task>) {
      return request<{ task: Task }>('/api/tasks', {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    remove(id: string) {
      return del(`/api/tasks?id=${encodeURIComponent(id)}`)
    },
  },

  events: {
    async list(): Promise<PlannerEvent[]> {
      const data = await request<{ events: PlannerEvent[] }>('/api/events')
      return data.events
    },
    create(
      input: Partial<PlannerEvent> & { title: string; event_date: string }
    ) {
      return request<{ event: PlannerEvent }>('/api/events', { method: 'POST', body: input })
    },
    remove(id: string) {
      return del(`/api/events?id=${encodeURIComponent(id)}`)
    },
  },

  habits: {
    async list(): Promise<HabitWithLogs[]> {
      const data = await request<{ habits: HabitWithLogs[] }>('/api/habits')
      return data.habits
    },
    create(input: { name: string; icon: string; color: string; target_per_week: number }) {
      return request<{ habit: unknown }>('/api/habits', { method: 'POST', body: input })
    },
    toggleLog(habitId: string, date: string) {
      return request<{ logged: boolean }>('/api/habits', {
        method: 'PATCH',
        body: { habitId, date },
      })
    },
    remove(id: string) {
      return del(`/api/habits?id=${encodeURIComponent(id)}`)
    },
  },

  projects: {
    async list(): Promise<Project[]> {
      const data = await request<{ projects: Project[] }>('/api/projects')
      return data.projects
    },
    async getById(id: string): Promise<Project | null> {
      try {
        const data = await request<{ project: Project }>(`/api/projects/${id}`)
        return data.project
      } catch {
        return null
      }
    },
    create(input: { name: string; description: string; color: string }) {
      return request<{ id: string }>('/api/projects', { method: 'POST', body: input })
    },
    async members(projectId: string): Promise<ProjectMember[]> {
      const data = await request<{ members: ProjectMember[] }>(
        `/api/projects/${projectId}/members`
      )
      return data.members
    },
    inviteByEmail(projectId: string, email: string, role = 'editor') {
      return request<{ ok: boolean }>(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: { email, role },
      })
    },
    removeMember(projectId: string, userId: string) {
      return del(`/api/projects/${projectId}/members?userId=${encodeURIComponent(userId)}`)
    },
    async columns(projectId: string): Promise<BoardColumn[]> {
      try {
        const data = await request<{ columns: BoardColumn[] }>(`/api/projects/${projectId}`)
        return data.columns
      } catch {
        return []
      }
    },
    async cards(projectId: string): Promise<Card[]> {
      const data = await request<{ cards: Card[] }>(`/api/projects/${projectId}/cards`)
      return data.cards
    },
    createCard(input: { project_id: string; column_id: string; title: string }) {
      return request<{ ok: boolean }>(`/api/projects/${input.project_id}/cards`, {
        method: 'POST',
        body: { column_id: input.column_id, title: input.title },
      })
    },
    updateCard(projectId: string, id: string, patch: Partial<Card>) {
      return request<{ ok: boolean }>(`/api/projects/${projectId}/cards`, {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    removeCard(projectId: string, id: string) {
      return del(`/api/projects/${projectId}/cards?id=${encodeURIComponent(id)}`)
    },
    async comments(projectId: string, cardId: string): Promise<CardComment[]> {
      const data = await request<{ comments: CardComment[] }>(
        `/api/projects/${projectId}/comments?cardId=${encodeURIComponent(cardId)}`
      )
      return data.comments
    },
    addComment(projectId: string, cardId: string, content: string) {
      return request<{ ok: boolean }>(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        body: { card_id: cardId, content },
      })
    },
    async activity(projectId: string): Promise<Activity[]> {
      try {
        const data = await request<{
          activities: (Activity & { profile_full_name: string; profile_email: string })[]
        }>(`/api/projects/${projectId}/activity`)
        return data.activities.map((a) => ({
          id: a.id,
          project_id: a.project_id,
          user_id: a.user_id,
          action: a.action,
          created_at: a.created_at,
          profiles: {
            id: a.user_id,
            email: a.profile_email,
            full_name: a.profile_full_name,
            avatar_url: null,
            created_at: '',
          },
        }))
      } catch {
        return []
      }
    },
  },

  expenses: {
    async groups(): Promise<ExpenseGroup[]> {
      const data = await request<{ groups: ExpenseGroup[] }>('/api/expenses/groups')
      return data.groups
    },
    createGroup(input: { name: string; emoji: string }) {
      return request<{ id: string }>('/api/expenses/groups', { method: 'POST', body: input })
    },
    inviteByEmail(groupId: string, email: string) {
      return request<{ ok: boolean }>(`/api/expenses/groups/${groupId}`, {
        method: 'POST',
        body: { kind: 'member', email },
      })
    },
    async expenses(groupId: string): Promise<Expense[]> {
      const data = await request<{ expenses: Expense[] }>(`/api/expenses/groups/${groupId}`)
      return data.expenses
    },
    createExpense(
      groupId: string,
      input: {
        paid_by: string
        description: string
        amount: number
        split_with: string[]
        expense_date: string
      }
    ) {
      return request<{ ok: boolean }>(`/api/expenses/groups/${groupId}`, {
        method: 'POST',
        body: { kind: 'expense', ...input },
      })
    },
    removeExpense(groupId: string, expenseId: string) {
      return del(
        `/api/expenses/groups/${groupId}?expenseId=${encodeURIComponent(expenseId)}`
      )
    },
    async settlements(groupId: string): Promise<Settlement[]> {
      const data = await request<{ settlements: Settlement[] }>(
        `/api/expenses/groups/${groupId}`
      )
      return data.settlements
    },
    createSettlement(
      groupId: string,
      input: { from_user: string; to_user: string; amount: number }
    ) {
      return request<{ ok: boolean }>(`/api/expenses/groups/${groupId}`, {
        method: 'POST',
        body: { kind: 'settlement', ...input },
      })
    },
    removeSettlement(groupId: string, settlementId: string) {
      return del(
        `/api/expenses/groups/${groupId}?settlementId=${encodeURIComponent(settlementId)}`
      )
    },
  },

  uploads: {
    async list(): Promise<Attachment[]> {
      const data = await request<{ attachments: Attachment[] }>('/api/uploads')
      return data.attachments
    },
    async upload(file: File): Promise<Attachment> {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: formData, credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      return data.attachment
    },
    remove(id: string) {
      return del(`/api/uploads?id=${encodeURIComponent(id)}`)
    },
  },

  notifications: {
    async list(): Promise<Notification[]> {
      const data = await request<{ notifications: Notification[] }>('/api/notifications')
      return data.notifications
    },
    async unreadCount(): Promise<number> {
      const data = await request<{ count: number }>('/api/notifications?unread=true')
      return data.count
    },
    markRead(id: string) {
      return request<{ ok: boolean }>(`/api/notifications`, { method: 'PATCH', body: { id } })
    },
    markAllRead() {
      return request<{ ok: boolean }>('/api/notifications', { method: 'PATCH', body: { all: true } })
    },
  },

  analytics: {
    async overview(): Promise<AnalyticsOverview> {
      return request('/api/analytics')
    },
  },

  automations: {
    async list(): Promise<Automation[]> {
      const data = await request<{ automations: Automation[] }>('/api/automations')
      return data.automations
    },
    create(input: { name: string; trigger_type: string; trigger_config: Record<string, unknown>; action_type: string; action_config: Record<string, unknown> }) {
      return request<{ automation: Automation }>('/api/automations', { method: 'POST', body: input })
    },
    update(id: string, patch: Partial<Automation>) {
      return request<{ automation: Automation }>('/api/automations', { method: 'PATCH', body: { id, ...patch } })
    },
    remove(id: string) {
      return del(`/api/automations?id=${encodeURIComponent(id)}`)
    },
  },

  templates: {
    async list(): Promise<Template[]> {
      const data = await request<{ templates: Template[] }>('/api/templates')
      return data.templates
    },
    create(input: { name: string; description: string; category: string; data: Record<string, unknown> }) {
      return request<{ template: Template }>('/api/templates', { method: 'POST', body: input })
    },
    apply(id: string) {
      return request<{ ok: boolean }>('/api/templates', { method: 'POST', body: { id, apply: true } })
    },
    remove(id: string) {
      return del(`/api/templates?id=${encodeURIComponent(id)}`)
    },
  },

  integrations: {
    async list(): Promise<Integration[]> {
      const data = await request<{ integrations: Integration[] }>('/api/integrations')
      return data.integrations
    },
    connect(provider: string, config: Record<string, unknown>) {
      return request<{ integration: Integration }>('/api/integrations', { method: 'POST', body: { provider, ...config } })
    },
    disconnect(id: string) {
      return del(`/api/integrations?id=${encodeURIComponent(id)}`)
    },
  },

  branches: {
    async list(): Promise<Branch[]> {
      const data = await request<{ branches: Branch[] }>('/api/branches')
      return data.branches
    },
    create(input: { name: string; description: string }) {
      return request<{ branch: Branch }>('/api/branches', { method: 'POST', body: input })
    },
    merge(id: string) {
      return request<{ ok: boolean }>(`/api/branches/${id}/merge`, { method: 'POST', body: {} })
    },
    remove(id: string) {
      return del(`/api/branches?id=${encodeURIComponent(id)}`)
    },
  },

  payments: {
    async listInvoices(): Promise<any[]> {
      const data = await request<{ invoices: any[] }>('/api/payments/invoices')
      return data.invoices
    },
    createInvoice(input: any) {
      return request<{ invoice: any }>('/api/payments/invoices', { method: 'POST', body: input })
    },
    updateInvoice(id: string, patch: any) {
      return request<{ invoice: any }>('/api/payments/invoices', {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    removeInvoice(id: string) {
      return del(`/api/payments/invoices?id=${encodeURIComponent(id)}`)
    },
  },

  social: {
    async listPosts(): Promise<any[]> {
      const data = await request<{ posts: any[] }>('/api/social/posts')
      return data.posts
    },
    createPost(input: any) {
      return request<{ post: any }>('/api/social/posts', { method: 'POST', body: input })
    },
    updatePost(id: string, patch: any) {
      return request<{ post: any }>('/api/social/posts', {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    removePost(id: string) {
      return del(`/api/social/posts?id=${encodeURIComponent(id)}`)
    },
  },

  meetings: {
    async list(): Promise<any[]> {
      const data = await request<{ meetings: any[] }>('/api/meetings')
      return data.meetings
    },
    create(input: any) {
      return request<{ meeting: any }>('/api/meetings', { method: 'POST', body: input })
    },
    update(id: string, patch: any) {
      return request<{ meeting: any }>('/api/meetings', {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    remove(id: string) {
      return del(`/api/meetings?id=${encodeURIComponent(id)}`)
    },
  },

  security: {
    async getAuditLogs(): Promise<any[]> {
      const data = await request<{ logs: any[] }>('/api/security/audit-logs')
      return data.logs
    },
    async getActiveSessions(): Promise<any[]> {
      const data = await request<{ sessions: any[] }>('/api/security/sessions')
      return data.sessions
    },
    async setup2FA(): Promise<{ qrCode: string }> {
      return request('/api/security/2fa/setup', { method: 'POST', body: {} })
    },
    async verify2FA(code: string): Promise<{ success: boolean }> {
      return request('/api/security/2fa/verify', { method: 'POST', body: { code } })
    },
    async disable2FA(): Promise<{ success: boolean }> {
      return request('/api/security/2fa/disable', { method: 'POST', body: {} })
    },
    async revokeSession(sessionId: string): Promise<{ ok: boolean }> {
      return del(`/api/security/sessions?id=${encodeURIComponent(sessionId)}`)
    },
  },

  ai: {
    chat(input: { messages: { role: string; content: string }[]; system?: string }) {
      return request<{ content: string }>('/api/ai/chat', { method: 'POST', body: input })
    },
    summarize(content: string) {
      return request<{ summary: string }>('/api/ai/summarize', { method: 'POST', body: { content } })
    },
    generateContent(prompt: string) {
      return request<{ content: string }>('/api/ai/generate', { method: 'POST', body: { prompt } })
    },
  },

  settings: {
    async getNotificationPreferences(): Promise<any[]> {
      const data = await request<{ preferences: any[] }>('/api/settings/notifications')
      return data.preferences
    },
    updateNotificationPreferences(preferences: any[]) {
      return request<{ ok: boolean }>('/api/settings/notifications', {
        method: 'POST',
        body: { preferences },
      })
    },
    async getApiKeys(): Promise<any[]> {
      const data = await request<{ keys: any[] }>('/api/settings/api-keys')
      return data.keys
    },
    addApiKey(provider: string, apiKey: string) {
      return request<{ ok: boolean }>('/api/settings/api-keys', {
        method: 'POST',
        body: { provider, api_key: apiKey },
      })
    },
    removeApiKey(id: string) {
      return del(`/api/settings/api-keys?id=${encodeURIComponent(id)}`)
    },
  },

  websites: {
    async list(): Promise<any[]> {
      const data = await request<{ websites: any[] }>('/api/websites')
      return data.websites
    },
    create(input: any) {
      return request<{ website: any }>('/api/websites', { method: 'POST', body: input })
    },
    update(id: string, patch: any) {
      return request<{ website: any }>('/api/websites', {
        method: 'PATCH',
        body: { id, ...patch },
      })
    },
    delete(id: string) {
      return del(`/api/websites?id=${encodeURIComponent(id)}`)
    },
    async getBySlug(slug: string): Promise<any> {
      const data = await request<{ website: any }>(`/api/websites/${slug}`)
      return data.website
    },
  },

  apps: {
    async list(): Promise<any[]> {
      const data = await request<{ apps: any[] }>('/api/apps')
      return data.apps
    },
    create(input: any) {
      return request<{ app: any; results: any[] }>('/api/apps', { method: 'POST', body: input })
    },
  },
}

export type { Profile, Attachment, Notification, NotificationPreference, Automation, Template, Integration, Branch, AnalyticsOverview }
