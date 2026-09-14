create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  summary text,
  tags text[] not null default '{}',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists planner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text default '',
  event_date date not null,
  start_time time,
  end_time time,
  color text not null default 'violet' check (color in ('violet','blue','emerald','amber','rose')),
  created_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  icon text not null default '🔥',
  color text not null default 'emerald' check (color in ('violet','blue','emerald','amber','rose')),
  target_per_week int not null default 7 check (target_per_week between 1 and 7),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  color text not null default 'violet' check (color in ('violet','blue','emerald','amber','rose')),
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  position int not null default 0
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  column_id uuid not null references board_columns(id) on delete cascade,
  title text not null,
  description text default '',
  assignee_id uuid references users(id) on delete set null,
  due_date date,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists expense_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🏠',
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references expense_groups(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references expense_groups(id) on delete cascade,
  paid_by uuid not null references users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'general',
  split_with uuid[] not null default '{}',
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references expense_groups(id) on delete cascade,
  from_user uuid not null references users(id) on delete cascade,
  to_user uuid not null references users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  filename text not null,
  original_name text not null,
  mime_type text not null,
  size int not null,
  created_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  email_tasks boolean not null default true,
  email_habits boolean not null default true,
  email_events boolean not null default true,
  email_projects boolean not null default true,
  reminder_minutes_before int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('task_overdue','habit_missed','event_upcoming','scheduled','custom')),
  trigger_config jsonb not null default '{}',
  action_type text not null check (action_type in ('send_email','create_task','create_notification','webhook')),
  action_config jsonb not null default '{}',
  enabled boolean not null default true,
  last_run timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  description text default '',
  category text not null default 'general',
  data jsonb not null default '{}',
  public boolean not null default false,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google','slack','discord','telegram')),
  access_token text,
  refresh_token text,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text default '',
  parent_branch text not null default 'main',
  snapshot jsonb not null default '{}',
  merged boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists email_queue (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  html text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_notes_user on notes(user_id);
create index if not exists idx_tasks_user on tasks(user_id);
create index if not exists idx_events_user_date on planner_events(user_id, event_date);
create index if not exists idx_habits_user on habits(user_id);
create index if not exists idx_habit_logs_habit on habit_logs(habit_id, log_date);
create index if not exists idx_project_members_user on project_members(user_id);
create index if not exists idx_columns_project on board_columns(project_id, position);
create index if not exists idx_cards_column on cards(column_id, position);
create index if not exists idx_cards_project on cards(project_id);
create index if not exists idx_comments_card on card_comments(card_id, created_at);
create index if not exists idx_activities_project on activities(project_id, created_at desc);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_expenses_group on expenses(group_id, expense_date desc);
create index if not exists idx_settlements_group on settlements(group_id);
create index if not exists idx_attachments_user on attachments(user_id);
create index if not exists idx_notifications_user on notifications(user_id, read, created_at desc);
create index if not exists idx_activity_logs_user on activity_logs(user_id, created_at desc);
create index if not exists idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index if not exists idx_automations_user on automations(user_id, enabled);
create index if not exists idx_templates_category on templates(category, public);
create index if not exists idx_integrations_user on integrations(user_id, provider);
create index if not exists idx_branches_user on branches(user_id, merged);
create index if not exists idx_email_queue_status on email_queue(status, created_at);
