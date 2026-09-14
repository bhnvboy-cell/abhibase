'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, Tag, Copy } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'

const CATEGORIES = ['general', 'task', 'note', 'project', 'meeting', 'weekly-review']

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [newDesc, setNewDesc] = React.useState('')
  const [newCategory, setNewCategory] = React.useState('general')
  const [newType, setNewType] = React.useState('task')
  const [newData, setNewData] = React.useState('')

  const templates = useQuery({ queryKey: ['templates'], queryFn: api.templates.list })

  const createTemplate = useMutation({
    mutationFn: () => {
      let data: Record<string, unknown> = { type: newType }
      try {
        if (newData.trim()) {
          data = { ...data, ...JSON.parse(newData) }
        }
      } catch {}
      return api.templates.create({
        name: newName,
        description: newDesc,
        category: newCategory,
        data,
      })
    },
    onSuccess: () => {
      toast('Template created')
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      setNewData('')
      qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const applyTemplate = useMutation({
    mutationFn: (id: string) => api.templates.apply(id),
    onSuccess: () => {
      toast('Template applied!')
      qc.invalidateQueries({ queryKey: ['templates'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.templates.remove(id),
    onSuccess: () => {
      toast('Template deleted')
      qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable templates for tasks, notes, and projects.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New template
        </Button>
      </div>

      {(templates.data ?? []).length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No templates yet"
          description="Create templates to quickly generate recurring tasks, notes, or projects."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create template
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(templates.data ?? []).map((tpl) => (
            <Card key={tpl.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <Badge variant="secondary">{tpl.category}</Badge>
                </div>
                {tpl.description && (
                  <p className="text-sm text-muted-foreground">{tpl.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Used {tpl.use_count} time{tpl.use_count !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyTemplate.mutate(tpl.id)}
                      disabled={applyTemplate.isPending}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this template?'))
                          deleteTemplate.mutate(tpl.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate} title="New template">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Weekly review"
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="task">Task</option>
                <option value="note">Note</option>
                <option value="project">Project</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Data (JSON)</Label>
            <Textarea
              rows={4}
              placeholder='{"title": "My task", "priority": "high"}'
              value={newData}
              onChange={(e) => setNewData(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTemplate.mutate()}
              disabled={!newName.trim() || createTemplate.isPending}
            >
              {createTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
