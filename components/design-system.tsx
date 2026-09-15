'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    headingWeight: string;
  };
  spacing: {
    unit: string;
    borderRadius: string;
    componentPadding: string;
  };
}

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat',
  'Source Sans Pro', 'Nunito', 'Work Sans', 'Rubik', 'Outfit',
  'Plus Jakarta Sans', 'DM Sans', 'Space Grotesk', 'Manrope',
  'Urbanist', 'Sora', 'General Sans', 'Satoshi', 'Cabinet Grotesk',
  'Lexend', 'Bricolage Grotesque', 'Atkinson Hyperlegible',
  'Fira Code', 'JetBrains Mono', 'IBM Plex Mono', 'Space Mono'
];

const DEFAULT_THEME: ThemeConfig = {
  id: 'default',
  name: 'AbhiBase Default',
  colors: {
    primary: '#7c3aed',
    secondary: '#6366f1',
    accent: '#f59e0b',
    background: '#09090b',
    surface: '#18181b',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    border: '#27272a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: '16px',
    lineHeight: '1.5',
    headingWeight: '700'
  },
  spacing: {
    unit: '4px',
    borderRadius: '8px',
    componentPadding: '24px'
  }
};

export function DesignSystem() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [savedThemes, setSavedThemes] = useState<ThemeConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'preview'>('colors');
  const [showFontSelector, setShowFontSelector] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const data = await api.design.themes.list();
      setSavedThemes(data);
    } catch (error) {
      console.error('Failed to load themes');
    }
  };

  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => {
    setTheme({
      ...theme,
      colors: { ...theme.colors, [key]: value }
    });
  };

  const updateTypography = (key: keyof ThemeConfig['typography'], value: string) => {
    setTheme({
      ...theme,
      typography: { ...theme.typography, [key]: value }
    });
  };

  const updateSpacing = (key: keyof ThemeConfig['spacing'], value: string) => {
    setTheme({
      ...theme,
      spacing: { ...theme.spacing, [key]: value }
    });
  };

  const saveTheme = async () => {
    try {
      await api.design.themes.create(theme);
      loadThemes();
    } catch (error) {
      console.error('Failed to save theme');
    }
  };

  const loadTheme = (savedTheme: ThemeConfig) => {
    setTheme(savedTheme);
  };

  const exportTheme = () => {
    const css = generateCSS(theme);
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCSS = (t: ThemeConfig): string => {
    return `:root {
  /* Colors */
  --color-primary: ${t.colors.primary};
  --color-secondary: ${t.colors.secondary};
  --color-accent: ${t.colors.accent};
  --color-background: ${t.colors.background};
  --color-surface: ${t.colors.surface};
  --color-text: ${t.colors.text};
  --color-text-secondary: ${t.colors.textSecondary};
  --color-border: ${t.colors.border};
  --color-success: ${t.colors.success};
  --color-warning: ${t.colors.warning};
  --color-error: ${t.colors.error};

  /* Typography */
  --font-family: ${t.typography.fontFamily}, sans-serif;
  --font-size: ${t.typography.fontSize};
  --line-height: ${t.typography.lineHeight};
  --heading-weight: ${t.typography.headingWeight};

  /* Spacing */
  --spacing-unit: ${t.spacing.unit};
  --border-radius: ${t.spacing.borderRadius};
  --component-padding: ${t.spacing.componentPadding};
}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Design System</h2>
        <div className="flex gap-2">
          <button
            onClick={exportTheme}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm"
          >
            Export CSS
          </button>
          <button
            onClick={saveTheme}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-sm"
          >
            Save Theme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
            {(['colors', 'typography', 'spacing', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Color Palette</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(theme.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border border-zinc-700 cursor-pointer"
                      style={{ backgroundColor: value }}
                    />
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateColor(key as keyof ThemeConfig['colors'], e.target.value)}
                        className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColor(key as keyof ThemeConfig['colors'], e.target.value)}
                      className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold mb-4">Typography</h3>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Font Family</label>
                <div className="relative">
                  <button
                    onClick={() => setShowFontSelector(!showFontSelector)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-left flex items-center justify-between"
                  >
                    <span style={{ fontFamily: theme.typography.fontFamily }}>
                      {theme.typography.fontFamily}
                    </span>
                    <span className="text-zinc-400">▼</span>
                  </button>

                  {showFontSelector && (
                    <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-64 overflow-y-auto">
                      {FONTS.map((font) => (
                        <button
                          key={font}
                          onClick={() => {
                            updateTypography('fontFamily', font);
                            setShowFontSelector(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors"
                          style={{ fontFamily: font }}
                        >
                          <span className="text-sm">{font}</span>
                          <span className="text-xs text-zinc-400 ml-2">Aa Bb Cc</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Base Font Size</label>
                  <select
                    value={theme.typography.fontSize}
                    onChange={(e) => updateTypography('fontSize', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    {['12px', '14px', '16px', '18px'].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Line Height</label>
                  <select
                    value={theme.typography.lineHeight}
                    onChange={(e) => updateTypography('lineHeight', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    {['1.25', '1.5', '1.75', '2'].map((lh) => (
                      <option key={lh} value={lh}>{lh}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Heading Weight</label>
                <select
                  value={theme.typography.headingWeight}
                  onChange={(e) => updateTypography('headingWeight', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                >
                  {['500', '600', '700', '800'].map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Spacing Tab */}
          {activeTab === 'spacing' && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold mb-4">Spacing & Layout</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Base Unit</label>
                  <select
                    value={theme.spacing.unit}
                    onChange={(e) => updateSpacing('unit', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    {['2px', '4px', '8px'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Border Radius</label>
                  <select
                    value={theme.spacing.borderRadius}
                    onChange={(e) => updateSpacing('borderRadius', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                  >
                    {['0px', '4px', '8px', '12px', '16px', '9999px'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Component Padding</label>
                <select
                  value={theme.spacing.componentPadding}
                  onChange={(e) => updateSpacing('componentPadding', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                >
                  {['12px', '16px', '20px', '24px', '32px'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Live Preview</h3>

              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: theme.colors.background,
                  padding: theme.spacing.componentPadding,
                  fontFamily: theme.typography.fontFamily
                }}
              >
                {/* Preview Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    A
                  </div>
                  <div>
                    <h4
                      className="text-lg"
                      style={{ color: theme.colors.text, fontWeight: theme.typography.headingWeight }}
                    >
                      AbhiBase Preview
                    </h4>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Design system preview
                    </p>
                  </div>
                </div>

                {/* Preview Button */}
                <button
                  className="px-6 py-2 text-white mb-4"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.spacing.borderRadius
                  }}
                >
                  Primary Button
                </button>

                {/* Preview Card */}
                <div
                  className="p-4 mb-4"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.spacing.borderRadius
                  }}
                >
                  <p style={{ color: theme.colors.text, fontSize: theme.typography.fontSize }}>
                    Sample card content
                  </p>
                </div>

                {/* Color Swatches */}
                <div className="flex gap-2">
                  {['success', 'warning', 'error'].map((color) => (
                    <div
                      key={color}
                      className="px-3 py-1 text-xs text-white rounded capitalize"
                      style={{ backgroundColor: theme.colors[color as keyof ThemeConfig['colors']] }}
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Themes Sidebar */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Saved Themes</h3>
          {savedThemes.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">
              No saved themes yet. Create and save your first theme.
            </p>
          ) : (
            <div className="space-y-2">
              {savedThemes.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => loadTheme(saved)}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-900" style={{ backgroundColor: saved.colors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-900" style={{ backgroundColor: saved.colors.secondary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-900" style={{ backgroundColor: saved.colors.accent }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{saved.name}</p>
                    <p className="text-xs text-zinc-400">{saved.typography.fontFamily}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <label className="block text-sm text-zinc-400 mb-2">Theme Name</label>
            <input
              type="text"
              value={theme.name}
              onChange={(e) => setTheme({ ...theme, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
