'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Mail, Bell, Save, Key, Trash2, ExternalLink, Plus } from 'lucide-react'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'

interface ApiKey {
  id: string
  provider: string
  api_key_masked: string
  has_key: boolean
  created_at: string
  updated_at: string
}

const PROVIDERS = [
  { id: 'groq', name: 'Groq', url: 'https://console.groq.com', description: 'Fastest free LLM inference', color: '#22c55e' },
  { id: 'mistral', name: 'Mistral AI', url: 'https://console.mistral.ai', description: 'Free Experiment plan with 1B tokens/month', color: '#f59e0b' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://aistudio.google.com', description: 'Free tier with Gemini Flash models', color: '#3b82f6' },
  { id: 'openai', name: 'OpenAI', url: 'https://platform.openai.com', description: 'GPT models (paid, but has trial credits)', color: '#8b5cf6' },
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai', description: 'Access multiple models with one key', color: '#ef4444' },
]

export default function SettingsPage() {
  const qc = useQueryClient()
  const [prefs, setPrefs] = React.useState({
    email_tasks: true,
    email_habits: true,
    email_events: true,
    email_projects: true,
    reminder_minutes_before: 30,
  })
  const [showAddKey, setShowAddKey] = React.useState(false)
  const [newKeyProvider, setNewKeyProvider] = React.useState('groq')
  const [newKeyValue, setNewKeyValue] = React.useState('')

  const { data: prefsData, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/settings/notifications')
      const data = await res.json()
      return data.preferences
    },
  })

  const { data: keysData, isLoading: keysLoading } = useQuery({
    queryKey: ['user-api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/settings/api-keys')
      const data = await res.json()
      return data.keys as ApiKey[]
    },
  })

  React.useEffect(() => {
    if (prefsData) {
      setPrefs({
        email_tasks: prefsData.email_tasks,
        email_habits: prefsData.email_habits,
        email_events: prefsData.email_events,
        email_projects: prefsData.email_projects,
        reminder_minutes_before: prefsData.reminder_minutes_before,
      })
    }
  }, [prefsData])

  const savePrefs = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error('Failed to save')
    },
    onSuccess: () => {
      toast('Settings saved')
      qc.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const addApiKey = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newKeyProvider, api_key: newKeyValue }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
    },
    onSuccess: () => {
      toast('API key saved')
      setShowAddKey(false)
      setNewKeyValue('')
      qc.invalidateQueries({ queryKey: ['user-api-keys'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/api-keys?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      toast('API key deleted')
      qc.invalidateQueries({ queryKey: ['user-api-keys'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const userKeys = keysData ?? []
  const savedProviders = userKeys.map((k) => k.provider)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your preferences, API keys, and notifications.
        </p>
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                AI API Keys
              </CardTitle>
              <CardDescription>
                Add your own free API keys to power AI features. All providers offer free tiers with no credit card.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddKey(true)}>
              <Plus className="h-4 w-4" />
              Add key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : userKeys.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Key className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No API keys added yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a free API key to enable AI-powered features like chat, note summarization, and smart suggestions.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setShowAddKey(true)}>
                <Plus className="h-4 w-4" />
                Add your first key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userKeys.map((key) => {
                const provider = PROVIDERS.find((p) => p.id === key.provider)
                return (
                  <div
                    key={key.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm"
                      style={{ backgroundColor: provider?.color || '#6b7280' }}
                    >
                      {provider?.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{provider?.name || key.provider}</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {key.api_key_masked}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete ${provider?.name} API key?`))
                          deleteApiKey.mutate(key.id)
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which emails you want to receive from AbhiBase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-tasks">Task reminders</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when tasks are due or overdue
              </p>
            </div>
            <input
              id="email-tasks"
              type="checkbox"
              checked={prefs.email_tasks}
              onChange={(e) => setPrefs({ ...prefs, email_tasks: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-habits">Habit reminders</Label>
              <p className="text-xs text-muted-foreground">
                Daily reminders to check in on your habits
              </p>
            </div>
            <input
              id="email-habits"
              type="checkbox"
              checked={prefs.email_habits}
              onChange={(e) => setPrefs({ ...prefs, email_habits: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-events">Event reminders</Label>
              <p className="text-xs text-muted-foreground">
                Reminders before upcoming events
              </p>
            </div>
            <input
              id="email-events"
              type="checkbox"
              checked={prefs.email_events}
              onChange={(e) => setPrefs({ ...prefs, email_events: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-projects">Project updates</Label>
              <p className="text-xs text-muted-foreground">
                Notifications for project activity
              </p>
            </div>
            <input
              id="email-projects"
              type="checkbox"
              checked={prefs.email_projects}
              onChange={(e) => setPrefs({ ...prefs, email_projects: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Timing
          </CardTitle>
          <CardDescription>
            How far in advance should we remind you about upcoming tasks and events?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Remind me before</Label>
            <select
              id="reminder-time"
              value={prefs.reminder_minutes_before}
              onChange={(e) =>
                setPrefs({ ...prefs, reminder_minutes_before: Number(e.target.value) })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={1440}>1 day</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => savePrefs.mutate()} disabled={savePrefs.isPending}>
          {savePrefs.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save settings
        </Button>
      </div>

      {/* Add API Key Dialog */}
      <Dialog open={showAddKey} onOpenChange={setShowAddKey} title="Add API Key">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setNewKeyProvider(p.id)}
                  disabled={savedProviders.includes(p.id)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                    newKeyProvider === p.id
                      ? 'border-primary bg-primary/5'
                      : savedProviders.includes(p.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded font-bold text-white text-xs"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>API Key</Label>
              <a
                href={PROVIDERS.find((p) => p.id === newKeyProvider)?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Get free key
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input
              type="password"
              placeholder="Paste your API key here..."
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Your key is stored securely in the database. It is only used for AI features in this app.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowAddKey(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addApiKey.mutate()}
              disabled={!newKeyValue.trim() || addApiKey.isPending}
            >
              {addApiKey.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save key
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
