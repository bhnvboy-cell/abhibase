'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ──────────────── TYPES ──────────────── */
interface Service {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  features: string[];
  link: string;
  demo?: string;
  status: 'active' | 'coming-soon';
}

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  description: string;
  capabilities: string[];
}

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'thinking';
  message: string;
  agent?: string;
}

/* ──────────────── SERVICES DATA ──────────────── */
const SERVICES: Service[] = [
  {
    id: 'app-builder',
    title: 'App Builder',
    subtitle: 'AI-Powered App Generation',
    description: 'Describe your app idea and watch it come to life. Our AI understands natural language and generates production-ready code.',
    icon: '🚀',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    features: ['Natural language to code', 'React/Next.js output', 'Database schema generation', 'API route creation', 'Authentication setup', 'Real-time preview'],
    link: '/dashboard/app-builder',
    status: 'active',
  },
  {
    id: 'thinking',
    title: 'Thinking & Analysis',
    subtitle: 'Deep Code Understanding',
    description: 'Advanced reasoning engine that analyzes your codebase, understands context, and provides intelligent suggestions.',
    icon: '🧠',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-fuchsia-500',
    features: ['Codebase analysis', 'Architecture recommendations', 'Dependency mapping', 'Performance insights', 'Security scanning', 'Best practices'],
    link: '/dashboard/analytics',
    status: 'active',
  },
  {
    id: 'implementation',
    title: 'Implementation Phase',
    subtitle: 'Step-by-Step Execution',
    description: 'Breaks down complex tasks into manageable steps and implements them with precision and accountability.',
    icon: '⚡',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
    features: ['Task decomposition', 'Incremental implementation', 'Progress tracking', 'Rollback capability', 'Testing integration', 'Documentation'],
    link: '/dashboard/workflows',
    status: 'active',
  },
  {
    id: 'issue-resolution',
    title: 'Issue Resolution',
    subtitle: 'Bug Detection & Fixing',
    description: 'Automatically identifies bugs, errors, and issues in your code and provides fixes with explanations.',
    icon: '🔧',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-500',
    features: ['Error detection', 'Root cause analysis', 'Auto-fix suggestions', 'Test generation', 'Regression prevention', 'Code quality reports'],
    link: '/dashboard/bug-resolver',
    status: 'active',
  },
  {
    id: 'agents',
    title: 'AI Agents',
    subtitle: 'Autonomous Task Workers',
    description: 'Deploy specialized AI agents that work independently on tasks, collaborate, and deliver results.',
    icon: '🤖',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-500',
    features: ['Specialized roles', 'Parallel execution', 'Inter-agent communication', 'Learning & adaptation', 'Task delegation', 'Result aggregation'],
    link: '/dashboard/ai-agents',
    status: 'active',
  },
  {
    id: 'code-review',
    title: 'Code Review',
    subtitle: 'Automated Quality Assurance',
    description: 'AI-powered code review that catches issues, suggests improvements, and ensures code quality.',
    icon: '👁️',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-500',
    features: ['Style consistency', 'Performance review', 'Security audit', 'Best practices', 'Documentation check', 'Test coverage'],
    link: '/dashboard/bug-resolver',
    status: 'active',
  },
  {
    id: 'refactoring',
    title: 'Smart Refactoring',
    subtitle: 'Code Improvement Engine',
    description: 'Intelligently refactors code to improve maintainability, performance, and readability.',
    icon: '♻️',
    color: '#14b8a6',
    gradient: 'from-teal-500 to-emerald-500',
    features: ['Pattern detection', 'Dead code removal', 'Performance optimization', 'Structure improvement', 'Naming suggestions', 'Module extraction'],
    link: '/dashboard/bug-resolver',
    status: 'active',
  },
  {
    id: 'documentation',
    title: 'Auto Documentation',
    subtitle: 'Intelligent Doc Generation',
    description: 'Automatically generates comprehensive documentation for your code, APIs, and projects.',
    icon: '📚',
    color: '#f97316',
    gradient: 'from-orange-500 to-red-500',
    features: ['JSDoc generation', 'API documentation', 'README creation', 'Changelog generation', 'Architecture docs', 'Usage examples'],
    link: '/dashboard/generators',
    status: 'active',
  },
];

/* ──────────────── AGENTS DATA ──────────────── */
const AGENTS: Agent[] = [
  { id: 'a1', name: 'Architect', role: 'System Design', avatar: '🏗️', status: 'online', description: 'Designs system architecture and plans implementation strategies', capabilities: ['Architecture planning', 'Tech stack selection', 'Scalability design'] },
  { id: 'a2', name: 'Debugger', role: 'Bug Resolution', avatar: '🐛', status: 'online', description: 'Finds and fixes bugs with minimal code changes', capabilities: ['Error analysis', 'Root cause identification', 'Fix implementation'] },
  { id: 'a3', name: 'Optimizer', role: 'Performance', avatar: '⚡', status: 'busy', description: 'Optimizes code for speed, memory, and efficiency', capabilities: ['Performance profiling', 'Memory optimization', 'Algorithm improvement'] },
  { id: 'a4', name: 'Tester', role: 'Quality Assurance', avatar: '🧪', status: 'online', description: 'Creates and runs tests to ensure code quality', capabilities: ['Unit testing', 'Integration testing', 'E2E testing'] },
  { id: 'a5', name: 'Reviewer', role: 'Code Review', avatar: '👁️', status: 'online', description: 'Reviews code for quality, security, and best practices', capabilities: ['Code analysis', 'Security audit', 'Style checking'] },
  { id: 'a6', name: 'Writer', role: 'Documentation', avatar: '✍️', status: 'offline', description: 'Creates comprehensive documentation for projects', capabilities: ['API docs', 'README generation', 'Code comments'] },
  { id: 'a7', name: 'Planner', role: 'Task Management', avatar: '📋', status: 'online', description: 'Breaks down complex tasks into actionable steps', capabilities: ['Task decomposition', 'Priority setting', 'Timeline planning'] },
  { id: 'a8', name: 'Guardian', role: 'Security', avatar: '🛡️', status: 'online', description: 'Monitors and protects against security vulnerabilities', capabilities: ['Vulnerability scanning', 'Dependency auditing', 'Security patches'] },
];

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function ServicesPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'agents' | 'activity'>('services');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulated activity logs
  useEffect(() => {
    const sampleLogs: LogEntry[] = [
      { id: '1', time: '10:23:15', type: 'info', message: 'Agent Architect initialized', agent: 'Architect' },
      { id: '2', time: '10:23:16', type: 'thinking', message: 'Analyzing project structure...', agent: 'Architect' },
      { id: '3', time: '10:23:18', type: 'success', message: 'Detected: Next.js 14 with App Router', agent: 'Architect' },
      { id: '4', time: '10:23:20', type: 'info', message: 'Agent Debugger started', agent: 'Debugger' },
      { id: '5', time: '10:23:21', type: 'thinking', message: 'Scanning for potential issues...', agent: 'Debugger' },
      { id: '6', time: '10:23:23', type: 'warning', message: 'Found: 2 unused imports in utils.ts', agent: 'Debugger' },
      { id: '7', time: '10:23:25', type: 'success', message: 'Auto-fix applied: Removed unused imports', agent: 'Debugger' },
      { id: '8', time: '10:23:27', type: 'info', message: 'Agent Optimizer analyzing performance...', agent: 'Optimizer' },
      { id: '9', time: '10:23:29', type: 'thinking', message: 'Profiling component render times...', agent: 'Optimizer' },
      { id: '10', time: '10:23:31', type: 'success', message: 'Optimization: Memoized expensive computation', agent: 'Optimizer' },
    ];
    setLogs(sampleLogs);
  }, []);

  const simulateAgentWork = () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStep(0);

    const steps = [
      { type: 'info' as const, message: 'Initializing all agents...', agent: 'System' },
      { type: 'thinking' as const, message: 'Architect: Analyzing codebase structure...', agent: 'Architect' },
      { type: 'thinking' as const, message: 'Debugger: Scanning for issues...', agent: 'Debugger' },
      { type: 'thinking' as const, message: 'Optimizer: Profiling performance...', agent: 'Optimizer' },
      { type: 'thinking' as const, message: 'Tester: Running test suite...', agent: 'Tester' },
      { type: 'success' as const, message: 'Architect: Architecture analysis complete', agent: 'Architect' },
      { type: 'success' as const, message: 'Debugger: Found and fixed 3 issues', agent: 'Debugger' },
      { type: 'success' as const, message: 'Optimizer: 15% performance improvement identified', agent: 'Optimizer' },
      { type: 'warning' as const, message: 'Tester: 2 tests need attention', agent: 'Tester' },
      { type: 'success' as const, message: 'All agents completed their tasks!', agent: 'System' },
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, {
          id: `${Date.now()}-${i}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          ...step,
        }]);
        setCurrentStep(i);
        if (i === steps.length - 1) setIsRunning(false);
      }, (i + 1) * 800);
    });
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚡</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AbhiBase Services
          </h1>
        </div>
        <p className="text-zinc-400 text-lg">AI-powered development platform — Build, analyze, and ship faster</p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl w-fit">
          {(['services', 'agents', 'activity'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              {tab === 'services' ? '🚀 Services' : tab === 'agents' ? '🤖 AI Agents' : '📊 Activity'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ════ SERVICES TAB ════ */}
        {activeTab === 'services' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Services Grid */}
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
              {SERVICES.map(service => (
                <button key={service.id} onClick={() => setSelectedService(service)}
                  className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${selectedService?.id === service.id ? 'bg-gradient-to-br ' + service.gradient + ' border-transparent shadow-lg' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{service.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{service.title}</h3>
                      <p className="text-sm text-zinc-400 mb-3">{service.subtitle}</p>
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 3).map(f => (
                          <span key={f} className="text-xs bg-zinc-800/50 text-zinc-300 px-2 py-1 rounded">{f}</span>
                        ))}
                        {service.features.length > 3 && (
                          <span className="text-xs text-zinc-500">+{service.features.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Service Detail Panel */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-6">
              {selectedService ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{selectedService.icon}</span>
                    <div>
                      <h3 className="font-bold text-xl">{selectedService.title}</h3>
                      <p className="text-sm text-zinc-400">{selectedService.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 mb-6 leading-relaxed">{selectedService.description}</p>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-zinc-400 mb-3">CAPABILITIES</h4>
                    <div className="space-y-2">
                      {selectedService.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={simulateAgentWork} disabled={isRunning}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${isRunning ? 'bg-zinc-700 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500'}`}>
                    {isRunning ? '⏳ Running Agents...' : '▶️ Run Service Demo'}
                  </button>
                  <button onClick={() => router.push(selectedService.link)}
                    className="w-full mt-2 py-3 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all">
                    Open {selectedService.title} →
                  </button>
                </>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <span className="text-5xl block mb-4">👈</span>
                  <p>Select a service to see details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ AGENTS TAB ════ */}
        {activeTab === 'agents' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map(agent => (
              <div key={agent.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <span className="text-3xl">{agent.avatar}</span>
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${agent.status === 'online' ? 'bg-emerald-500' : agent.status === 'busy' ? 'bg-amber-500' : 'bg-zinc-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold">{agent.name}</h3>
                    <p className="text-xs text-zinc-500">{agent.role}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mb-3">{agent.description}</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map(c => (
                    <span key={c} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">{c}</span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors">Configure</button>
                  <button className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs font-medium transition-colors">Deploy</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ ACTIVITY TAB ════ */}
        {activeTab === 'activity' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Logs */}
            <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-sm">Live Activity Feed</span>
                </div>
                <span className="text-xs text-zinc-500">{logs.length} entries</span>
              </div>
              <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm space-y-1">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-zinc-600 shrink-0">{log.time}</span>
                    <span className={`shrink-0 ${log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'error' ? 'text-red-400' : log.type === 'thinking' ? 'text-purple-400' : 'text-zinc-400'}`}>
                      {log.type === 'success' ? '✓' : log.type === 'warning' ? '⚠' : log.type === 'error' ? '✕' : log.type === 'thinking' ? '◈' : '•'}
                    </span>
                    {log.agent && <span className="text-violet-400 shrink-0">[{log.agent}]</span>}
                    <span className="text-zinc-300">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
              <div className="px-4 py-3 border-t border-zinc-800">
                <button onClick={simulateAgentWork} disabled={isRunning}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${isRunning ? 'bg-zinc-700 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500'}`}>
                  {isRunning ? `⏳ Running... Step ${currentStep + 1}/10` : '▶️ Run All Agents'}
                </button>
              </div>
            </div>

            {/* Agent Status */}
            <div className="space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                <h3 className="font-bold text-sm mb-3">Agent Status</h3>
                <div className="space-y-2">
                  {AGENTS.map(agent => (
                    <div key={agent.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-emerald-500' : agent.status === 'busy' ? 'bg-amber-500' : 'bg-zinc-600'}`} />
                      <span className="flex-1">{agent.avatar} {agent.name}</span>
                      <span className="text-xs text-zinc-500 capitalize">{agent.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                <h3 className="font-bold text-sm mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tasks Done', value: '1,247', icon: '✅' },
                    { label: 'Issues Fixed', value: '89', icon: '🔧' },
                    { label: 'Lines Reviewed', value: '52K', icon: '👁️' },
                    { label: 'Uptime', value: '99.9%', icon: '🟢' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-zinc-800/50 rounded-xl p-3 text-center">
                      <span className="text-lg">{stat.icon}</span>
                      <div className="font-bold text-lg">{stat.value}</div>
                      <div className="text-xs text-zinc-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
