'use client';

import { useState } from 'react';

/* ──────── TYPES ──────── */
interface DBTable {
  id: string;
  name: string;
  columns: DBColumn[];
  x: number;
  y: number;
  color: string;
}

interface DBColumn {
  id: string;
  name: string;
  type: string;
  pk: boolean;
  fk: boolean;
  nullable: boolean;
  ref?: string;
}

interface QueryResult {
  columns: string[];
  rows: (string | number | null)[][];
  time: number;
}

/* ──────── SAMPLE DATA ──────── */
const SAMPLE_TABLES: DBTable[] = [
  {
    id: 'users', name: 'users', x: 50, y: 50, color: '#8b5cf6',
    columns: [
      { id: 'u1', name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
      { id: 'u2', name: 'email', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 'u3', name: 'full_name', type: 'TEXT', pk: false, fk: false, nullable: true },
      { id: 'u4', name: 'avatar_url', type: 'TEXT', pk: false, fk: false, nullable: true },
      { id: 'u5', name: 'created_at', type: 'TIMESTAMPTZ', pk: false, fk: false, nullable: false },
    ]
  },
  {
    id: 'projects', name: 'projects', x: 400, y: 50, color: '#3b82f6',
    columns: [
      { id: 'p1', name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
      { id: 'p2', name: 'name', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 'p3', name: 'owner_id', type: 'UUID', pk: false, fk: true, nullable: false, ref: 'users.id' },
      { id: 'p4', name: 'created_at', type: 'TIMESTAMPTZ', pk: false, fk: false, nullable: false },
    ]
  },
  {
    id: 'tasks', name: 'tasks', x: 50, y: 350, color: '#10b981',
    columns: [
      { id: 't1', name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
      { id: 't2', name: 'title', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 't3', name: 'description', type: 'TEXT', pk: false, fk: false, nullable: true },
      { id: 't4', name: 'status', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 't5', name: 'project_id', type: 'UUID', pk: false, fk: true, nullable: false, ref: 'projects.id' },
      { id: 't6', name: 'assigned_to', type: 'UUID', pk: false, fk: true, nullable: true, ref: 'users.id' },
      { id: 't7', name: 'due_date', type: 'DATE', pk: false, fk: false, nullable: true },
    ]
  },
  {
    id: 'notes', name: 'notes', x: 400, y: 350, color: '#f59e0b',
    columns: [
      { id: 'n1', name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
      { id: 'n2', name: 'title', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 'n3', name: 'content', type: 'TEXT', pk: false, fk: false, nullable: true },
      { id: 'n4', name: 'tags', type: 'TEXT[]', pk: false, fk: false, nullable: true },
      { id: 'n5', name: 'user_id', type: 'UUID', pk: false, fk: true, nullable: false, ref: 'users.id' },
    ]
  },
  {
    id: 'habits', name: 'habits', x: 750, y: 50, color: '#ec4899',
    columns: [
      { id: 'h1', name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
      { id: 'h2', name: 'name', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 'h3', name: 'frequency', type: 'TEXT', pk: false, fk: false, nullable: false },
      { id: 'h4', name: 'user_id', type: 'UUID', pk: false, fk: true, nullable: false, ref: 'users.id' },
    ]
  },
  {
    id: 'habit_logs', name: 'habit_logs', x: 750, y: 350, color: '#06b6d4',
    columns: [
      { id: 'hl1', name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
      { id: 'hl2', name: 'habit_id', type: 'UUID', pk: false, fk: true, nullable: false, ref: 'habits.id' },
      { id: 'hl3', name: 'completed', type: 'BOOLEAN', pk: false, fk: false, nullable: false },
      { id: 'hl4', name: 'logged_at', type: 'DATE', pk: false, fk: false, nullable: false },
    ]
  },
];

const SAMPLE_QUERIES: { name: string; sql: string; result: QueryResult }[] = [
  {
    name: 'All Users',
    sql: 'SELECT id, email, full_name FROM users ORDER BY created_at DESC;',
    result: { columns: ['id', 'email', 'full_name'], rows: [['a1b2c3', 'admin@abhibase.com', 'Admin'], ['d4e5f6', 'user@test.com', 'Test User'], ['g7h8i9', 'demo@abhibase.com', 'Demo User']], time: 2 },
  },
  {
    name: 'Tasks with Project',
    sql: `SELECT t.title, t.status, p.name as project\nFROM tasks t\nJOIN projects p ON t.project_id = p.id\nORDER BY t.due_date;`,
    result: { columns: ['title', 'status', 'project'], rows: [['Design homepage', 'in_progress', 'Website Redesign'], ['Write docs', 'todo', 'Documentation'], ['Fix auth bug', 'done', 'Bug Fixes']], time: 3 },
  },
  {
    name: 'Habit Streaks',
    sql: `SELECT h.name, COUNT(hl.id) as streak\nFROM habits h\nLEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.completed = true\nGROUP BY h.name\nORDER BY streak DESC;`,
    result: { columns: ['name', 'streak'], rows: [['Morning Run', 12], ['Read 30min', 8], ['Meditate', 5], ['Journal', 3]], time: 1 },
  },
];

/* ──────── MAIN COMPONENT ──────── */
export default function DatabaseEditor() {
  const [tables, setTables] = useState<DBTable[]>(SAMPLE_TABLES);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'erd' | 'query' | 'migrations'>('erd');
  const [query, setQuery] = useState(SAMPLE_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryTime, setQueryTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showNewTable, setShowNewTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [migrations, setMigrations] = useState([
    { id: 1, name: '001_initial_schema', tables: 6, status: 'applied', date: '2026-09-01' },
    { id: 2, name: '002_add_workflows', tables: 3, status: 'applied', date: '2026-09-05' },
    { id: 3, name: '003_add_integrations', tables: 4, status: 'applied', date: '2026-09-10' },
    { id: 4, name: '004_add_analytics', tables: 4, status: 'applied', date: '2026-09-12' },
    { id: 5, name: '005_add_enterprise', tables: 6, status: 'applied', date: '2026-09-14' },
    { id: 6, name: '006_add_ai_agents', tables: 3, status: 'applied', date: '2026-09-15' },
  ]);

  const runQuery = async () => {
    setIsRunning(true);
    setQueryResult(null);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
    const match = SAMPLE_QUERIES.find(q => q.sql.trim() === query.trim());
    if (match) {
      setQueryResult(match.result);
      setQueryTime(match.result.time);
    } else {
      const words = query.toLowerCase();
      if (words.includes('select') || words.includes('insert') || words.includes('update') || words.includes('delete')) {
        setQueryResult({ columns: ['result'], rows: [[words.includes('select') ? '3 rows returned' : 'Query executed successfully']], time: Math.floor(Math.random() * 5) + 1 });
        setQueryTime(Math.floor(Math.random() * 5) + 1);
      } else {
        setQueryResult({ columns: ['error'], rows: [['Syntax error near "' + query.slice(0, 20) + '..."']], time: 0 });
      }
    }
    setIsRunning(false);
  };

  const addTable = () => {
    if (!newTableName.trim()) return;
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];
    const newTable: DBTable = {
      id: newTableName.toLowerCase().replace(/\s/g, '_'),
      name: newTableName.toLowerCase().replace(/\s/g, '_'),
      x: 50 + Math.random() * 600,
      y: 50 + Math.random() * 300,
      color: colors[tables.length % colors.length],
      columns: [
        { id: `${newTableName[0]}1`, name: 'id', type: 'UUID', pk: true, fk: false, nullable: false },
        { id: `${newTableName[0]}2`, name: 'name', type: 'TEXT', pk: false, fk: false, nullable: false },
        { id: `${newTableName[0]}3`, name: 'created_at', type: 'TIMESTAMPTZ', pk: false, fk: false, nullable: false },
      ]
    };
    setTables([...tables, newTable]);
    setNewTableName('');
    setShowNewTable(false);
  };

  const addColumn = (tableId: string) => {
    setTables(tables.map(t => t.id === tableId ? {
      ...t,
      columns: [...t.columns, { id: `${t.name[0]}${t.columns.length + 1}`, name: 'new_column', type: 'TEXT', pk: false, fk: false, nullable: true }]
    } : t));
  };

  const removeTable = (tableId: string) => {
    setTables(tables.filter(t => t.id !== tableId));
    if (selectedTable === tableId) setSelectedTable(null);
  };

  const updateColumn = (tableId: string, colId: string, updates: Partial<DBColumn>) => {
    setTables(tables.map(t => t.id === tableId ? {
      ...t,
      columns: t.columns.map(c => c.id === colId ? { ...c, ...updates } : c)
    } : t));
  };

  const removeColumn = (tableId: string, colId: string) => {
    setTables(tables.map(t => t.id === tableId ? {
      ...t,
      columns: t.columns.filter(c => c.id !== colId)
    } : t));
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold">Database Editor</h2>
          <p className="text-xs text-zinc-500">{tables.length} tables • 6 migrations applied</p>
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          {(['erd', 'query', 'migrations'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{t === 'erd' ? '📊 ERD' : t === 'query' ? '⚡ Query' : '🔄 Migrations'}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ERD View */}
        {activeTab === 'erd' && (
          <div className="flex-1 flex">
            <div className="flex-1 overflow-auto bg-zinc-950 p-6 relative">
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                <button onClick={() => setShowNewTable(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">+ New Table</button>
              </div>
              {showNewTable && (
                <div className="absolute top-4 left-44 z-10 bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex gap-2 shadow-xl">
                  <input value={newTableName} onChange={e => setNewTableName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTable()}
                    placeholder="Table name" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" autoFocus />
                  <button onClick={addTable} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm">Add</button>
                  <button onClick={() => setShowNewTable(false)} className="text-zinc-500 hover:text-white text-sm">✕</button>
                </div>
              )}

              {/* SVG Lines for relationships */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1000, minHeight: 600 }}>
                {tables.flatMap(t => t.columns.filter(c => c.fk && c.ref).map(c => {
                  const [refTable] = c.ref!.split('.');
                  const sourceTable = tables.find(tt => tt.id === t.id);
                  const targetTable = tables.find(tt => tt.id === refTable);
                  if (!sourceTable || !targetTable) return null;
                  const sx = sourceTable.x + 180;
                  const sy = sourceTable.y + 30;
                  const tx = targetTable.x + 180;
                  const ty = targetTable.y + 30;
                  return (
                    <g key={`${t.id}-${c.id}`}>
                      <line x1={sx} y1={sy} x2={tx} y2={ty} stroke="#4c1d95" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                      <circle cx={tx} cy={ty} r="5" fill="#7c3aed" stroke="#4c1d95" strokeWidth="2" />
                    </g>
                  );
                }))}
              </svg>

              {/* Table Cards */}
              {tables.map(table => (
                <div key={table.id}
                  className={`absolute bg-zinc-900 border-2 rounded-xl shadow-2xl cursor-move w-[360px] transition-shadow ${selectedTable === table.id ? 'border-violet-500 shadow-violet-500/20' : 'border-zinc-800 hover:border-zinc-700'}`}
                  style={{ left: table.x, top: table.y }}
                  onClick={() => setSelectedTable(table.id)}>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 rounded-t-xl" style={{ background: table.color + '20' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📋</span>
                      <span className="font-bold text-sm" style={{ color: table.color }}>{table.name}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{table.columns.length} cols</span>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    {table.columns.map(col => (
                      <div key={col.id} className="flex items-center gap-2 px-4 py-1.5 text-xs hover:bg-zinc-800/50">
                        {col.pk && <span className="text-amber-400">🔑</span>}
                        {col.fk && <span className="text-blue-400">🔗</span>}
                        {!col.pk && !col.fk && <span className="w-4" />}
                        <span className="text-white font-mono flex-1">{col.name}</span>
                        <span className="text-zinc-500 font-mono text-[10px]">{col.type}</span>
                        {col.nullable && <span className="text-zinc-600">?</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Table Detail Panel */}
            {selectedTableData && (
              <div className="w-80 bg-zinc-900/50 border-l border-zinc-800 overflow-y-auto shrink-0">
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold" style={{ color: selectedTableData.color }}>{selectedTableData.name}</h3>
                    <button onClick={() => removeTable(selectedTableData.id)} className="text-zinc-500 hover:text-red-400 text-xs">Delete</button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{selectedTableData.columns.length} columns</p>
                </div>
                <div className="p-3 space-y-2">
                  {selectedTableData.columns.map(col => (
                    <div key={col.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input value={col.name} onChange={e => updateColumn(selectedTableData.id, col.id, { name: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-white font-mono focus:outline-none" />
                        <button onClick={() => removeColumn(selectedTableData.id, col.id)} className="text-zinc-600 hover:text-red-400 text-xs">✕</button>
                      </div>
                      <div className="flex gap-1">
                        <select value={col.type} onChange={e => updateColumn(selectedTableData.id, col.id, { type: e.target.value })}
                          className="bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-xs text-white">
                          {['UUID', 'TEXT', 'INTEGER', 'DECIMAL(12,2)', 'BOOLEAN', 'DATE', 'TIMESTAMPTZ', 'JSONB', 'TEXT[]', 'REAL'].map(t => <option key={t}>{t}</option>)}
                        </select>
                        <button onClick={() => updateColumn(selectedTableData.id, col.id, { pk: !col.pk })}
                          className={`px-1.5 py-0.5 rounded text-xs ${col.pk ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700 text-zinc-400'}`}>PK</button>
                        <button onClick={() => updateColumn(selectedTableData.id, col.id, { nullable: !col.nullable })}
                          className={`px-1.5 py-0.5 rounded text-xs ${col.nullable ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>NULL</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addColumn(selectedTableData.id)}
                    className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">+ Add Column</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Query Console */}
        {activeTab === 'query' && (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex gap-2 mb-3">
                {SAMPLE_QUERIES.map(q => (
                  <button key={q.name} onClick={() => { setQuery(q.sql); setQueryResult(null); }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300">{q.name}</button>
                ))}
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">SQL Editor</span>
                  <button onClick={runQuery} disabled={isRunning}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    {isRunning ? <><span className="animate-spin">⏳</span> Running...</> : <><span>▶</span> Run Query</>}
                  </button>
                </div>
                <textarea value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full bg-transparent p-4 text-sm font-mono text-emerald-400 resize-none h-32 focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runQuery(); }} />
              </div>
              {queryTime > 0 && <p className="text-xs text-zinc-500 mt-2">⚡ {queryTime}ms</p>}
            </div>
            {queryResult && (
              <div className="flex-1 overflow-auto p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {queryResult.columns.map(c => <th key={c} className="text-left px-4 py-2 text-zinc-400 font-medium text-xs">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, i) => (
                        <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/50">
                          {row.map((cell, j) => <td key={j} className="px-4 py-2 text-white font-mono text-xs">{cell === null ? <span className="text-zinc-600">NULL</span> : String(cell)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Migrations */}
        {activeTab === 'migrations' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl space-y-3">
              <h3 className="font-bold text-lg mb-4">Migration History</h3>
              {migrations.map(m => (
                <div key={m.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">✓</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-zinc-500">{m.tables} tables • {m.date}</div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
