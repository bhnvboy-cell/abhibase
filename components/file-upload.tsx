'use client'

import * as React from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Attachment {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  created_at: string
}

interface FileUploadProps {
  attachments: Attachment[]
  onUpload: (attachment: Attachment) => void
  onRemove: (id: string) => void
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text')) return FileText
  return File
}

export function FileUpload({ attachments, onUpload, onRemove, className }: FileUploadProps) {
  const [dragging, setDragging] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      const { attachment } = await res.json()
      onUpload(attachment)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Uploading...' : 'Drop a file or click to upload'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Max 10MB - Images, PDFs, Documents
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept="image/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.zip"
      />

      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att) => {
            const Icon = fileIcon(att.mime_type)
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{att.original_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(att.size)}
                  </p>
                </div>
                <a
                  href={`/uploads/${att.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(att.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export type { Attachment }
