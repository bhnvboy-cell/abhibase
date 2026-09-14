'use client'

import * as React from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { KanbanSquare, Loader2, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import { accentColors, colorBar } from '@/lib/constants'
import type { AccentColor } from '@/lib/types'

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [dialog, setDialog] = React.useState<{
    name: string
    description: string
    color: AccentColor
  } | null>(null)

  const projects = useQuery({ queryKey: ['projects'], queryFn: api.projects.list })

  const createProject = useMutation({
    mutationFn: async (state: { name: string; description: string; color: AccentColor }) => {
      const id = await api.projects.create({
        name: state.name.trim(),
        description: state.description.trim(),
        color: state.color,
      })
      return id
    },
    onSuccess: (id) => {
      toast('Project created')
      setDialog(null)
      qc.invalidateQueries({ queryKey: ['projects'] })
      window.location.href = `/dashboard/projects/${id}`
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ name: '', description: '', color: 'violet' })}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {projects.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : (projects.data ?? []).length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="No projects yet"
          description="Create a board for your team — kanban columns, cards, comments and activity come pre-wired."
          action={
            <Button onClick={() => setDialog({ name: '', description: '', color: 'violet' })}>
              <Plus className="h-4 w-4" />
              Create your first project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(projects.data ?? []).map((project, i) => {
            const members = project.project_members ?? []
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={cn('h-1.5 w-full', colorBar[project.color])} />
                  <div className="p-5">
                    <h3 className="font-semibold tracking-tight group-hover:text-primary">
                      {project.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {project.description || 'No description'}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {members.slice(0, 5).map((m) => (
                          <Avatar
                            key={m.id}
                            name={m.profiles?.full_name || m.profiles?.email || '?'}
                            className="h-7 w-7 text-[10px]"
                          />
                        ))}
                        {members.length > 5 && (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
                            +{members.length - 5}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {members.length} member{members.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title="New project"
        description="A kanban board with Backlog → In Progress → Review → Done is created automatically."
      >
        {dialog && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!dialog.name.trim()) return
              createProject.mutate(dialog)
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                placeholder="Website redesign"
                value={dialog.name}
                onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                rows={3}
                placeholder="What is this project about?"
                value={dialog.description}
                onChange={(e) => setDialog({ ...dialog, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Select
                value={dialog.color}
                onChange={(e) => setDialog({ ...dialog, color: e.target.value as AccentColor })}
              >
                {accentColors.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dialog.name.trim() || createProject.isPending}>
                {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create project
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
