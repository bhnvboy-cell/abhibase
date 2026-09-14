'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    let active = true
    api.auth
      .me()
      .then(({ user }) => {
        if (!active) return
        setProfile(user ? { ...user, created_at: '' } : null)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const signOut = React.useCallback(async () => {
    try {
      await api.auth.signOut()
    } finally {
      setProfile(null)
      router.push('/')
      router.refresh()
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
