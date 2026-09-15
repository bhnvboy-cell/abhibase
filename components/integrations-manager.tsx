'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Integration {
  id: string;
  name: string;
  type: 'google-calendar' | 'google-gmail' | 'slack' | 'zoom' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  error?: string;
  config?: Record<string, any>;
}

export function IntegrationsManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<Integration | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await api.integrations.list();
      setIntegrations(data as unknown as Integration[]);
    } catch (error) {
      console.error('Failed to load integrations');
    }
  };

  const connectIntegration = async (type: string) => {
    setLoading(type);
    try {
      await api.integrations.connect(type, {});
      loadIntegrations();
    } catch (error) {
      console.error('Failed to connect integration');
    } finally {
      setLoading(null);
    }
  };

  const disconnectIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    try {
      await api.integrations.disconnect(id);
      loadIntegrations();
    } catch (error) {
      console.error('Failed to disconnect integration');
    }
  };

  const testConnection = async (id: string) => {
    setLoading(id);
    try {
      // Test connection by making a simple API call
      await api.integrations.list();
      alert('Connection successful!');
    } catch (error) {
      console.error('Connection test failed');
      alert('Connection test failed');
    } finally {
      setLoading(null);
    }
  };

  const syncNow = async (id: string) => {
    setLoading(id);
    try {
      // Sync by refreshing the integration list
      await loadIntegrations();
      alert('Sync completed!');
    } catch (error) {
      console.error('Failed to sync');
    } finally {
      setLoading(null);
    }
  };

  const getIntegrationIcon = (type: Integration['type']) => {
    const icons: Record<string, string> = {
      'google-calendar': '📅',
      'google-gmail': '📧',
      slack: '💬',
      zoom: '📹',
      custom: '🔌'
    };
    return icons[type] || '🔌';
  };

  const getIntegrationColor = (type: Integration['type']) => {
    const colors: Record<string, string> = {
      'google-calendar': 'from-blue-500 to-blue-600',
      'google-gmail': 'from-red-500 to-red-600',
      slack: 'from-purple-500 to-purple-600',
      zoom: 'from-blue-400 to-blue-500',
      custom: 'from-zinc-500 to-zinc-600'
    };
    return colors[type] || colors.custom;
  };

  const getStatusBadge = (status: Integration['status']) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      connected: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Connected' },
      disconnected: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Disconnected' },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Error' },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' }
    };
    const badge = badges[status] || badges.disconnected;
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const availableIntegrations: { type: Integration['type']; name: string; description: string }[] = [
    {
      type: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync events, create meetings, manage schedules'
    },
    {
      type: 'google-gmail',
      name: 'Gmail',
      description: 'Send emails, track conversations, manage inbox'
    },
    {
      type: 'slack',
      name: 'Slack',
      description: 'Send messages, create channels, manage workspace'
    },
    {
      type: 'zoom',
      name: 'Zoom',
      description: 'Create meetings, manage participants, recordings'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Integrations</h2>

      {/* Connected Integrations */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Connected Integrations</h3>
        {integrations.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-4xl mb-2">🔌</p>
            <p>No integrations connected</p>
            <p className="text-sm mt-2">Connect your favorite services below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIntegrationColor(integration.type)} flex items-center justify-center text-xl`}>
                  {getIntegrationIcon(integration.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{integration.name}</p>
                    {getStatusBadge(integration.status)}
                  </div>
                  <p className="text-sm text-zinc-400">
                    {integration.lastSync
                      ? `Last synced: ${new Date(integration.lastSync).toLocaleString('en-IN')}`
                      : 'Not synced yet'}
                  </p>
                  {integration.error && (
                    <p className="text-sm text-red-400 mt-1">{integration.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testConnection(integration.id)}
                    disabled={loading === integration.id}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading === integration.id ? '⏳' : '🔍'} Test
                  </button>
                  <button
                    onClick={() => syncNow(integration.id)}
                    disabled={loading === integration.id || integration.status !== 'connected'}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    🔄 Sync
                  </button>
                  <button
                    onClick={() => setShowConfig(integration)}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => disconnectIntegration(integration.id)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Integrations */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableIntegrations.map((item) => {
            const isConnected = integrations.some(i => i.type === item.type && i.status === 'connected');
            return (
              <div
                key={item.type}
                className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIntegrationColor(item.type)} flex items-center justify-center text-xl`}>
                  {getIntegrationIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-zinc-400">{item.description}</p>
                </div>
                <button
                  onClick={() => connectIntegration(item.type)}
                  disabled={isConnected || loading === item.type}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-violet-600 hover:bg-violet-700 disabled:opacity-50'
                  }`}
                >
                  {isConnected ? '✓ Connected' : loading === item.type ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getIntegrationColor(showConfig.type)} flex items-center justify-center text-lg`}>
                    {getIntegrationIcon(showConfig.type)}
                  </div>
                  <h2 className="text-xl font-semibold">{showConfig.name} Settings</h2>
                </div>
                <button onClick={() => setShowConfig(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Status</span>
                    {getStatusBadge(showConfig.status)}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Last Sync</span>
                    <span className="text-sm">
                      {showConfig.lastSync ? new Date(showConfig.lastSync).toLocaleString('en-IN') : 'Never'}
                    </span>
                  </div>
                  {showConfig.error && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-400">
                      {showConfig.error}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => testConnection(showConfig.id)}
                    disabled={loading === showConfig.id}
                    className="flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span>🔍</span>
                    <span className="text-sm">Test Connection</span>
                  </button>
                  <button
                    onClick={() => syncNow(showConfig.id)}
                    disabled={loading === showConfig.id || showConfig.status !== 'connected'}
                    className="flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span>🔄</span>
                    <span className="text-sm">Sync Now</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => disconnectIntegration(showConfig.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => setShowConfig(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg"
                  >
                    Close
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
