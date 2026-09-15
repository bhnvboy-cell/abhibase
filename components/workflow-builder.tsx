'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: WorkflowAction[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowAction {
  id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  result: unknown;
}

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual', icon: '▶️' },
  { value: 'schedule', label: 'Schedule', icon: '🕐' },
  { value: 'event', label: 'Event', icon: '⚡' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: '📧' },
  { value: 'send_notification', label: 'Send Notification', icon: '🔔' },
  { value: 'update_record', label: 'Update Record', icon: '✏️' },
  { value: 'create_record', label: 'Create Record', icon: '➕' },
  { value: 'delete_record', label: 'Delete Record', icon: '🗑️' },
  { value: 'run_script', label: 'Run Script', icon: '📜' },
  { value: 'call_api', label: 'Call API', icon: '🌐' },
  { value: 'wait', label: 'Wait', icon: '⏳' },
];

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'runs'>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTriggerType, setFormTriggerType] = useState('manual');
  const [formTriggerConfig, setFormTriggerConfig] = useState<Record<string, unknown>>({});
  const [formActions, setFormActions] = useState<WorkflowAction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [w, r] = await Promise.all([api.workflows.list(), api.workflows.runs()]);
      setWorkflows(w as unknown as Workflow[]);
      setRuns(r as unknown as WorkflowRun[]);
    } catch (error) {
      console.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormTriggerType('manual');
    setFormTriggerConfig({});
    setFormActions([]);
    setSelectedWorkflow(null);
  };

  const openCreate = () => {
    resetForm();
    setActiveView('create');
  };

  const openEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setFormName(workflow.name);
    setFormDescription(workflow.description);
    setFormTriggerType(workflow.trigger_type);
    setFormTriggerConfig(workflow.trigger_config || {});
    setFormActions(workflow.actions || []);
    setActiveView('edit');
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formName,
        description: formDescription,
        trigger_type: formTriggerType,
        trigger_config: formTriggerConfig,
        actions: formActions,
      };
      if (selectedWorkflow) {
        await api.workflows.update(selectedWorkflow.id, payload);
      } else {
        await api.workflows.create(payload);
      }
      resetForm();
      setActiveView('list');
      loadData();
    } catch (error) {
      console.error('Failed to save workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.workflows.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete workflow');
    }
  };

  const handleRun = async (id: string) => {
    try {
      setRunningId(id);
      await api.workflows.run(id);
      loadData();
    } catch (error) {
      console.error('Failed to run workflow');
    } finally {
      setRunningId(null);
    }
  };

  const addAction = (type: string) => {
    const newAction: WorkflowAction = {
      id: `temp-${Date.now()}`,
      type,
      config: {},
      order: formActions.length,
    };
    setFormActions([...formActions, newAction]);
  };

  const removeAction = (index: number) => {
    setFormActions(formActions.filter((_, i) => i !== index));
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formActions.length) return;
    const updated = [...formActions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormActions(updated);
  };

  const updateActionConfig = (index: number, key: string, value: unknown) => {
    const updated = [...formActions];
    updated[index] = { ...updated[index], config: { ...updated[index].config, [key]: value } };
    setFormActions(updated);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return styles[status] || styles.draft;
  };

  const getTriggerInfo = (triggerType: string) => {
    return TRIGGER_TYPES.find((t) => t.value === triggerType) || TRIGGER_TYPES[0];
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
        <h2 className="text-2xl font-bold">Workflow Builder</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveView('list'); loadData(); }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'list' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Workflows
          </button>
          <button
            onClick={() => { setActiveView('runs'); loadData(); }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'runs' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Run History
          </button>
          <button
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + New Workflow
          </button>
        </div>
      </div>

      {activeView === 'list' && (
        <div className="space-y-3">
          {workflows.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <span className="text-4xl">🔄</span>
              <p className="mt-3 text-zinc-400">No workflows yet. Create your first automation.</p>
              <button
                onClick={openCreate}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Create Workflow
              </button>
            </div>
          ) : (
            workflows.map((workflow) => {
              const trigger = getTriggerInfo(workflow.trigger_type);
              return (
                <div
                  key={workflow.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(workflow.status)}`}>
                          {workflow.status}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-zinc-400 mt-1">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          {trigger.icon} {trigger.label}
                        </span>
                        <span>{workflow.actions?.length || 0} actions</span>
                        <span>Updated {new Date(workflow.updated_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRun(workflow.id)}
                        disabled={runningId === workflow.id}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        {runningId === workflow.id ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                            Running
                          </span>
                        ) : (
                          '▶ Run'
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(workflow)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
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
              {selectedWorkflow ? 'Edit Workflow' : 'Create Workflow'}
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
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Workflow"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What does this workflow do?"
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Trigger Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TRIGGER_TYPES.map((trigger) => (
                  <button
                    key={trigger.value}
                    onClick={() => setFormTriggerType(trigger.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      formTriggerType === trigger.value
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <span>{trigger.icon}</span>
                    <span>{trigger.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {formTriggerType === 'schedule' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Cron Expression</label>
                <input
                  type="text"
                  value={(formTriggerConfig.cron as string) || ''}
                  onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, cron: e.target.value })}
                  placeholder="0 * * * *"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">e.g., 0 9 * * * = daily at 9am</p>
              </div>
            )}

            {formTriggerType === 'webhook' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`https://abhibase.app/api/workflows/webhook/${selectedWorkflow?.id || 'new'}`}
                    readOnly
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-400 font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard?.writeText(`https://abhibase.app/api/workflows/webhook/${selectedWorkflow?.id || 'new'}`)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 rounded-lg text-sm"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}

            {formTriggerType === 'event' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Event Type</label>
                <select
                  value={(formTriggerConfig.event as string) || ''}
                  onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, event: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">Select event...</option>
                  <option value="record.created">Record Created</option>
                  <option value="record.updated">Record Updated</option>
                  <option value="record.deleted">Record Deleted</option>
                  <option value="user.joined">User Joined</option>
                  <option value="payment.received">Payment Received</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Actions</label>
              <div className="space-y-2">
                {formActions.map((action, index) => {
                  const actionType = ACTION_TYPES.find((a) => a.value === action.type);
                  return (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
                    >
                      <span className="text-zinc-500 text-sm">{index + 1}.</span>
                      <span className="text-lg">{actionType?.icon || '⚡'}</span>
                      <span className="flex-1 text-sm">{actionType?.label || action.type}</span>
                      <input
                        type="text"
                        value={(action.config.label as string) || ''}
                        onChange={(e) => updateActionConfig(index, 'label', e.target.value)}
                        placeholder="Label..."
                        className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        onClick={() => moveAction(index, 'up')}
                        disabled={index === 0}
                        className="text-zinc-400 hover:text-zinc-300 disabled:opacity-30 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveAction(index, 'down')}
                        disabled={index === formActions.length - 1}
                        className="text-zinc-400 hover:text-zinc-300 disabled:opacity-30 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3">
                <p className="text-xs text-zinc-500 mb-2">Add action:</p>
                <div className="flex flex-wrap gap-2">
                  {ACTION_TYPES.map((actionType) => (
                    <button
                      key={actionType.value}
                      onClick={() => addAction(actionType.value)}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      <span>{actionType.icon}</span>
                      <span>{actionType.label}</span>
                    </button>
                  ))}
                </div>
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
              {selectedWorkflow ? 'Save Changes' : 'Create Workflow'}
            </button>
          </div>
        </div>
      )}

      {activeView === 'runs' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Run History</h3>
          <div className="space-y-2">
            {runs.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">No runs yet</p>
            ) : (
              runs.map((run) => {
                const workflow = workflows.find((w) => w.id === run.workflow_id);
                return (
                  <div key={run.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {run.status === 'completed' ? '✅' : run.status === 'failed' ? '❌' : '⏳'}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{workflow?.name || 'Unknown Workflow'}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(run.started_at).toLocaleString('en-IN')}
                          {run.completed_at && ` → ${new Date(run.completed_at).toLocaleString('en-IN')}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(run.status)}`}>
                      {run.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
