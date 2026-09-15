'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Agent {
  id: string;
  name: string;
  type: 'assistant' | 'scheduler' | 'monitor' | 'responder' | 'custom';
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  last_run?: string;
  created_at: string;
  updated_at: string;
}

interface AgentLog {
  id: string;
  agent_id: string;
  task: string;
  status: string;
  result?: string;
  error?: string;
  started_at: string;
  completed_at?: string;
}

const AGENT_TYPES = [
  { value: 'assistant', label: 'Assistant', icon: '🤖', description: 'General-purpose AI helper' },
  { value: 'scheduler', label: 'Scheduler', icon: '🕐', description: 'Manages schedules and deadlines' },
  { value: 'monitor', label: 'Monitor', icon: '👁️', description: 'Watches for events and alerts' },
  { value: 'responder', label: 'Responder', icon: '💬', description: 'Auto-responds to messages' },
  { value: 'custom', label: 'Custom', icon: '⚙️', description: 'Custom workflow agent' },
];

const CAPABILITIES = [
  'task-management', 'note-taking', 'scheduling', 'email',
  'monitoring', 'reporting', 'integrations', 'analytics',
  'content-generation', 'summarization', 'translation', 'data-analysis'
];

export function AIAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'logs' | 'config'>('list');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState('');

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>('assistant');
  const [formCapabilities, setFormCapabilities] = useState<string[]>([]);
  const [formConfig, setFormConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.ai.agents.list();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (agentId: string) => {
    try {
      const data = await api.ai.agents.logs(agentId);
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to load logs');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType('assistant');
    setFormCapabilities([]);
    setFormConfig({});
    setSelectedAgent(null);
  };

  const openCreate = () => {
    resetForm();
    setActiveView('create');
  };

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormName(agent.name);
    setFormType(agent.type);
    setFormCapabilities(agent.capabilities || []);
    setFormConfig(agent.config || {});
    setActiveView('edit');
  };

  const openLogs = async (agent: Agent) => {
    setSelectedAgent(agent);
    await loadLogs(agent.id);
    setActiveView('logs');
  };

  const openConfig = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormConfig(agent.config || {});
    setActiveView('config');
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formName,
        type: formType,
        capabilities: formCapabilities,
        config: formConfig,
      };
      if (selectedAgent) {
        await api.ai.agents.update(selectedAgent.id, payload);
      } else {
        await api.ai.agents.create(payload);
      }
      resetForm();
      setActiveView('list');
      loadAgents();
    } catch (error) {
      console.error('Failed to save agent');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    try {
      await api.ai.agents.delete(id);
      loadAgents();
    } catch (error) {
      console.error('Failed to delete agent');
    }
  };

  const handleRun = async (agentId: string) => {
    if (!taskInput.trim()) return;
    try {
      setRunningId(agentId);
      await api.ai.agents.run(agentId, { task: taskInput.trim() });
      setTaskInput('');
      openLogs({ ...agents.find(a => a.id === agentId)!, id: agentId } as Agent);
    } catch (error) {
      console.error('Failed to run agent task');
    } finally {
      setRunningId(null);
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedAgent) return;
    try {
      await api.ai.agents.update(selectedAgent.id, { config: formConfig });
      setActiveView('list');
      loadAgents();
    } catch (error) {
      console.error('Failed to update config');
    }
  };

  const toggleCapability = (cap: string) => {
    setFormCapabilities(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      error: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return styles[status] || styles.inactive;
  };

  const getTypeInfo = (type: string) => {
    return AGENT_TYPES.find(t => t.value === type) || AGENT_TYPES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Superagents</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveView('list'); loadAgents(); }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'list' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => { setActiveView('logs'); setLogs([]); }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'logs' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + New Agent
          </button>
        </div>
      </div>

      {activeView === 'list' && (
        <div className="space-y-3">
          {agents.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <span className="text-4xl">🤖</span>
              <p className="mt-3 text-zinc-400">No agents yet. Create your first AI superagent.</p>
              <button
                onClick={openCreate}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Create Agent
              </button>
            </div>
          ) : (
            agents.map((agent) => {
              const typeInfo = getTypeInfo(agent.type);
              return (
                <div
                  key={agent.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{typeInfo.icon}</span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(agent.status)}`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-0.5">{typeInfo.label} — {typeInfo.description}</p>
                        {agent.capabilities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {agent.capabilities.slice(0, 4).map((cap) => (
                              <span key={cap} className="bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-400">
                                {cap}
                              </span>
                            ))}
                            {agent.capabilities.length > 4 && (
                              <span className="text-xs text-zinc-500">+{agent.capabilities.length - 4} more</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                          {agent.last_run && (
                            <span>Last run: {new Date(agent.last_run).toLocaleString('en-IN')}</span>
                          )}
                          <span>Created: {new Date(agent.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setTaskInput('');
                          openLogs(agent);
                        }}
                        disabled={runningId === agent.id}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        {runningId === agent.id ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                            Running
                          </span>
                        ) : (
                          '▶ Run'
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(agent)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openConfig(agent)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        ⚙
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {(activeView === 'create' || activeView === 'edit') && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedAgent ? 'Edit Agent' : 'Create Agent'}
            </h3>
            <button
              onClick={() => { resetForm(); setActiveView('list'); }}
              className="text-zinc-400 hover:text-zinc-300 text-sm"
            >
              ← Back
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Agent Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Agent"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Agent Type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {AGENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormType(type.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-colors ${
                      formType === type.value
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Capabilities</label>
              <div className="flex flex-wrap gap-2">
                {CAPABILITIES.map((cap) => (
                  <button
                    key={cap}
                    onClick={() => toggleCapability(cap)}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                      formCapabilities.includes(cap)
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { resetForm(); setActiveView('list'); }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formName.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {selectedAgent ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </div>
      )}

      {activeView === 'logs' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {selectedAgent ? `Logs — ${selectedAgent.name}` : 'All Agent Logs'}
            </h3>
            {selectedAgent && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Enter task for agent..."
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => handleRun(selectedAgent.id)}
                  disabled={!taskInput.trim() || runningId === selectedAgent.id}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  {runningId === selectedAgent.id ? 'Running...' : 'Run Task'}
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">No logs yet</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {log.status === 'completed' ? '✅' : log.status === 'failed' ? '❌' : '⏳'}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{log.task}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(log.started_at).toLocaleString('en-IN')}
                        {log.completed_at && ` → ${new Date(log.completed_at).toLocaleString('en-IN')}`}
                      </p>
                      {log.error && <p className="text-xs text-red-400 mt-1">{log.error}</p>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(log.status)}`}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeView === 'config' && selectedAgent && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configure — {selectedAgent.name}</h3>
            <button
              onClick={() => setActiveView('list')}
              className="text-zinc-400 hover:text-zinc-300 text-sm"
            >
              ← Back
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Max Tokens</label>
              <input
                type="number"
                value={(formConfig.maxTokens as number) || 2048}
                onChange={(e) => setFormConfig({ ...formConfig, maxTokens: parseInt(e.target.value) || 2048 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={(formConfig.temperature as number) || 0.7}
                onChange={(e) => setFormConfig({ ...formConfig, temperature: parseFloat(e.target.value) || 0.7 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">System Prompt</label>
              <textarea
                value={(formConfig.systemPrompt as string) || ''}
                onChange={(e) => setFormConfig({ ...formConfig, systemPrompt: e.target.value })}
                rows={4}
                placeholder="Instructions for the agent..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Schedule (cron)</label>
              <input
                type="text"
                value={(formConfig.schedule as string) || ''}
                onChange={(e) => setFormConfig({ ...formConfig, schedule: e.target.value })}
                placeholder="0 * * * *"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-violet-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Leave empty for manual-only execution</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Active</p>
                <p className="text-xs text-zinc-500">Enable or disable the agent</p>
              </div>
              <button
                onClick={() => setFormConfig({ ...formConfig, active: !formConfig.active })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formConfig.active ? 'bg-violet-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    formConfig.active ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setActiveView('list')}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateConfig}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
