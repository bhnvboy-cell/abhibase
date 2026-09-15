'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/* ──────────────── TYPES ──────────────── */
interface EmailBlock {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface EmailConfig {
  subject: string;
  preheader: string;
  brandName: string;
  brandLogo: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  width: number;
  borderRadius: number;
}

/* ──────────────── BLOCK DEFINITIONS ──────────────── */
const BLOCK_DEFS: Record<string, { label: string; icon: string; category: string; defaults: Record<string, any> }> = {
  header:      { label: 'Header',         icon: '📍', category: 'Layout',   defaults: { showLogo: true, showNav: true, navLinks: ['Home','Features','Pricing'] } },
  hero:        { label: 'Hero Banner',    icon: '🎯', category: 'Content',  defaults: { headline: 'Welcome to Our Platform', subheadline: 'We are excited to have you on board', ctaText: 'Get Started', ctaLink: '#', bgType: 'gradient' } },
  text:        { label: 'Text Block',     icon: '📝', category: 'Content',  defaults: { content: 'This is a text block. You can write anything here. Use the editor to customize this content.', alignment: 'left' } },
  image:       { label: 'Image Block',    icon: '🖼️', category: 'Media',    defaults: { url: 'https://picsum.photos/600/300', alt: 'Image', width: '100%', alignment: 'center', caption: '' } },
  button:      { label: 'Button',         icon: '🔘', category: 'Conversion',defaults: { text: 'Click Here', link: '#', style: 'primary', alignment: 'center', fullWidth: false } },
  divider:     { label: 'Divider',        icon: '➖', category: 'Layout',   defaults: { style: 'solid', color: '#eee', spacing: 20 } },
  spacer:      { label: 'Spacer',         icon: '↕️', category: 'Layout',   defaults: { height: 40 } },
  columns:     { label: 'Two Columns',    icon: '▥', category: 'Layout',   defaults: { leftContent: 'Left column content', rightContent: 'Right column content', ratio: '50-50' } },
  social:      { label: 'Social Links',   icon: '📱', category: 'Social',   defaults: { platforms: ['twitter','facebook','linkedin','instagram'], style: 'icon' } },
  products:    { label: 'Product Grid',   icon: '🛍️', category: 'Commerce', defaults: { columns: 2, items: [{ name: 'Product 1', price: '$29.99', image: 'https://picsum.photos/200/200?random=1' },{ name: 'Product 2', price: '$39.99', image: 'https://picsum.photos/200/200?random=2' }] } },
  features:    { label: 'Feature List',   icon: '✅', category: 'Content',  defaults: { items: ['Feature One - Description','Feature Two - Description','Feature Three - Description'], icon: '✓' } },
  testimonial: { label: 'Testimonial',    icon: '💬', category: 'Social',   defaults: { quote: 'This product changed my life!', author: 'Jane Smith', role: 'CEO, Company', avatar: '👩‍💼' } },
  promo:       { label: 'Promo Banner',   icon: '🏷️', category: 'Commerce', defaults: { headline: '20% OFF', subheadline: 'Use code SAVE20 at checkout', bgColor: '#6366f1', textColor: '#ffffff' } },
  footer:      { label: 'Footer',         icon: '📎', category: 'Layout',   defaults: { showUnsubscribe: true, showSocial: true, copyright: true, address: '123 Main St, City, Country' } },
  countdown:   { label: 'Countdown',      icon: '⏰', category: 'Conversion',defaults: { date: '2025-12-31', label: 'Sale Ends In', urgency: true } },
  review:      { label: 'Star Rating',    icon: '⭐', category: 'Social',   defaults: { rating: 5, text: 'Amazing product! Highly recommended.', showStars: true } },
  invoice:     { label: 'Invoice Table',  icon: '📊', category: 'Commerce', defaults: { items: [{ desc: 'Service Fee', qty: 1, price: '$99.00' },{ desc: 'Premium Add-on', qty: 2, price: '$49.00' }], subtotal: '$197.00', tax: '$15.76', total: '$212.76' } },
};

const CATEGORIES = ['Layout', 'Content', 'Media', 'Commerce', 'Social', 'Conversion'];
const FONTS = ['Arial', 'Helvetica', 'Georgia', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Courier New'];
const SOCIAL_ICONS: Record<string, string> = { twitter: '🐦', facebook: '📘', linkedin: '💼', instagram: '📷', youtube: '🎬', github: '🐙' };

function getDefaultBlocks(): EmailBlock[] {
  return [
    { id: 'b1', type: 'header',   data: { ...BLOCK_DEFS.header.defaults } },
    { id: 'b2', type: 'hero',     data: { ...BLOCK_DEFS.hero.defaults } },
    { id: 'b3', type: 'features', data: { ...BLOCK_DEFS.features.defaults } },
    { id: 'b4', type: 'button',   data: { ...BLOCK_DEFS.button.defaults } },
    { id: 'b5', type: 'footer',   data: { ...BLOCK_DEFS.footer.defaults } },
  ];
}

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function LocalEmailGenerator() {
  const [blocks, setBlocks] = useState<EmailBlock[]>(getDefaultBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [config, setConfig] = useState<EmailConfig>({
    subject: 'Welcome to Our Platform!',
    preheader: 'We are excited to have you join us',
    brandName: 'MyBrand',
    brandLogo: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    bgColor: '#f8f9fa',
    textColor: '#1a1a2e',
    fontFamily: 'Arial',
    width: 600,
    borderRadius: 8,
  });
  const [leftPanel, setLeftPanel] = useState<'blocks' | 'layers'>('blocks');
  const [rightPanel, setRightPanel] = useState<'style' | 'settings' | 'code'>('settings');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [notification, setNotification] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const selected = blocks.find(b => b.id === selectedId);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 2000); };

  // ─── Block CRUD ───
  const addBlock = (type: string) => {
    const def = BLOCK_DEFS[type];
    if (!def) return;
    const newBlock: EmailBlock = { id: `b${Date.now()}`, type, data: JSON.parse(JSON.stringify(def.defaults)) };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedId(newBlock.id);
    notify(`Added ${def.label}`);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
    notify('Block removed');
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const clone: EmailBlock = { id: `b${Date.now()}`, type: blocks[idx].type, data: JSON.parse(JSON.stringify(blocks[idx].data)) };
    setBlocks([...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)]);
    setSelectedId(clone.id);
    notify('Block duplicated');
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const arr = [...blocks];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setBlocks(arr);
  };

  const updateBlockData = (id: string, data: Record<string, any>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
  };

  // ─── HTML Generation ───
  const generateHTML = useCallback(() => {
    const c = config;
    const blockHtml = blocks.map(b => renderBlock(b, c)).join('\n');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${c.subject}</title><style>body{margin:0;padding:0;background:${c.bgColor};font-family:${c.fontFamily},sans-serif;color:${c.textColor}}.email-wrapper{width:100%;background:${c.bgColor}}.email-container{max-width:${c.width}px;margin:0 auto;background:#ffffff}.img-fluid{max-width:100%;height:auto;display:block}.btn-primary{background:${c.primaryColor};color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:${c.borderRadius}px;display:inline-block;font-weight:600}.btn-secondary{background:transparent;color:${c.primaryColor};border:2px solid ${c.primaryColor};padding:12px 32px;text-decoration:none;border-radius:${c.borderRadius}px;display:inline-block;font-weight:600}@media only screen and (max-width:600px){.email-container{width:100%!important}.column{width:100%!important;display:block!important}.mobile-padding{padding:20px!important}.mobile-center{text-align:center!important}}</style></head><body><div class="email-wrapper"><div class="email-container">${blockHtml}</div></div></body></html>`;
  }, [blocks, config]);

  function renderBlock(block: EmailBlock, c: EmailConfig): string {
    const d = block.data;
    const br = c.borderRadius;
    switch (block.type) {
      case 'header':
        return `<div style="padding:16px 24px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center"><div style="font-size:20px;font-weight:800;color:${c.primaryColor}">${c.brandName}</div>${d.showNav?`<div>${(d.navLinks||[]).map((l:string)=>`<a href="#" style="color:#666;text-decoration:none;margin-left:16px;font-size:13px">${l}</a>`).join('')}</div>`:''}</div>`;
      case 'hero':
        const bg = d.bgType==='gradient'?`background:linear-gradient(135deg,${c.primaryColor},${c.secondaryColor})`:`background:${c.primaryColor}`;
        return `<div style="${bg};color:#ffffff;padding:60px 40px;text-align:center;border-radius:${br}px ${br}px 0 0"><h1 style="margin:0 0 12px;font-size:28px">${d.headline}</h1><p style="margin:0 0 24px;font-size:16px;opacity:0.9">${d.subheadline}</p>${d.ctaText?`<a href="${d.ctaLink}" class="btn-primary">${d.ctaText}</a>`:''}</div>`;
      case 'text':
        return `<div style="padding:24px;text-align:${d.alignment}"><p style="margin:0;line-height:1.7;font-size:15px">${d.content}</p></div>`;
      case 'image':
        return `<div style="padding:16px 24px;text-align:${d.alignment}"><img src="${d.url}" alt="${d.alt}" style="max-width:${d.width};height:auto;border-radius:${br}px">${d.caption?`<p style="font-size:13px;color:#666;margin:8px 0 0">${d.caption}</p>`:''}</div>`;
      case 'button':
        return `<div style="padding:16px 24px;text-align:${d.alignment}"><a href="${d.link}" class="${d.style==='primary'?'btn-primary':'btn-secondary'}" style="${d.fullWidth?'display:block;width:100%;text-align:center':''}">${d.text}</a></div>`;
      case 'divider':
        return `<div style="padding:${d.spacing}px 24px"><hr style="border:none;border-top:1px ${d.style} ${d.color}"></div>`;
      case 'spacer':
        return `<div style="height:${d.height}px"></div>`;
      case 'columns':
        return `<div style="padding:16px 24px;display:flex;gap:20px"><div class="column" style="flex:1"><p style="margin:0;line-height:1.7">${d.leftContent}</p></div><div class="column" style="flex:1"><p style="margin:0;line-height:1.7">${d.rightContent}</p></div></div>`;
      case 'social':
        return `<div style="padding:20px 24px;text-align:center">${(d.platforms||[]).map((p:string)=>`<a href="#" style="display:inline-block;margin:0 8px;font-size:24px;text-decoration:none">${SOCIAL_ICONS[p]||'🔗'}</a>`).join('')}</div>`;
      case 'products':
        return `<div style="padding:24px"><div style="display:flex;flex-wrap:wrap;gap:16px">${(d.items||[]).map((item:any)=>`<div style="flex:1;min-width:200px;border:1px solid #eee;border-radius:${br}px;overflow:hidden"><img src="${item.image}" style="width:100%;height:160px;object-fit:cover"><div style="padding:16px"><div style="font-weight:600;margin-bottom:4px">${item.name}</div><div style="color:${c.primaryColor};font-weight:700">${item.price}</div></div></div>`).join('')}</div></div>`;
      case 'features':
        return `<div style="padding:24px">${(d.items||[]).map((f:string)=>`<div style="padding:8px 0;display:flex;align-items:start;gap:8px"><span style="color:${c.primaryColor};font-weight:bold">${d.icon}</span><span style="line-height:1.6">${f}</span></div>`).join('')}</div>`;
      case 'testimonial':
        return `<div style="padding:32px 40px;text-align:center;background:#f8f9fa"><div style="font-size:48px;margin-bottom:16px">❝</div><p style="font-size:18px;font-style:italic;line-height:1.7;margin:0 0 20px">${d.quote}</p><div style="font-weight:600">${d.author}</div><div style="color:#666;font-size:13px">${d.role}</div></div>`;
      case 'promo':
        return `<div style="background:${d.bgColor};color:${d.textColor};padding:40px;text-align:center;border-radius:${br}px"><h2 style="margin:0 0 8px;font-size:36px">${d.headline}</h2><p style="margin:0;font-size:16px;opacity:0.9">${d.subheadline}</p></div>`;
      case 'footer':
        return `<div style="background:#1a1a2e;color:#aaa;padding:40px 24px;text-align:center;font-size:13px">${d.showSocial?`<div style="margin-bottom:16px">${['twitter','facebook','linkedin'].map(p=>`<a href="#" style="display:inline-block;margin:0 6px;font-size:18px;text-decoration:none">${SOCIAL_ICONS[p]}</a>`).join('')}</div>`:''}${d.address?`<p style="margin:0 0 8px">${d.address}</p>`:''}${d.showUnsubscribe?`<p style="margin:0"><a href="#" style="color:${c.primaryColor}">Unsubscribe</a> | <a href="#" style="color:${c.primaryColor}">Manage Preferences</a></p>`:''}${d.copyright?`<p style="margin:12px 0 0;color:#666">© ${new Date().getFullYear()} ${c.brandName}. All rights reserved.</p>`:''}</div>`;
      case 'countdown':
        return `<div style="background:${c.primaryColor};color:#fff;padding:32px;text-align:center;border-radius:${br}px"><div style="font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">${d.label}</div><div style="font-size:48px;font-weight:800">02 : 14 : 36 : 58</div><p style="margin:12px 0 0;opacity:0.8;font-size:14px">Days : Hours : Minutes : Seconds</p></div>`;
      case 'review':
        return `<div style="padding:24px;text-align:center"><div style="font-size:28px;margin-bottom:8px">${'⭐'.repeat(d.rating)}</div><p style="font-style:italic;margin:0 0 8px">${d.text}</p></div>`;
      case 'invoice':
        return `<div style="padding:24px"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="border-bottom:2px solid #eee"><th style="text-align:left;padding:8px">Item</th><th style="text-align:center;padding:8px">Qty</th><th style="text-align:right;padding:8px">Price</th></tr></thead><tbody>${(d.items||[]).map((item:any)=>`<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${item.desc}</td><td style="text-align:center;padding:8px">${item.qty}</td><td style="text-align:right;padding:8px">${item.price}</td></tr>`).join('')}</tbody><tfoot><tr style="border-top:2px solid #eee;font-weight:600"><td colspan="2" style="padding:8px">Subtotal</td><td style="text-align:right;padding:8px">${d.subtotal}</td></tr><tr><td colspan="2" style="padding:8px">Tax</td><td style="text-align:right;padding:8px">${d.tax}</td></tr><tr style="font-size:16px;color:${c.primaryColor}"><td colspan="2" style="padding:8px;font-weight:700">Total</td><td style="text-align:right;padding:8px;font-weight:700">${d.total}</td></tr></tfoot></table></div>`;
      default:
        return '';
    }
  }

  const previewWidth = previewMode === 'desktop' ? '100%' : '375px';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-white overflow-hidden">
      {/* ──── TOP BAR ──── */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Email Builder</span>
          <span className="text-xs text-zinc-500">|</span>
          <span className="text-xs text-zinc-500">{blocks.length} blocks</span>
        </div>
        <div className="flex items-center gap-1">
          {(['desktop','mobile'] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)} className={`p-2 rounded-lg text-sm ${previewMode===mode?'bg-blue-600':'hover:bg-zinc-800'}`}>
              {mode==='desktop'?'🖥️':'📱'}
            </button>
          ))}
          <span className="w-px h-5 bg-zinc-700 mx-1" />
          <button onClick={() => setLeftOpen(!leftOpen)} className={`p-2 rounded-lg text-sm ${leftOpen?'bg-zinc-700':'hover:bg-zinc-800'}`}>📋</button>
          <button onClick={() => setRightOpen(!rightOpen)} className={`p-2 rounded-lg text-sm ${rightOpen?'bg-zinc-700':'hover:bg-zinc-800'}`}>⚙️</button>
          <span className="w-px h-5 bg-zinc-700 mx-1" />
          <button onClick={() => { navigator.clipboard.writeText(generateHTML()); setCopied(true); notify('Copied!'); setTimeout(()=>setCopied(false),2000); }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">{copied?'✓ Copied':'📋 Copy HTML'}</button>
          <button onClick={() => {
            const blob = new Blob([generateHTML()], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${config.subject.toLowerCase().replace(/\s+/g,'-')}.html`; a.click();
            notify('Downloaded!');
          }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">💾 Download</button>
        </div>
      </div>

      {notification && <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm z-50 animate-pulse">{notification}</div>}

      <div className="flex flex-1 overflow-hidden">
        {/* ════ LEFT SIDEBAR ════ */}
        {leftOpen && (
          <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
            <div className="flex border-b border-zinc-800">
              {(['blocks','layers'] as const).map(tab => (
                <button key={tab} onClick={() => setLeftPanel(tab)} className={`flex-1 py-2.5 text-xs font-medium capitalize ${leftPanel===tab?'text-blue-400 border-b-2 border-blue-400':'text-zinc-500 hover:text-zinc-300'}`}>{tab}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {leftPanel === 'blocks' ? (
                <div className="space-y-4">
                  {CATEGORIES.map(cat => (
                    <div key={cat}>
                      <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 px-1">{cat}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(BLOCK_DEFS).filter(([,def]) => def.category === cat).map(([type, def]) => (
                          <button key={type} onClick={() => addBlock(type)}
                            className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-blue-500/50 rounded-xl text-xs transition-all group">
                            <span className="text-xl group-hover:scale-110 transition-transform">{def.icon}</span>
                            <span className="text-zinc-400 group-hover:text-white">{def.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {blocks.map((b, idx) => (
                    <div key={b.id} draggable onDragStart={() => setDragIdx(idx)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIdx!==null) moveBlock(dragIdx, idx); setDragIdx(null); }}
                      onClick={() => setSelectedId(b.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border ${selectedId===b.id?'bg-blue-600/20 border-blue-500':'bg-zinc-800/50 border-transparent hover:border-zinc-700'}`}>
                      <span className="text-sm cursor-grab">⠿</span>
                      <span className="text-sm">{BLOCK_DEFS[b.type]?.icon}</span>
                      <span className="flex-1 text-sm truncate">{BLOCK_DEFS[b.type]?.label}</span>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); moveBlock(idx, idx-1); }} className="text-xs opacity-50 hover:opacity-100" disabled={idx===0}>↑</button>
                        <button onClick={e => { e.stopPropagation(); moveBlock(idx, idx+1); }} className="text-xs opacity-50 hover:opacity-100" disabled={idx===blocks.length-1}>↓</button>
                        <button onClick={e => { e.stopPropagation(); duplicateBlock(b.id); }} className="text-xs opacity-50 hover:opacity-100">⧉</button>
                        <button onClick={e => { e.stopPropagation(); removeBlock(b.id); }} className="text-xs text-red-400 opacity-50 hover:opacity-100">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ CANVAS ════ */}
        <div className="flex-1 overflow-y-auto bg-zinc-800 flex justify-center p-4">
          <div style={{ width: previewWidth, maxWidth: '100%', transition: 'width 0.3s' }} className="bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
            {/* Subject line preview */}
            <div className="bg-zinc-100 px-4 py-3 border-b">
              <div className="text-xs text-zinc-500 mb-1">Subject:</div>
              <div className="font-semibold text-sm">{config.subject}</div>
              <div className="text-xs text-zinc-400 mt-1">{config.preheader}</div>
            </div>
            <div className="min-h-[500px]">
              {blocks.length === 0 ? (
                <div className="flex items-center justify-center h-[500px] text-zinc-400">
                  <div className="text-center"><div className="text-5xl mb-3">📧</div><div>Add blocks from the left panel</div></div>
                </div>
              ) : (
                blocks.map(b => (
                  <div key={b.id} onClick={() => setSelectedId(b.id)}
                    className={`relative group cursor-pointer transition-all ${selectedId===b.id?'ring-2 ring-blue-500 ring-offset-1':'hover:ring-2 hover:ring-blue-400/30'}`}>
                    <div className={`absolute top-1 right-1 z-10 flex gap-1 transition-opacity ${selectedId===b.id?'opacity-100':'opacity-0 group-hover:opacity-100'}`}>
                      <span className="bg-zinc-900/90 text-white text-xs px-2 py-1 rounded-md">{BLOCK_DEFS[b.type]?.icon} {BLOCK_DEFS[b.type]?.label}</span>
                      <button onClick={e => { e.stopPropagation(); removeBlock(b.id); }} className="bg-red-600/90 text-white text-xs w-5 h-5 rounded-md hover:bg-red-500">✕</button>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: renderBlock(b, config) }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        {rightOpen && (
          <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
            <div className="flex border-b border-zinc-800">
              {(['style','settings','code'] as const).map(tab => (
                <button key={tab} onClick={() => setRightPanel(tab)} className={`flex-1 py-2.5 text-xs font-medium capitalize ${rightPanel===tab?'text-blue-400 border-b-2 border-blue-400':'text-zinc-500 hover:text-zinc-300'}`}>{tab}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {rightPanel === 'style' && (
                <>
                  <FG title="Email Settings">
                    <TF label="Subject Line" value={config.subject} onChange={v => setConfig(p=>({...p,subject:v}))} />
                    <TF label="Preheader" value={config.preheader} onChange={v => setConfig(p=>({...p,preheader:v}))} />
                    <TF label="Brand Name" value={config.brandName} onChange={v => setConfig(p=>({...p,brandName:v}))} />
                  </FG>
                  <FG title="Colors">
                    <CF label="Primary" value={config.primaryColor} onChange={v => setConfig(p=>({...p,primaryColor:v}))} />
                    <CF label="Secondary" value={config.secondaryColor} onChange={v => setConfig(p=>({...p,secondaryColor:v}))} />
                    <CF label="Background" value={config.bgColor} onChange={v => setConfig(p=>({...p,bgColor:v}))} />
                    <CF label="Text" value={config.textColor} onChange={v => setConfig(p=>({...p,textColor:v}))} />
                  </FG>
                  <FG title="Typography">
                    <SF label="Font Family" value={config.fontFamily} options={FONTS} onChange={v => setConfig(p=>({...p,fontFamily:v}))} />
                  </FG>
                  <FG title="Layout">
                    <SLF label="Email Width" value={config.width} min={400} max={800} step={50} unit="px" onChange={v => setConfig(p=>({...p,width:v}))} />
                    <SLF label="Border Radius" value={config.borderRadius} min={0} max={20} unit="px" onChange={v => setConfig(p=>({...p,borderRadius:v}))} />
                  </FG>
                </>
              )}

              {rightPanel === 'settings' && (
                selected ? <BlockEditor block={selected} onChange={(data) => updateBlockData(selected.id, data)} /> : (
                  <div className="text-center py-12 text-zinc-600"><div className="text-4xl mb-3">👆</div><div className="text-sm">Select a block to edit</div></div>
                )
              )}

              {rightPanel === 'code' && (
                <div>
                  <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">HTML Source</div>
                  <pre className="bg-zinc-800 rounded-lg p-3 overflow-auto max-h-[500px] text-xs font-mono text-green-400 whitespace-pre-wrap break-all">{generateHTML()}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Field Helpers ──── */
function FG({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">{title}</div><div className="space-y-3">{children}</div></div>;
}
function TF({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div><label className="block text-xs text-zinc-400 mb-1">{label}</label><input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>;
}
function TAF({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return <div><label className="block text-xs text-zinc-400 mb-1">{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-y" /></div>;
}
function SF({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <div><label className="block text-xs text-zinc-400 mb-1">{label}</label><select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>;
}
function SLF({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return <div><div className="flex justify-between mb-1"><label className="text-xs text-zinc-400">{label}</label><span className="text-xs text-blue-400 font-mono">{value}{unit}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-blue-500 h-1.5" /></div>;
}
function CF({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="flex items-center gap-2"><input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" /><input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none" /></div>;
}
function BF({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">{label}</span><button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-colors ${value?'bg-blue-600':'bg-zinc-700'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${value?'translate-x-5':'translate-x-0.5'}`} /></button></div>;
}

/* ──── Block Editor ──── */
function BlockEditor({ block, onChange }: { block: EmailBlock; onChange: (data: Record<string, any>) => void }) {
  const d = block.data;
  switch (block.type) {
    case 'header':
      return <div className="space-y-3"><BF label="Show Logo" value={d.showLogo} onChange={v => onChange({showLogo:v})} /><BF label="Show Navigation" value={d.showNav} onChange={v => onChange({showNav:v})} /><TF label="Nav Links (comma sep)" value={(d.navLinks||[]).join(', ')} onChange={v => onChange({navLinks:v.split(',').map((s:string)=>s.trim()).filter(Boolean)})} /></div>;
    case 'hero':
      return <div className="space-y-3"><TF label="Headline" value={d.headline} onChange={v => onChange({headline:v})} /><TF label="Subheadline" value={d.subheadline} onChange={v => onChange({subheadline:v})} /><TF label="Button Text" value={d.ctaText} onChange={v => onChange({ctaText:v})} /><TF label="Button Link" value={d.ctaLink} onChange={v => onChange({ctaLink:v})} /><SF label="Background" value={d.bgType} options={['gradient','solid']} onChange={v => onChange({bgType:v})} /></div>;
    case 'text':
      return <div className="space-y-3"><TAF label="Content" value={d.content} onChange={v => onChange({content:v})} rows={5} /><SF label="Alignment" value={d.alignment} options={['left','center','right']} onChange={v => onChange({alignment:v})} /></div>;
    case 'image':
      return <div className="space-y-3"><TF label="Image URL" value={d.url} onChange={v => onChange({url:v})} /><TF label="Alt Text" value={d.alt} onChange={v => onChange({alt:v})} /><TF label="Caption" value={d.caption} onChange={v => onChange({caption:v})} /><SF label="Width" value={d.width} options={['100%','80%','60%','50%','auto']} onChange={v => onChange({width:v})} /><SF label="Alignment" value={d.alignment} options={['left','center','right']} onChange={v => onChange({alignment:v})} /></div>;
    case 'button':
      return <div className="space-y-3"><TF label="Text" value={d.text} onChange={v => onChange({text:v})} /><TF label="Link" value={d.link} onChange={v => onChange({link:v})} /><SF label="Style" value={d.style} options={['primary','secondary']} onChange={v => onChange({style:v})} /><SF label="Alignment" value={d.alignment} options={['left','center','right']} onChange={v => onChange({alignment:v})} /><BF label="Full Width" value={d.fullWidth} onChange={v => onChange({fullWidth:v})} /></div>;
    case 'divider':
      return <div className="space-y-3"><SF label="Style" value={d.style} options={['solid','dashed','dotted']} onChange={v => onChange({style:v})} /><CF label="Color" value={d.color} onChange={v => onChange({color:v})} /><SLF label="Spacing" value={d.spacing} min={8} max={40} unit="px" onChange={v => onChange({spacing:v})} /></div>;
    case 'spacer':
      return <div className="space-y-3"><SLF label="Height" value={d.height} min={10} max={100} unit="px" onChange={v => onChange({height:v})} /></div>;
    case 'columns':
      return <div className="space-y-3"><TAF label="Left Column" value={d.leftContent} onChange={v => onChange({leftContent:v})} /><TAF label="Right Column" value={d.rightContent} onChange={v => onChange({rightContent:v})} /><SF label="Ratio" value={d.ratio} options={['50-50','60-40','40-60','70-30','30-70']} onChange={v => onChange({ratio:v})} /></div>;
    case 'social':
      return <div className="space-y-3"><TF label="Platforms (comma sep)" value={(d.platforms||[]).join(', ')} onChange={v => onChange({platforms:v.split(',').map((s:string)=>s.trim()).filter(Boolean)})} /><SF label="Style" value={d.style} options={['icon','label','combined']} onChange={v => onChange({style:v})} /></div>;
    case 'products':
      return <div className="space-y-3"><SF label="Columns" value={String(d.columns)} options={['1','2','3']} onChange={v => onChange({columns:Number(v)})} />{(d.items||[]).map((item:any,i:number)=>(<div key={i} className="p-2 bg-zinc-800/50 rounded-lg space-y-2"><div className="flex justify-between items-center"><span className="text-xs text-zinc-500">Product {i+1}</span><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div><input value={item.name} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],name:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Name" /><input value={item.price} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],price:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Price" /></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{name:'New Product',price:'$0.00',image:'https://picsum.photos/200/200'}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Product</button></div>;
    case 'features':
      return <div className="space-y-3"><TF label="Icon" value={d.icon} onChange={v => onChange({icon:v})} />{(d.items||[]).map((item:string,i:number)=>(<div key={i} className="flex gap-2"><input value={item} onChange={e=>{const items=[...(d.items||[])];items[i]=e.target.value;onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" /><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),'New feature']})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Feature</button></div>;
    case 'testimonial':
      return <div className="space-y-3"><TAF label="Quote" value={d.quote} onChange={v => onChange({quote:v})} /><TF label="Author" value={d.author} onChange={v => onChange({author:v})} /><TF label="Role" value={d.role} onChange={v => onChange({role:v})} /></div>;
    case 'promo':
      return <div className="space-y-3"><TF label="Headline" value={d.headline} onChange={v => onChange({headline:v})} /><TF label="Subheadline" value={d.subheadline} onChange={v => onChange({subheadline:v})} /><CF label="Background" value={d.bgColor} onChange={v => onChange({bgColor:v})} /><CF label="Text Color" value={d.textColor} onChange={v => onChange({textColor:v})} /></div>;
    case 'footer':
      return <div className="space-y-3"><BF label="Show Unsubscribe" value={d.showUnsubscribe} onChange={v => onChange({showUnsubscribe:v})} /><BF label="Show Social" value={d.showSocial} onChange={v => onChange({showSocial:v})} /><BF label="Show Copyright" value={d.copyright} onChange={v => onChange({copyright:v})} /><TF label="Address" value={d.address} onChange={v => onChange({address:v})} /></div>;
    case 'countdown':
      return <div className="space-y-3"><TF label="Target Date" value={d.date} onChange={v => onChange({date:v})} /><TF label="Label" value={d.label} onChange={v => onChange({label:v})} /><BF label="Urgency Style" value={d.urgency} onChange={v => onChange({urgency:v})} /></div>;
    case 'review':
      return <div className="space-y-3"><SLF label="Rating" value={d.rating} min={1} max={5} unit=" stars" onChange={v => onChange({rating:v})} /><TAF label="Review Text" value={d.text} onChange={v => onChange({text:v})} rows={2} /></div>;
    case 'invoice':
      return <div className="space-y-3">{(d.items||[]).map((item:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={item.desc} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],desc:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Description" /><input value={item.qty} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],qty:e.target.value};onChange({items})}} className="w-12 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-center" placeholder="Qty" /><input value={item.price} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],price:e.target.value};onChange({items})}} className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Price" /><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{desc:'New Item',qty:1,price:'$0.00'}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Item</button><TF label="Subtotal" value={d.subtotal} onChange={v => onChange({subtotal:v})} /><TF label="Tax" value={d.tax} onChange={v => onChange({tax:v})} /><TF label="Total" value={d.total} onChange={v => onChange({total:v})} /></div>;
    default:
      return <p className="text-xs text-zinc-600">No settings for this block.</p>;
  }
}
