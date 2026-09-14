'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Kanban, ActivityFeed, MemberBadge } from '@/components/kanban'
import { cn } from '@/lib/utils'
import { colorBar } from '@/lib/constants'

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const qc = useQueryClient()
  const [inviteEmail, setInviteEmail] = React.useState('')

  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.projects.getById(projectId),
  })
  const columns = useQuery({
    queryKey: ['columns', projectId],
    queryFn: () => api.projects.columns(projectId),
  })

  const invalidateMembers = () => {
    qc.invalidateQueries({ queryKey: ['project', projectId] })
    qc.invalidateQueries({ queryKey: ['projects'] })
  }

  const inviteMember = useMutation({
    mutationFn: (email: string) => api.projects.inviteByEmail(projectId, email),
    onSuccess: () => {
      toast('Member added to the project')
      setInviteEmail('')
      invalidateMembers()
      qc.invalidateQueries({ queryKey: ['activity', projectId] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  if (project.isLoading || columns.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!project.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Project not found or you don&apos;t have access.</p>
        <Link href="/dashboard/projects" className="mt-3 inline-block text-primary hover:underline">
          ← Back to projects
        </Link>
      </div>
    )
  }

  const members = project.data.project_members ?? []

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
        <div className={cn('mt-3 h-1 w-16 rounded-full', colorBar[project.data.color])} />
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{project.data.name}</h2>
        {project.data.description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.data.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.map((m) => (
              <Avatar
                key={m.id}
                name={m.profiles?.full_name || m.profiles?.email || '?'}
                className="h-8 w-8 text-[10px]"
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {members.length} member{members.length === 1 ? '' : 's'}
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (inviteEmail.trim()) inviteMember.mutate(inviteEmail.trim())
          }}
          className="ml-auto flex items-center gap-2"
        >
          <Input
            type="email"
            placeholder="teammate@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="secondary" disabled={!inviteEmail.trim() || inviteMember.isPending}>
            {inviteMember.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Invite
          </Button>
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <Kanban projectId={projectId} columns={columns.data ?? []} members={members} />
        <div className="space-y-4">
          <ActivityFeed projectId={projectId} />
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Team</h3>
            <ul className="space-y-2.5">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <Avatar
                    name={m.profiles?.full_name || m.profiles?.email || '?'}
                    className="h-7 w-7 text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {m.profiles?.full_name || m.profiles?.email}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">{m.profiles?.email}</p>
                  </div>
                  <MemberBadge role={m.role} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
