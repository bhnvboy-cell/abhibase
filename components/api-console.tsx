'use client';

import { useState } from 'react';

/* ──────── TYPES ──────── */
interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  url: string;
  headers: Record<string, string>;
  body: string;
  saved: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: string;
  headers: Record<string, string>;
  body: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PATCH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const SAMPLE_ENDPOINTS = [
  { name: 'List Notes', method: 'GET' as const, url: '/api/notes' },
  { name: 'Create Note', method: 'POST' as const, url: '/api/notes' },
  { name: 'List Tasks', method: 'GET' as const, url: '/api/tasks' },
  { name: 'Create Task', method: 'POST' as const, url: '/api/tasks' },
  { name: 'List Habits', method: 'GET' as const, url: '/api/habits' },
  { name: 'Get Health', method: 'GET' as const, url: '/api/health' },
  { name: 'List Projects', method: 'GET' as const, url: '/api/projects' },
  { name: 'AI Chat', method: 'POST' as const, url: '/api/ai/chat' },
  { name: 'List Expenses', method: 'GET' as const, url: '/api/expenses' },
  { name: 'List Events', method: 'GET' as const, url: '/api/events' },
];

const SAMPLE_RESPONSES: Record<string, ApiResponse> = {
  'GET /api/notes': { status: 200, statusText: 'OK', time: 45, size: '1.2 KB', headers: { 'content-type': 'application/json', 'x-request-id': 'abc123' }, body: JSON.stringify({ notes: [{ id: '1', title: 'Meeting Notes', content: 'Discussed Q4 roadmap...', tags: ['work', 'planning'], created_at: '2026-09-15T10:00:00Z' }, { id: '2', title: 'Ideas', content: 'New feature ideas...', tags: ['creative'], created_at: '2026-09-14T15:30:00Z' }], total: 2 }, null, 2) },
  'POST /api/notes': { status: 201, statusText: 'Created', time: 120, size: '0.3 KB', headers: { 'content-type': 'application/json', 'location': '/api/notes/3' }, body: JSON.stringify({ id: '3', title: 'New Note', content: 'Created successfully', created_at: '2026-09-15T12:00:00Z' }, null, 2) },
  'GET /api/tasks': { status: 200, statusText: 'OK', time: 38, size: '2.1 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tasks: [{ id: '1', title: 'Design homepage', status: 'in_progress', priority: 'high', due_date: '2026-09-20' }, { id: '2', title: 'Write tests', status: 'todo', priority: 'medium', due_date: '2026-09-22' }, { id: '3', title: 'Fix auth bug', status: 'done', priority: 'high', due_date: '2026-09-14' }], total: 3 }, null, 2) },
  'POST /api/tasks': { status: 201, statusText: 'Created', time: 95, size: '0.4 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: '4', title: 'New Task', status: 'todo', created_at: '2026-09-15T12:00:00Z' }, null, 2) },
  'GET /api/habits': { status: 200, statusText: 'OK', time: 32, size: '0.8 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ habits: [{ id: '1', name: 'Morning Run', frequency: 'daily', streak: 12, last_completed: '2026-09-15' }, { id: '2', name: 'Read 30min', frequency: 'daily', streak: 8, last_completed: '2026-09-14' }], total: 2 }, null, 2) },
  'GET /api/health': { status: 200, statusText: 'OK', time: 5, size: '0.2 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'healthy', database: 'connected', uptime: '3d 14h 22m', memory: '142MB', version: '1.0.0' }, null, 2) },
  'GET /api/projects': { status: 200, statusText: 'OK', time: 42, size: '1.5 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projects: [{ id: '1', name: 'Website Redesign', members: 3, tasks: 12 }, { id: '2', name: 'Mobile App', members: 5, tasks: 24 }], total: 2 }, null, 2) },
  'POST /api/ai/chat': { status: 200, statusText: 'OK', time: 1250, size: '0.5 KB', headers: { 'content-type': 'application/json', 'x-rate-limit-remaining': '99' }, body: JSON.stringify({ response: 'Hello! I\'m AbhiBase AI. How can I help you today?' }, null, 2) },
  'GET /api/expenses': { status: 200, statusText: 'OK', time: 55, size: '1.8 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ expenses: [{ id: '1', description: 'Coffee', amount: 4.50, category: 'food', date: '2026-09-15' }, { id: '2', description: 'Uber', amount: 15.00, category: 'transport', date: '2026-09-14' }], total: 2 }, null, 2) },
  'GET /api/events': { status: 200, statusText: 'OK', time: 28, size: '0.6 KB', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events: [{ id: '1', title: 'Team Standup', date: '2026-09-16', time: '09:00' }, { id: '2', title: 'Client Call', date: '2026-09-17', time: '14:00' }], total: 2 }, null, 2) },
};

/* ──────── MAIN COMPONENT ──────── */
export default function ApiConsole() {
  const [requests, setRequests] = useState<ApiRequest[]>([
    { id: '1', name: 'List Notes', method: 'GET', url: '/api/notes', headers: { 'Content-Type': 'application/json' }, body: '', saved: true },
  ]);
  const [activeId, setActiveId] = useState('1');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
  const [history, setHistory] = useState<{ method: string; url: string; status: number; time: number }[]>([]);

  const active = requests.find(r => r.id === activeId) || requests[0];

  const updateRequest = (id: string, updates: Partial<ApiRequest>) => {
    setRequests(requests.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const sendRequest = async () => {
    setIsRunning(true);
    setResponse(null);
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 300 + Math.random() * 800));

    const key = `${active.method} ${active.url}`;
    const sampleResp = SAMPLE_RESPONSES[key];
    if (sampleResp) {
      const resp = { ...sampleResp, time: Date.now() - startTime };
      setResponse(resp);
      setHistory([{ method: active.method, url: active.url, status: resp.status, time: resp.time }, ...history.slice(0, 19)]);
    } else {
      const resp: ApiResponse = {
        status: active.method === 'DELETE' ? 204 : active.url.includes('not-found') ? 404 : 200,
        statusText: active.method === 'DELETE' ? 'No Content' : 'OK',
        time: Date.now() - startTime,
        size: '0.1 KB',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: `${active.method} ${active.url} - simulated response` }, null, 2),
      };
      setResponse(resp);
      setHistory([{ method: active.method, url: active.url, status: resp.status, time: resp.time }, ...history.slice(0, 19)]);
    }
    setIsRunning(false);
  };

  const addRequest = () => {
    const id = Date.now().toString();
    setRequests([...requests, { id, name: 'New Request', method: 'GET', url: '/api/', headers: { 'Content-Type': 'application/json' }, body: '', saved: false }]);
    setActiveId(id);
  };

  const deleteRequest = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
    if (activeId === id) setActiveId(requests[0]?.id || '');
  };

  const loadEndpoint = (ep: typeof SAMPLE_ENDPOINTS[0]) => {
    const id = Date.now().toString();
    const body = ep.method === 'POST'
      ? JSON.stringify({ title: 'New Item', content: 'Sample content...' }, null, 2) : '';
    setRequests([...requests, { id, name: ep.name, method: ep.method, url: ep.url, headers: { 'Content-Type': 'application/json' }, body, saved: false }]);
    setActiveId(id);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* ─── LEFT: Request List ─── */}
      <div className="w-72 bg-zinc-900/50 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-sm">API Requests</h3>
          <button onClick={addRequest} className="text-violet-400 hover:text-violet-300 text-lg">+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {requests.map(r => (
            <div key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`px-3 py-2 border-b border-zinc-800/50 cursor-pointer flex items-center gap-2 ${activeId === r.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[r.method]}`}>{r.method}</span>
              <span className="text-sm text-zinc-300 truncate flex-1">{r.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteRequest(r.id); }}
                className="text-zinc-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
        {/* History */}
        <div className="border-t border-zinc-800">
          <div className="px-3 py-2 text-xs text-zinc-500 font-medium">History</div>
          <div className="max-h-40 overflow-y-auto">
            {history.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-600">No requests yet</div>
            ) : history.map((h, i) => (
              <div key={i} className="px-3 py-1 flex items-center gap-2 text-xs">
                <span className={`font-bold ${h.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>{h.status}</span>
                <span className={`font-bold ${METHOD_COLORS[h.method]?.split(' ')[1]}`}>{h.method}</span>
                <span className="text-zinc-500 truncate flex-1">{h.url}</span>
                <span className="text-zinc-600">{h.time}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CENTER: Request Builder ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* URL Bar */}
        <div className="p-3 border-b border-zinc-800 flex gap-2 shrink-0">
          <select value={active.method}
            onChange={e => updateRequest(active.id, { method: e.target.value as any })}
            className={`rounded-lg px-3 py-2 text-sm font-bold border ${METHOD_COLORS[active.method]}`}>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input value={active.url} onChange={e => updateRequest(active.id, { url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-violet-500" />
          <button onClick={sendRequest} disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
            {isRunning ? <><span className="animate-spin">⏳</span> Sending...</> : '▶ Send'}
          </button>
        </div>

        {/* Request Tabs */}
        <div className="flex border-b border-zinc-800 shrink-0">
          {['Body', 'Headers', 'Params', 'Auth'].map(tab => (
            <button key={tab} className="px-4 py-2 text-sm text-zinc-400 hover:text-white border-b-2 border-transparent hover:border-zinc-600">{tab}</button>
          ))}
          <div className="flex-1" />
          <input value={active.name} onChange={e => updateRequest(active.id, { name: e.target.value })}
            className="bg-transparent text-sm text-zinc-400 px-4 py-2 text-right focus:outline-none" placeholder="Request name..." />
        </div>

        {/* Request Body */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-zinc-800">
            <textarea value={active.body} onChange={e => updateRequest(active.id, { body: e.target.value })}
              placeholder={active.method === 'GET' ? '// No body for GET requests' : '{\n  "key": "value"\n}'}
              className="flex-1 bg-zinc-950 p-4 text-sm font-mono text-emerald-400 resize-none focus:outline-none" />
          </div>

          {/* Response */}
          <div className="flex-1 flex flex-col">
            {response ? (
              <>
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-bold ${response.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-xs text-zinc-500">⚡ {response.time}ms</span>
                  <span className="text-xs text-zinc-500">📦 {response.size}</span>
                  <div className="flex-1" />
                  <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                    {(['body', 'headers'] as const).map(t => (
                      <button key={t} onClick={() => setActiveResponseTab(t)}
                        className={`px-3 py-1 text-xs capitalize ${activeResponseTab === t ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-zinc-950 p-4">
                  {activeResponseTab === 'body' ? (
                    <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">{response.body}</pre>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-violet-400 font-mono">{k}:</span>
                          <span className="text-zinc-300 font-mono">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <span className="text-4xl block mb-2">🚀</span>
                  <p className="text-sm">Click Send to make a request</p>
                  <p className="text-xs mt-1">Ctrl+Enter to send</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Quick Endpoints ─── */}
      <div className="w-56 bg-zinc-900/50 border-l border-zinc-800 overflow-y-auto shrink-0">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="font-bold text-xs text-zinc-400 uppercase">Quick Endpoints</h3>
        </div>
        <div className="p-2 space-y-1">
          {SAMPLE_ENDPOINTS.map((ep, i) => (
            <button key={i} onClick={() => loadEndpoint(ep)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-left group">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
              <span className="text-xs text-zinc-300 truncate">{ep.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
