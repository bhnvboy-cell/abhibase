'use client';

import { useState } from 'react';
import { EMAIL_TEMPLATES, replacePlaceholders } from '@/lib/local-templates';

export default function LocalEmailGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    email: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    ctaText: 'Get Started',
    ctaLink: '#',
    discount: '20',
    promoCode: 'SAVE20',
    expiryDate: '2024-12-31',
    orderId: '12345',
    itemCount: '3',
    subtotal: '$99.99',
    shipping: '$9.99',
    total: '$109.98',
    trackLink: '#',
    topic: 'our partnership',
    message: 'I wanted to check if you had a chance to review my proposal.',
    senderName: 'John Doe',
    painPoint: 'customer retention',
    observation: 'growing rapidly',
    socialProof: 'Company X and Y',
    solution: 'automating your workflow',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    year: new Date().getFullYear().toString(),
    unsubscribeLink: '#'
  });

  const [activeTab, setActiveTab] = useState<'select' | 'customize' | 'preview'>('select');
  const [showHtml, setShowHtml] = useState(false);
  const [copied, setCopied] = useState(false);

  const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

  const renderPreview = () => {
    if (!template) return '';
    return replacePlaceholders(template.html, {
      ...formData,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const html = renderPreview();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template?.name.toLowerCase().replace(/\s+/g, '-') || 'email'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Template Generator</h2>
        <p className="text-zinc-400">Create professional emails instantly - no AI needed</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['select', 'customize', 'preview'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-violet-600' : 'bg-zinc-700'}`}
          >
            {tab === 'select' ? '📋 Templates' : tab === 'customize' ? '✏️ Customize' : '👁️ Preview'}
          </button>
        ))}
      </div>

      {activeTab === 'select' && (
        <div className="grid md:grid-cols-3 gap-4">
          {EMAIL_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplate(t.id); setActiveTab('customize'); }}
              className={`bg-zinc-900/50 border rounded-xl p-6 text-left hover:border-zinc-700 transition-all ${
                selectedTemplate === t.id ? 'border-violet-500' : 'border-zinc-800'
              }`}
            >
              <span className="text-xs bg-zinc-700 px-2 py-1 rounded">{t.category}</span>
              <h3 className="font-semibold mt-3">{t.name}</h3>
              <p className="text-sm text-zinc-400 mt-1">{t.subject}</p>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'customize' && template && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Customize Template</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand Name *</label>
                <input type="text" value={formData.brand} onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Recipient Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.primaryColor} onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={formData.primaryColor} onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.secondaryColor} onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={formData.secondaryColor} onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">CTA Button Text</label>
                <input type="text" value={formData.ctaText} onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">CTA Link</label>
                <input type="text" value={formData.ctaLink} onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              {template.id === 'promotional' && (
                <>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Discount %</label>
                    <input type="text" value={formData.discount} onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Promo Code</label>
                    <input type="text" value={formData.promoCode} onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  </div>
                </>
              )}
              {template.id === 'transactional' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Order ID</label>
                      <input type="text" value={formData.orderId} onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Total</label>
                      <input type="text" value={formData.total} onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                    </div>
                  </div>
                </>
              )}
              <button onClick={() => setActiveTab('preview')} className="w-full bg-violet-600 hover:bg-violet-700 py-2 rounded-lg font-medium">
                Preview Email →
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Template Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="bg-zinc-100 p-3 border-b text-sm">
                <div className="font-semibold">{replacePlaceholders(template.subject, formData)}</div>
                <div className="text-zinc-500 text-xs">{template.preheader}</div>
              </div>
              <div className="p-4 text-sm text-zinc-600">
                <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && template && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{template.name} - Final Preview</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowHtml(!showHtml)} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">
                {showHtml ? '👁️ Visual' : '📝 HTML'}
              </button>
              <button onClick={() => copyToClipboard(showHtml ? renderPreview() : renderPreview())} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
              <button onClick={downloadHtml} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">
                💾 Download
              </button>
            </div>
          </div>

          {showHtml ? (
            <pre className="bg-zinc-800 rounded-lg p-4 overflow-auto max-h-[600px] text-sm font-mono text-green-400">
              {renderPreview()}
            </pre>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <iframe srcDoc={renderPreview()} className="w-full h-[600px] border-0" title="Email Preview" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
