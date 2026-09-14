'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export function SecuritySettings() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [logs, sessions] = await Promise.all([
        api.security.getAuditLogs(),
        api.security.getActiveSessions()
      ]);
      setAuditLogs(logs);
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Failed to load security data');
    }
  };

  const setup2FA = async () => {
    try {
      const data = await api.security.setup2FA();
      setQrCode(data.qrCode);
      setShowSetup2FA(true);
    } catch (error) {
      console.error('Failed to setup 2FA');
    }
  };

  const verify2FA = async () => {
    try {
      await api.security.verify2FA(verificationCode);
      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
    } catch (error) {
      console.error('Failed to verify 2FA');
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;
    try {
      await api.security.disable2FA();
      setTwoFactorEnabled(false);
    } catch (error) {
      console.error('Failed to disable 2FA');
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await api.security.revokeSession(sessionId);
      loadSecurityData();
    } catch (error) {
      console.error('Failed to revoke session');
    }
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      login: '🔑',
      logout: '🚪',
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      download: '📥',
      share: '🔗',
      export: '📤'
    };
    return icons[action.split('_')[0]] || '📋';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Security & Privacy</h2>

      {/* 2FA Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-zinc-400">Add an extra layer of security to your account</p>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors ${
            twoFactorEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}>
            <button
              onClick={twoFactorEnabled ? disable2FA : setup2FA}
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {twoFactorEnabled && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-emerald-400 text-sm">✓ Two-factor authentication is enabled</p>
          </div>
        )}

        {showSetup2FA && (
          <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-400 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                {qrCode ? (
                  <img src={qrCode} alt="2FA QR Code" className="w-full h-full" />
                ) : (
                  <div className="text-black text-center text-sm">Loading QR...</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                maxLength={6}
              />
              <button
                onClick={verify2FA}
                className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg"
              >
                Verify
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {session.device?.includes('Mobile') ? '📱' : '💻'}
                </span>
                <div>
                  <p className="text-sm font-medium">{session.device || 'Unknown Device'}</p>
                  <p className="text-xs text-zinc-400">
                    {session.ip_address} • Last active: {new Date(session.last_active).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Revoke
                </button>
              )}
              {session.current && (
                <span className="text-emerald-400 text-xs">Current</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Activity Log</h3>
        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No activity recorded yet</p>
          ) : (
            auditLogs.slice(0, 50).map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg">
                <span className="text-xl">{getActionIcon(log.action)}</span>
                <div className="flex-1">
                  <p className="text-sm">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-zinc-400">
                    {log.resource_type} • {new Date(log.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                {log.ip_address && (
                  <span className="text-xs text-zinc-500">{log.ip_address}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Data Management</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">📤</span>
              <span className="text-sm">Export All Data</span>
            </div>
            <span className="text-zinc-400">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">📥</span>
              <span className="text-sm">Import Data</span>
            </div>
            <span className="text-zinc-400">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">🗑️</span>
              <span className="text-sm text-red-400">Delete Account</span>
            </div>
            <span className="text-red-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
