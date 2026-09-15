'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface TestResult {
  id: string;
  app_id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration?: number;
  error?: string;
  details?: string;
  created_at: string;
}

interface SecurityScan {
  id: string;
  app_id: string;
  scan_type: string;
  status: 'completed' | 'running' | 'failed';
  vulnerabilities: Vulnerability[];
  score: number;
  scanned_at: string;
}

interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

interface PerformanceMetrics {
  load_time: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  cumulative_layout_shift: number;
  total_blocking_time: number;
  speed_index: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
}

interface AppTestProps {
  appId?: string;
}

const TEST_TYPES = [
  { value: 'unit', label: 'Unit Tests', icon: '🧩' },
  { value: 'integration', label: 'Integration', icon: '🔗' },
  { value: 'e2e', label: 'E2E Tests', icon: '🌐' },
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'security', label: 'Security', icon: '🔒' },
];

export function AppTesting({ appId }: AppTestProps) {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tests' | 'security' | 'performance' | 'history'>('tests');
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [runningScan, setRunningScan] = useState(false);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const [testsData, scansData] = await Promise.all([
        api.apps.tests.list(appId),
        api.apps.security.list(appId),
      ]);
      setTests(testsData.tests);
      setScans(scansData.scans);
    } catch (error) {
      console.error('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  const runTests = async (type: string) => {
    if (!appId) return;
    try {
      setRunningTest(type);
      await api.apps.tests.create(appId, { type, status: 'running' });
      loadData();
    } catch (error) {
      console.error('Failed to run tests');
    } finally {
      setRunningTest(null);
    }
  };

  const runSecurityScan = async () => {
    if (!appId) return;
    try {
      setRunningScan(true);
      await api.apps.security.scan(appId, { scan_type: 'full' });
      loadData();
    } catch (error) {
      console.error('Failed to run security scan');
    } finally {
      setRunningScan(false);
    }
  };

  const runPerformanceAudit = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const mockMetrics: PerformanceMetrics = {
        load_time: 1.2 + Math.random() * 2,
        first_contentful_paint: 0.8 + Math.random() * 1.5,
        largest_contentful_paint: 1.5 + Math.random() * 2,
        cumulative_layout_shift: Math.random() * 0.3,
        total_blocking_time: 100 + Math.random() * 300,
        speed_index: 1.0 + Math.random() * 2,
        performance_score: 60 + Math.floor(Math.random() * 40),
        accessibility_score: 70 + Math.floor(Math.random() * 30),
        best_practices_score: 65 + Math.floor(Math.random() * 35),
        seo_score: 75 + Math.floor(Math.random() * 25),
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to run performance audit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      passed: '✅',
      failed: '❌',
      running: '⏳',
      pending: '⏸️',
      completed: '✅',
      error: '❌',
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      passed: 'text-emerald-400',
      failed: 'text-red-400',
      running: 'text-yellow-400',
      pending: 'text-zinc-400',
      completed: 'text-emerald-400',
      error: 'text-red-400',
    };
    return colors[status] || 'text-zinc-400';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      info: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };
    return colors[severity] || colors.info;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalVulnerabilities = scans.reduce((acc, s) => acc + s.vulnerabilities.length, 0);

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
        <h2 className="text-2xl font-bold">App Testing</h2>
        <div className="flex gap-2">
          {['tests', 'security', 'performance', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Tests Passed</p>
          <p className="text-2xl font-bold text-emerald-400">{passedTests}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Tests Failed</p>
          <p className="text-2xl font-bold text-red-400">{failedTests}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Vulnerabilities</p>
          <p className="text-2xl font-bold text-yellow-400">{totalVulnerabilities}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1">Performance</p>
          <p className={`text-2xl font-bold ${getScoreColor(metrics?.performance_score ?? 0)}`}>
            {metrics?.performance_score ?? '--'}
          </p>
        </div>
      </div>

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {TEST_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => runTests(type.value)}
                disabled={runningTest !== null}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <span>{type.icon}</span>
                <span>{runningTest === type.value ? 'Running...' : `Run ${type.label}`}</span>
              </button>
            ))}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-semibold">Test Results</h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {tests.length === 0 ? (
                <div className="p-8 text-center text-zinc-400">
                  No tests run yet. Select a test type above to get started.
                </div>
              ) : (
                tests.map((test) => (
                  <div key={test.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusIcon(test.status)}</span>
                      <div>
                        <p className="text-sm font-medium">{test.name}</p>
                        <p className="text-xs text-zinc-400">
                          {TEST_TYPES.find(t => t.value === test.type)?.label || test.type}
                          {test.duration && ` • ${test.duration}ms`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Security Scans</h3>
            <button
              onClick={runSecurityScan}
              disabled={runningScan}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {runningScan ? 'Scanning...' : 'Run Full Scan'}
            </button>
          </div>

          {scans.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <span className="text-4xl">🔒</span>
              <p className="mt-3 text-zinc-400">No security scans yet. Run your first scan to check for vulnerabilities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => (
                <div key={scan.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusIcon(scan.status)}</span>
                      <div>
                        <p className="font-semibold">{scan.scan_type} Scan</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(scan.scanned_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Score:</span>
                      <span className={`text-lg font-bold ${getScoreColor(scan.score)}`}>
                        {scan.score}/100
                      </span>
                    </div>
                  </div>

                  {scan.vulnerabilities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400 mb-2">
                        {scan.vulnerabilities.length} vulnerabilities found:
                      </p>
                      {scan.vulnerabilities.map((vuln, i) => (
                        <div
                          key={i}
                          className="bg-zinc-800/50 rounded-lg p-3 flex items-start gap-3"
                        >
                          <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm">{vuln.description}</p>
                            {vuln.file && (
                              <p className="text-xs text-zinc-500 mt-1">
                                {vuln.file}{vuln.line ? `:${vuln.line}` : ''}
                              </p>
                            )}
                            {vuln.recommendation && (
                              <p className="text-xs text-violet-400 mt-1">{vuln.recommendation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {scan.vulnerabilities.length === 0 && scan.status === 'completed' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-emerald-400">No vulnerabilities found! Your app looks secure.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Performance Metrics</h3>
            <button
              onClick={runPerformanceAudit}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Run Audit
            </button>
          </div>

          {!metrics ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <span className="text-4xl">⚡</span>
              <p className="mt-3 text-zinc-400">Run a performance audit to see metrics.</p>
            </div>
          ) : (
            <>
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Performance', score: metrics.performance_score },
                  { label: 'Accessibility', score: metrics.accessibility_score },
                  { label: 'Best Practices', score: metrics.best_practices_score },
                  { label: 'SEO', score: metrics.seo_score },
                ].map((item) => (
                  <div key={item.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-400 mb-2">{item.label}</p>
                    <div className="relative h-16 w-16 mx-auto">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#27272a"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={item.score >= 90 ? '#22c55e' : item.score >= 50 ? '#eab308' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${item.score}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>
                          {item.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Core Web Vitals */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h4 className="font-semibold mb-4">Core Web Vitals</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Load Time', value: `${metrics.load_time.toFixed(2)}s`, metric: metrics.load_time, threshold: 3 },
                    { label: 'FCP', value: `${metrics.first_contentful_paint.toFixed(2)}s`, metric: metrics.first_contentful_paint, threshold: 2.5 },
                    { label: 'LCP', value: `${metrics.largest_contentful_paint.toFixed(2)}s`, metric: metrics.largest_contentful_paint, threshold: 4 },
                    { label: 'CLS', value: metrics.cumulative_layout_shift.toFixed(3), metric: metrics.cumulative_layout_shift, threshold: 0.25 },
                    { label: 'TBT', value: `${metrics.total_blocking_time.toFixed(0)}ms`, metric: metrics.total_blocking_time, threshold: 300 },
                    { label: 'Speed Index', value: `${metrics.speed_index.toFixed(2)}s`, metric: metrics.speed_index, threshold: 3.4 },
                  ].map((item) => (
                    <div key={item.label} className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                      <p className={`text-lg font-bold ${
                        item.metric <= item.threshold * 0.7 ? 'text-emerald-400' :
                        item.metric <= item.threshold ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {item.value}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Target: &lt;{item.threshold}{item.label === 'CLS' ? '' : 's'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-semibold">Test History</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {tests.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                No test history yet.
              </div>
            ) : (
              tests.map((test) => (
                <div key={test.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getStatusIcon(test.status)}</span>
                    <div>
                      <p className="text-sm font-medium">{test.name}</p>
                      <p className="text-xs text-zinc-400">
                        {TEST_TYPES.find(t => t.value === test.type)?.label || test.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(test.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
