'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import { useSidebarStore } from '@/lib/store'
import { useAuth } from '@/components/auth-provider'

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/notes': 'Notes',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/planner': 'Planner',
  '/dashboard/habits': 'Habits',
  '/dashboard/projects': 'Projects',
  '/dashboard/expenses': 'Expenses',
}

export function Navbar() {
  const pathname = usePathname()
  const toggleSidebar = useSidebarStore((s) => s.toggle)
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const title =
    titles[pathname] ??
    (pathname.startsWith('/dashboard/projects/') ? 'Project' : 'AbhiBase')

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar name={profile?.full_name || profile?.email || '?'} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-lg border bg-card shadow-lg">
              <div className="border-b px-3 py-2.5">
                <p className="truncate text-sm font-medium">{profile?.full_name || 'You'}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Link
                href="/dashboard/habits"
                className="block px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                onClick={() => setMenuOpen(false)}
              >
                My habits
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="block w-full px-3 py-2 text-left text-sm text-rose-500 transition-colors hover:bg-muted"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
