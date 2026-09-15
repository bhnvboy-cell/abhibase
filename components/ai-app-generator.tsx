'use client';

import { useState, useEffect, useRef } from 'react';

/* ──────── TYPES ──────── */
interface AppStructure {
  name: string;
  description: string;
  icon: string;
  models: { name: string; description: string; fields: { name: string; type: string; required: boolean; description: string }[] }[];
  apiRoutes: { path: string; method: string; description: string; model: string }[];
  uiComponents: { name: string; type: string; model: string; description: string; fields: string[] }[];
  pages: { name: string; path: string; description: string; components: string[] }[];
}

interface GenerateResult {
  structure: AppStructure;
  folder: string;
  files: string[];
}

interface GenerateStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}

const EXAMPLE_PROMPTS = [
  { icon: '🍔', text: 'Build a food delivery app with restaurants, menus, orders, and delivery tracking' },
  { icon: '📚', text: 'Create an online course platform with courses, lessons, quizzes, and student progress' },
  { icon: '🏋️', text: 'Make a fitness tracker with workouts, exercises, progress photos, and goals' },
  { icon: '🏠', text: 'Build a real estate listing app with properties, agents, inquiries, and saved searches' },
  { icon: '🎵', text: 'Create a music streaming app with playlists, songs, artists, and listening history' },
  { icon: '✈️', text: 'Make a travel booking app with destinations, hotels, flights, and itineraries' },
];

/* ──────── MAIN COMPONENT ──────── */
export default function AiAppGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [structure, setStructure] = useState<AppStructure | null>(null);
  const [generatedFolder, setGeneratedFolder] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [steps, setSteps] = useState<GenerateStep[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'code' | 'install'>('write');
  const [error, setError] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [launchPort, setLaunchPort] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateApp = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setStructure(null);
    setInstallResult(null);

    // Define steps
    const generateSteps: GenerateStep[] = [
      { id: 'analyze', label: 'Analyzing your description', status: 'active' },
      { id: 'models', label: 'Designing database models', status: 'pending' },
      { id: 'routes', label: 'Generating API routes', status: 'pending' },
      { id: 'components', label: 'Creating UI components', status: 'pending' },
      { id: 'pages', label: 'Building pages', status: 'pending' },
      { id: 'complete', label: 'App structure ready', status: 'pending' },
    ];
    setSteps(generateSteps);

    // Animate steps
    const stepTimers: NodeJS.Timeout[] = [];
    generateSteps.forEach((step, i) => {
      if (i > 0) {
        stepTimers.push(setTimeout(() => {
          setSteps(prev => prev.map(s =>
            s.id === step.id ? { ...s, status: 'active' } :
            s.id === generateSteps[i - 1].id ? { ...s, status: 'done' } : s
          ));
        }, 1200 * i));
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
      setGeneratedFiles(data.files || []);
      setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
      setActiveTab('preview');
    } catch (err: any) {
      setError(err.message);
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error', detail: err.message } : s));
    } finally {
      setIsGenerating(false);
      stepTimers.forEach(clearTimeout);
    }
  };

  const installApp = async () => {
    if (!structure) return;
    setIsInstalling(true);
    setInstallResult(null);

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: structure.name,
          description: structure.description,
          models: structure.models,
          apiRoutes: structure.apiRoutes,
          uiComponents: structure.uiComponents,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Installation failed');

      const tableCount = data.results?.length || 0;
      const failedTables = data.results?.filter((r: any) => !r.success) || [];

      if (failedTables.length > 0) {
        setInstallResult(`⚠️ Partially installed: ${tableCount - failedTables.length}/${tableCount} tables created. ${failedTables.map((t: any) => t.table).join(', ')} failed.`);
      } else {
        setInstallResult(`✅ Successfully installed "${structure.name}"! ${tableCount} database tables created.`);
      }
    } catch (err: any) {
      setInstallResult(`❌ Installation failed: ${err.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const launchApp = async () => {
    if (!generatedFolder || !structure) return;
    setIsLaunching(true);
    setLaunchUrl(null);

    try {
      const res = await fetch('/api/ai/launch-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: generatedFolder, slug: generatedFolder.replace('generated-apps/', '') }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Launch failed');

      setLaunchUrl(data.url);
      setLaunchPort(data.port);

      // Open in new tab
      window.open(data.url, '_blank');
    } catch (err: any) {
      setError(`Launch failed: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const generateCode = (): string => {
    if (!structure) return '';
    let code = `'use client';\n\nimport { useState, useEffect } from 'react';\n\n`;
    code += `// Auto-generated by AbhiBase AI App Generator\n`;
    code += `// App: ${structure.name}\n// ${structure.description}\n\n`;

    // Generate types
    code += `/* ── Types ── */\n`;
    structure.models.forEach(m => {
      code += `interface ${m.name} {\n`;
      code += `  id: string;\n`;
      m.fields.forEach(f => {
        const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : f.type === 'date' ? 'string' : 'string';
        code += `  ${f.name}${f.required ? '' : '?'}: ${tsType};\n`;
      });
      code += `  created_at: string;\n`;
      code += `  updated_at: string;\n`;
      code += `}\n\n`;
    });

    // Generate components
    structure.uiComponents.forEach(comp => {
      const model = structure.models.find(m => m.name === comp.model);
      code += `/* ── ${comp.name} (${comp.type}) ── */\n`;
      code += `export function ${comp.name}() {\n`;
      code += `  const [data, setData] = useState<${comp.model}[]>([]);\n\n`;
      code += `  useEffect(() => {\n`;
      code += `    fetch('/api/${comp.model.toLowerCase()}s').then(r => r.json()).then(setData);\n`;
      code += `  }, []);\n\n`;

      if (comp.type === 'list') {
        code += `  return (\n`;
        code += `    <div className="space-y-3">\n`;
        code += `      <h2 className="text-xl font-bold">${comp.name}</h2>\n`;
        code += `      {data.map(item => (\n`;
        code += `        <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">\n`;
        comp.fields.slice(0, 3).forEach(f => {
          code += `          <p className="text-sm text-zinc-300">{item.${f}}</p>\n`;
        });
        code += `        </div>\n`;
        code += `      ))}\n`;
        code += `    </div>\n`;
        code += `  );\n`;
      } else if (comp.type === 'form') {
        code += `  const [form, setForm] = useState<Partial<${comp.model}>>({});\n\n`;
        code += `  const handleSubmit = async () => {\n`;
        code += `    await fetch('/api/${comp.model.toLowerCase()}s', {\n`;
        code += `      method: 'POST',\n`;
        code += `      headers: { 'Content-Type': 'application/json' },\n`;
        code += `      body: JSON.stringify(form),\n`;
        code += `    });\n`;
        code += `  };\n\n`;
        code += `  return (\n`;
        code += `    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">\n`;
        code += `      <h2 className="text-xl font-bold">Create ${comp.model}</h2>\n`;
        comp.fields.forEach(f => {
          code += `      <input placeholder="${f}" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"\n`;
          code += `        value={form.${f} as string || ''} onChange={e => setForm({...form, ${f}: e.target.value})} />\n`;
        });
        code += `      <button onClick={handleSubmit} className="bg-violet-600 px-6 py-2 rounded-lg">Save</button>\n`;
        code += `    </div>\n`;
        code += `  );\n`;
      } else {
        code += `  return (\n`;
        code += `    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">\n`;
        code += `      <h2 className="text-xl font-bold">${comp.name}</h2>\n`;
        code += `      <p className="text-zinc-400 text-sm mt-2">${comp.description}</p>\n`;
        code += `    </div>\n`;
        code += `  );\n`;
      }
      code += `}\n\n`;
    });

    return code;
  };

  const totalModels = structure?.models?.length || 0;
  const totalRoutes = structure?.apiRoutes?.length || 0;
  const totalComponents = structure?.uiComponents?.length || 0;
  const totalPages = structure?.pages?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-400 mb-4">
          <span className="animate-pulse">✨</span> Powered by Gemini AI
        </div>
        <h1 className="text-4xl font-bold mb-3">
          AI App Generator
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Describe your app idea in plain English. Gemini AI understands your words and AbhiBase builds it.
        </p>
      </div>

      {/* Write Tab */}
      {activeTab === 'write' && (
        <div className="space-y-6">
          {/* Prompt Input */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <label className="block text-sm text-zinc-400 mb-3">What do you want to build?</label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Example: Build a project management tool with teams, tasks, deadlines, and progress tracking..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4 h-40 text-lg focus:outline-none focus:border-violet-500 resize-none transition-colors"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generateApp(); }}
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-zinc-600">Ctrl+Enter to generate</span>
              <button
                onClick={generateApp}
                disabled={!prompt.trim() || isGenerating}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-3 transition-all"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin text-xl">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🚀</span>
                    Generate App with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example Prompts */}
          <div>
            <h3 className="text-sm text-zinc-500 mb-3 font-medium">💡 Try these examples</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button key={i} onClick={() => { setPrompt(ex.text); textareaRef.current?.focus(); }}
                  className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-left hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group">
                  <span className="text-2xl block mb-2">{ex.icon}</span>
                  <span className="text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">{ex.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Steps */}
          {steps.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="font-bold mb-4">🔄 Generation Progress</h3>
              <div className="space-y-3">
                {steps.map(step => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                      step.status === 'active' ? 'bg-violet-500/20 text-violet-400 animate-pulse' :
                      step.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-800 text-zinc-500'
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              ❌ {error}
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && structure && (
        <div className="space-y-6">
          {/* App Summary */}
          <div className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{structure.icon}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{structure.name}</h2>
                <p className="text-zinc-400 mt-1">{structure.description}</p>
                <div className="flex gap-4 mt-4">
                  <span className="bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">🗄️ {totalModels} Models</span>
                  <span className="bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">⚡ {totalRoutes} API Routes</span>
                  <span className="bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">🧩 {totalComponents} Components</span>
                  <span className="bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">📄 {totalPages} Pages</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('write')} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">✏️ Edit</button>
                <button onClick={installApp} disabled={isInstalling}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-sm font-bold">
                  {isInstalling ? '⏳ Installing...' : '🚀 Install App'}
                </button>
                <button onClick={launchApp} disabled={isLaunching || !generatedFolder}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-sm font-bold">
                  {isLaunching ? '⏳ Launching...' : '▶️ Launch App'}
                </button>
              </div>
            </div>
            {launchUrl && (
              <div className="mt-4 p-3 rounded-lg text-sm bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-blue-400">✅ App running at </span>
                  <a href={launchUrl} target="_blank" rel="noopener" className="text-blue-300 font-mono underline">{launchUrl}</a>
                </div>
                <button onClick={() => window.open(launchUrl, '_blank')} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs">Open →</button>
              </div>
            )}
            {installResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${installResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : installResult.startsWith('⚠') ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                {installResult}
              </div>
            )}
            {generatedFolder && (
              <div className="mt-4 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📁</span>
                  <span className="font-bold text-sm">Generated Files</span>
                </div>
                <div className="text-xs text-zinc-400 mb-3 font-mono bg-zinc-900 rounded-lg px-3 py-2">
                  C:\my projects\abhibase\{generatedFolder}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {generatedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs bg-zinc-900 rounded-lg px-2 py-1.5">
                      <span className={f.endsWith('.sql') ? 'text-amber-400' : f.endsWith('.tsx') ? 'text-blue-400' : f.endsWith('.ts') ? 'text-violet-400' : 'text-zinc-400'}>
                        {f.endsWith('.sql') ? '🗃️' : f.endsWith('.tsx') ? '⚛️' : f.endsWith('.ts') ? '📘' : '📄'}
                      </span>
                      <span className="text-zinc-300 truncate">{f.split('/').pop()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-zinc-800 overflow-hidden w-fit">
            {(['preview', 'code'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 text-sm font-medium capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>
                {t === 'preview' ? '📊 Preview' : '💻 Code'}
              </button>
            ))}
          </div>

          {/* Models */}
          <div>
            <h3 className="font-bold text-lg mb-4">🗄️ Database Models</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {structure.models.map(model => (
                <div key={model.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
                    <span className="font-bold text-sm">{model.name}</span>
                    <span className="text-xs text-zinc-500">{model.fields.length} fields</span>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-xs text-zinc-500 mb-2">{model.description}</p>
                    <div className="space-y-1">
                      {model.fields.map(f => (
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

          {/* API Routes */}
          <div>
            <h3 className="font-bold text-lg mb-4">⚡ API Routes</h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-2 text-zinc-400 font-medium">Method</th>
                    <th className="text-left px-4 py-2 text-zinc-400 font-medium">Path</th>
                    <th className="text-left px-4 py-2 text-zinc-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {structure.apiRoutes.map((route, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/50">
                      <td className="px-4 py-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          route.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                          route.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                          route.method === 'PATCH' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{route.method}</span>
                      </td>
                      <td className="px-4 py-2 font-mono text-zinc-300">{route.path}</td>
                      <td className="px-4 py-2 text-zinc-400">{route.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* UI Components */}
          <div>
            <h3 className="font-bold text-lg mb-4">🧩 UI Components</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {structure.uiComponents.map(comp => (
                <div key={comp.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {comp.type === 'list' ? '📋' : comp.type === 'form' ? '📝' : comp.type === 'dashboard' ? '📊' : comp.type === 'detail' ? '📄' : '⚙️'}
                    </span>
                    <span className="font-bold text-sm">{comp.name}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{comp.description}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{comp.type}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{comp.model}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h3 className="font-bold text-lg mb-4">📄 Pages</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {structure.pages.map(page => (
                <div key={page.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{page.name}</span>
                    <span className="text-xs text-zinc-500 font-mono">{page.path}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{page.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {page.components.map(c => (
                      <span key={c} className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code Tab */}
      {activeTab === 'code' && structure && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm text-zinc-400">generated-app.tsx</span>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(generateCode())}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs">📋 Copy</button>
              <button onClick={() => {
                const blob = new Blob([generateCode()], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${structure!.name.toLowerCase().replace(/\s/g, '-')}.tsx`; a.click();
                URL.revokeObjectURL(url);
              }} className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-xs">⬇ Download</button>
            </div>
          </div>
          <pre className="p-6 text-sm font-mono text-zinc-300 overflow-auto max-h-[600px] leading-relaxed">
            <code>{generateCode()}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
