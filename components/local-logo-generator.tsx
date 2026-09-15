'use client';

import { useState } from 'react';
import { LOGO_SHAPES, COLOR_PALETTES, FONTS, getInitials } from '@/lib/local-templates';

export default function LocalLogoGenerator() {
  const [brand, setBrand] = useState({
    name: '',
    tagline: '',
    shape: 'circle',
    palette: 'Violet',
    font: 'Arial',
    style: 'Filled',
    showInitials: true,
    borderWidth: 0,
    shadowEnabled: true,
    gradientEnabled: false,
    iconPosition: 'left'
  });

  const [customColor, setCustomColor] = useState('#6366f1');
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'code'>('config');

  const palette = COLOR_PALETTES.find(p => p.name === brand.palette) || COLOR_PALETTES[0];
  const shape = LOGO_SHAPES.find(s => s.id === brand.shape) || LOGO_SHAPES[0];

  const generateLogoSvg = (size: number = 200): string => {
    const initials = getInitials(brand.name || 'AB');
    const color = brand.gradientEnabled ? `url(#gradient-${brand.shape})` : customColor;

    let shapeSvg = shape.svg(color, size);

    if (brand.borderWidth > 0) {
      const strokeShape = shape.svg('none', size);
      shapeSvg += strokeShape.replace('fill=', `stroke="${customColor}" stroke-width="${brand.borderWidth}" fill="none"`);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="gradient-${brand.shape}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.primary}"/>
      <stop offset="100%" style="stop-color:${palette.secondary}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  ${brand.shadowEnabled ? shapeSvg.replace('/>', ' filter="url(#shadow)"/>') : shapeSvg}
  ${brand.showInitials ? `<text x="${size/2}" y="${size/2 + size/8}" text-anchor="middle" fill="white" font-size="${size/3}" font-weight="bold" font-family="${brand.font}">${initials}</text>` : ''}
</svg>`;
  };

  const generateFullLogo = (): string => {
    const logoSvg = generateLogoSvg(100);
    return `<div style="display:flex;align-items:center;gap:16px">
  ${brand.iconPosition === 'left' ? logoSvg : ''}
  <div>
    <div style="font-size:24px;font-weight:bold;color:${palette.primary};font-family:${brand.font}">${brand.name || 'Your Brand'}</div>
    ${brand.tagline ? `<div style="font-size:14px;color:#666;font-family:${brand.font}">${brand.tagline}</div>` : ''}
  </div>
  ${brand.iconPosition === 'right' ? logoSvg : ''}
</div>`;
  };

  const downloadSvg = () => {
    const svg = generateLogoSvg(400);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(brand.name || 'logo').toLowerCase().replace(/\s+/g, '-')}-logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = generateLogoSvg(400);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${(brand.name || 'logo').toLowerCase().replace(/\s+/g, '-')}-logo.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Logo Generator</h2>
        <p className="text-zinc-400">Create professional logos instantly - no AI needed</p>
      </div>

      <div className="flex gap-2">
        {['config', 'preview', 'code'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-violet-600' : 'bg-zinc-700'}`}>
            {tab === 'config' ? '⚙️ Design' : tab === 'preview' ? '👁️ Preview' : '📋 Export'}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Brand Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand Name *</label>
                <input type="text" value={brand.name} onChange={(e) => setBrand(prev => ({ ...prev, name: e.target.value }))} placeholder="Your Brand" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tagline</label>
                <input type="text" value={brand.tagline} onChange={(e) => setBrand(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Innovation Simplified" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Shape</h3>
            <div className="grid grid-cols-4 gap-2">
              {LOGO_SHAPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setBrand(prev => ({ ...prev, shape: s.id }))}
                  className={`p-3 rounded-lg border ${brand.shape === s.id ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto">
                    {s.svg(customColor, 40)}
                  </svg>
                  <p className="text-xs mt-1 text-center">{s.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Color Palette</h3>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PALETTES.map(p => (
                <button
                  key={p.name}
                  onClick={() => setBrand(prev => ({ ...prev, palette: p.name }))}
                  className={`p-3 rounded-lg border ${brand.palette === p.name ? 'border-violet-500' : 'border-zinc-700'}`}
                >
                  <div className="flex gap-1 justify-center mb-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.primary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.secondary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.accent }} />
                  </div>
                  <p className="text-xs text-center">{p.name}</p>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="block text-sm text-zinc-400 mb-1">Custom Color</label>
              <div className="flex gap-2">
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-10 h-10 rounded" />
                <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Style Options</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Font</label>
                <select value={brand.font} onChange={(e) => setBrand(prev => ({ ...prev, font: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Icon Position</label>
                <select value={brand.iconPosition} onChange={(e) => setBrand(prev => ({ ...prev, iconPosition: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top">Top</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={brand.showInitials} onChange={(e) => setBrand(prev => ({ ...prev, showInitials: e.target.checked }))} className="rounded" />
                <span className="text-sm">Show Initials</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={brand.gradientEnabled} onChange={(e) => setBrand(prev => ({ ...prev, gradientEnabled: e.target.checked }))} className="rounded" />
                <span className="text-sm">Gradient Fill</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={brand.shadowEnabled} onChange={(e) => setBrand(prev => ({ ...prev, shadowEnabled: e.target.checked }))} className="rounded" />
                <span className="text-sm">Drop Shadow</span>
              </label>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Border Width: {brand.borderWidth}px</label>
                <input type="range" min="0" max="5" value={brand.borderWidth} onChange={(e) => setBrand(prev => ({ ...prev, borderWidth: parseInt(e.target.value) }))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
            <h3 className="font-semibold mb-6">Logo Preview</h3>
            <div className="flex flex-col items-center gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg" dangerouslySetInnerHTML={{ __html: generateFullLogo() }} />
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-xs text-zinc-400 mb-2">Icon Only</p>
                  <div dangerouslySetInnerHTML={{ __html: generateLogoSvg(80) }} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-400 mb-2">With Text</p>
                  <div dangerouslySetInnerHTML={{ __html: generateFullLogo() }} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-400 mb-2">Dark Background</p>
                  <div className="bg-zinc-800 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: generateFullLogo() }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Color Palette Used</h3>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-lg" style={{ backgroundColor: palette.primary }} />
                <p className="text-xs mt-1">Primary</p>
                <p className="text-xs text-zinc-400">{palette.primary}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-lg" style={{ backgroundColor: palette.secondary }} />
                <p className="text-xs mt-1">Secondary</p>
                <p className="text-xs text-zinc-400">{palette.secondary}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-lg" style={{ backgroundColor: palette.accent }} />
                <p className="text-xs mt-1">Accent</p>
                <p className="text-xs text-zinc-400">{palette.accent}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Export Options</h3>
              <div className="flex gap-2">
                <button onClick={downloadSvg} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg">📥 Download SVG</button>
                <button onClick={downloadPng} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">📥 Download PNG</button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">SVG Code</h4>
                <pre className="bg-zinc-800 rounded-lg p-4 overflow-auto max-h-[400px] text-xs font-mono text-green-400">
                  {generateLogoSvg(200)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">HTML Embed</h4>
                <pre className="bg-zinc-800 rounded-lg p-4 overflow-auto max-h-[400px] text-xs font-mono text-green-400">
                  {generateFullLogo()}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Brand Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">Colors</h4>
                <ul className="space-y-1 text-zinc-400">
                  <li>Primary: {palette.primary}</li>
                  <li>Secondary: {palette.secondary}</li>
                  <li>Accent: {palette.accent}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Typography</h4>
                <ul className="space-y-1 text-zinc-400">
                  <li>Font: {brand.font}</li>
                  <li>Style: {brand.style}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
