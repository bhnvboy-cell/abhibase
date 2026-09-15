'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface PushSubscription {
  id: string;
  endpoint: string;
  device: string;
  browser: string;
  os: string;
  created_at: string;
  last_active: string;
}

interface NotificationPreference {
  id: string;
  category: string;
  enabled: boolean;
  email: boolean;
  push: boolean;
  in_app: boolean;
}

const NOTIFICATION_CATEGORIES = [
  { id: 'tasks', label: 'Tasks', icon: '📋', description: 'Task assignments, due dates, and updates' },
  { id: 'projects', label: 'Projects', icon: '📁', description: 'Project activity and mentions' },
  { id: 'messages', label: 'Messages', icon: '💬', description: 'Direct messages and group chats' },
  { id: 'habits', label: 'Habits', icon: '✅', description: 'Habit reminders and streaks' },
  { id: 'calendar', label: 'Calendar', icon: '📅', description: 'Event reminders and schedules' },
  { id: 'expenses', label: 'Expenses', icon: '💰', description: 'Expense splits and settlements' },
  { id: 'security', label: 'Security', icon: '🔒', description: 'Login alerts and security events' },
  { id: 'system', label: 'System', icon: '⚙️', description: 'System updates and maintenance' },
];

export function PushNotificationSettings() {
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadData();
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, prefs] = await Promise.all([
        api.notifications.push.list(),
        api.settings.getNotificationPreferences(),
      ]);
      setSubscriptions(subs.subscriptions || subs);
      setPreferences(prefs);
      setIsSubscribed((subs.subscriptions || subs).length > 0);
    } catch (error) {
      console.error('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    return result === 'granted';
  };

  const subscribe = async () => {
    try {
      setSubscribing(true);
      const granted = await requestPermission();
      if (!granted) return;

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        const deviceInfo = getDeviceInfo();
        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');
        
        await api.notifications.push.subscribe({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
            auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : '',
          },
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        });

        setIsSubscribed(true);
        loadData();
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setSubscribing(false);
    }
  };

  const unsubscribe = async (id?: string) => {
    try {
      if (id) {
        await api.notifications.push.unsubscribe(id);
      } else {
        for (const sub of subscriptions) {
          await api.notifications.push.unsubscribe(sub.id);
        }
      }
      setIsSubscribed(false);
      setSubscriptions([]);
    } catch (error) {
      console.error('Failed to unsubscribe');
    }
  };

  const sendTestNotification = async (deviceId?: string) => {
    try {
      setTestingId(deviceId || 'all');
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('AbhiBase Test', {
          body: 'Push notifications are working correctly!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test-notification',
        });
      }
    } catch (error) {
      console.error('Failed to send test notification');
    } finally {
      setTestingId(null);
    }
  };

  const updatePreference = async (categoryId: string, field: keyof NotificationPreference, value: boolean) => {
    const updated = preferences.map((p) =>
      p.id === categoryId ? { ...p, [field]: value } : p
    );
    setPreferences(updated);
    try {
      await api.settings.updateNotificationPreferences(updated);
    } catch (error) {
      console.error('Failed to update preferences');
      setPreferences(preferences);
    }
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

    if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
    else if (ua.includes('Tablet')) device = 'Tablet';

    return { browser, os, device };
  };

  const formatEndpoint = (endpoint: string) => {
    try {
      const url = new URL(endpoint);
      return url.hostname + url.pathname.substring(0, 20) + '...';
    } catch {
      return endpoint.substring(0, 40) + '...';
    }
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
      <h2 className="text-2xl font-bold">Push Notifications</h2>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Push Notification Status</h3>
            <p className="text-sm text-zinc-400">Receive notifications even when you're not on AbhiBase</p>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors ${
            isSubscribed ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}>
            <button
              onClick={isSubscribed ? () => unsubscribe() : subscribe}
              disabled={subscribing}
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                isSubscribed ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {permissionStatus === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-emerald-400 text-sm">✓ Push notifications are enabled</p>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Devices</h3>
          <button
            onClick={() => sendTestNotification()}
            disabled={testingId === 'all'}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            {testingId === 'all' ? 'Sending...' : '🔔 Test Notification'}
          </button>
        </div>
        <div className="space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-zinc-400 text-center py-6 text-sm">No devices subscribed</p>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {sub.device === 'Mobile' ? '📱' : sub.device === 'Tablet' ? '📟' : '💻'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{sub.os} — {sub.browser}</p>
                    <p className="text-xs text-zinc-400 font-mono">{formatEndpoint(sub.endpoint)}</p>
                    <p className="text-xs text-zinc-500">
                      Added {new Date(sub.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendTestNotification(sub.id)}
                    disabled={testingId === sub.id}
                    className="text-violet-400 hover:text-violet-300 text-sm"
                  >
                    {testingId === sub.id ? '...' : 'Test'}
                  </button>
                  <button
                    onClick={() => unsubscribe(sub.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const pref = preferences.find((p) => p.id === category.id) || {
              id: category.id,
              category: category.id,
              enabled: true,
              email: true,
              push: true,
              in_app: true,
            };
            return (
              <div key={category.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{category.label}</p>
                    <p className="text-xs text-zinc-400">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={pref.push}
                      onChange={(e) => updatePreference(category.id, 'push', e.target.checked)}
                      className="rounded border-zinc-600 bg-zinc-700 text-violet-500 focus:ring-violet-500"
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={pref.email}
                      onChange={(e) => updatePreference(category.id, 'email', e.target.checked)}
                      className="rounded border-zinc-600 bg-zinc-700 text-violet-500 focus:ring-violet-500"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={pref.in_app}
                      onChange={(e) => updatePreference(category.id, 'in_app', e.target.checked)}
                      className="rounded border-zinc-600 bg-zinc-700 text-violet-500 focus:ring-violet-500"
                    />
                    In-App
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
