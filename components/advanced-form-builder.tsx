'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface FormField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
  submitText: string;
  style: string;
  color: string;
  successMessage: string;
}

export default function AdvancedFormBuilder() {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormData>({
    title: 'Contact Us',
    description: 'We\'d love to hear from you',
    fields: [
      { id: '1', label: 'Name', type: 'text', placeholder: 'Your name', required: true },
      { id: '2', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
    ],
    submitText: 'Submit',
    style: 'Modern',
    color: '#6366f1',
    successMessage: 'Thank you! We\'ll get back to you soon.',
  });

  const [newOption, setNewOption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'code'>('form');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const addField = (type: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: type === 'heading' ? 'Section Heading' : `New ${type} field`,
      type,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
    };
    setForm(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const removeField = (id: string) => {
    setForm(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }));
  };

  const addOption = (fieldId: string) => {
    if (newOption.trim()) {
      const field = form.fields.find(f => f.id === fieldId);
      if (field) {
        updateField(fieldId, { options: [...(field.options || []), newOption.trim()] });
        setNewOption('');
      }
    }
  };

  const removeOption = (fieldId: string, optIndex: number) => {
    const field = form.fields.find(f => f.id === fieldId);
    if (field?.options) {
      updateField(fieldId, { options: field.options.filter((_, i) => i !== optIndex) });
    }
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Create a professional ${form.title} form with the following context:
Title: ${form.title}
Description: ${form.description}

Generate appropriate form fields with labels, types, and placeholders. Return JSON:
{
  "fields": [
    {"label": "Field Name", "type": "text|email|phone|textarea|select|radio|checkbox|number|date|file", "placeholder": "...", "required": true/false, "options": []}
  ],
  "submitText": "Button text",
  "successMessage": "Thank you message"
}`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a UX form designer. Create user-friendly forms with clear labels and appropriate field types.'
      });

      const parsed = JSON.parse(response.response);
      if (parsed.fields) {
        setForm(prev => ({
          ...prev,
          fields: parsed.fields.map((f: any, i: number) => ({
            id: (i + 1).toString(),
            label: f.label,
            type: f.type,
            placeholder: f.placeholder,
            required: f.required,
            options: f.options,
          })),
          submitText: parsed.submitText || prev.submitText,
          successMessage: parsed.successMessage || prev.successMessage,
        }));
      }
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHtmlCode = (): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${form.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 40px 20px; }
    .form-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .form-header { background: ${form.color}; color: white; padding: 30px; text-align: center; }
    .form-header h1 { font-size: 24px; margin-bottom: 8px; }
    .form-header p { opacity: 0.9; font-size: 14px; }
    .form-body { padding: 30px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 6px; }
    label .required { color: ${form.color}; }
    input, textarea, select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: ${form.color}; }
    textarea { resize: vertical; min-height: 100px; }
    .checkbox-group, .radio-group { display: flex; flex-direction: column; gap: 8px; }
    .checkbox-group label, .radio-group label { display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; }
    .submit-btn { width: 100%; background: ${form.color}; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .submit-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="form-header">
      <h1>${form.title}</h1>
      <p>${form.description}</p>
    </div>
    <div class="form-body">
      <form onsubmit="event.preventDefault(); alert('${form.successMessage}');">
${form.fields.map(f => {
  if (f.type === 'textarea') {
    return `        <div class="form-group">
          <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
          <textarea name="${f.label}" placeholder="${f.placeholder}" ${f.required ? 'required' : ''}></textarea>
        </div>`;
  } else if (f.type === 'select') {
    return `        <div class="form-group">
          <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
          <select name="${f.label}" ${f.required ? 'required' : ''}>
            <option value="">Select...</option>
${(f.options || []).map(o => `            <option value="${o}">${o}</option>`).join('\n')}
          </select>
        </div>`;
  } else if (f.type === 'radio') {
    return `        <div class="form-group">
          <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
          <div class="radio-group">
${(f.options || []).map(o => `            <label><input type="radio" name="${f.label}" value="${o}" ${f.required ? 'required' : ''}> ${o}</label>`).join('\n')}
          </div>
        </div>`;
  } else if (f.type === 'checkbox') {
    return `        <div class="form-group">
          <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
          <div class="checkbox-group">
${(f.options || []).map(o => `            <label><input type="checkbox" name="${f.label}" value="${o}"> ${o}</label>`).join('\n')}
          </div>
        </div>`;
  } else {
    return `        <div class="form-group">
          <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
          <input type="${f.type}" name="${f.label}" placeholder="${f.placeholder}" ${f.required ? 'required' : ''}>
        </div>`;
  }
}).join('\n')}
        <button type="submit" class="submit-btn">${form.submitText}</button>
      </form>
    </div>
  </div>
</body>
</html>`;
  };

  const downloadCode = () => {
    const blob = new Blob([generateHtmlCode()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title.toLowerCase().replace(/\s+/g, '-')}-form.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Form Builder</h2>
          <p className="text-zinc-400">Create beautiful forms with live preview and export</p>
        </div>
        <div className="flex gap-2">
          {['form', 'preview', 'code'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-violet-600' : 'bg-zinc-700'}`}>
              {tab === 'form' ? '✏️ Build' : tab === 'preview' ? '👁️ Preview' : '📝 Code'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Field Types */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">➕ Add Fields</h3>
            <div className="grid grid-cols-2 gap-2">
              {['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file'].map(type => (
                <button key={type} onClick={() => addField(type)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm capitalize">
                  {type}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Form Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Submit Button</label>
                <input type="text" value={form.submitText} onChange={(e) => setForm(prev => ({ ...prev, submitText: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Color</label>
                <div className="flex gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded" />
                  <input type="text" value={form.color} onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                </div>
              </div>
              <button onClick={generateWithAI} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-2 rounded-lg font-medium">
                {isGenerating ? '⏳ Generating...' : '✨ Generate Fields with AI'}
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">📋 Form Fields ({form.fields.length})</h3>
            <div className="space-y-3">
              {form.fields.map((field, i) => (
                <div key={field.id} className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-zinc-700 px-2 py-1 rounded">{field.type}</span>
                      <input type="text" value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="bg-transparent font-medium" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="rounded" />
                        Required
                      </label>
                      <button onClick={() => removeField(field.id)} className="text-red-400 hover:text-red-300">×</button>
                    </div>
                  </div>
                  <input type="text" value={field.placeholder} onChange={(e) => updateField(field.id, { placeholder: e.target.value })} placeholder="Placeholder text" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-sm mb-2" />
                  {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input type="text" value={newOption} onChange={(e) => setNewOption(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOption(field.id)} placeholder="Add option..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-sm" />
                        <button onClick={() => addOption(field.id)} className="px-2 bg-violet-600 rounded text-sm">+</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(field.options || []).map((opt, oi) => (
                          <span key={oi} className="bg-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                            {opt}
                            <button onClick={() => removeOption(field.id, oi)} className="text-zinc-400 hover:text-red-400">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'preview' ? (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl mx-auto" ref={formRef}>
          {submitted ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">{form.successMessage}</h3>
              <button onClick={() => { setSubmitted(false); setFormValues({}); }} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg">Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="p-6" style={{ backgroundColor: form.color }}>
                <h2 className="text-2xl font-bold text-white">{form.title}</h2>
                <p className="text-white/80 mt-1">{form.description}</p>
              </div>
              <div className="p-6 space-y-4">
                {form.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        required={field.required}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-2">
                        {(field.options || []).map(opt => (
                          <label key={opt} className="flex items-center gap-2">
                            <input type="radio" name={field.id} value={opt} onChange={(e) => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))} className="text-indigo-600" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="space-y-2">
                        {(field.options || []).map(opt => (
                          <label key={opt} className="flex items-center gap-2">
                            <input type="checkbox" value={opt} className="text-indigo-600 rounded" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-6 pt-0">
                <button type="submit" className="w-full py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: form.color }}>
                  {form.submitText}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Code View */
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">HTML Code</h3>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(generateHtmlCode())} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">📋 Copy</button>
              <button onClick={downloadCode} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">💾 Download</button>
            </div>
          </div>
          <pre className="bg-zinc-800 rounded-lg p-4 overflow-auto max-h-[500px] text-sm font-mono text-green-400">
            {generateHtmlCode()}
          </pre>
        </div>
      )}
    </div>
  );
}
