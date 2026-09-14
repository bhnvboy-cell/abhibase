'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, Loader2, MessageSquare, Plus, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import type { Attachment } from '@/components/file-upload'
import { cn, fmtDate, fmtDateTime } from '@/lib/utils'
import type { BoardColumn, Card, ProjectMember } from '@/lib/types'

interface KanbanProps {
  projectId: string
  columns: BoardColumn[]
  members: ProjectMember[]
}

interface CardDialogState {
  card: Card
  title: string
  description: string
  assigneeId: string
  dueDate: string
  attachments: Attachment[]
}

export function Kanban({ projectId, columns, members }: KanbanProps) {
  const qc = useQueryClient()
  const [dragCardId, setDragCardId] = React.useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = React.useState<string | null>(null)
  const [composerCol, setComposerCol] = React.useState<string | null>(null)
  const [composerTitle, setComposerTitle] = React.useState('')
  const [cardDialog, setCardDialog] = React.useState<CardDialogState | null>(null)
  const [newComment, setNewComment] = React.useState('')

  const invalidateCards = () => {
    qc.invalidateQueries({ queryKey: ['cards', projectId] })
    qc.invalidateQueries({ queryKey: ['activity', projectId] })
  }

  const cards = useQuery({
    queryKey: ['cards', projectId],
    queryFn: () => api.projects.cards(projectId),
  })
  const comments = useQuery({
    queryKey: ['comments', cardDialog?.card.id],
    queryFn: () => api.projects.comments(projectId, cardDialog!.card.id),
    enabled: !!cardDialog,
  })

  const allAttachments = useQuery({ queryKey: ['attachments'], queryFn: api.uploads.list })

  const memberName = (userId: string | null) => {
    if (!userId) return 'Unassigned'
    const m = members.find((mm) => mm.user_id === userId)
    return m?.profiles?.full_name || m?.profiles?.email || 'Member'
  }

  const createCard = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      await api.projects.createCard({ project_id: projectId, column_id: columnId, title })
      return title
    },
    onSuccess: () => {
      setComposerTitle('')
      toast('Card added')
      invalidateCards()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const moveCard = useMutation({
    mutationFn: async ({ card, columnId }: { card: Card; columnId: string }) => {
      const all = cards.data ?? []
      const target = all.filter((c) => c.column_id === columnId && c.id !== card.id)
      const position = target.length ? Math.max(...target.map((c) => c.position)) + 1 : 0
      await api.projects.updateCard(projectId, card.id, { column_id: columnId, position })
      return { card, columnId }
    },
    onSuccess: ({ card, columnId }) => {
      invalidateCards()
      void card
      void columnId
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const updateCard = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Card>
    }) => api.projects.updateCard(projectId, id, patch),
    onSuccess: () => {
      toast('Card updated')
      invalidateCards()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteCard = useMutation({
    mutationFn: (id: string) => api.projects.removeCard(projectId, id),
    onSuccess: () => {
      toast('Card deleted')
      setCardDialog(null)
      invalidateCards()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const addComment = useMutation({
    mutationFn: (input: { cardId: string; content: string }) =>
      api.projects.addComment(projectId, input.cardId, input.content),
    onSuccess: (_data, vars) => {
      setNewComment('')
      qc.invalidateQueries({ queryKey: ['comments', vars.cardId] })
      qc.invalidateQueries({ queryKey: ['activity', projectId] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  function handleDrop(columnId: string) {
    setDragOverCol(null)
    if (dragCardId) {
      const card = (cards.data ?? []).find((c) => c.id === dragCardId)
      if (card && card.column_id !== columnId) moveCard.mutate({ card, columnId })
      else if (card) moveCard.mutate({ card, columnId })
      setDragCardId(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const colCards = (cards.data ?? []).filter((c) => c.column_id === col.id)
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverCol(col.id)
              }}
              onDragLeave={() => setDragOverCol((prev) => (prev === col.id ? null : prev))}
              onDrop={() => handleDrop(col.id)}
              className={cn(
                'flex min-h-64 flex-col rounded-xl border bg-muted/30 p-3 transition-colors',
                dragOverCol === col.id && 'border-primary/60 bg-primary/5'
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{col.name}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {colCards.length}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {colCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    draggable
                    onDragStart={() => setDragCardId(card.id)}
                    onDragEnd={() => setDragCardId(null)}
                    onClick={() =>
                      setCardDialog({
                        card,
                        title: card.title,
                        description: card.description,
                        assigneeId: card.assignee_id ?? '',
                        dueDate: card.due_date ?? '',
                        attachments: (allAttachments.data ?? []).filter(() => true),
                      })
                    }
                    className={cn(
                      'cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing',
                      dragCardId === card.id && 'opacity-50'
                    )}
                  >
                    <p className="break-words pr-4 text-sm font-medium">{card.title}</p>
                    {card.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2">
                      {card.due_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDate(card.due_date)}
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {card.assignee_id && (
                          <Avatar name={memberName(card.assignee_id)} className="h-5 w-5 text-[9px]" />
                        )}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {composerCol === col.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (composerTitle.trim()) createCard.mutate({ columnId: col.id, title: composerTitle.trim() })
                  }}
                  className="mt-2"
                >
                  <Input
                    autoFocus
                    placeholder="Card title…"
                    value={composerTitle}
                    onChange={(e) => setComposerTitle(e.target.value)}
                    onBlur={() => !composerTitle && setComposerCol(null)}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button type="submit" size="sm" disabled={!composerTitle.trim()}>
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setComposerCol(null)
                        setComposerTitle('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setComposerCol(col.id)}
                  className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add card
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Dialog
        open={cardDialog !== null}
        onOpenChange={(open) => !open && setCardDialog(null)}
        title={cardDialog?.title || 'Card'}
        className="max-w-xl"
      >
        {cardDialog && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="card-title">Title</Label>
              <Input
                id="card-title"
                value={cardDialog.title}
                onChange={(e) => setCardDialog({ ...cardDialog, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-desc">Description</Label>
              <Textarea
                id="card-desc"
                rows={3}
                placeholder="Add more detail…"
                value={cardDialog.description}
                onChange={(e) => setCardDialog({ ...cardDialog, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select
                  value={cardDialog.assigneeId}
                  onChange={(e) => setCardDialog({ ...cardDialog, assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {m.profiles?.full_name || m.profiles?.email}
                      {m.role === 'owner' ? ' (owner)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-due">Due date</Label>
                <Input
                  id="card-due"
                  type="date"
                  value={cardDialog.dueDate}
                  onChange={(e) => setCardDialog({ ...cardDialog, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Attachments</Label>
              <FileUpload
                attachments={cardDialog.attachments}
                onUpload={(att) =>
                  setCardDialog((prev) =>
                    prev ? { ...prev, attachments: [...prev.attachments, att] } : prev
                  )
                }
                onRemove={(id) =>
                  setCardDialog((prev) =>
                    prev
                      ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== id) }
                      : prev
                  )
                }
              />
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Comments
              </p>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {(comments.data ?? []).length === 0 && (
                  <p className="py-2 text-xs text-muted-foreground">No comments yet.</p>
                )}
                {(comments.data ?? []).map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Avatar
                      name={c.profiles?.full_name || c.profiles?.email || '?'}
                      className="h-6 w-6 text-[9px]"
                    />
                    <div className="min-w-0 flex-1 rounded-lg bg-background px-2.5 py-1.5">
                      <p className="text-xs font-medium">
                        {c.profiles?.full_name || c.profiles?.email || 'Member'}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {fmtDateTime(c.created_at)}
                        </span>
                      </p>
                      <p className="mt-0.5 break-words text-sm">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newComment.trim())
                    addComment.mutate({ cardId: cardDialog.card.id, content: newComment.trim() })
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={!newComment.trim() || addComment.isPending}>
                  Send
                </Button>
              </form>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this card?')) deleteCard.mutate(cardDialog.card.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCardDialog(null)}>
                  <X className="h-4 w-4" />
                  Close
                </Button>
                <Button
                  disabled={updateCard.isPending}
                  onClick={() => {
                    updateCard.mutate(
                      {
                        id: cardDialog.card.id,
                        patch: {
                          title: cardDialog.title.trim() || cardDialog.card.title,
                          description: cardDialog.description,
                          assignee_id: cardDialog.assigneeId || null,
                          due_date: cardDialog.dueDate || null,
                        },
                      },
                      {
                        onSuccess: () => {
                          setCardDialog(null)
                        },
                      }
                    )
                  }}
                >
                  {updateCard.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}

export function ActivityFeed({ projectId }: { projectId: string }) {
  const activity = useQuery({
    queryKey: ['activity', projectId],
    queryFn: () => api.projects.activity(projectId),
  })

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Activity</h3>
      <div className="space-y-3">
        {(activity.data ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        )}
        {(activity.data ?? []).map((a) => (
          <div key={a.id} className="flex items-start gap-2.5">
            <Avatar
              name={a.profiles?.full_name || a.profiles?.email || '?'}
              className="h-6 w-6 text-[9px]"
            />
            <div className="min-w-0">
              <p className="text-xs leading-relaxed">
                <span className="font-medium">{a.profiles?.full_name || 'Someone'}</span>{' '}
                <span className="text-muted-foreground">{a.action}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">{fmtDateTime(a.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MemberBadge({ role }: { role: string }) {
  if (role === 'owner') return <Badge variant="default">owner</Badge>
  if (role === 'viewer') return <Badge variant="secondary">viewer</Badge>
  return <Badge variant="info">editor</Badge>
}
