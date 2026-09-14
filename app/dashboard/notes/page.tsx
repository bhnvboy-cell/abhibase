'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, NotebookPen, Pin, PinOff, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/empty-state'
import { FileUpload } from '@/components/file-upload'
import type { Attachment } from '@/components/file-upload'
import { fmtDateTime } from '@/lib/utils'
import type { Note } from '@/lib/types'

interface EditorState {
  id: string | null
  title: string
  content: string
  tags: string
  summary: string | null
  attachments: Attachment[]
}

const blankEditor: EditorState = { id: null, title: '', content: '', tags: '', summary: null, attachments: [] }

export default function NotesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [editor, setEditor] = React.useState<EditorState | null>(null)
  const [summarizing, setSummarizing] = React.useState(false)

  const notes = useQuery({ queryKey: ['notes'], queryFn: api.notes.list })
  const allAttachments = useQuery({ queryKey: ['attachments'], queryFn: api.uploads.list })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notes'] })

  const saveNote = useMutation({
    mutationFn: async (state: EditorState) => {
      const tags = state.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
      if (state.id) {
        await api.notes.update(state.id, {
          title: state.title.trim() || 'Untitled',
          content: state.content,
          tags,
        })
      } else {
        await api.notes.create({
          title: state.title.trim() || 'Untitled',
          content: state.content,
          tags,
        })
      }
    },
    onSuccess: () => {
      toast(editor?.id ? 'Note updated' : 'Note created')
      setEditor(null)
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.notes.remove(id),
    onSuccess: () => {
      toast('Note deleted')
      invalidate()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const togglePin = useMutation({
    mutationFn: (note: Note) => api.notes.update(note.id, { pinned: !note.pinned }),
    onSuccess: invalidate,
    onError: (e: Error) => toast(e.message, 'error'),
  })

  async function handleSummarize() {
    if (!editor?.content.trim()) {
      toast('Write something first', 'info')
      return
    }
    setSummarizing(true)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Summarization failed')
      setEditor((prev) =>
        prev
          ? {
              ...prev,
              summary: data.summary,
              tags: data.tags?.length && !prev.tags ? data.tags.join(', ') : prev.tags,
            }
          : prev
      )
      toast(data.mocked ? 'Summary ready (offline mode)' : 'AI summary ready')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setSummarizing(false)
    }
  }

  const filtered = (notes.data ?? []).filter((n) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.includes(q))
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes and tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setEditor({ ...blankEditor })}>
          <Plus className="h-4 w-4" />
          New note
        </Button>
      </div>

      {notes.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={search ? 'No matching notes' : 'No notes yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Capture ideas, meeting notes, or journal entries. AI can summarize them for you.'
          }
          action={
            !search && (
              <Button onClick={() => setEditor({ ...blankEditor })}>
                <Plus className="h-4 w-4" />
                Create your first note
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note, i) => (
            <motion.article
              key={note.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="group flex cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              onClick={() =>
                setEditor({
                  id: note.id,
                  title: note.title,
                  content: note.content,
                  tags: note.tags.join(', '),
                  summary: note.summary,
                  attachments: (allAttachments.data ?? []).filter(
                    (a) => true
                  ),
                })
              }
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 truncate font-medium">{note.title}</h3>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    title={note.pinned ? 'Unpin' : 'Pin'}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin.mutate(note)
                    }}
                  >
                    {note.pinned ? (
                      <Pin className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <PinOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${note.title}"?`)) deleteNote.mutate(note.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {note.content || 'Empty note'}
              </p>
              {note.summary && (
                <p className="mt-3 line-clamp-3 rounded-lg bg-primary/5 p-2.5 text-xs italic leading-relaxed text-muted-foreground">
                  <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                  {note.summary}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {note.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary">
                    #{t}
                  </Badge>
                ))}
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {fmtDateTime(note.updated_at)}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        title={editor?.id ? 'Edit note' : 'New note'}
        description="Write freely — the AI summarizer lives in the toolbar."
      >
        {editor && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                placeholder="Untitled"
                value={editor.title}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="note-content">Content</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Summarize with AI
                </Button>
              </div>
              <Textarea
                id="note-content"
                rows={8}
                placeholder="Start typing…"
                value={editor.content}
                onChange={(e) => setEditor({ ...editor, content: e.target.value })}
              />
            </div>
            {editor.summary && (
              <div className="rounded-lg bg-primary/10 p-3 text-sm leading-relaxed">
                <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" /> AI Summary
                </p>
                <p>{editor.summary}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="note-tags">Tags</Label>
              <Input
                id="note-tags"
                placeholder="ideas, work, personal"
                value={editor.tags}
                onChange={(e) => setEditor({ ...editor, tags: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Attachments</Label>
              <FileUpload
                attachments={editor.attachments}
                onUpload={(att) =>
                  setEditor((prev) =>
                    prev ? { ...prev, attachments: [...prev.attachments, att] } : prev
                  )
                }
                onRemove={(id) =>
                  setEditor((prev) =>
                    prev
                      ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== id) }
                      : prev
                  )
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditor(null)}>
                Cancel
              </Button>
              <Button onClick={() => saveNote.mutate(editor)} disabled={saveNote.isPending}>
                {saveNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save note
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
