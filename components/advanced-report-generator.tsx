'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ReportData {
  title: string;
  type: string;
  period: string;
  author: string;
  department: string;
  audience: string;
  data: { metric: string; value: string; change: string }[];
  sections: { title: string; content: string }[];
  recommendations: string[];
  color: string;
}

export default function AdvancedReportGenerator() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<ReportData>({
    title: '',
    type: 'Monthly Report',
    period: '',
    author: '',
    department: '',
    audience: 'Management',
    data: [{ metric: '', value: '', change: '' }],
    sections: [{ title: 'Executive Summary', content: '' }],
    recommendations: [],
    color: '#6366f1',
  });

  const [recommendationInput, setRecommendationInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const addMetric = () => {
    setReport(prev => ({ ...prev, data: [...prev.data, { metric: '', value: '', change: '' }] }));
  };

  const updateMetric = (index: number, field: string, value: string) => {
    setReport(prev => ({
      ...prev,
      data: prev.data.map((d, i) => i === index ? { ...d, [field]: value } : d)
    }));
  };

  const removeMetric = (index: number) => {
    setReport(prev => ({ ...prev, data: prev.data.filter((_, i) => i !== index) }));
  };

  const addSection = () => {
    setReport(prev => ({ ...prev, sections: [...prev.sections, { title: '', content: '' }] }));
  };

  const updateSection = (index: number, field: string, value: string) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const removeSection = (index: number) => {
    setReport(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
  };

  const addRecommendation = () => {
    if (recommendationInput.trim()) {
      setReport(prev => ({ ...prev, recommendations: [...prev.recommendations, recommendationInput.trim()] }));
      setRecommendationInput('');
    }
  };

  const generateWithAI = async () => {
    if (!report.title) {
      alert('Please fill in Report Title');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a professional ${report.type} report.

Title: ${report.title}
Period: ${report.period}
Department: ${report.department}
Audience: ${report.audience}
${report.data.filter(d => d.metric).map(d => `${d.metric}: ${d.value} (${d.change})`).join('\n')}

Create a complete report with:
1. Executive Summary (2-3 paragraphs)
2. Key Findings (3-5 bullet points)
3. Data Analysis section
4. Recommendations (3-5 actionable items)
5. Conclusion

Return JSON:
{
  "executive_summary": "paragraph...",
  "key_findings": ["finding 1", "finding 2"],
  "sections": [{"title": "Section", "content": "paragraph..."}],
  "recommendations": ["rec 1", "rec 2"]
}`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a business analyst. Create clear, data-driven reports with actionable insights.'
      });

      const parsed = JSON.parse(response.response);
      setReport(prev => ({
        ...prev,
        sections: [
          { title: 'Executive Summary', content: parsed.executive_summary || '' },
          { title: 'Key Findings', content: (parsed.key_findings || []).join('\n• ') },
          ...(parsed.sections || []),
        ],
        recommendations: parsed.recommendations || prev.recommendations,
      }));
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${report.title}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333;line-height:1.6}
      .report{max-width:800px;margin:0 auto}.header{border-bottom:3px solid ${report.color};padding-bottom:20px;margin-bottom:30px}
      .title{font-size:28px;font-weight:bold;color:${report.color}}.meta{color:#666;font-size:14px;margin-top:10px}
      .section{margin-bottom:25px}.section-title{font-size:16px;font-weight:bold;color:${report.color};margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #eee}
      .metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px}
      .metric-card{background:#f8f9fa;padding:15px;border-radius:8px;text-align:center}
      .metric-value{font-size:24px;font-weight:bold;color:${report.color}}.metric-label{font-size:12px;color:#666;margin-top:5px}
      .metric-change{font-size:12px;margin-top:5px}.positive{color:#10b981}.negative{color:#ef4444}
      .content{font-size:14px;color:#555;white-space:pre-line}
      @media print{body{padding:20px}}
    </style></head><body>${reportRef.current?.innerHTML || ''}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadReport = () => {
    const html = reportRef.current?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html><html><head><title>${report.title}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333;line-height:1.6}
      .report{max-width:800px;margin:0 auto}.header{border-bottom:3px solid ${report.color};padding-bottom:20px;margin-bottom:30px}
      .title{font-size:28px;font-weight:bold;color:${report.color}}.meta{color:#666;font-size:14px;margin-top:10px}
      .section{margin-bottom:25px}.section-title{font-size:16px;font-weight:bold;color:${report.color};margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #eee}
      .metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px}
      .metric-card{background:#f8f9fa;padding:15px;border-radius:8px;text-align:center}
      .metric-value{font-size:24px;font-weight:bold;color:${report.color}}.metric-label{font-size:12px;color:#666;margin-top:5px}
      .content{font-size:14px;color:#555;white-space:pre-line}
    </style></head><body><div class="report">${html}</div></body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Report Generator</h2>
          <p className="text-zinc-400">Create professional business reports with charts and analysis</p>
        </div>
        <button onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg">
          {activeTab === 'form' ? '👁️ Preview' : '✏️ Edit'}
        </button>
      </div>

      {activeTab === 'form' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">📊 Report Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Report Title *</label>
                <input type="text" value={report.title} onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Report Type</label>
                  <select value={report.type} onChange={(e) => setReport(prev => ({ ...prev, type: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    {['Weekly Summary', 'Monthly Report', 'Project Update', 'Analytics', 'Financial', 'Custom'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Period</label>
                  <input type="text" value={report.period} onChange={(e) => setReport(prev => ({ ...prev, period: e.target.value }))} placeholder="January 2024" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Author</label>
                  <input type="text" value={report.author} onChange={(e) => setReport(prev => ({ ...prev, author: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Department</label>
                  <input type="text" value={report.department} onChange={(e) => setReport(prev => ({ ...prev, department: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Accent Color</label>
                <div className="flex gap-2">
                  <input type="color" value={report.color} onChange={(e) => setReport(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded" />
                  <input type="text" value={report.color} onChange={(e) => setReport(prev => ({ ...prev, color: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                </div>
              </div>
              <button onClick={generateWithAI} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-2 rounded-lg font-medium">
                {isGenerating ? '⏳ Generating...' : '✨ Generate with AI'}
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">📈 Key Metrics</h3>
              <button onClick={addMetric} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">+ Add</button>
            </div>
            <div className="space-y-3">
              {report.data.map((d, i) => (
                <div key={i} className="grid grid-cols-7 gap-2 items-center">
                  <input type="text" value={d.metric} onChange={(e) => updateMetric(i, 'metric', e.target.value)} placeholder="Metric" className="col-span-3 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <input type="text" value={d.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} placeholder="Value" className="col-span-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <input type="text" value={d.change} onChange={(e) => updateMetric(i, 'change', e.target.value)} placeholder="+15%" className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <button onClick={() => removeMetric(i)} className="p-2 bg-red-600/20 text-red-400 rounded">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">📝 Report Sections</h3>
              <button onClick={addSection} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">+ Add Section</button>
            </div>
            <div className="space-y-4">
              {report.sections.map((section, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <input type="text" value={section.title} onChange={(e) => updateSection(i, 'title', e.target.value)} placeholder="Section Title" className="bg-transparent border-b border-zinc-600 font-semibold w-1/2" />
                    <button onClick={() => removeSection(i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                  </div>
                  <textarea value={section.content} onChange={(e) => updateSection(i, 'content', e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm resize-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">💡 Recommendations</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" value={recommendationInput} onChange={(e) => setRecommendationInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRecommendation()} placeholder="Add recommendation..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
              <button onClick={addRecommendation} className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-sm">+</button>
            </div>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2 text-sm">
                  <span>💡 {rec}</span>
                  <button onClick={() => setReport(prev => ({ ...prev, recommendations: prev.recommendations.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-300">×</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Report Preview */
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden" ref={reportRef}>
          <div className="report p-8">
            <div className="header">
              <h1 className="title">{report.title || 'Report Title'}</h1>
              <div className="meta">
                {report.author && <span>By {report.author}</span>}
                {report.department && <span> • {report.department}</span>}
                {report.period && <span> • {report.period}</span>}
              </div>
            </div>

            {/* Metrics Grid */}
            {report.data.some(d => d.metric) && (
              <div className="metric-grid">
                {report.data.filter(d => d.metric).map((d, i) => (
                  <div key={i} className="metric-card">
                    <div className="metric-value">{d.value || '—'}</div>
                    <div className="metric-label">{d.metric}</div>
                    {d.change && (
                      <div className={`metric-change ${d.change.startsWith('+') ? 'positive' : 'negative'}`}>
                        {d.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sections */}
            {report.sections.filter(s => s.title || s.content).map((section, i) => (
              <div key={i} className="section">
                <h2 className="section-title">{section.title}</h2>
                <div className="content">{section.content}</div>
              </div>
            ))}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="section">
                <h2 className="section-title">Recommendations</h2>
                <ul className="content">
                  {report.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium">🖨️ Print</button>
          <button onClick={downloadReport} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">💾 Download HTML</button>
          <button onClick={() => navigator.clipboard.writeText(reportRef.current?.innerText || '')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg">📋 Copy Text</button>
        </div>
      </div>
    </div>
  );
}
