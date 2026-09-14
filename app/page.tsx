'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Flame,
  KanbanSquare,
  ListTodo,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const features = [
  {
    icon: Brain,
    title: 'AI Notes',
    description:
      'Capture ideas and let built-in AI summarize them and extract tags automatically.',
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: ListTodo,
    title: 'Tasks & Planner',
    description:
      'Kanban-style personal tasks, priorities, due dates, and a weekly planner that keeps you honest.',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Flame,
    title: 'Habit Streaks',
    description:
      'Build momentum with daily check-ins, streak tracking, and weekly targets.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: KanbanSquare,
    title: 'Team Projects',
    description:
      'Collaborative kanban boards with members, comments, assignments, and live activity feeds.',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: Wallet,
    title: 'Shared Expenses',
    description:
      'Split bills with groups, see who owes what, and settle up with smart suggestions.',
    accent: 'from-rose-500 to-pink-500',
  },
]

const highlights = [
  { icon: Zap, label: '6 apps in one' },
  { icon: Sparkles, label: 'AI built in' },
  { icon: Users, label: 'Realtime collab' },
  { icon: ShieldCheck, label: 'Private by default (RLS)' },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-160px] top-1/3 h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[120px]" />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">AbhiBase</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/auth/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button>
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-8">
        <section className="flex flex-col items-center pb-20 pt-20 text-center md:pt-28">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            One base · Every part of your life
          </motion.div>
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            Every part of your life.{' '}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              One base.
            </span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-5 max-w-xl text-balance text-base text-muted-foreground md:text-lg"
          >
            AbhiBase unifies AI-powered notes, tasks, weekly planning, habit streaks, team
            projects, and shared expenses into one beautiful workspace.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/auth/sign-up">
              <Button size="lg" className="px-7">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button size="lg" variant="outline">
                I already have an account
              </Button>
            </Link>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
          >
            {highlights.map((h) => (
              <span key={h.label} className="inline-flex items-center gap-2">
                <h.icon className="h-4 w-4 text-primary" />
                {h.label}
              </span>
            ))}
          </motion.div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className={
                'group rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 ' +
                (i === 0 ? 'sm:col-span-2 lg:col-span-1' : '')
              }
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-md`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </motion.article>
          ))}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="flex flex-col justify-between rounded-xl border bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-sm sm:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-md">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                Your whole week at a glance
              </h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                The overview dashboard stitches everything together — today&apos;s tasks, habit
                streaks, upcoming events, and your group balances — the moment you sign in.
              </p>
            </div>
            <Link href="/auth/sign-up" className="mt-6 inline-flex">
              <Button variant="secondary">
                Take the tour
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.article>
        </section>
      </main>

      <footer className="relative z-10 border-t py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row md:px-8">
          <p>© {new Date().getFullYear()} AbhiBase</p>
          <p>Next.js · Supabase · Tailwind · AI inside</p>
        </div>
      </footer>
    </div>
  )
}
