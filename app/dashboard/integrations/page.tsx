'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, Puzzle, Webhook, MessageSquare } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'

const PROVIDERS = [
  { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Send notifications to Slack channels' },
  { id: 'discord', name: 'Discord', icon: MessageSquare, description: 'Send notifications to Discord channels' },
  { id: 'telegram', name: 'Telegram', icon: MessageSquare, description: 'Send notifications via Telegram' },
  { id: 'google', name: 'Google Calendar', icon: Puzzle, description: 'Sync events with Google Calendar' },
]

export default function IntegrationsPage() {
  const qc = useQueryClient()
  const [showConnect, setShowConnect] = React.useState(false)
  const [selectedProvider, setSelectedProvider] = React.useState('slack')
  const [webhookUrl, setWebhookUrl] = React.useState('')
  const [channel, setChannel] = React.useState('')

  const integrations = useQuery({ queryKey: ['integrations'], queryFn: api.integrations.list })

  const connectIntegration = useMutation({
    mutationFn: () =>
      api.integrations.connect(selectedProvider, {
        webhook_url: webhookUrl,
        channel,
      }),
    onSuccess: () => {
      toast('Integration connected')
      setShowConnect(false)
      setWebhookUrl('')
      setChannel('')
      qc.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const disconnectIntegration = useMutation({
    mutationFn: (id: string) => api.integrations.disconnect(id),
    onSuccess: () => {
      toast('Integration disconnected')
      qc.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const connectedProviders = (integrations.data ?? []).map((i) => i.provider)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Integrations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect AbhiBase with your favorite tools.
          </p>
        </div>
        <Button onClick={() => setShowConnect(true)}>
          <Plus className="h-4 w-4" />
          Connect
        </Button>
      </div>

      {(integrations.data ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Connected</h3>
          {(integrations.data ?? []).map((integration) => {
            const provider = PROVIDERS.find((p) => p.id === integration.provider)
            return (
              <Card key={integration.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {provider?.icon && <provider.icon className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{provider?.name ?? integration.provider}</p>
                    <p className="text-sm text-muted-foreground">
                      {integration.config?.webhook_url
                        ? `Webhook configured`
                        : `Connected on ${new Date(integration.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge variant={integration.enabled ? 'success' : 'secondary'}>
                    {integration.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Disconnect this integration?'))
                        disconnectIntegration.mutate(integration.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Available</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROVIDERS.filter((p) => !connectedProviders.includes(p.id)).map((provider) => (
            <Card
              key={provider.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => {
                setSelectedProvider(provider.id)
                setShowConnect(true)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <provider.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {provider.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {(integrations.data ?? []).length === 0 && PROVIDERS.every((p) => connectedProviders.includes(p.id)) && (
        <EmptyState
          icon={Puzzle}
          title="All integrations connected"
          description="You've connected all available integrations."
        />
      )}

      <Dialog open={showConnect} onOpenChange={setShowConnect} title={`Connect ${PROVIDERS.find((p) => p.id === selectedProvider)?.name}`}>
        <div className="space-y-4">
          {(selectedProvider === 'slack' || selectedProvider === 'discord') && (
            <>
              <div className="space-y-1.5">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Channel (optional)</Label>
                <Input
                  placeholder="#general"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                />
              </div>
            </>
          )}
          {selectedProvider === 'telegram' && (
            <div className="space-y-1.5">
              <Label>Bot Token</Label>
              <Input
                placeholder="123456:ABC-..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
          )}
          {selectedProvider === 'google' && (
            <p className="text-sm text-muted-foreground">
              Google Calendar integration requires OAuth setup. This feature is coming soon.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowConnect(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => connectIntegration.mutate()}
              disabled={connectIntegration.isPending}
            >
              {connectIntegration.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
