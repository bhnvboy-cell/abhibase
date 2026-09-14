'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface GeneratedApp {
  id: string;
  name: string;
  description: string;
  models: AppModel[];
  apiRoutes: AppRoute[];
  uiComponents: AppUI[];
  created_at: string;
}

interface AppModel {
  name: string;
  fields: ModelField[];
}

interface ModelField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'uuid';
  required: boolean;
  default?: string;
}

interface AppRoute {
  path: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  description: string;
}

interface AppUI {
  name: string;
  type: 'list' | 'form' | 'detail' | 'dashboard';
  model: string;
  fields: string[];
}

const APP_TEMPLATES = [
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Customer relationship management with contacts, deals, and pipeline',
    icon: '👥',
    prompt: 'Build a CRM with contacts, companies, deals, and activity tracking'
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Track products, stock levels, suppliers, and orders',
    icon: '📦',
    prompt: 'Build an inventory system with products, categories, suppliers, and stock tracking'
  },
  {
    id: 'blog',
    name: 'Blog Platform',
    description: 'Create and manage blog posts with categories and comments',
    icon: '📝',
    prompt: 'Build a blog with posts, categories, comments, and author profiles'
  },
  {
    id: 'booking',
    name: 'Booking System',
    description: 'Appointment scheduling with calendars and reminders',
    icon: '📅',
    prompt: 'Build a booking system with appointments, services, and time slots'
  },
  {
    id: 'feedback',
    name: 'Feedback Board',
    description: 'Collect and manage user feedback with voting',
    icon: '💬',
    prompt: 'Build a feedback board with posts, comments, and voting'
  },
  {
    id: 'portfolio',
    name: 'Portfolio Site',
    description: 'Showcase projects, skills, and testimonials',
    icon: '🎨',
    prompt: 'Build a portfolio with projects, skills, testimonials, and contact form'
  }
];

export function AppBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [previewTab, setPreviewTab] = useState<'schema' | 'api' | 'ui' | 'code'>('schema');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [apps, setApps] = useState<GeneratedApp[]>([]);

  const generateApp = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await api.ai.chat({
        messages: [{
          role: 'user',
          content: `Generate a complete app based on this description: "${prompt}"
          
          Return JSON with this structure:
          {
            "name": "app name",
            "description": "brief description",
            "models": [
              {
                "name": "ModelName",
                "fields": [
                  { "name": "field_name", "type": "text|number|boolean|date|json|uuid", "required": true|false }
                ]
              }
            ],
            "apiRoutes": [
              { "path": "/api/resource", "method": "GET|POST|PATCH|DELETE", "description": "what it does" }
            ],
            "uiComponents": [
              { "name": "ComponentName", "type": "list|form|detail|dashboard", "model": "ModelName", "fields": ["field1", "field2"] }
            ]
          }`
        }],
        system: 'You are an expert app architect. Generate complete app structures with models, API routes, and UI components. Make sure models have proper relationships and fields.'
      });

      const parsed = JSON.parse(response.content);
      const newApp: GeneratedApp = {
        id: Date.now().toString(),
        ...parsed,
        created_at: new Date().toISOString()
      };
      
      setGeneratedApp(newApp);
    } catch (error) {
      console.error('Failed to generate app');
      alert('Failed to generate app. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const useTemplate = (template: typeof APP_TEMPLATES[0]) => {
    setSelectedTemplate(template.id);
    setPrompt(template.prompt);
  };

  const installApp = async () => {
    if (!generatedApp) return;

    try {
      // Create database tables
      for (const model of generatedApp.models) {
        await api.ai.generateContent(`
          CREATE TABLE IF NOT EXISTS ${model.name.toLowerCase()}s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            ${model.fields.map(f => `${f.name} ${mapFieldType(f.type)} ${f.required ? 'NOT NULL' : ''}`).join(',\n            ')},
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
      }

      alert(`✅ App "${generatedApp.name}" installed successfully!\n\nYou can now access your new app through the API.`);
      setApps([...apps, generatedApp]);
      setGeneratedApp(null);
      setPrompt('');
    } catch (error) {
      console.error('Failed to install app');
      alert('Failed to install app');
    }
  };

  const mapFieldType = (type: string): string => {
    const typeMap: Record<string, string> = {
      text: 'TEXT',
      number: 'DECIMAL(12, 2)',
      boolean: 'BOOLEAN DEFAULT false',
      date: 'DATE',
      json: 'JSONB DEFAULT \'{}\'',
      uuid: 'UUID'
    };
    return typeMap[type] || 'TEXT';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">AI App Builder</h2>
        <p className="text-zinc-400">Describe your app and let AI build it for you</p>
      </div>

      {/* Template Grid */}
      <div>
        <h3 className="text-sm text-zinc-400 mb-3">Quick Start Templates</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {APP_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => useTemplate(template)}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                selectedTemplate === template.id
                  ? 'bg-violet-600/20 border-violet-500'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-2xl">{template.icon}</span>
              <p className="font-medium mt-2">{template.name}</p>
              <p className="text-xs text-zinc-400 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <label className="block text-sm text-zinc-400 mb-2">Describe your app</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Build a project management app with tasks, milestones, and team collaboration..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 h-32 focus:outline-none focus:border-violet-500 resize-none"
        />
        <button
          onClick={generateApp}
          disabled={!prompt.trim() || isGenerating}
          className="mt-4 w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              Generating App...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate App
            </>
          )}
        </button>
      </div>

      {/* Generated App Preview */}
      {generatedApp && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {/* App Header */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{generatedApp.name}</h3>
                <p className="text-zinc-400 text-sm">{generatedApp.description}</p>
              </div>
              <button
                onClick={installApp}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-medium"
              >
                📥 Install App
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            {(['schema', 'api', 'ui', 'code'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPreviewTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  previewTab === tab
                    ? 'text-violet-400 border-b-2 border-violet-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'schema' ? '📊 Models' :
                 tab === 'api' ? '🔌 API Routes' :
                 tab === 'ui' ? '🎨 UI Components' : '💻 Code'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {previewTab === 'schema' && (
              <div className="space-y-4">
                {generatedApp.models.map((model, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📋</span>
                      <h4 className="font-semibold">{model.name}</h4>
                      <span className="text-xs text-zinc-400">({model.fields.length} fields)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {model.fields.map((field, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-400">{field.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
                            {field.type}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-400">*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewTab === 'api' && (
              <div className="space-y-2">
                {generatedApp.apiRoutes.map((route, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      route.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                      route.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                      route.method === 'PATCH' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {route.method}
                    </span>
                    <code className="text-sm font-mono">{route.path}</code>
                    <span className="text-zinc-400 text-sm ml-auto">{route.description}</span>
                  </div>
                ))}
              </div>
            )}

            {previewTab === 'ui' && (
              <div className="grid grid-cols-2 gap-4">
                {generatedApp.uiComponents.map((ui, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {ui.type === 'list' ? '📋' :
                         ui.type === 'form' ? '📝' :
                         ui.type === 'detail' ? '📄' : '📊'}
                      </span>
                      <h4 className="font-medium">{ui.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 mb-2">
                      {ui.type} view for {ui.model}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ui.fields.map((field, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 bg-zinc-700 rounded">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewTab === 'code' && (
              <div className="bg-zinc-800 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-zinc-300">
{`// ${generatedApp.name} - Database Schema
// Generated by AbhiBase AI App Builder

${generatedApp.models.map(model => `
CREATE TABLE ${model.name.toLowerCase()}s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
${model.fields.map(f => `  ${f.name} ${mapFieldType(f.type)}${f.required ? ' NOT NULL' : ''}`).join(',\n')},
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`).join('\n')}

// API Routes
${generatedApp.apiRoutes.map(r => `// ${r.method} ${r.path} - ${r.description}`).join('\n')}`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installed Apps */}
      {apps.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Installed Apps</h3>
          <div className="space-y-2">
            {apps.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-zinc-400">{app.models.length} models • {app.apiRoutes.length} endpoints</p>
                </div>
                <span className="text-emerald-400 text-sm">✓ Installed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
