'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ──────── TYPES ──────── */
interface ComponentNode {
  id: string;
  type: string;
  label: string;
  props: Record<string, string>;
  children: ComponentNode[];
  style: Record<string, string>;
}

interface HistoryEntry {
  components: ComponentNode[];
  timestamp: number;
}

const COMPONENT_PALETTE = [
  { type: 'Container', icon: '📦', category: 'Layout' },
  { type: 'Row', icon: '↔️', category: 'Layout' },
  { type: 'Column', icon: '↕️', category: 'Layout' },
  { type: 'Card', icon: '🃏', category: 'Layout' },
  { type: 'Header', icon: '📰', category: 'Layout' },
  { type: 'Divider', icon: '➖', category: 'Layout' },
  { type: 'Heading', icon: '🔤', category: 'Text' },
  { type: 'Paragraph', icon: '📄', category: 'Text' },
  { type: 'Label', icon: '🏷️', category: 'Text' },
  { type: 'Badge', icon: '🔴', category: 'Text' },
  { type: 'Button', icon: '🔘', category: 'Input' },
  { type: 'Input', icon: '📝', category: 'Input' },
  { type: 'Textarea', icon: '📋', category: 'Input' },
  { type: 'Select', icon: '📑', category: 'Input' },
  { type: 'Checkbox', icon: '☑️', category: 'Input' },
  { type: 'Toggle', icon: '🔀', category: 'Input' },
  { type: 'Image', icon: '🖼️', category: 'Media' },
  { type: 'Avatar', icon: '👤', category: 'Media' },
  { type: 'Icon', icon: '⭐', category: 'Media' },
  { type: 'Table', icon: '📊', category: 'Data' },
  { type: 'List', icon: '📋', category: 'Data' },
  { type: 'Progress', icon: '📶', category: 'Data' },
  { type: 'Chart', icon: '📈', category: 'Data' },
  { type: 'Modal', icon: '🪟', category: 'Overlay' },
  { type: 'Toast', icon: '💬', category: 'Overlay' },
  { type: 'Tabs', icon: '🗂️', category: 'Navigation' },
  { type: 'Navbar', icon: '🧭', category: 'Navigation' },
  { type: 'Sidebar', icon: '📐', category: 'Navigation' },
  { type: 'Footer', icon: '📎', category: 'Navigation' },
];

const STYLE_PRESETS: Record<string, Record<string, string>> = {
  'Primary Button': { background: '#7c3aed', color: 'white', borderRadius: '8px', padding: '10px 20px', fontWeight: '600' },
  'Secondary Button': { background: '#27272a', color: 'white', borderRadius: '8px', padding: '10px 20px', border: '1px solid #3f3f46' },
  'Card': { background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' },
  'Input': { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px 14px', color: 'white', width: '100%' },
  'Heading': { fontSize: '24px', fontWeight: '700', color: 'white' },
  'Subheading': { fontSize: '16px', fontWeight: '500', color: '#a1a1aa' },
  'Badge': { background: '#7c3aed', color: 'white', borderRadius: '12px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' },
  'Navbar': { background: '#09090b', borderBottom: '1px solid #27272a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  'Footer': { background: '#09090b', borderTop: '1px solid #27272a', padding: '24px', textAlign: 'center', color: '#71717a' },
};

/* ──────── HELPERS ──────── */
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();

function generateCode(components: ComponentNode[], indent = 0): string {
  const pad = '  '.repeat(indent);
  if (components.length === 0) return `${pad}<div className="p-8 text-zinc-500">Drop components here</div>\n`;
  return components.map(c => {
    const tag = c.type.toLowerCase();
    const styleStr = Object.keys(c.style).length > 0
      ? ` style={${JSON.stringify(c.style)}}`
      : '';
    const propsStr = Object.entries(c.props).map(([k, v]) => ` ${k}="${v}"`).join('');

    if (['button', 'input', 'textarea', 'select', 'img', 'br', 'hr', 'progress'].includes(tag)) {
      if (tag === 'img') return `${pad}<img src="${c.props.src || '/placeholder.png'}" alt="${c.label}" className="rounded-lg"${styleStr} />`;
      if (tag === 'input') return `${pad}<input type="${c.props.type || 'text'}" placeholder="${c.props.placeholder || ''}" className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white w-full"${styleStr} />`;
      if (tag === 'textarea') return `${pad}<textarea placeholder="${c.props.placeholder || ''}" className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white w-full h-24"${styleStr} />`;
      if (tag === 'select') return `${pad}<select className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white"${styleStr}>\n${pad}  <option>Option 1</option>\n${pad}  <option>Option 2</option>\n${pad}</select>`;
      if (tag === 'progress') return `${pad}<div className="w-full bg-zinc-800 rounded-full h-2"${styleStr}><div className="bg-violet-500 h-2 rounded-full" style={{width: '60%'}}></div></div>`;
      return `${pad}<button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium"${styleStr}>${c.label}</button>`;
    }

    if (c.children.length > 0) {
      const childCode = generateCode(c.children, indent + 1);
      const divClass = c.type === 'Container' ? 'max-w-6xl mx-auto p-6'
        : c.type === 'Row' ? 'flex gap-4'
        : c.type === 'Column' ? 'flex flex-col gap-4'
        : c.type === 'Card' ? 'bg-zinc-900 border border-zinc-800 rounded-xl p-6'
        : c.type === 'Table' ? 'w-full border-collapse'
        : c.type === 'List' ? 'space-y-2'
        : c.type === 'Tabs' ? 'flex gap-2 border-b border-zinc-800'
        : '';
      return `${pad}<div className="${divClass}"${styleStr}>\n${childCode}${pad}</div>\n`;
    }

    if (c.type === 'Heading') return `${pad}<h1 className="text-2xl font-bold text-white"${styleStr}>${c.label}</h1>\n`;
    if (c.type === 'Paragraph') return `${pad}<p className="text-zinc-400"${styleStr}>${c.label}</p>\n`;
    if (c.type === 'Label') return `${pad}<span className="text-sm text-zinc-500"${styleStr}>${c.label}</span>\n`;
    if (c.type === 'Badge') return `${pad}<span className="bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full text-xs font-medium"${styleStr}>${c.label}</span>\n`;
    if (c.type === 'Divider') return `${pad}<hr className="border-zinc-800"${styleStr} />\n`;
    if (c.type === 'Image') return `${pad}<img src="${c.props.src || '/placeholder.png'}" alt="${c.label}" className="rounded-lg"${styleStr} />\n`;
    if (c.type === 'Avatar') return `${pad}<div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold"${styleStr}>${c.label[0]}</div>\n`;
    if (c.type === 'Icon') return `${pad}<span className="text-violet-400"${styleStr}>⭐</span>\n`;
    if (c.type === 'Navbar') return `${pad}<nav className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800"${styleStr}>\n${pad}  <span className="font-bold text-white">MyApp</span>\n${pad}  <div className="flex gap-4"><button className="text-zinc-400 hover:text-white">Home</button><button className="text-zinc-400 hover:text-white">About</button></div>\n${pad}</nav>\n`;
    if (c.type === 'Sidebar') return `${pad}<aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 min-h-screen"${styleStr}>\n${pad}  <div className="space-y-2"><div className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm">Dashboard</div><div className="px-3 py-2 text-zinc-400 text-sm hover:bg-zinc-800 rounded-lg">Settings</div></div>\n${pad}</aside>\n`;
    if (c.type === 'Footer') return `${pad}<footer className="bg-zinc-900 border-t border-zinc-800 p-6 text-center text-zinc-500"${styleStr}>© 2026 MyApp. All rights reserved.</footer>\n`;
    if (c.type === 'Modal') return `${pad}<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"${styleStr}>\n${pad}  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4">\n${pad}    <h2 className="text-lg font-bold text-white mb-4">${c.label}</h2>\n${pad}    <p className="text-zinc-400">Modal content here</p>\n${pad}  </div>\n${pad}</div>\n`;
    if (c.type === 'Toast') return `${pad}<div className="fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm shadow-lg"${styleStr}>${c.label}</div>\n`;
    if (c.type === 'Chart') return `${pad}<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"${styleStr}>\n${pad}  <div className="h-48 flex items-end gap-2 px-4">\n${pad}    {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (\n${pad}      <div key={i} className="flex-1 bg-violet-500 rounded-t" style={{height: \`\${h}%\`}} />\n${pad}    ))}\n${pad}  </div>\n${pad}</div>\n`;

    return `${pad}<div className="p-2"${styleStr}>${c.label}</div>\n`;
  }).join('');
}

function generateExportCode(components: ComponentNode[]): string {
  return `'use client';

import { useState } from 'react';

export default function GeneratedApp() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
${generateCode(components, 4)}
    </div>
  );
}
`;
}

/* ──────── MAIN COMPONENT ──────── */
export default function AdvancedAppBuilder() {
  const [components, setComponents] = useState<ComponentNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [tab, setTab] = useState<'design' | 'code' | 'export'>('design');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [appName, setAppName] = useState('My App');
  const [paletteSearch, setPaletteSearch] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const saveHistory = useCallback((comps: ComponentNode[]) => {
    setHistory(prev => {
      const newHist = prev.slice(0, historyIdx + 1);
      newHist.push({ components: comps, timestamp: now() });
      if (newHist.length > 50) newHist.shift();
      return newHist;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setComponents(history[historyIdx - 1].components);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setComponents(history[historyIdx + 1].components);
    }
  };

  const addComponent = (type: string, parentId?: string) => {
    const node: ComponentNode = {
      id: uid(), type, label: type, props: {}, children: [], style: {},
    };
    const applyPreset = STYLE_PRESETS[type + ' Button'] || STYLE_PRESETS[type] || {};
    node.style = { ...applyPreset };

    const newComps = [...components];
    if (parentId) {
      const addToParent = (nodes: ComponentNode[]): boolean => {
        for (const n of nodes) {
          if (n.id === parentId) { n.children.push(node); return true; }
          if (addToParent(n.children)) return true;
        }
        return false;
      };
      addToParent(newComps);
    } else {
      newComps.push(node);
    }
    setComponents(newComps);
    saveHistory(newComps);
    setSelectedId(node.id);
  };

  const removeComponent = (id: string) => {
    const removeFromList = (nodes: ComponentNode[]): ComponentNode[] =>
      nodes.filter(n => n.id !== id).map(n => ({ ...n, children: removeFromList(n.children) }));
    const newComps = removeFromList(components);
    setComponents(newComps);
    saveHistory(newComps);
    if (selectedId === id) setSelectedId(null);
  };

  const updateComponent = (id: string, updates: Partial<ComponentNode>) => {
    const updateInList = (nodes: ComponentNode[]): ComponentNode[] =>
      nodes.map(n => n.id === id ? { ...n, ...updates } : { ...n, children: updateInList(n.children) });
    const newComps = updateInList(components);
    setComponents(newComps);
  };

  const commitUpdate = () => saveHistory(components);

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const moveInList = (nodes: ComponentNode[]): ComponentNode[] => {
      const idx = nodes.findIndex(n => n.id === id);
      if (idx !== -1) {
        const newNodes = [...nodes];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < newNodes.length) {
          [newNodes[idx], newNodes[swapIdx]] = [newNodes[swapIdx], newNodes[idx]];
        }
        return newNodes;
      }
      return nodes.map(n => ({ ...n, children: moveInList(n.children) }));
    };
    const newComps = moveInList(components);
    setComponents(newComps);
    saveHistory(newComps);
  };

  const duplicateComponent = (id: string) => {
    const dup = (nodes: ComponentNode[]): ComponentNode[] =>
      nodes.flatMap(n => {
        if (n.id === id) return [n, { ...n, id: uid(), children: dup(n.children) }];
        return [{ ...n, children: dup(n.children) }];
      });
    const newComps = dup(components);
    setComponents(newComps);
    saveHistory(newComps);
  };

  const clearAll = () => { setComponents([]); saveHistory([]); setSelectedId(null); };

  const loadTemplate = (template: string) => {
    const templates: Record<string, ComponentNode[]> = {
      landing: [
        { id: uid(), type: 'Navbar', label: 'Navbar', props: {}, children: [], style: {} },
        { id: uid(), type: 'Container', label: 'Hero', props: {}, style: {}, children: [
          { id: uid(), type: 'Heading', label: 'Build Something Amazing', props: {}, children: [], style: {} },
          { id: uid(), type: 'Paragraph', label: 'The all-in-one platform for modern web apps.', props: {}, children: [], style: {} },
          { id: uid(), type: 'Button', label: 'Get Started Free', props: {}, children: [], style: STYLE_PRESETS['Primary Button'] },
        ]},
        { id: uid(), type: 'Container', label: 'Features', props: {}, style: {}, children: [
          { id: uid(), type: 'Row', label: 'Row', props: {}, style: {}, children: [
            { id: uid(), type: 'Card', label: 'Feature 1', props: {}, style: {}, children: [
              { id: uid(), type: 'Heading', label: 'Fast', props: {}, children: [], style: {} },
              { id: uid(), type: 'Paragraph', label: 'Blazing fast performance.', props: {}, children: [], style: {} },
            ]},
            { id: uid(), type: 'Card', label: 'Feature 2', props: {}, style: {}, children: [
              { id: uid(), type: 'Heading', label: 'Secure', props: {}, children: [], style: {} },
              { id: uid(), type: 'Paragraph', label: 'Enterprise-grade security.', props: {}, children: [], style: {} },
            ]},
            { id: uid(), type: 'Card', label: 'Feature 3', props: {}, style: {}, children: [
              { id: uid(), type: 'Heading', label: 'Scalable', props: {}, children: [], style: {} },
              { id: uid(), type: 'Paragraph', label: 'Grows with your business.', props: {}, children: [], style: {} },
            ]},
          ]},
        ]},
        { id: uid(), type: 'Footer', label: 'Footer', props: {}, children: [], style: {} },
      ],
      dashboard: [
        { id: uid(), type: 'Navbar', label: 'Navbar', props: {}, children: [], style: {} },
        { id: uid(), type: 'Container', label: 'Dashboard', props: {}, style: {}, children: [
          { id: uid(), type: 'Row', label: 'Stats', props: {}, style: {}, children: [
            { id: uid(), type: 'Card', label: 'Revenue', props: {}, style: {}, children: [
              { id: uid(), type: 'Label', label: 'Total Revenue', props: {}, children: [], style: {} },
              { id: uid(), type: 'Heading', label: '$45,231.89', props: {}, children: [], style: {} },
              { id: uid(), type: 'Badge', label: '+20.1% from last month', props: {}, children: [], style: {} },
            ]},
            { id: uid(), type: 'Card', label: 'Users', props: {}, style: {}, children: [
              { id: uid(), type: 'Label', label: 'Active Users', props: {}, children: [], style: {} },
              { id: uid(), type: 'Heading', label: '2,350', props: {}, children: [], style: {} },
              { id: uid(), type: 'Badge', label: '+180 this week', props: {}, children: [], style: {} },
            ]},
            { id: uid(), type: 'Card', label: 'Orders', props: {}, style: {}, children: [
              { id: uid(), type: 'Label', label: 'Pending Orders', props: {}, children: [], style: {} },
              { id: uid(), type: 'Heading', label: '142', props: {}, children: [], style: {} },
              { id: uid(), type: 'Badge', label: '12 urgent', props: {}, children: [], style: {} },
            ]},
          ]},
          { id: uid(), type: 'Chart', label: 'Revenue Chart', props: {}, children: [], style: {} },
          { id: uid(), type: 'Table', label: 'Recent Orders', props: {}, children: [], style: {} },
        ]},
        { id: uid(), type: 'Footer', label: 'Footer', props: {}, children: [], style: {} },
      ],
      form: [
        { id: uid(), type: 'Container', label: 'Form', props: {}, style: {}, children: [
          { id: uid(), type: 'Card', label: 'Form Card', props: {}, style: {}, children: [
            { id: uid(), type: 'Heading', label: 'Create Account', props: {}, children: [], style: {} },
            { id: uid(), type: 'Paragraph', label: 'Fill in the details below.', props: {}, children: [], style: {} },
            { id: uid(), type: 'Label', label: 'Full Name', props: {}, children: [], style: {} },
            { id: uid(), type: 'Input', label: 'Name', props: { placeholder: 'John Doe' }, children: [], style: STYLE_PRESETS['Input'] },
            { id: uid(), type: 'Label', label: 'Email', props: {}, children: [], style: {} },
            { id: uid(), type: 'Input', label: 'Email', props: { placeholder: 'john@example.com', type: 'email' }, children: [], style: STYLE_PRESETS['Input'] },
            { id: uid(), type: 'Label', label: 'Message', props: {}, children: [], style: {} },
            { id: uid(), type: 'Textarea', label: 'Message', props: { placeholder: 'Tell us about yourself...' }, children: [], style: STYLE_PRESETS['Input'] },
            { id: uid(), type: 'Label', label: 'Role', props: {}, children: [], style: {} },
            { id: uid(), type: 'Select', label: 'Role', props: {}, children: [], style: STYLE_PRESETS['Input'] },
            { id: uid(), type: 'Button', label: 'Create Account', props: {}, children: [], style: STYLE_PRESETS['Primary Button'] },
          ]},
        ]},
      ],
    };
    const newComps = templates[template] || [];
    setComponents(newComps);
    saveHistory(newComps);
  };

  const renderPreviewNode = (node: ComponentNode, depth = 0): React.ReactNode => {
    const isSelected = selectedId === node.id;
    const outlineClass = isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950' : '';
    const wrapper = (content: React.ReactNode, extraClass = '') => (
      <div key={node.id} className={`relative group ${outlineClass} ${extraClass}`}
        onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
        style={node.style}>
        {content}
        {isSelected && (
          <div className="absolute -top-8 left-0 flex gap-1 z-10">
            <button onClick={(e) => { e.stopPropagation(); moveComponent(node.id, 'up'); }}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-1.5 py-0.5 rounded">↑</button>
            <button onClick={(e) => { e.stopPropagation(); moveComponent(node.id, 'down'); }}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-1.5 py-0.5 rounded">↓</button>
            <button onClick={(e) => { e.stopPropagation(); duplicateComponent(node.id); }}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-1.5 py-0.5 rounded">⧉</button>
            <button onClick={(e) => { e.stopPropagation(); removeComponent(node.id); }}
              className="bg-red-600 hover:bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">✕</button>
          </div>
        )}
      </div>
    );

    switch (node.type) {
      case 'Navbar': return wrapper(<nav className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800"><span className="font-bold text-white">{appName}</span><div className="flex gap-4"><span className="text-zinc-400 hover:text-white cursor-pointer">Home</span><span className="text-zinc-400 hover:text-white cursor-pointer">About</span></div></nav>);
      case 'Sidebar': return wrapper(<aside className="w-48 bg-zinc-900 border-r border-zinc-800 p-3"><div className="space-y-1"><div className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm">Dashboard</div><div className="px-3 py-1.5 text-zinc-400 text-sm rounded-lg hover:bg-zinc-800">Settings</div></div></aside>);
      case 'Footer': return wrapper(<footer className="bg-zinc-900 border-t border-zinc-800 p-6 text-center text-zinc-500 text-sm">© 2026 {appName}</footer>);
      case 'Container': return wrapper(<div className="max-w-5xl mx-auto p-6">{node.children.map(c => renderPreviewNode(c, depth + 1))}</div>);
      case 'Row': return wrapper(<div className="flex gap-3 flex-wrap">{node.children.map(c => renderPreviewNode(c, depth + 1))}</div>);
      case 'Column': return wrapper(<div className="flex flex-col gap-3">{node.children.map(c => renderPreviewNode(c, depth + 1))}</div>);
      case 'Card': return wrapper(<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 min-w-[200px]">{node.children.length > 0 ? node.children.map(c => renderPreviewNode(c, depth + 1)) : <span className="text-zinc-600 text-sm">Empty card</span>}</div>);
      case 'Heading': return wrapper(<h1 className="text-xl font-bold text-white">{node.label}</h1>);
      case 'Paragraph': return wrapper(<p className="text-zinc-400 text-sm">{node.label}</p>);
      case 'Label': return wrapper(<span className="text-xs text-zinc-500 block mb-1">{node.label}</span>);
      case 'Badge': return wrapper(<span className="inline-block bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full text-xs">{node.label}</span>);
      case 'Button': return wrapper(<button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{node.label}</button>);
      case 'Input': return wrapper(<input placeholder={node.props.placeholder || ''} className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm w-full" />);
      case 'Textarea': return wrapper(<textarea placeholder={node.props.placeholder || ''} className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm w-full h-20" />);
      case 'Select': return wrapper(<select className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm w-full"><option>Option 1</option><option>Option 2</option></select>);
      case 'Image': return wrapper(<div className="bg-zinc-800 rounded-lg h-32 flex items-center justify-center text-zinc-600 text-sm">🖼 Image</div>);
      case 'Avatar': return wrapper(<div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">{node.label[0]}</div>);
      case 'Divider': return wrapper(<hr className="border-zinc-800 my-2" />);
      case 'Chart': return wrapper(<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="h-32 flex items-end gap-1.5 px-2">{[40, 65, 45, 80, 55, 70, 90, 35, 75, 50, 85, 60].map((h, i) => <div key={i} className="flex-1 bg-violet-500/80 rounded-t" style={{ height: `${h}%` }} />)}</div></div>);
      case 'Table': return wrapper(<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-zinc-800"><th className="text-left py-2 text-zinc-400 font-medium">Name</th><th className="text-left py-2 text-zinc-400 font-medium">Status</th><th className="text-left py-2 text-zinc-400 font-medium">Date</th></tr></thead><tbody><tr className="border-b border-zinc-800/50"><td className="py-2 text-white">Project A</td><td className="py-2"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs">Active</span></td><td className="py-2 text-zinc-400">2026-09-15</td></tr><tr><td className="py-2 text-white">Project B</td><td className="py-2"><span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs">Pending</span></td><td className="py-2 text-zinc-400">2026-09-14</td></tr></tbody></table></div>);
      case 'Progress': return wrapper(<div className="w-full bg-zinc-800 rounded-full h-2"><div className="bg-violet-500 h-2 rounded-full" style={{ width: '65%' }} /></div>);
      case 'Modal': return wrapper(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4"><h2 className="text-lg font-bold text-white mb-3">{node.label}</h2><p className="text-zinc-400 text-sm">Modal content here</p></div></div>);
      case 'Toast': return wrapper(<div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm inline-block">{node.label}</div>);
      case 'Tabs': return wrapper(<div className="flex gap-2 border-b border-zinc-800 pb-2">{['Tab 1', 'Tab 2', 'Tab 3'].map((t, i) => <div key={t} className={`px-3 py-1 rounded-lg text-sm cursor-pointer ${i === 0 ? 'bg-violet-500/20 text-violet-400' : 'text-zinc-400 hover:text-white'}`}>{t}</div>)}</div>);
      default:
        if (node.children.length > 0) return wrapper(<div>{node.children.map(c => renderPreviewNode(c, depth + 1))}</div>);
        return wrapper(<div className="p-1 text-zinc-500 text-sm bg-zinc-900/50 rounded">{node.label}</div>);
    }
  };

  const selectedNode = selectedId ? (() => {
    const find = (nodes: ComponentNode[]): ComponentNode | undefined => {
      for (const n of nodes) {
        if (n.id === selectedId) return n;
        const found = find(n.children);
        if (found) return found;
      }
      return undefined;
    };
    return find(components);
  })() : null;

  const categories = [...new Set(COMPONENT_PALETTE.map(c => c.category))];
  const filteredPalette = COMPONENT_PALETTE.filter(c => !paletteSearch || c.type.toLowerCase().includes(paletteSearch.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0">
      {/* ─── LEFT: Component Palette ─── */}
      <div className="w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="font-bold text-sm mb-2">Components</h3>
          <input value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)}
            placeholder="Search..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {categories.map(cat => (
            <div key={cat}>
              <div className="text-xs text-zinc-500 font-medium px-2 mb-1 uppercase">{cat}</div>
              <div className="grid grid-cols-2 gap-1">
                {filteredPalette.filter(c => c.category === cat).map(c => (
                  <button key={c.type}
                    draggable
                    onDragStart={() => setDraggedType(c.type)}
                    onDragEnd={() => setDraggedType(null)}
                    onClick={() => addComponent(c.type, selectedId || undefined)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-xs transition-all cursor-grab active:cursor-grabbing">
                    <span className="text-base">{c.icon}</span>
                    <span className="text-zinc-300 truncate w-full text-center">{c.type}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Templates */}
        <div className="p-3 border-t border-zinc-800">
          <h4 className="text-xs text-zinc-500 font-medium mb-2 uppercase">Templates</h4>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => loadTemplate('landing')} className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300">🌐 Landing</button>
            <button onClick={() => loadTemplate('dashboard')} className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300">📊 Dashboard</button>
            <button onClick={() => loadTemplate('form')} className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300">📝 Form</button>
          </div>
        </div>
      </div>

      {/* ─── CENTER: Canvas ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 bg-zinc-900/50 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
          <input value={appName} onChange={e => setAppName(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white w-48" />
          <div className="flex gap-1">
            <button onClick={undo} disabled={historyIdx <= 0}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-sm" title="Undo">↩</button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-sm" title="Redo">↪</button>
          </div>
          <div className="h-5 w-px bg-zinc-700" />
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {(['design', 'code', 'export'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs font-medium capitalize ${tab === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-zinc-500">{components.length} components</span>
          <button onClick={clearAll} className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs">Clear</button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-6"
          onDragOver={e => e.preventDefault()}
          onDrop={() => { if (draggedType) addComponent(draggedType); setDraggedType(null); }}>
          {tab === 'design' && (
            <div ref={previewRef} className="min-h-full bg-zinc-950 rounded-xl border border-zinc-800 p-6"
              onClick={() => setSelectedId(null)}>
              {components.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl">
                  <span className="text-4xl mb-3">🎨</span>
                  <p className="text-sm">Drag components here or click to add</p>
                  <p className="text-xs mt-1 text-zinc-700">Select a component and click to add to selection</p>
                </div>
              ) : (
                <div className="space-y-2">{components.map(c => renderPreviewNode(c))}</div>
              )}
            </div>
          )}
          {tab === 'code' && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden h-full">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <span className="text-xs text-zinc-500">generated-app.tsx</span>
                <button onClick={() => navigator.clipboard.writeText(generateCode(components))}
                  className="ml-auto text-xs text-violet-400 hover:text-violet-300">Copy</button>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-auto max-h-[500px] leading-relaxed">
                <code>{generateCode(components)}</code>
              </pre>
            </div>
          )}
          {tab === 'export' && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
              <h3 className="font-bold text-lg">Export App</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                  <h4 className="font-medium mb-2">📄 React Component</h4>
                  <p className="text-xs text-zinc-400 mb-3">Copy-paste ready JSX component</p>
                  <button onClick={() => { navigator.clipboard.writeText(generateExportCode(components)); alert('Copied!'); }}
                    className="w-full bg-violet-600 hover:bg-violet-700 py-2 rounded-lg text-sm font-medium">Copy Code</button>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                  <h4 className="font-medium mb-2">🌐 HTML Export</h4>
                  <p className="text-xs text-zinc-400 mb-3">Standalone HTML file with inline styles</p>
                  <button onClick={() => {
                    const html = `<!DOCTYPE html><html><head><title>${appName}</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-zinc-950 text-white p-8"><pre class="font-mono text-sm">${generateCode(components).replace(/</g, '&lt;')}</pre></body></html>`;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${appName.toLowerCase().replace(/\s/g, '-')}.html`; a.click();
                    URL.revokeObjectURL(url);
                  }} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg text-sm font-medium">Download HTML</button>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                  <h4 className="font-medium mb-2">📦 JSON Schema</h4>
                  <p className="text-xs text-zinc-400 mb-3">Component tree as JSON for re-import</p>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(components, null, 2)); alert('Copied!'); }}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg text-sm font-medium">Copy JSON</button>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                  <h4 className="font-medium mb-2">🚀 Deploy</h4>
                  <p className="text-xs text-zinc-400 mb-3">Deploy to Vercel/Netlify (coming soon)</p>
                  <button disabled className="w-full bg-zinc-700 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">Deploy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Properties Panel ─── */}
      {selectedNode && (
        <div className="w-72 bg-zinc-900/50 border-l border-zinc-800 overflow-y-auto flex flex-col shrink-0">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">{selectedNode.type}</h3>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{selectedNode.id.slice(0, 6)}</span>
          </div>
          <div className="p-3 space-y-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Label / Text</label>
              <input value={selectedNode.label}
                onChange={e => updateComponent(selectedNode.id, { label: e.target.value })}
                onBlur={commitUpdate}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            </div>
            {selectedNode.type === 'Input' && (
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Placeholder</label>
                <input value={selectedNode.props.placeholder || ''}
                  onChange={e => updateComponent(selectedNode.id, { props: { ...selectedNode.props, placeholder: e.target.value } })}
                  onBlur={commitUpdate}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
            )}
            {selectedNode.type === 'Image' && (
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Image URL</label>
                <input value={selectedNode.props.src || ''}
                  onChange={e => updateComponent(selectedNode.id, { props: { ...selectedNode.props, src: e.target.value } })}
                  onBlur={commitUpdate}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800">
              <label className="text-xs text-zinc-500 block mb-2">Style</label>
              {Object.entries(selectedNode.style).length === 0 ? (
                <p className="text-xs text-zinc-600">No custom styles</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(selectedNode.style).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-20 shrink-0 truncate">{key}</span>
                      <input value={val}
                        onChange={e => {
                          const newStyle = { ...selectedNode.style, [key]: e.target.value };
                          updateComponent(selectedNode.id, { style: newStyle });
                        }}
                        onBlur={commitUpdate}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                      <button onClick={() => {
                        const { [key]: _, ...rest } = selectedNode.style;
                        updateComponent(selectedNode.id, { style: rest });
                        commitUpdate();
                      }} className="text-zinc-600 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowStylePanel(!showStylePanel)}
                className="mt-2 text-xs text-violet-400 hover:text-violet-300">+ Add style</button>
              {showStylePanel && (
                <div className="mt-2 bg-zinc-800 rounded-lg p-2 space-y-1">
                  {['background', 'color', 'border', 'borderRadius', 'padding', 'margin', 'fontSize', 'fontWeight', 'width', 'height', 'display', 'gap'].map(s => (
                    <button key={s}
                      onClick={() => {
                        updateComponent(selectedNode.id, { style: { ...selectedNode.style, [s]: '' } });
                        setShowStylePanel(false);
                      }}
                      className="block w-full text-left px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 rounded">{s}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <label className="text-xs text-zinc-500 block mb-2">Presets</label>
              <div className="flex flex-wrap gap-1">
                {Object.keys(STYLE_PRESETS).slice(0, 6).map(preset => (
                  <button key={preset}
                    onClick={() => { updateComponent(selectedNode.id, { style: { ...STYLE_PRESETS[preset] } }); commitUpdate(); }}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2 py-1 rounded">{preset}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
