'use client';

import { useState, useEffect } from 'react';

/* ──────── TYPES ──────── */
interface Metric {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source: string;
  duration?: number;
}

interface Endpoint {
  method: string;
  path: string;
  avgTime: number;
  requests: number;
  errors: number;
  p95: number;
}

/* ──────── DATA ──────── */
const METRICS: Metric[] = [
  { label: 'Uptime', value: '99.97%', change: 0, icon: '🟢', color: 'text-emerald-400' },
  { label: 'Avg Response', value: '142ms', change: -12, icon: '⚡', color: 'text-emerald-400' },
  { label: 'Requests/min', value: '1,247', change: 15, icon: '📈', color: 'text-blue-400' },
  { label: 'Error Rate', value: '0.03%', change: -0.01, icon: '🎯', color: 'text-emerald-400' },
  { label: 'Memory Usage', value: '142MB', change: 3, icon: '💾', color: 'text-amber-400' },
  { label: 'Active Users', value: '23', change: 5, icon: '👥', color: 'text-violet-400' },
];

const SAMPLE_LOGS: LogEntry[] = [
  { id: '1', time: '12:34:56', level: 'info', message: 'GET /api/notes 200', source: 'api', duration: 45 },
  { id: '2', time: '12:34:55', level: 'success', message: 'POST /api/tasks created', source: 'api', duration: 95 },
  { id: '3', time: '12:34:53', level: 'warn', message: 'Rate limit approaching for user b584', source: 'auth', duration: 12 },
  { id: '4', time: '12:34:50', level: 'info', message: 'GET /api/habits 200', source: 'api', duration: 32 },
  { id: '5', time: '12:34:48', level: 'error', message: 'POST /api/ai/chat rate limit exceeded', source: 'ai', duration: 1250 },
  { id: '6', time: '12:34:45', level: 'info', message: 'GET /api/projects 200', source: 'api', duration: 42 },
  { id: '7', time: '12:34:42', level: 'success', message: 'User authenticated via JWT', source: 'auth', duration: 8 },
  { id: '8', time: '12:34:40', level: 'info', message: 'Database query executed', source: 'db', duration: 15 },
  { id: '9', time: '12:34:38', level: 'warn', message: 'Slow query detected (>500ms)', source: 'db', duration: 623 },
  { id: '10', time: '12:34:35', level: 'info', message: 'GET /api/expenses 200', source: 'api', duration: 55 },
];

const SAMPLE_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/notes', avgTime: 45, requests: 12400, errors: 3, p95: 120 },
  { method: 'POST', path: '/api/notes', avgTime: 120, requests: 3200, errors: 12, p95: 350 },
  { method: 'GET', path: '/api/tasks', avgTime: 38, requests: 15600, errors: 5, p95: 95 },
  { method: 'POST', path: '/api/tasks', avgTime: 95, requests: 4100, errors: 8, p95: 280 },
  { method: 'GET', path: '/api/habits', avgTime: 32, requests: 8900, errors: 1, p95: 80 },
  { method: 'GET', path: '/api/health', avgTime: 5, requests: 45000, errors: 0, p95: 12 },
  { method: 'POST', path: '/api/ai/chat', avgTime: 1250, requests: 2100, errors: 45, p95: 3200 },
  { method: 'GET', path: '/api/expenses', avgTime: 55, requests: 6700, errors: 2, p95: 140 },
  { method: 'GET', path: '/api/events', avgTime: 28, requests: 5400, errors: 0, p95: 70 },
  { method: 'GET', path: '/api/projects', avgTime: 42, requests: 7800, errors: 4, p95: 110 },
];

const CORE_WEB_VITALS = [
  { name: 'LCP', label: 'Largest Contentful Paint', value: '1.8s', target: '<2.5s', status: 'good' as const },
  { name: 'FID', label: 'First Input Delay', value: '45ms', target: '<100ms', status: 'good' as const },
  { name: 'CLS', label: 'Cumulative Layout Shift', value: '0.05', target: '<0.1', status: 'good' as const },
  { name: 'TTFB', label: 'Time to First Byte', value: '180ms', target: '<200ms', status: 'good' as const },
  { name: 'INP', label: 'Interaction to Next Paint', value: '120ms', target: '<200ms', status: 'good' as const },
  { name: 'FCP', label: 'First Contentful Paint', value: '0.9s', target: '<1.8s', status: 'good' as const },
];

/* ──────── MAIN COMPONENT ──────── */
export default function PerformanceMonitor() {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'logs' | 'vitals'>('overview');
  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [liveTraffic, setLiveTraffic] = useState<{ time: string; count: number }[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      setLiveTraffic(prev => {
        const newEntry = { time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), count: Math.floor(Math.random() * 50) + 80 };
        return [...prev.slice(-29), newEntry];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const maxTraffic = Math.max(...liveTraffic.map(t => t.count), 1);
  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => l.level === logFilter);

  const errorEndpoints = SAMPLE_ENDPOINTS.filter(e => e.errors > 0).sort((a, b) => b.errors - a.errors);
  const slowEndpoints = [...SAMPLE_ENDPOINTS].sort((a, b) => b.avgTime - a.avgTime);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-sm text-zinc-400">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-zinc-400">Live</span>
          <span className="text-xs text-zinc-600 ml-2">{now.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-6 gap-3">
        {METRICS.map(m => (
          <div key={m.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{m.icon}</span>
              <span className="text-xs text-zinc-500">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            {m.change !== 0 && (
              <span className={`text-xs ${m.change > 0 && m.label !== 'Error Rate' ? 'text-emerald-400' : m.change < 0 && m.label === 'Error Rate' ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.change > 0 ? '↑' : '↓'} {Math.abs(m.change)}{m.label.includes('Rate') ? '%' : 'ms'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-zinc-800 overflow-hidden w-fit">
        {(['overview', 'endpoints', 'logs', 'vitals'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'endpoints' ? '🔌 Endpoints' : t === 'logs' ? '📋 Logs' : '⚡ Web Vitals'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Live Traffic */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">Live Traffic</h3>
            <div className="h-48 flex items-end gap-px">
              {liveTraffic.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-violet-500/80 rounded-t" style={{ height: `${(t.count / maxTraffic) * 100}%`, minHeight: 2 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-600">
              <span>-60s</span><span>-40s</span><span>-20s</span><span>Now</span>
            </div>
          </div>

          {/* Error Hotspots */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">Error Hotspots</h3>
            <div className="space-y-3">
              {errorEndpoints.map((ep, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{ep.method}</span>
                  <span className="text-sm font-mono text-zinc-300 flex-1">{ep.path}</span>
                  <span className="text-sm text-red-400 font-medium">{ep.errors}</span>
                  <div className="w-24 bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(ep.errors / 50) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slowest Endpoints */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">Slowest Endpoints</h3>
            <div className="space-y-3">
              {slowEndpoints.slice(0, 5).map((ep, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{ep.method}</span>
                  <span className="text-sm font-mono text-zinc-300 flex-1">{ep.path}</span>
                  <span className={`text-sm font-medium ${ep.avgTime > 500 ? 'text-red-400' : ep.avgTime > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>{ep.avgTime}ms</span>
                  <span className="text-xs text-zinc-600">p95: {ep.p95}ms</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">Resource Usage</h3>
            <div className="space-y-4">
              {[
                { label: 'Memory', used: 142, total: 512, unit: 'MB' },
                { label: 'CPU', used: 23, total: 100, unit: '%' },
                { label: 'Disk', used: 2.4, total: 50, unit: 'GB' },
                { label: 'Connections', used: 12, total: 100, unit: '' },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">{r.label}</span>
                    <span className="text-white">{r.used}{r.unit} / {r.total}{r.unit}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className={`h-2 rounded-full ${r.used / r.total > 0.8 ? 'bg-red-500' : r.used / r.total > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(r.used / r.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-3 text-zinc-400 font-medium">Method</th>
                <th className="text-left px-6 py-3 text-zinc-400 font-medium">Path</th>
                <th className="text-right px-6 py-3 text-zinc-400 font-medium">Avg Time</th>
                <th className="text-right px-6 py-3 text-zinc-400 font-medium">P95</th>
                <th className="text-right px-6 py-3 text-zinc-400 font-medium">Requests</th>
                <th className="text-right px-6 py-3 text-zinc-400 font-medium">Errors</th>
                <th className="text-right px-6 py-3 text-zinc-400 font-medium">Error %</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ENDPOINTS.map((ep, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/50">
                  <td className="px-6 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{ep.method}</span></td>
                  <td className="px-6 py-3 font-mono text-zinc-300">{ep.path}</td>
                  <td className="px-6 py-3 text-right"><span className={`${ep.avgTime > 500 ? 'text-red-400' : ep.avgTime > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>{ep.avgTime}ms</span></td>
                  <td className="px-6 py-3 text-right text-zinc-400">{ep.p95}ms</td>
                  <td className="px-6 py-3 text-right text-zinc-300">{ep.requests.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right"><span className={ep.errors > 10 ? 'text-red-400' : 'text-zinc-400'}>{ep.errors}</span></td>
                  <td className="px-6 py-3 text-right"><span className={ep.errors / ep.requests > 0.01 ? 'text-red-400' : 'text-emerald-400'}>{((ep.errors / ep.requests) * 100).toFixed(2)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium">Live Logs</span>
            <div className="flex-1" />
            <div className="flex gap-1">
              {['all', 'info', 'success', 'warn', 'error'].map(f => (
                <button key={f} onClick={() => setLogFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize ${logFilter === f ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto font-mono text-xs">
            {filteredLogs.map(log => (
              <div key={log.id} className="px-6 py-2 border-b border-zinc-800/30 flex items-start gap-3 hover:bg-zinc-800/30">
                <span className="text-zinc-600 shrink-0">{log.time}</span>
                <span className={`shrink-0 w-16 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : log.level === 'success' ? 'text-emerald-400' : 'text-zinc-400'}`}>[{log.level}]</span>
                <span className="text-zinc-300 flex-1">{log.message}</span>
                <span className="text-zinc-600 shrink-0">{log.source}</span>
                {log.duration !== undefined && <span className="text-zinc-500 shrink-0">{log.duration}ms</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web Vitals */}
      {activeTab === 'vitals' && (
        <div className="grid grid-cols-3 gap-4">
          {CORE_WEB_VITALS.map(v => (
            <div key={v.name} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${v.status === 'good' ? 'bg-emerald-500' : v.status === 'needs-improvement' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="font-bold">{v.name}</span>
              </div>
              <div className="text-3xl font-bold mb-1">{v.value}</div>
              <div className="text-sm text-zinc-400 mb-2">{v.label}</div>
              <div className="text-xs text-zinc-500">Target: {v.target}</div>
              <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${v.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: v.status === 'good' ? '85%' : '60%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
