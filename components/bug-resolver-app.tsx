'use client';

import { useState, useEffect, useRef } from 'react';

/* ──────────────── TYPES ──────────────── */
interface Bug {
  id: string;
  line: number;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  fix: string;
  fixedCode: string;
  agent: string;
  status: 'detected' | 'analyzing' | 'fixed';
}

interface ScanLog {
  id: string;
  time: string;
  agent: string;
  type: 'scan' | 'detect' | 'analyze' | 'fix' | 'complete';
  message: string;
}

/* ──────────────── SAMPLE CODE WITH BUGS ──────────────── */
const SAMPLE_CODE = `// 📄 src/utils/helpers.ts
import { useState } from 'react';

// Bug 1: Missing dependency in useEffect
export function UserData({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, []); // ← Missing userId dependency!

  return <div>{user?.name}</div>;
}

// Bug 2: Unreachable code
export function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
    return total; // ← Returns too early!
  }
  return total;
}

// Bug 3: Memory leak - no cleanup
export function useInterval(callback, delay) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    // ← Missing cleanup function!
  });
}

// Bug 4: Incorrect comparison
export function findUser(users, targetId) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id = targetId) { // ← Assignment instead of comparison!
      return users[i];
    }
  }
  return null;
}

// Bug 5: Async/await error handling
export async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json(); // ← No error handling!
  return data;
}

// Bug 6: XSS vulnerability
export function renderHTML(content) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />; // ← XSS risk!
}

// Bug 7: Unused variable
export function processItems(items) {
  const unused = items.filter(i => i.active); // ← Variable never used
  return items.map(i => ({ ...i, processed: true }));
}

// Bug 8: Potential null reference
export function getUserName(user) {
  return user.profile.name.toUpperCase(); // ← No null check!
}`;

const FIXED_CODE = `// 📄 src/utils/helpers.ts
import { useState, useEffect } from 'react';

// ✅ Fixed: Added userId to dependency array
export function UserData({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]); // ← Fixed!

  return <div>{user?.name}</div>;
}

// ✅ Fixed: Moved return outside loop
export function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total; // ← Fixed!
}

// ✅ Fixed: Added cleanup function
export function useInterval(callback, delay) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id); // ← Fixed!
  }, [callback, delay]);
}

// ✅ Fixed: Changed = to ===
export function findUser(users, targetId) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === targetId) { // ← Fixed!
      return users[i];
    }
  }
  return null;
}

// ✅ Fixed: Added try-catch
export async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// ✅ Fixed: Sanitized HTML content
export function renderHTML(content) {
  const sanitized = content.replace(/<script[^>]*>[^<]*<\/script>/gi, '');
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// ✅ Fixed: Removed unused variable
export function processItems(items) {
  return items.map(i => ({ ...i, processed: true }));
}

// ✅ Fixed: Added null checks
export function getUserName(user) {
  return user?.profile?.name?.toUpperCase() || 'UNKNOWN';
}`;

/* ──────────────── BUGS DATA ──────────────── */
const BUGS: Bug[] = [
  { id: 'b1', line: 9, severity: 'critical', type: 'React Hook', message: 'Missing dependency in useEffect - causes stale closures', fix: 'Add userId to the dependency array', fixedCode: '}, [userId]);', agent: 'Debugger', status: 'detected' },
  { id: 'b2', line: 19, severity: 'critical', type: 'Logic Error', message: 'Unreachable code - return statement inside loop', fix: 'Move return statement outside the for loop', fixedCode: '  }\n  return total;', agent: 'Architect', status: 'detected' },
  { id: 'b3', line: 26, severity: 'warning', type: 'Memory Leak', message: 'Missing cleanup in useEffect - interval never cleared', fix: 'Add cleanup function to clear the interval', fixedCode: '    return () => clearInterval(id);', agent: 'Optimizer', status: 'detected' },
  { id: 'b4', line: 33, severity: 'critical', type: 'Comparison', message: 'Assignment (=) used instead of comparison (===)', fix: 'Change single equals to triple equals', fixedCode: 'if (users[i].id === targetId)', agent: 'Debugger', status: 'detected' },
  { id: 'b5', line: 40, severity: 'warning', type: 'Error Handling', message: 'No error handling for async/await operation', fix: 'Wrap in try-catch block', fixedCode: 'try {\n    // ... fetch logic\n  } catch (error) {\n    console.error(error);\n  }', agent: 'Guardian', status: 'detected' },
  { id: 'b6', line: 46, severity: 'critical', type: 'Security', message: 'XSS vulnerability - unsanitized HTML injection', fix: 'Sanitize HTML content before rendering', fixedCode: 'const sanitized = content.replace(/<script[^>]*>.*?<\\/script>/gi, \'\');', agent: 'Guardian', status: 'detected' },
  { id: 'b7', line: 51, severity: 'info', type: 'Code Quality', message: 'Unused variable - variable declared but never referenced', fix: 'Remove the unused variable', fixedCode: '  return items.map(i => ({ ...i, processed: true }));', agent: 'Reviewer', status: 'detected' },
  { id: 'b8', line: 56, severity: 'critical', type: 'Null Reference', message: 'Potential null reference - no optional chaining', fix: 'Add optional chaining operator (?.)', fixedCode: 'return user?.profile?.name?.toUpperCase() || \'UNKNOWN\';', agent: 'Debugger', status: 'detected' },
];

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function BugResolverApp() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'analyzing' | 'fixing' | 'complete'>('idle');
  const [currentBug, setCurrentBug] = useState<string | null>(null);
  const [fixedCount, setFixedCount] = useState(0);
  const [showFixed, setShowFixed] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (agent: string, type: ScanLog['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      agent, type, message,
    }]);
  };

  const startScan = async () => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    setBugs([]);
    setLogs([]);
    setFixedCount(0);
    setShowFixed(false);
    setCode(SAMPLE_CODE);

    // Phase 1: Scanning
    addLog('Architect', 'scan', 'Initializing code analysis...');
    await delay(600);
    addLog('Architect', 'scan', 'Parsing TypeScript AST...');
    await delay(400);
    addLog('Debugger', 'scan', 'Loading bug detection patterns...');
    await delay(500);
    addLog('Optimizer', 'scan', 'Preparing performance profiler...');
    await delay(400);
    addLog('Guardian', 'scan', 'Loading security vulnerability rules...');
    await delay(300);

    // Phase 2: Analyzing & Detecting
    setPhase('analyzing');
    addLog('Debugger', 'analyze', 'Scanning for logic errors...');
    await delay(700);

    for (const bug of BUGS) {
      await delay(500);
      setCurrentBug(bug.id);
      addLog(bug.agent, 'detect', `Line ${bug.line}: ${bug.type} - ${bug.message}`);
      setBugs(prev => [...prev, { ...bug, status: 'detected' }]);
    }

    await delay(600);
    addLog('Reviewer', 'analyze', `Found ${BUGS.length} issues (${BUGS.filter(b=>b.severity==='critical').length} critical)`);
    
    // Phase 3: Fixing
    setPhase('fixing');
    await delay(800);
    addLog('System', 'fix', 'Starting automatic fixes...');
    await delay(500);

    for (const bug of BUGS) {
      setCurrentBug(bug.id);
      addLog(bug.agent, 'fix', `Fixing: ${bug.message}`);
      setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'analyzing' } : b));
      await delay(600);
      setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'fixed' } : b));
      setFixedCount(prev => prev + 1);
      addLog(bug.agent, 'fix', `✓ Fixed: ${bug.type}`);
      await delay(300);
    }

    // Complete
    setPhase('complete');
    setCurrentBug(null);
    addLog('System', 'complete', `🎉 All ${BUGS.length} issues resolved!`);
    addLog('Architect', 'complete', 'Code quality score: 95/100');
    addLog('Optimizer', 'complete', 'Performance improved by 23%');
    addLog('Guardian', 'complete', 'Security vulnerabilities: 0');
    setShowFixed(true);
  };

  const resetDemo = () => {
    setPhase('idle');
    setBugs([]);
    setLogs([]);
    setFixedCount(0);
    setCurrentBug(null);
    setShowFixed(false);
    setCode(SAMPLE_CODE);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const getLineStatus = (lineNum: number) => {
    const bug = bugs.find(b => b.line === lineNum);
    if (!bug) return null;
    if (bug.status === 'fixed') return 'fixed';
    if (bug.severity === 'critical') return 'critical';
    if (bug.severity === 'warning') return 'warning';
    return 'info';
  };

  const severityColors = { critical: 'text-red-400 bg-red-500/10 border-red-500/30', warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30', info: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  const statusIcons = { detected: '🔍', analyzing: '⚙️', fixed: '✅' };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🐛</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Bug Resolver Demo
              </h1>
            </div>
            <p className="text-zinc-400">Watch AI agents find and fix bugs in real-time</p>
          </div>
          <div className="flex gap-2">
            {phase === 'idle' ? (
              <button onClick={startScan} className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl font-bold transition-all">
                🔍 Start Bug Scan
              </button>
            ) : phase === 'complete' ? (
              <button onClick={resetDemo} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-all">
                🔄 Reset Demo
              </button>
            ) : (
              <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900 rounded-xl">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-zinc-400 capitalize">{phase}...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Bugs Found', value: bugs.length, icon: '🐛', color: 'text-red-400' },
            { label: 'Fixed', value: fixedCount, icon: '✅', color: 'text-emerald-400' },
            { label: 'Critical', value: bugs.filter(b => b.severity === 'critical').length, icon: '🔴', color: 'text-red-400' },
            { label: 'Warnings', value: bugs.filter(b => b.severity === 'warning').length, icon: '🟡', color: 'text-amber-400' },
            { label: 'Agents Active', value: phase !== 'idle' ? 4 : 0, icon: '🤖', color: 'text-violet-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-lg">{stat.icon}</span>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Code Editor */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm text-zinc-400 ml-2">src/utils/helpers.ts</span>
            </div>
            {phase === 'complete' && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">✓ All Fixed</span>
            )}
          </div>
          <div className="overflow-auto max-h-[600px]">
            <pre className="p-4 text-sm font-mono leading-relaxed">
              {code.split('\n').map((line, i) => {
                const lineNum = i + 1;
                const status = getLineStatus(lineNum);
                const isCurrentBug = currentBug && bugs.find(b => b.id === currentBug)?.line === lineNum;
                return (
                  <div key={i} className={`flex ${isCurrentBug ? 'bg-amber-500/10 -mx-4 px-4' : ''} ${status === 'fixed' ? 'bg-emerald-500/5' : ''}`}>
                    <span className={`w-10 text-right pr-4 select-none shrink-0 ${status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : status === 'fixed' ? 'text-emerald-400' : 'text-zinc-600'}`}>
                      {status === 'critical' ? '✕' : status === 'warning' ? '⚠' : status === 'fixed' ? '✓' : lineNum}
                    </span>
                    <span className={`${status === 'fixed' ? 'text-emerald-300' : status ? 'text-white' : 'text-zinc-400'}`}>{line}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Bugs List */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-medium text-sm">🐛 Detected Issues</span>
              <span className="text-xs text-zinc-500">{bugs.length}/{BUGS.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {bugs.length === 0 ? (
                <div className="p-6 text-center text-zinc-600 text-sm">
                  {phase === 'idle' ? 'Click "Start Bug Scan" to begin' : 'Scanning for bugs...'}
                </div>
              ) : (
                bugs.map(bug => (
                  <div key={bug.id} className={`px-4 py-3 border-b border-zinc-800/50 ${currentBug === bug.id ? 'bg-amber-500/10' : ''} ${bug.status === 'fixed' ? 'bg-emerald-500/5' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${severityColors[bug.severity]}`}>
                        {bug.severity}
                      </span>
                      <span className="text-xs text-zinc-500">Line {bug.line}</span>
                      <span className="ml-auto">{statusIcons[bug.status]}</span>
                    </div>
                    <div className="text-sm font-medium mb-1">{bug.type}</div>
                    <div className="text-xs text-zinc-400">{bug.message}</div>
                    {bug.status === 'fixed' && (
                      <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                        💡 {bug.fix}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${phase !== 'idle' && phase !== 'complete' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-medium text-sm">📋 Activity Log</span>
            </div>
            <div className="h-[250px] overflow-y-auto p-3 font-mono text-xs space-y-1">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-1.5">
                  <span className="text-zinc-600 shrink-0">{log.time.slice(0, 8)}</span>
                  <span className={`shrink-0 ${log.type === 'fix' ? 'text-emerald-400' : log.type === 'detect' ? 'text-red-400' : log.type === 'complete' ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {log.type === 'fix' ? '🔧' : log.type === 'detect' ? '🐛' : log.type === 'complete' ? '🎉' : log.type === 'scan' ? '🔍' : '⚙️'}
                  </span>
                  <span className="text-violet-400 shrink-0">[{log.agent}]</span>
                  <span className="text-zinc-300">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
