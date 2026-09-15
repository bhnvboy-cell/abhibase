'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AnalyticsOverview {
  totalEvents: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  activeUsers: number;
}

interface EventData {
  id: string;
  name: string;
  count: number;
  lastTriggered: string;
  trend: number;
}

interface SessionData {
  date: string;
  sessions: number;
  users: number;
  avgDuration: number;
}

interface FunnelStep {
  id: string;
  name: string;
  users: number;
  conversionRate: number;
}

interface UserBehavior {
  pageViews: { page: string; views: number; avgTime: number }[];
  deviceBreakdown: { device: string; percentage: number }[];
  topReferrers: { source: string; visits: number }[];
}

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalEvents: 0,
    totalSessions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    activeUsers: 0
  });
  const [events, setEvents] = useState<EventData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [behavior, setBehavior] = useState<UserBehavior>({
    pageViews: [],
    deviceBreakdown: [],
    topReferrers: []
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'funnel' | 'behavior'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [showCustomEvent, setShowCustomEvent] = useState(false);
  const [customEventName, setCustomEventName] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const [overviewData, dashboardData] = await Promise.all([
        api.analytics.overview(),
        api.analytics.getDashboard({ range: dateRange })
      ]);
      setOverview(overviewData as any);
      setEvents(dashboardData.dashboard?.events || []);
      setSessions(dashboardData.dashboard?.sessions || []);
      setFunnel(dashboardData.dashboard?.funnel || []);
      setBehavior(dashboardData.dashboard?.behavior || {});
    } catch (error) {
      console.error('Failed to load analytics');
    }
  };

  const trackCustomEvent = async () => {
    if (!customEventName.trim()) return;
    try {
      await api.analytics.trackEvent({ name: customEventName, type: 'custom' });
      setCustomEventName('');
      setShowCustomEvent(false);
      loadAnalytics();
    } catch (error) {
      console.error('Failed to track event');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => setShowCustomEvent(true)}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
          >
            + Track Event
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Total Events</p>
          <p className="text-2xl font-bold text-violet-400">{formatNumber(overview.totalEvents)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Sessions</p>
          <p className="text-2xl font-bold text-blue-400">{formatNumber(overview.totalSessions)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Avg Duration</p>
          <p className="text-2xl font-bold text-emerald-400">{formatDuration(overview.avgSessionDuration)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Bounce Rate</p>
          <p className="text-2xl font-bold text-amber-400">{overview.bounceRate.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Active Users</p>
          <p className="text-2xl font-bold text-cyan-400">{formatNumber(overview.activeUsers)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
        {(['overview', 'events', 'funnel', 'behavior'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'bg-violet-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab - Session Chart */}
      {activeTab === 'overview' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Sessions Over Time</h3>
          <div className="h-64 flex items-end gap-1">
            {sessions.map((s, i) => {
              const maxSessions = Math.max(...sessions.map(x => x.sessions));
              const height = maxSessions > 0 ? (s.sessions / maxSessions) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-violet-500/80 rounded-t hover:bg-violet-400 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${s.sessions} sessions on ${s.date}`}
                  />
                  {i % Math.ceil(sessions.length / 7) === 0 && (
                    <span className="text-xs text-zinc-500">
                      {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Event Tracking</h3>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p className="text-4xl mb-2">📊</p>
              <p>No events recorded yet</p>
              <p className="text-sm mt-2">Start tracking events to see data here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-zinc-400">
                        Last triggered: {new Date(event.lastTriggered).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatNumber(event.count)}</p>
                    <p className={`text-xs ${event.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {event.trend >= 0 ? '↑' : '↓'} {Math.abs(event.trend)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Funnel Tab */}
      {activeTab === 'funnel' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Conversion Funnel</h3>
          {funnel.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p className="text-4xl mb-2">🔀</p>
              <p>No funnel data available</p>
              <p className="text-sm mt-2">Define a funnel to track conversions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {funnel.map((step, i) => (
                <div key={step.id} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{step.name}</span>
                        <span className="text-sm text-zinc-400">
                          {formatNumber(step.users)} users
                        </span>
                      </div>
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${step.conversionRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-sm font-mono text-zinc-400">
                      {step.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="ml-4 h-4 border-l-2 border-dashed border-zinc-700" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Page Views */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Top Pages</h3>
            <div className="space-y-3">
              {behavior.pageViews.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-4">No data</p>
              ) : (
                behavior.pageViews.map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded">
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{page.page}</p>
                      <p className="text-xs text-zinc-400">{page.avgTime}s avg</p>
                    </div>
                    <span className="text-sm text-violet-400">{formatNumber(page.views)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Devices</h3>
            <div className="space-y-3">
              {behavior.deviceBreakdown.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-4">No data</p>
              ) : (
                behavior.deviceBreakdown.map((device, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{device.device}</span>
                      <span className="text-sm text-zinc-400">{device.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Referrers */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Top Referrers</h3>
            <div className="space-y-3">
              {behavior.topReferrers.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-4">No data</p>
              ) : (
                behavior.topReferrers.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded">
                    <span className="text-sm truncate">{ref.source}</span>
                    <span className="text-sm text-emerald-400">{formatNumber(ref.visits)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Event Modal */}
      {showCustomEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Track Custom Event</h2>
                <button onClick={() => setShowCustomEvent(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    placeholder="e.g., button_clicked"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCustomEvent(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={trackCustomEvent}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 py-2 rounded-lg"
                  >
                    Track Event
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
