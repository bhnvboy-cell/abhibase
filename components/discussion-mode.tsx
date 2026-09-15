'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface DiscussionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface DiscussionNote {
  id: string;
  title: string;
  content: string;
  ideas: string[];
  created_at: string;
}

interface DiscussionTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  created: boolean;
}

export function DiscussionMode() {
  const [messages, setMessages] = useState<DiscussionMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to Discussion Mode! This is a sandbox for brainstorming and planning. No credits are consumed here. Feel free to explore ideas freely.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<DiscussionNote[]>([]);
  const [tasks, setTasks] = useState<DiscussionTask[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'tasks'>('chat');
  const [showSaveNote, setShowSaveNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: DiscussionMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await api.ai.discussion({
        messages: newMessages.map(m => ({ role: m.role === 'system' ? 'assistant' : m.role, content: m.content })),
      });

      const assistantMsg: DiscussionMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, assistantMsg]);
    } catch (error) {
      const errorMsg: DiscussionMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = () => {
    const allContent = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n\n');

    const newNote: DiscussionNote = {
      id: `note-${Date.now()}`,
      title: noteTitle || `Discussion ${new Date().toLocaleDateString('en-IN')}`,
      content: allContent,
      ideas: extractIdeas(allContent),
      created_at: new Date().toISOString(),
    };

    setNotes([...notes, newNote]);
    setShowSaveNote(false);
    setNoteTitle('');
  };

  const extractIdeas = (content: string): string[] => {
    const ideas: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        ideas.push(trimmed.replace(/^[-*•]\s*/, ''));
      }
    }
    return ideas.slice(0, 10);
  };

  const convertToTask = (idea: string) => {
    const newTask: DiscussionTask = {
      id: `task-${Date.now()}`,
      title: idea,
      description: `Converted from discussion note`,
      priority: 'medium',
      created: false,
    };
    setTasks([...tasks, newTask]);
  };

  const createTaskFromDiscussion = async (task: DiscussionTask) => {
    try {
      await api.tasks.create({
        title: task.title,
        priority: task.priority,
        due_date: null,
      });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, created: true } : t));
    } catch (error) {
      console.error('Failed to create task');
    }
  };

  const clearDiscussion = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: 'Discussion cleared. Start brainstorming again!',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discussion Mode</h2>
          <p className="text-sm text-zinc-400 mt-1">Brainstorm freely — no credits consumed</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearDiscussion}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Clear Chat
          </button>
          <button
            onClick={() => setShowSaveNote(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Save Notes
          </button>
        </div>
      </div>

      {/* Credit Consumption Indicator */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <div>
          <p className="text-sm font-medium text-emerald-400">Free Mode Active</p>
          <p className="text-xs text-zinc-400">This discussion does not consume any AI credits. Brainstorm as much as you want!</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'chat', label: 'Discussion', count: messages.filter(m => m.role !== 'system').length },
          { id: 'notes', label: 'Saved Notes', count: notes.length },
          { id: 'tasks', label: 'Tasks', count: tasks.filter(t => !t.created).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 bg-zinc-700 px-1.5 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chat View */}
      {activeTab === 'chat' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div
            ref={scrollRef}
            className="h-[500px] overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : msg.role === 'system'
                      ? 'bg-zinc-800 text-zinc-300 text-center'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] mt-1 opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Discuss ideas, ask questions, brainstorm..."
                disabled={loading}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notes View */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <span className="text-4xl">📝</span>
              <p className="mt-3 text-zinc-400">No saved notes yet. Save your discussions to reference later.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold">{note.title}</h3>
                  <span className="text-xs text-zinc-500">
                    {new Date(note.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                {note.ideas.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-zinc-400 mb-1.5">Key Ideas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {note.ideas.map((idea, i) => (
                        <button
                          key={i}
                          onClick={() => convertToTask(idea)}
                          className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-xs text-zinc-300 transition-colors"
                          title="Click to convert to task"
                        >
                          + {idea.length > 40 ? idea.slice(0, 40) + '...' : idea}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <details className="group">
                  <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-300">
                    Show full discussion
                  </summary>
                  <div className="mt-2 bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {note.content}
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tasks View */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <span className="text-4xl">✅</span>
              <p className="mt-3 text-zinc-400">No tasks yet. Convert discussion ideas into actionable tasks.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-zinc-900/50 border rounded-xl p-4 flex items-center justify-between ${
                  task.created ? 'border-emerald-500/20' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${task.created ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {task.created ? '✅' : '⬜'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${task.created ? 'text-zinc-500 line-through' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-zinc-500">{task.description}</p>
                  </div>
                </div>
                {!task.created && (
                  <button
                    onClick={() => createTaskFromDiscussion(task)}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Create Task
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Save Note Modal */}
      {showSaveNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Save Discussion Notes</h2>
                <button onClick={() => setShowSaveNote(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Discussion notes..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  This will save the entire discussion and extract any bullet-point ideas.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSaveNote(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 py-2 rounded-lg text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
