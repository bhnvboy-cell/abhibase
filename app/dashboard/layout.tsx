'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) router.replace('/auth/sign-in')
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
