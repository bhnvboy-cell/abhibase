export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  summary: string | null
  tags: string[]
  pinned: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface PlannerEvent {
  id: string
  user_id: string
  title: string
  description: string
  event_date: string
  start_time: string | null
  end_time: string | null
  color: AccentColor
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  color: AccentColor
  target_per_week: number
  archived: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  log_date: string
}

export interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
}

export type AccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose'

export interface Project {
  id: string
  name: string
  description: string
  color: AccentColor
  created_by: string
  created_at: string
  project_members?: ProjectMember[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  profiles?: Profile
}

export interface BoardColumn {
  id: string
  project_id: string
  name: string
  position: number
}

export interface Card {
  id: string
  project_id: string
  column_id: string
  title: string
  description: string
  assignee_id: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface CardComment {
  id: string
  card_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Activity {
  id: string
  project_id: string
  user_id: string
  action: string
  created_at: string
  profiles?: Profile
}

export interface ExpenseGroup {
  id: string
  name: string
  emoji: string
  created_by: string
  created_at: string
  group_members?: GroupMember[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  profiles?: Profile
}

export interface Expense {
  id: string
  group_id: string
  paid_by: string
  description: string
  amount: number
  category: string
  split_with: string[]
  expense_date: string
  created_at: string
}

export interface Settlement {
  id: string
  group_id: string
  from_user: string
  to_user: string
  amount: number
  created_at: string
}

export interface Attachment {
  id: string
  user_id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  email_tasks: boolean
  email_habits: boolean
  email_events: boolean
  email_projects: boolean
  reminder_minutes_before: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

export interface Automation {
  id: string
  user_id: string
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  action_type: string
  action_config: Record<string, unknown>
  enabled: boolean
  last_run: string | null
  created_at: string
}

export interface Template {
  id: string
  user_id: string | null
  name: string
  description: string
  category: string
  data: Record<string, unknown>
  public: boolean
  use_count: number
  created_at: string
}

export interface Integration {
  id: string
  user_id: string
  provider: string
  config: Record<string, unknown>
  enabled: boolean
  created_at: string
}

export interface Branch {
  id: string
  user_id: string
  name: string
  description: string
  parent_branch: string
  snapshot: Record<string, unknown>
  merged: boolean
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_name: string
  client_email: string | null
  due_date: string | null
  amount: number
  currency: string
  items: InvoiceItem[]
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
}

export interface SocialPost {
  id: string
  user_id: string
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook'
  content: string
  hashtags: string[]
  scheduled_for: string | null
  status: 'draft' | 'scheduled' | 'published'
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  user_id: string
  title: string
  date: string
  duration: number
  attendees: string[]
  notes: string
  platform: string
  summary: string | null
  action_items: ActionItem[]
  created_at: string
  updated_at: string
}

export interface ActionItem {
  id: string
  task: string
  assignee: string
  due_date?: string
  completed: boolean
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  device: string | null
  ip_address: string | null
  user_agent: string | null
  last_active: string
  current: boolean
  created_at: string
}
