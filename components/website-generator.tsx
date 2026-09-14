'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface Website {
  id: string;
  name: string;
  slug: string;
  html: string;
  css: string;
  js: string;
  template: string;
  status: 'draft' | 'published';
  custom_domain?: string;
  created_at: string;
  updated_at: string;
}

interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompt: string;
  preview: string;
}

const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Modern SaaS/product landing page with hero, features, and CTA',
    icon: '🚀',
    category: 'business',
    prompt: 'Create a modern SaaS landing page with hero section, feature cards, pricing table, testimonials, and newsletter signup. Use a gradient purple theme with smooth animations.',
    preview: 'hero + features + pricing + testimonials + CTA'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Creative portfolio to showcase projects and skills',
    icon: '🎨',
    category: 'personal',
    prompt: 'Create a creative developer portfolio with animated hero, project grid with hover effects, skills section with progress bars, and contact form. Dark theme with neon accents.',
    preview: 'hero + projects + skills + contact'
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Restaurant website with menu and reservation',
    icon: '🍕',
    category: 'business',
    prompt: 'Create an elegant restaurant website with hero image, menu section with food cards, about section, gallery, and reservation form. Warm colors with elegant typography.',
    preview: 'hero + menu + about + gallery + reservation'
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Minimal blog layout with posts grid',
    icon: '📝',
    category: 'content',
    prompt: 'Create a minimal blog homepage with featured post hero, post grid cards with images, categories sidebar, and newsletter signup. Clean white theme.',
    preview: 'featured + post grid + sidebar + newsletter'
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Digital agency website with services and team',
    icon: '💼',
    category: 'business',
    prompt: 'Create a digital agency website with animated hero, services grid, team section with photos, case studies carousel, and contact form. Modern blue theme.',
    preview: 'hero + services + team + cases + contact'
  },
  {
    id: 'ecommerce',
    name: 'Product Page',
    description: 'E-commerce product landing page',
    icon: '🛍️',
    category: 'business',
    prompt: 'Create a product landing page with hero product image, features list, product gallery, reviews section, and buy button. Apple-style minimal design.',
    preview: 'hero + features + gallery + reviews + buy'
  },
  {
    id: 'event',
    name: 'Event',
    description: 'Conference/event landing page',
    icon: '🎉',
    category: 'events',
    prompt: 'Create a tech conference landing page with countdown timer, speaker cards, schedule timeline, ticket pricing, and sponsors section. Vibrant gradient theme.',
    preview: 'countdown + speakers + schedule + tickets'
  },
  {
    id: 'saas',
    name: 'SaaS App',
    description: 'SaaS application marketing page',
    icon: '⚡',
    category: 'business',
    prompt: 'Create a SaaS app landing page with animated hero, feature comparison table, integrations logos, security badges, and pricing tiers. Modern dark theme.',
    preview: 'hero + features + integrations + pricing'
  }
];

export function WebsiteGenerator() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [generatedWebsite, setGeneratedWebsite] = useState<Website | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const data = await api.websites.list();
      setWebsites(data);
    } catch (error) {
      console.error('Failed to load websites');
    }
  };

  const useTemplate = (template: WebsiteTemplate) => {
    setSelectedTemplate(template.id);
    setPrompt(template.prompt);
  };

  const generateWebsite = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await api.ai.chat({
        messages: [{
          role: 'user',
          content: `Generate a complete, modern, responsive website based on this description: "${prompt}"
          
          Return JSON with:
          {
            "name": "Website Name",
            "html": "Complete HTML structure (no <html>, <head>, <body> tags - just content)",
            "css": "Complete CSS styles (modern, responsive, with animations)",
            "js": "JavaScript for interactions (if needed)"
          }
          
          Requirements:
          - Use modern CSS (flexbox, grid, variables)
          - Mobile responsive
          - Smooth animations/transitions
          - Professional design
          - Include placeholder images using https://picsum.photos/
          - Use Google Fonts (Inter, Poppins, or similar)`
        }],
        system: 'You are an expert web developer. Generate production-ready HTML, CSS, and JavaScript code. Make it modern, responsive, and visually appealing.'
      });

      const parsed = JSON.parse(response.content);
      
      const fullHtml = generateFullHtml(parsed.html, parsed.css, parsed.js);
      
      const newWebsite: Website = {
        id: Date.now().toString(),
        name: parsed.name || 'My Website',
        slug: (parsed.name || 'my-website').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        html: parsed.html,
        css: parsed.css,
        js: parsed.js || '',
        template: selectedTemplate || 'custom',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setGeneratedWebsite(newWebsite);
      setPreviewHtml(fullHtml);
    } catch (error) {
      console.error('Failed to generate website');
      alert('Failed to generate website. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFullHtml = (html: string, css: string, js: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${js}
  </script>
</body>
</html>`;
  };

  const saveWebsite = async () => {
    if (!generatedWebsite) return;
    
    try {
      const result = await api.websites.create(generatedWebsite);
      // Use the server's returned website with the correct ID
      setWebsites([...websites, result.website]);
      alert('✅ Website saved successfully!');
      setGeneratedWebsite(null);
      setPreviewHtml('');
      setPrompt('');
    } catch (error) {
      console.error('Failed to save website');
      alert('Failed to save website');
    }
  };

  const publishWebsite = async (website: Website) => {
    try {
      await api.websites.update(website.id, { status: 'published' });
      setWebsites(websites.map(w => 
        w.id === website.id ? { ...w, status: 'published' } : w
      ));
      alert(`✅ Website published!\n\nLive at: ${window.location.origin}/websites/${website.slug}`);
    } catch (error) {
      console.error('Failed to publish website');
    }
  };

  const deleteWebsite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website?')) return;
    
    try {
      await api.websites.delete(id);
      setWebsites(websites.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete website');
    }
  };

  const editWebsite = (website: Website) => {
    setEditingWebsite(website);
    setGeneratedWebsite(website);
    setPreviewHtml(generateFullHtml(website.html, website.css, website.js));
  };

  const updateWebsiteCode = (field: 'html' | 'css' | 'js', value: string) => {
    if (!generatedWebsite) return;
    
    const updated = { ...generatedWebsite, [field]: value };
    setGeneratedWebsite(updated);
    setPreviewHtml(generateFullHtml(updated.html, updated.css, updated.js));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Website Generator</h2>
        <p className="text-zinc-400">Create beautiful websites with AI - no coding required</p>
      </div>

      {/* Template Grid */}
      <div>
        <h3 className="text-sm text-zinc-400 mb-3">Choose a Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WEBSITE_TEMPLATES.map((template) => (
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
              <p className="font-medium mt-2 text-sm">{template.name}</p>
              <p className="text-xs text-zinc-400 mt-1">{template.preview}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <label className="block text-sm text-zinc-400 mb-2">Describe your website</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Create a modern tech startup landing page with a dark theme, animated gradient hero section, feature cards with icons, pricing table, and a contact form..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 h-32 focus:outline-none focus:border-violet-500 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={generateWebsite}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating Website...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate Website
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview & Editor */}
      {generatedWebsite && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={generatedWebsite.name}
                onChange={(e) => setGeneratedWebsite({ ...generatedWebsite, name: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"
              />
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setEditMode('visual')}
                  className={`px-3 py-1 rounded text-sm ${
                    editMode === 'visual' ? 'bg-violet-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setEditMode('code')}
                  className={`px-3 py-1 rounded text-sm ${
                    editMode === 'code' ? 'bg-violet-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  Code
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveWebsite}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-sm"
              >
                💾 Save
              </button>
              <button
                onClick={() => publishWebsite(generatedWebsite)}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm"
              >
                🚀 Publish
              </button>
            </div>
          </div>

          {/* Preview/Code */}
          {editMode === 'visual' ? (
            <div className="relative">
              <iframe
                ref={previewRef}
                srcDoc={previewHtml}
                className="w-full h-[600px] bg-white"
                title="Preview"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-2">HTML</label>
                <textarea
                  value={generatedWebsite.html}
                  onChange={(e) => updateWebsiteCode('html', e.target.value)}
                  className="w-full h-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-2">CSS</label>
                <textarea
                  value={generatedWebsite.css}
                  onChange={(e) => updateWebsiteCode('css', e.target.value)}
                  className="w-full h-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-2">JavaScript</label>
                <textarea
                  value={generatedWebsite.js}
                  onChange={(e) => updateWebsiteCode('js', e.target.value)}
                  className="w-full h-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Websites */}
      {websites.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">My Websites</h3>
          <div className="space-y-3">
            {websites.map((website) => (
              <div key={website.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center text-xl">
                    🌐
                  </div>
                  <div>
                    <p className="font-medium">{website.name}</p>
                    <p className="text-sm text-zinc-400">
                      {website.slug}.abhibase.app
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        website.status === 'published' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {website.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editWebsite(website)}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => publishWebsite(website)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-sm"
                  >
                    🚀 Publish
                  </button>
                  <button
                    onClick={() => deleteWebsite(website.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
