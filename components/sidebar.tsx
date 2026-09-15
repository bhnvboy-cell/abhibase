'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  CreditCard,
  Flame,
  GitBranch,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  MessageSquare,
  NotebookPen,
  Palette,
  Puzzle,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Video,
  Wallet,
  Wand2,
  Webhook,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/store'
import { useAuth } from '@/components/auth-provider'
import { Avatar } from '@/components/ui/avatar'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/notes', label: 'Notes', icon: NotebookPen },
      { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
      { href: '/dashboard/planner', label: 'Planner', icon: CalendarDays },
      { href: '/dashboard/habits', label: 'Habits', icon: Flame },
    ],
  },
  {
    label: 'Collaborate',
    items: [
      { href: '/dashboard/projects', label: 'Projects', icon: KanbanSquare },
      { href: '/dashboard/expenses', label: 'Expenses', icon: Wallet },
      { href: '/dashboard/meetings', label: 'Meetings', icon: Video },
      { href: '/dashboard/messages', label: 'Messages', icon: Mail },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/dashboard/services', label: 'AbhiBase Services', icon: Sparkles },
      { href: '/dashboard/bug-resolver', label: 'Bug Resolver', icon: Shield },
      { href: '/dashboard/generators', label: 'Generator Hub', icon: Wand2 },
      { href: '/dashboard/app-builder', label: 'App Builder', icon: Wrench },
      { href: '/dashboard/website-builder', label: 'Website Builder', icon: Globe },
      { href: '/dashboard/ai-agents', label: 'AI Agents', icon: Bot },
      { href: '/dashboard/discussion', label: 'Discussion Mode', icon: MessageSquare },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/automations', label: 'Automations', icon: Sparkles },
      { href: '/dashboard/workflows', label: 'Workflows', icon: Webhook },
      { href: '/dashboard/templates', label: 'Templates', icon: Tag },
      { href: '/dashboard/templates-gallery', label: 'Template Gallery', icon: Sparkles },
      { href: '/dashboard/integrations', label: 'Integrations', icon: Puzzle },
      { href: '/dashboard/branches', label: 'Branches', icon: GitBranch },
      { href: '/dashboard/design', label: 'Design System', icon: Palette },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
      { href: '/dashboard/social', label: 'Social Media', icon: Sparkles },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
      { href: '/dashboard/testing', label: 'App Testing', icon: Shield },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
      { href: '/dashboard/security', label: 'Security', icon: Shield },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          A
        </div>
        <span className="text-[15px] font-semibold tracking-tight">AbhiBase</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={profile?.full_name || profile?.email || '?'} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name || 'You'}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign out"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { open, close } = useSidebarStore()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={close}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-64 border-r bg-background"
            >
              <button
                type="button"
                onClick={close}
                className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={close} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
