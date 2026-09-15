'use client';

import { useState, useRef } from 'react';

/* ──────── TYPES ──────── */
interface AppStructure {
  name: string;
  description: string;
  icon: string;
  models: { name: string; description: string; fields: { name: string; type: string; required: boolean; description: string }[] }[];
}

interface GenerateStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}

const EXAMPLE_PROMPTS = [
  { icon: '🍔', text: 'Build a food delivery app with restaurants, menus, orders' },
  { icon: '📚', text: 'Create an online course platform with courses, lessons, students' },
  { icon: '🏋️', text: 'Make a fitness tracker with workouts, goals, exercises' },
  { icon: '🏠', text: 'Build a real estate listing app with properties, inquiries' },
  { icon: '🎵', text: 'Create a music app with tracks, playlists, artists' },
  { icon: '✈️', text: 'Make a travel booking app with destinations, trips, bookings' },
  { icon: '✅', text: 'Build a task manager with tasks, projects, deadlines' },
];

/* ──────── MAIN COMPONENT ──────── */
export default function AiAppGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [structure, setStructure] = useState<AppStructure | null>(null);
  const [generatedFolder, setGeneratedFolder] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [steps, setSteps] = useState<GenerateStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateApp = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setStructure(null);
    setGeneratedUrl(null);

    const generateSteps: GenerateStep[] = [
      { id: 'analyze', label: 'Analyzing your description', status: 'active' },
      { id: 'models', label: 'Designing database models', status: 'pending' },
      { id: 'html', label: 'Generating HTML app', status: 'pending' },
      { id: 'seed', label: 'Adding sample data', status: 'pending' },
      { id: 'complete', label: 'App ready to launch!', status: 'pending' },
    ];
    setSteps(generateSteps);

    const stepTimers: NodeJS.Timeout[] = [];
    generateSteps.forEach((step, i) => {
      if (i > 0) {
        stepTimers.push(setTimeout(() => {
          setSteps(prev => prev.map(s =>
            s.id === step.id ? { ...s, status: 'active' } :
            s.id === generateSteps[i - 1].id ? { ...s, status: 'done' } : s
          ));
        }, 800 * i));
      }
    });

    try {
      const res = await fetch('/api/ai/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setStructure(data.structure);
      setGeneratedFolder(data.folder || null);
      setGeneratedUrl(data.url || null);
      setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
    } catch (err: any) {
      setError(err.message);
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error', detail: err.message } : s));
    } finally {
      setIsGenerating(false);
      stepTimers.forEach(clearTimeout);
    }
  };

  const launchApp = () => {
    if (generatedUrl) {
      window.open(generatedUrl, '_blank');
    }
  };

  const totalModels = structure?.models?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-400 mb-4">
          <span className="animate-pulse">✨</span> Powered by Gemini AI
        </div>
        <h1 className="text-4xl font-bold mb-3">AI App Generator</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Describe your app idea. Get a working app in seconds.
        </p>
      </div>

      {/* Input */}
      {!structure && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the app you want to build..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 resize-none h-32 focus:outline-none focus:border-violet-500"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateApp(); }}}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 4).map((ex, i) => (
                <button key={i} onClick={() => { setPrompt(ex.text); textareaRef.current?.focus(); }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                  {ex.icon} {ex.text.slice(0, 30)}...
                </button>
              ))}
            </div>
            <button onClick={generateApp} disabled={!prompt.trim() || isGenerating}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl font-bold text-sm transition-colors whitespace-nowrap">
              {isGenerating ? '⏳ Generating...' : '🚀 Generate App'}
            </button>
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="space-y-3">
            {steps.map(step => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                  step.status === 'active' ? 'bg-violet-500/20 text-violet-400 animate-pulse' :
                  step.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-zinc-800 text-zinc-600'
                }`}>
                  {step.status === 'done' ? '✓' : step.status === 'active' ? '⚙' : step.status === 'error' ? '✕' : '○'}
                </div>
                <span className={`text-sm ${step.status === 'active' ? 'text-white' : step.status === 'done' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {step.label}
                </span>
                {step.detail && <span className="text-xs text-red-400 ml-auto">{step.detail}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {structure && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{structure.icon}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{structure.name}</h2>
                <p className="text-zinc-400 mt-1">{structure.description}</p>
                <div className="flex gap-4 mt-3">
                  <span className="bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">🗄️ {totalModels} Models</span>
                  <span className="bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">📋 {structure.models.reduce((a, m) => a + m.fields.length, 0)} Fields</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStructure(null)} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">✏️ New</button>
                <button onClick={launchApp} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-bold">
                  ▶️ Launch App
                </button>
              </div>
            </div>

            {/* Launch link */}
            {generatedUrl && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-blue-400 text-sm">✅ App ready at </span>
                  <a href={generatedUrl} target="_blank" rel="noopener" className="text-blue-300 font-mono text-sm underline">{generatedUrl}</a>
                </div>
                <button onClick={launchApp} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold">Open →</button>
              </div>
            )}

            {/* Files */}
            {generatedFolder && (
              <div className="mt-4 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>📁</span>
                  <span className="font-mono">{generatedFolder}/index.html</span>
                  <span className="text-zinc-600">•</span>
                  <span>{generatedFolder}/schema.sql</span>
                </div>
              </div>
            )}
          </div>

          {/* Models */}
          <div>
            <h3 className="font-bold text-lg mb-4">🗄️ Database Models</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {(structure.models || []).map(model => (
                <div key={model.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
                    <span className="font-bold text-sm">{model.name}</span>
                    <span className="text-xs text-zinc-500">{model.fields?.length || 0} fields</span>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-xs text-zinc-500 mb-2">{model.description}</p>
                    <div className="space-y-1">
                      {(model.fields || []).map(f => (
                        <div key={f.name} className="flex items-center gap-2 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${f.required ? 'bg-red-400' : 'bg-zinc-600'}`} />
                          <span className="text-white font-mono">{f.name}</span>
                          <span className="text-zinc-600">{f.type}</span>
                          {f.required && <span className="text-red-400 text-[10px]">required</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
