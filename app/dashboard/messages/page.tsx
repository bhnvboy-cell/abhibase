'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Mail, Send, Inbox, Star, Trash2, Search, Plus } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  subject: string
  content: string
  is_read: boolean
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [newMessage, setNewMessage] = useState({ to: '', subject: '', content: '' })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const data = await api.messages.inbox.list()
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.to || !newMessage.content) return
    
    try {
      await api.messages.inbox.send({
        receiver_email: newMessage.to,
        subject: newMessage.subject,
        content: newMessage.content
      })
      setShowCompose(false)
      setNewMessage({ to: '', subject: '', content: '' })
      loadMessages()
    } catch (error) {
      alert('Failed to send message')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.messages.inbox.markRead(id)
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch (error) {
      console.error('Failed to mark as read')
    }
  }

  const deleteMessage = async (id: string) => {
    try {
      await api.messages.inbox.delete(id)
      setMessages(messages.filter(m => m.id !== id))
      setSelectedMessage(null)
    } catch (error) {
      alert('Failed to delete message')
    }
  }

  const filteredMessages = messages.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 p-4">
        <button
          onClick={() => setShowCompose(true)}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>

        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50 text-white">
            <Inbox className="w-4 h-4" />
            Inbox
            {unreadCount > 0 && (
              <span className="ml-auto bg-violet-600 text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400">
            <Star className="w-4 h-4" />
            Starred
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400">
            <Trash2 className="w-4 h-4" />
            Trash
          </button>
        </nav>
      </div>

      {/* Message List */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
              <Mail className="w-8 h-8 mb-2" />
              <p className="text-sm">No messages</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message)
                  if (!message.is_read) markAsRead(message.id)
                }}
                className={`w-full text-left p-3 border-b border-zinc-800 hover:bg-zinc-800/50 ${
                  selectedMessage?.id === message.id ? 'bg-zinc-800/50' : ''
                } ${!message.is_read ? 'border-l-2 border-l-violet-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${!message.is_read ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                    {message.subject || 'No subject'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{message.content}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {new Date(message.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedMessage.subject || 'No subject'}</h2>
                <p className="text-sm text-zinc-500">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteMessage(selectedMessage.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-zinc-300 whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a message to read</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-semibold">New Message</h3>
              <button onClick={() => setShowCompose(false)} className="text-zinc-400 hover:text-white">×</button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="email"
                placeholder="To:"
                value={newMessage.to}
                onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
              />
              <input
                type="text"
                placeholder="Subject:"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
              />
              <textarea
                placeholder="Message..."
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
