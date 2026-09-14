'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, GitBranch, GitMerge, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'

export default function BranchesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = React.useState(false)
  const [showSnapshot, setShowSnapshot] = React.useState<Record<string, unknown> | null>(null)
  const [newName, setNewName] = React.useState('')
  const [newDesc, setNewDesc] = React.useState('')

  const branches = useQuery({ queryKey: ['branches'], queryFn: api.branches.list })

  const createBranch = useMutation({
    mutationFn: () => api.branches.create({ name: newName, description: newDesc }),
    onSuccess: () => {
      toast('Branch created')
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      qc.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const mergeBranch = useMutation({
    mutationFn: (id: string) => api.branches.merge(id),
    onSuccess: () => {
      toast('Branch merged!')
      qc.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteBranch = useMutation({
    mutationFn: (id: string) => api.branches.remove(id),
    onSuccess: () => {
      toast('Branch deleted')
      qc.invalidateQueries({ queryKey: ['branches'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Branches</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create snapshots of your data and experiment safely.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New branch
        </Button>
      </div>

      {(branches.data ?? []).length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No branches yet"
          description="Branches let you snapshot your data before making big changes. Create your first branch to get started."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create branch
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {(branches.data ?? []).map((branch) => (
            <Card key={branch.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{branch.name}</p>
                    <Badge variant={branch.merged ? 'success' : 'secondary'}>
                      {branch.merged ? 'Merged' : 'Active'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {branch.description || 'No description'} · Created{' '}
                    {new Date(branch.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSnapshot(branch.snapshot)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="View snapshot"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {!branch.merged && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Merge branch "${branch.name}" to main?`))
                          mergeBranch.mutate(branch.id)
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      title="Merge"
                    >
                      <GitMerge className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this branch?'))
                        deleteBranch.mutate(branch.id)
                    }}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate} title="New branch">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g., feature/new-layout"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="Optional description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A snapshot of your current notes, tasks, and habits will be saved.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createBranch.mutate()}
              disabled={!newName.trim() || createBranch.isPending}
            >
              {createBranch.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create branch
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showSnapshot !== null}
        onOpenChange={(open) => !open && setShowSnapshot(null)}
        title="Branch Snapshot"
        className="max-w-lg"
      >
        {showSnapshot && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-2xl font-bold">{(showSnapshot.notes_data as unknown[])?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-2xl font-bold">{(showSnapshot.tasks_data as unknown[])?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-2xl font-bold">{(showSnapshot.habits_data as unknown[])?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Habits</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Snapshot created: {showSnapshot.created_at ? new Date(showSnapshot.created_at as string).toLocaleString() : 'Unknown'}
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowSnapshot(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
