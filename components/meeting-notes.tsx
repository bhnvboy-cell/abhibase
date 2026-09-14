'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  attendees: string[];
  notes: string;
  action_items: ActionItem[];
  summary?: string;
  platform?: 'zoom' | 'google-meet' | 'teams' | 'other';
}

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  due_date?: string;
  completed: boolean;
}

export function MeetingNotes() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const data = await api.meetings.list();
      setMeetings(data);
    } catch (error) {
      console.error('Failed to load meetings');
    }
  };

  const summarizeMeeting = async (meeting: Meeting) => {
    setIsSummarizing(true);
    try {
      const response = await api.ai.chat({
        messages: [{
          role: 'user',
          content: `Summarize this meeting and extract action items:\n\n${meeting.notes}\n\nReturn JSON: { "summary": "brief summary", "action_items": [{ "task": "task description", "assignee": "name" }] }`
        }],
        system: 'You are a meeting assistant. Extract key points and action items from meeting notes.'
      });

      const parsed = JSON.parse(response.content);
      
      await api.meetings.update(meeting.id, {
        summary: parsed.summary,
        action_items: parsed.action_items.map((item: any, i: number) => ({
          id: `action-${Date.now()}-${i}`,
          ...item,
          completed: false
        }))
      });

      loadMeetings();
    } catch (error) {
      console.error('Failed to summarize meeting');
    } finally {
      setIsSummarizing(false);
    }
  };

  const toggleActionItem = async (meetingId: string, actionId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const updatedItems = meeting.action_items.map(item =>
      item.id === actionId ? { ...item, completed: !item.completed } : item
    );

    await api.meetings.update(meetingId, { action_items: updatedItems });
    loadMeetings();
  };

  const getPlatformIcon = (platform?: string) => {
    const icons: Record<string, string> = {
      zoom: '📹',
      'google-meet': '🎥',
      teams: '👥',
      other: '📞'
    };
    return icons[platform || 'other'] || '📞';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meeting Notes</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg"
        >
          + New Meeting
        </button>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-zinc-400 mb-2">No meetings yet</p>
          <p className="text-sm text-zinc-500">Add meeting notes to track discussions and action items</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => setSelectedMeeting(meeting)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformIcon(meeting.platform)}</span>
                  <div>
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <p className="text-sm text-zinc-400">
                      {new Date(meeting.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {meeting.duration > 0 && ` • ${meeting.duration} min`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    summarizeMeeting(meeting);
                  }}
                  disabled={isSummarizing}
                  className="text-violet-400 hover:text-violet-300 text-sm disabled:opacity-50"
                >
                  {isSummarizing ? '⏳' : '✨'} Summarize
                </button>
              </div>

              {/* Attendees */}
              {meeting.attendees.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {meeting.attendees.map((attendee, i) => (
                    <span key={i} className="bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300">
                      {attendee}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes Preview */}
              <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{meeting.notes}</p>

              {/* Summary */}
              {meeting.summary && (
                <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-violet-400 mb-1">Summary</p>
                  <p className="text-sm">{meeting.summary}</p>
                </div>
              )}

              {/* Action Items Preview */}
              {meeting.action_items.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span>✅</span>
                  <span>
                    {meeting.action_items.filter(i => i.completed).length}/{meeting.action_items.length} tasks completed
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={loadMeetings}
          onToggleItem={toggleActionItem}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateMeetingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadMeetings();
          }}
        />
      )}
    </div>
  );
}

function MeetingDetailModal({ 
  meeting, 
  onClose, 
  onUpdate,
  onToggleItem 
}: { 
  meeting: Meeting; 
  onClose: () => void;
  onUpdate: () => void;
  onToggleItem: (meetingId: string, actionId: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{meeting.title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-6">
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>📅 {new Date(meeting.date).toLocaleDateString('en-IN')}</span>
              <span>⏱️ {meeting.duration} min</span>
              <span>👥 {meeting.attendees.length} attendees</span>
            </div>

            {/* Attendees */}
            <div>
              <h4 className="text-sm text-zinc-400 mb-2">Attendees</h4>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map((attendee, i) => (
                  <span key={i} className="bg-zinc-800 px-3 py-1 rounded-full text-sm">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary */}
            {meeting.summary && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                <h4 className="text-sm text-violet-400 mb-2">📝 Summary</h4>
                <p className="text-sm">{meeting.summary}</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <h4 className="text-sm text-zinc-400 mb-2">Notes</h4>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {meeting.notes}
              </div>
            </div>

            {/* Action Items */}
            {meeting.action_items.length > 0 && (
              <div>
                <h4 className="text-sm text-zinc-400 mb-2">✅ Action Items</h4>
                <div className="space-y-2">
                  {meeting.action_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <button
                        onClick={() => onToggleItem(meeting.id, item.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          item.completed
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                      >
                        {item.completed && '✓'}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? 'line-through text-zinc-500' : ''}`}>
                          {item.task}
                        </p>
                        <p className="text-xs text-zinc-400">{item.assignee}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateMeetingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    duration: 30,
    attendees: '',
    notes: '',
    platform: 'other' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.meetings.create({
        ...form,
        attendees: form.attendees.split(',').map(a => a.trim()).filter(Boolean),
        action_items: []
      });
      onCreated();
    } catch (error) {
      console.error('Failed to create meeting');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">New Meeting</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
              >
                <option value="zoom">📹 Zoom</option>
                <option value="google-meet">🎥 Google Meet</option>
                <option value="teams">👥 Microsoft Teams</option>
                <option value="other">📞 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Attendees (comma-separated)</label>
              <input
                type="text"
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                placeholder="John, Jane, Bob"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500 resize-none"
                placeholder="Meeting notes, discussion points, decisions made..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 py-2 rounded-lg">
                Create Meeting
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
