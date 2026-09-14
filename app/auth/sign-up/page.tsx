'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      await api.auth.signUp({ fullName, email, password })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
      setLoading(false)
      return
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            A
          </div>
          <span className="text-xl font-semibold tracking-tight">AbhiBase</span>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-lg">
          <h1 className="text-lg font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One base for notes, tasks, habits, teams and money.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Ada Lovelace"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create account
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
