'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, Zap, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'

const TRIGGER_TYPES = [
  { value: 'task_overdue', label: 'Task is overdue' },
  { value: 'habit_missed', label: 'Habit missed today' },
  { value: 'event_upcoming', label: 'Event coming up' },
  { value: 'scheduled', label: 'Scheduled (daily)' },
]

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send email notification' },
  { value: 'create_task', label: 'Create a task' },
  { value: 'create_notification', label: 'Create in-app notification' },
]

export default function AutomationsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [newTrigger, setNewTrigger] = React.useState('task_overdue')
  const [newAction, setNewAction] = React.useState('send_email')

  const automations = useQuery({ queryKey: ['automations'], queryFn: api.automations.list })

  const createAutomation = useMutation({
    mutationFn: () =>
      api.automations.create({
        name: newName,
        trigger_type: newTrigger,
        trigger_config: {},
        action_type: newAction,
        action_config: {},
      }),
    onSuccess: () => {
      toast('Automation created')
      setShowCreate(false)
      setNewName('')
      qc.invalidateQueries({ queryKey: ['automations'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const toggleAutomation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.automations.update(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteAutomation = useMutation({
    mutationFn: (id: string) => api.automations.remove(id),
    onSuccess: () => {
      toast('Automation deleted')
      qc.invalidateQueries({ queryKey: ['automations'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const getTriggerLabel = (type: string) =>
    TRIGGER_TYPES.find((t) => t.value === type)?.label ?? type

  const getActionLabel = (type: string) =>
    ACTION_TYPES.find((a) => a.value === type)?.label ?? type

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Automations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create rules that trigger actions automatically.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New automation
        </Button>
      </div>

      {(automations.data ?? []).length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          description="Automations let you automate repetitive tasks. Create your first one to get started."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create automation
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {(automations.data ?? []).map((auto) => (
            <Card key={auto.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{auto.name}</p>
                    <Badge variant={auto.enabled ? 'success' : 'secondary'}>
                      {auto.enabled ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    When <strong>{getTriggerLabel(auto.trigger_type)}</strong> →{' '}
                    <strong>{getActionLabel(auto.action_type)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      toggleAutomation.mutate({ id: auto.id, enabled: !auto.enabled })
                    }
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={auto.enabled ? 'Pause' : 'Enable'}
                  >
                    {auto.enabled ? (
                      <ToggleRight className="h-5 w-5 text-primary" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this automation?'))
                        deleteAutomation.mutate(auto.id)
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

      <Dialog open={showCreate} onOpenChange={setShowCreate} title="New automation">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Daily task reminder"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Trigger</Label>
            <Select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}>
              {TRIGGER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Action</Label>
            <Select value={newAction} onChange={(e) => setNewAction(e.target.value)}>
              {ACTION_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createAutomation.mutate()}
              disabled={!newName.trim() || createAutomation.isPending}
            >
              {createAutomation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
