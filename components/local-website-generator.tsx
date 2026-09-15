'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ──────────────────── TYPES ──────────────────── */
interface Section {
  id: string;
  type: string;
  locked?: boolean;
  data: Record<string, any>;
}

interface PageSettings {
  title: string;
  description: string;
  favicon: string;
  bgImage: string;
  customCss: string;
  customJs: string;
}

interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  spacing: number;
  darkMode: boolean;
  maxWidth: number;
}

interface LinkConfig {
  text: string;
  url: string;
  target: '_self' | '_blank';
}

/* ──────────────────── SECTION DEFINITIONS ──────────────────── */
const SECTION_DEFS: Record<string, { label: string; icon: string; category: string; defaults: Record<string, any> }> = {
  navbar:     { label: 'Navigation Bar', icon: '📍', category: 'Layout',    defaults: { brand: 'MyBrand', links: ['Home','Features','Pricing','Contact'], ctaText: 'Get Started', style: 'solid' } },
  hero:       { label: 'Hero Section',   icon: '🎯', category: 'Layout',    defaults: { headline: 'Build Something Amazing', subheadline: 'The all-in-one platform for modern teams', ctaText: 'Start Free Trial', secondaryCta: 'Watch Demo', alignment: 'center', bgType: 'gradient' } },
  features:   { label: 'Features Grid',  icon: '⚡', category: 'Content',   defaults: { title: 'Everything You Need', columns: 3, items: [{ icon: '⚡', title: 'Lightning Fast', desc: 'Optimized for speed' },{ icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security' },{ icon: '📊', title: 'Analytics', desc: 'Track everything' },{ icon: '🔄', title: 'API First', desc: 'RESTful APIs' },{ icon: '🌍', title: 'Global CDN', desc: '200+ edge locations' },{ icon: '💬', title: '24/7 Support', desc: 'Expert help anytime' }] } },
  pricing:    { label: 'Pricing Table',  icon: '💰', category: 'Commerce', defaults: { title: 'Simple Pricing', plans: [{ name: 'Starter', price: '$29', period: 'mo', features: ['5 Users','10GB Storage','Email Support'] },{ name: 'Pro', price: '$79', period: 'mo', popular: true, features: ['Unlimited Users','100GB Storage','Priority Support','API Access'] },{ name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Everything','Dedicated Support','SLA'] }] } },
  testimonials:{ label: 'Testimonials',  icon: '💬', category: 'Social',    defaults: { title: 'Loved by Teams Worldwide', items: [{ name: 'Sarah Chen', role: 'CTO, TechCorp', text: 'AbhiBase transformed how our team ships products.', avatar: '👩‍💻' },{ name: 'Marcus Johnson', role: 'Founder, StartupXYZ', text: 'The best investment we made this year.', avatar: '👨‍💼' },{ name: 'Emily Park', role: 'PM, DesignCo', text: 'Finally a tool that does everything we need.', avatar: '👩‍🎨' }] } },
  gallery:    { label: 'Image Gallery',  icon: '🖼️', category: 'Media',    defaults: { title: 'Our Work', columns: 3, images: [1,2,3,4,5,6].map(i => ({ url: `https://picsum.photos/400/300?random=${i}`, caption: `Project ${i}` })) } },
  cta:        { label: 'Call to Action', icon: '📢', category: 'Conversion',defaults: { headline: 'Ready to Get Started?', subheadline: 'Join thousands of satisfied customers', ctaText: 'Start Free Trial', style: 'gradient' } },
  footer:     { label: 'Footer',         icon: '📎', category: 'Layout',    defaults: { columns: [{ title: 'Product', links: ['Features','Pricing','Changelog'] },{ title: 'Company', links: ['About','Blog','Careers'] },{ title: 'Legal', links: ['Privacy','Terms','Security'] }], copyright: true, socials: ['Twitter','GitHub','LinkedIn'] } },
  faq:        { label: 'FAQ Section',    icon: '❓', category: 'Content',   defaults: { title: 'Frequently Asked Questions', items: [{ q: 'What is AbhiBase?', a: 'An all-in-one productivity platform.' },{ q: 'Is there a free trial?', a: 'Yes, 14 days free with no credit card.' },{ q: 'Can I cancel anytime?', a: 'Absolutely. No long-term contracts.' }] } },
  newsletter: { label: 'Newsletter',     icon: '📧', category: 'Conversion',defaults: { title: 'Stay in the Loop', description: 'Get the latest updates delivered to your inbox', buttonText: 'Subscribe' } },
  team:       { label: 'Team Section',   icon: '👥', category: 'Social',    defaults: { title: 'Meet the Team', members: [{ name: 'Alex Rivera', role: 'CEO', avatar: '👨‍💼' },{ name: 'Jamie Zhang', role: 'CTO', avatar: '👩‍💻' },{ name: 'Sam Patel', role: 'Design Lead', avatar: '👨‍🎨' }] } },
  contact:    { label: 'Contact Form',   icon: '📬', category: 'Conversion',defaults: { title: 'Get in Touch', fields: ['name','email','message'], submitText: 'Send Message' } },
  stats:      { label: 'Statistics',     icon: '📈', category: 'Social',    defaults: { title: 'Numbers Speak', items: [{ value: '10,000+', label: 'Users' },{ value: '99.9%', label: 'Uptime' },{ value: '50+', label: 'Countries' },{ value: '4.9', label: 'Rating' }] } },
  divider:    { label: 'Divider',        icon: '➖', category: 'Layout',    defaults: { style: 'line' } },
};

const CATEGORIES = ['Layout', 'Content', 'Commerce', 'Social', 'Conversion', 'Media'];

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Playfair Display', 'Merriweather', 'Fira Code', 'Space Grotesk',
  'Outfit', 'Sora', 'DM Sans', 'Plus Jakarta Sans', 'Manrope',
];

/* ──────────────────── DEFAULT SECTIONS ──────────────────── */
function getDefaultSections(): Section[] {
  return [
    { id: 's1', type: 'navbar',      data: { ...SECTION_DEFS.navbar.defaults } },
    { id: 's2', type: 'hero',        data: { ...SECTION_DEFS.hero.defaults } },
    { id: 's3', type: 'features',    data: { ...SECTION_DEFS.features.defaults } },
    { id: 's4', type: 'testimonials',data: { ...SECTION_DEFS.testimonials.defaults } },
    { id: 's5', type: 'cta',         data: { ...SECTION_DEFS.cta.defaults } },
    { id: 's6', type: 'footer',      data: { ...SECTION_DEFS.footer.defaults } },
  ];
}

/* ──────────────────── SIDEBAR PANELS ──────────────────── */
type LeftPanel = 'sections' | 'elements' | 'layers' | 'pages';
type RightPanel = 'style' | 'settings' | 'seo' | 'animations' | 'links';

/* ──────────────────── MAIN COMPONENT ──────────────────── */
export default function LocalWebsiteGenerator() {
  // Core state
  const [sections, setSections] = useState<Section[]>(getDefaultSections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#10b981',
    fontFamily: 'Inter', fontSize: 16, borderRadius: 8, spacing: 40, darkMode: false, maxWidth: 1200,
  });
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    title: 'My Website', description: 'Built with AbhiBase', favicon: '', bgImage: '', customCss: '', customJs: '',
  });

  // UI state
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('elements');
  const [rightPanel, setRightPanel] = useState<RightPanel | null>('style');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreview, setIsPreview] = useState(false);
  const [history, setHistory] = useState<Section[][]>([getDefaultSections()]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [notification, setNotification] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const selected = sections.find(s => s.id === selectedId);
  const selectedDef = selected ? SECTION_DEFS[selected.type] : null;

  // ─── History ───
  const pushHistory = useCallback((newSections: Section[]) => {
    const trimmed = history.slice(0, historyIdx + 1);
    setHistory([...trimmed, newSections]);
    setHistoryIdx(trimmed.length);
  }, [history, historyIdx]);

  const undo = () => { if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setSections(history[historyIdx - 1]); } };
  const redo = () => { if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setSections(history[historyIdx + 1]); } };

  // ─── Section CRUD ───
  const addSection = (type: string) => {
    const def = SECTION_DEFS[type];
    if (!def) return;
    const newSection: Section = {
      id: `s${Date.now()}`,
      type,
      data: JSON.parse(JSON.stringify(def.defaults)),
    };
    const newSections = [...sections, newSection];
    setSections(newSections);
    pushHistory(newSections);
    setSelectedId(newSection.id);
    notify(`Added ${def.label}`);
  };

  const removeSection = (id: string) => {
    const newSections = sections.filter(s => s.id !== id);
    setSections(newSections);
    pushHistory(newSections);
    if (selectedId === id) setSelectedId(null);
    notify('Section removed');
  };

  const duplicateSection = (id: string) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const clone: Section = {
      id: `s${Date.now()}`,
      type: sections[idx].type,
      data: JSON.parse(JSON.stringify(sections[idx].data)),
    };
    const newSections = [...sections.slice(0, idx + 1), clone, ...sections.slice(idx + 1)];
    setSections(newSections);
    pushHistory(newSections);
    setSelectedId(clone.id);
    notify('Section duplicated');
  };

  const moveSection = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.length) return;
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIdx, 1);
    newSections.splice(toIdx, 0, moved);
    setSections(newSections);
    pushHistory(newSections);
  };

  const updateSectionData = (id: string, data: Record<string, any>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, data: { ...s.data, ...data } } : s));
  };

  const toggleSectionLock = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, locked: !s.locked } : s));
  };

  // ─── Notifications ───
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2000);
  };

  // ─── HTML Generation ───
  const generateHTML = useCallback(() => {
    const s = siteSettings;
    const css = `
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'${s.fontFamily}',sans-serif;font-size:${s.fontSize}px;line-height:1.6;color:#1a1a2e;background:${s.darkMode ? '#0f0f23' : '#ffffff'}}
      .site-container{max-width:${s.maxWidth}px;margin:0 auto}
      img{max-width:100%;height:auto;display:block}
      a{text-decoration:none;transition:all .2s}
      .btn{display:inline-block;padding:14px 32px;border-radius:${s.borderRadius}px;font-weight:600;cursor:pointer;transition:all .2s;border:none;font-size:16px}
      .btn-primary{background:${s.primaryColor};color:#fff}
      .btn-primary:hover{opacity:.9;transform:translateY(-2px)}
      .btn-outline{background:transparent;color:#fff;border:2px solid currentColor}
      .btn-outline:hover{background:${s.primaryColor};border-color:${s.primaryColor}}
      .section{padding:${s.spacing}px 40px}
      .section-dark{background:#1a1a2e;color:#fff}
      .section-gray{background:#f8f9fa}
      .container{max-width:${s.maxWidth}px;margin:0 auto}
      .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:30px}
      .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}
      .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
      .text-center{text-align:center}
      .text-primary{color:${s.primaryColor}}
      .text-muted{color:#666}
      .mb-1{margin-bottom:8px}
      .mb-2{margin-bottom:16px}
      .mb-3{margin-bottom:24px}
      .mb-4{margin-bottom:32px}
      h1{font-size:clamp(32px,5vw,56px);line-height:1.1;font-weight:800}
      h2{font-size:clamp(24px,3.5vw,40px);line-height:1.2;font-weight:700}
      h3{font-size:20px;font-weight:600}
      @media(max-width:768px){.grid-2,.grid-3,.grid-4{grid-template-columns:1fr}.section{padding:${s.spacing/2}px 20px}}
      .card{background:${s.darkMode ? '#16213e' : '#fff'};border-radius:${s.borderRadius}px;padding:30px;box-shadow:0 2px 15px rgba(0,0,0,.08);transition:transform .2s,box-shadow .2s}
      .card:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.12)}
      .badge{display:inline-block;background:${s.primaryColor}15;color:${s.primaryColor};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
      ${pageSettings.customCss}
    `;
    const body = sections.map(sec => renderSection(sec, s)).join('\n');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pageSettings.title}</title><meta name="description" content="${pageSettings.description}"><style>${css}</style></head><body>${body}<script>document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})}));${pageSettings.customJs}</script></body></html>`;
  }, [sections, siteSettings, pageSettings]);

  function renderSection(sec: Section, s: SiteSettings): string {
    const d = sec.data;
    switch (sec.type) {
      case 'navbar':
        return `<nav style="background:${s.darkMode?'#0f0f23':'#fff'};border-bottom:1px solid ${s.darkMode?'#333':'#eee'};padding:16px 40px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;backdrop-filter:blur(10px)"><div style="font-size:22px;font-weight:800;color:${s.primaryColor}">${d.brand}</div><div style="display:flex;gap:24px;align-items:center">${(d.links||[]).map((l:string)=>`<a href="#${l.toLowerCase()}" style="color:${s.darkMode?'#ccc':'#333'};font-weight:500">${l}</a>`).join('')}${d.ctaText?`<a href="#" class="btn btn-primary" style="padding:10px 24px;font-size:14px">${d.ctaText}</a>`:''}</div></nav>`;
      case 'hero':
        const bgHero = d.bgType==='video'?`background:#1a1a2e`:`background:linear-gradient(135deg,${s.primaryColor},${s.secondaryColor})`;
        return `<section class="section" style="${bgHero};color:#fff;text-align:${d.alignment||'center'};padding:120px 40px"><div class="container"><h1 style="margin-bottom:20px">${d.headline}</h1><p style="font-size:20px;opacity:.9;max-width:600px;margin:0 auto 30px">${d.subheadline}</p><div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap"><a href="#" class="btn btn-primary" style="background:#fff;color:${s.primaryColor}">${d.ctaText}</a>${d.secondaryCta?`<a href="#" class="btn btn-outline">${d.secondaryCta}</a>`:''}</div></div></section>`;
      case 'features':
        return `<section class="section${s.darkMode?' section-dark':''}" id="features"><div class="container text-center"><h2 class="mb-4">${d.title}</h2><div class="grid-${d.columns||3}">${(d.items||[]).map((f:any)=>`<div class="card text-center"><div style="font-size:36px;margin-bottom:15px">${f.icon}</div><h3 class="mb-1">${f.title}</h3><p class="text-muted">${f.desc}</p></div>`).join('')}</div></div></section>`;
      case 'pricing':
        return `<section class="section" style="background:${s.darkMode?'#1a1a2e':'#f8f9fa'}"><div class="container text-center"><h2 class="mb-4">${d.title}</h2><div class="grid-3">${(d.plans||[]).map((p:any)=>`<div class="card text-center" style="${p.popular?`border:2px solid ${s.primaryColor};transform:scale(1.05)`:''}">${p.popular?`<span class="badge" style="margin-bottom:10px">POPULAR</span>`:''}<h3 class="mb-2">${p.name}</h3><div style="font-size:48px;font-weight:800;color:${s.primaryColor};margin:16px 0">${p.price}<span style="font-size:16px;opacity:.6">/${p.period}</span></div><ul style="list-style:none;margin:20px 0;text-align:left">${(p.features||[]).map((f:string)=>`<li style="padding:8px 0;border-bottom:1px solid ${s.darkMode?'#333':'#eee'}">✓ ${f}</li>`).join('')}</ul><a href="#" class="btn ${p.popular?'btn-primary':'btn-outline'}" style="width:100%;${p.popular?'':'color:'+s.primaryColor+';border-color:'+s.primaryColor}">Get Started</a></div>`).join('')}</div></div></section>`;
      case 'testimonials':
        return `<section class="section${s.darkMode?' section-dark':''}" id="testimonials"><div class="container text-center"><h2 class="mb-4">${d.title}</h2><div class="grid-3">${(d.items||[]).map((t:any)=>`<div class="card"><p style="font-size:16px;margin-bottom:20px;line-height:1.7">"${t.text}"</p><div style="display:flex;align-items:center;gap:12px"><div style="width:48px;height:48px;border-radius:50%;background:${s.primaryColor}20;display:flex;align-items:center;justify-content:center;font-size:24px">${t.avatar}</div><div><div style="font-weight:600">${t.name}</div><div style="color:#666;font-size:14px">${t.role}</div></div></div></div>`).join('')}</div></div></section>`;
      case 'gallery':
        return `<section class="section"><div class="container"><h2 class="mb-4 text-center">${d.title}</h2><div class="grid-${d.columns||3}">${(d.images||[]).map((img:any)=>`<div style="border-radius:${s.borderRadius}px;overflow:hidden;cursor:pointer"><img src="${img.url}" alt="${img.caption}" style="width:100%;height:200px;object-fit:cover;transition:transform .3s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"><div style="padding:12px"><span style="font-weight:500">${img.caption}</span></div></div>`).join('')}</div></div></section>`;
      case 'cta':
        const bgCTA = d.style==='gradient'?`background:linear-gradient(135deg,${s.primaryColor},${s.secondaryColor})`:`background:${s.primaryColor}`;
        return `<section class="section" style="${bgCTA};color:#fff;text-align:center"><div class="container"><h2 class="mb-2">${d.headline}</h2><p style="font-size:18px;opacity:.9;margin-bottom:30px">${d.subheadline}</p><a href="#" class="btn" style="background:#fff;color:${s.primaryColor}">${d.ctaText}</a></div></section>`;
      case 'faq':
        return `<section class="section${s.darkMode?' section-dark':''}" id="faq"><div class="container" style="max-width:800px"><h2 class="text-center mb-4">${d.title}</h2>${(d.items||[]).map((item:any)=>`<details style="margin-bottom:12px;border:1px solid ${s.darkMode?'#333':'#eee'};border-radius:${s.borderRadius}px;overflow:hidden"><summary style="padding:16px 20px;cursor:pointer;font-weight:600;background:${s.darkMode?'#16213e':'#f8f9fa'};list-style:none;display:flex;justify-content:space-between;align-items:center">${item.q}<span style="font-size:20px">+</span></summary><div style="padding:16px 20px;line-height:1.7">${item.a}</div></details>`).join('')}</div></section>`;
      case 'newsletter':
        return `<section class="section" style="background:${s.primaryColor};color:#fff;text-align:center"><div class="container" style="max-width:600px"><h2 class="mb-2">${d.title}</h2><p style="opacity:.9;margin-bottom:24px">${d.description}</p><form style="display:flex;gap:10px;max-width:450px;margin:0 auto" onsubmit="event.preventDefault();alert('Subscribed!')"><input type="email" placeholder="Your email" required style="flex:1;padding:14px 20px;border:none;border-radius:${s.borderRadius}px;font-size:16px"><button type="submit" class="btn" style="background:#1a1a2e;color:#fff;white-space:nowrap">${d.buttonText}</button></form></div></section>`;
      case 'team':
        return `<section class="section${s.darkMode?' section-dark':''}"><div class="container text-center"><h2 class="mb-4">${d.title}</h2><div class="grid-3" style="max-width:900px;margin:0 auto">${(d.members||[]).map((m:any)=>`<div class="card text-center"><div style="width:80px;height:80px;border-radius:50%;background:${s.primaryColor}20;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:36px">${m.avatar}</div><h3>${m.name}</h3><p class="text-muted">${m.role}</p></div>`).join('')}</div></div></section>`;
      case 'contact':
        return `<section class="section section-gray" id="contact"><div class="container" style="max-width:600px"><h2 class="text-center mb-4">${d.title}</h2><form onsubmit="event.preventDefault();alert('Message sent!')" style="display:flex;flex-direction:column;gap:16px">${(d.fields||[]).map((f:string)=>f==='message'?`<textarea placeholder="Your message" rows="5" required style="padding:14px;border:1px solid #ddd;border-radius:${s.borderRadius}px;font-size:16px;font-family:inherit;resize:vertical"></textarea>`:`<input type="${f==='email'?'email':'text'}" placeholder="${f.charAt(0).toUpperCase()+f.slice(1)}" required style="padding:14px;border:1px solid #ddd;border-radius:${s.borderRadius}px;font-size:16px">`).join('')}<button type="submit" class="btn btn-primary">${d.submitText}</button></form></div></section>`;
      case 'stats':
        return `<section class="section"><div class="container"><h2 class="text-center mb-4">${d.title}</h2><div class="grid-4 text-center">${(d.items||[]).map((st:any)=>`<div><div style="font-size:40px;font-weight:800;color:${s.primaryColor}">${st.value}</div><div class="text-muted">${st.label}</div></div>`).join('')}</div></div></section>`;
      case 'footer':
        return `<footer style="background:#1a1a2e;color:#fff;padding:60px 40px"><div class="container"><div class="grid-4">${(d.columns||[]).map((col:any)=>`<div><h4 style="margin-bottom:16px">${col.title}</h4>${(col.links||[]).map((l:string)=>`<a href="#" style="display:block;color:#aaa;padding:4px 0;font-size:14px">${l}</a>`).join('')}</div>`).join('')}</div>${d.copyright?`<div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #333;color:#666;font-size:14px">© ${new Date().getFullYear()} All rights reserved.</div>`:''}</div></footer>`;
      case 'divider':
        return `<div style="padding:0 40px"><hr style="border:none;border-top:1px solid ${s.darkMode?'#333':'#eee'}"></div>`;
      default:
        return `<div class="section text-center text-muted">Unknown section: ${sec.type}</div>`;
    }
  }

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if (e.key === 'Delete' && selectedId) { const sec = sections.find(s=>s.id===selectedId); if(sec && !sec.locked) removeSection(selectedId); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) { e.preventDefault(); duplicateSection(selectedId); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, sections, historyIdx, history]);

  // ─── Sync iframe ───
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcdoc = generateHTML();
    }
  }, [generateHTML, previewMode]);

  /* ════════════════════════ RENDER ════════════════════════ */
  const previewWidth = previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-white overflow-hidden">
      {/* ──── TOP BAR ──── */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Website Builder</span>
          <span className="text-xs text-zinc-500 hidden sm:inline">|</span>
          <span className="text-xs text-zinc-500 hidden sm:inline">{sections.length} sections</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button onClick={undo} disabled={historyIdx===0} className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-sm" title="Undo (Ctrl+Z)">↩️</button>
          <button onClick={redo} disabled={historyIdx===history.length-1} className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-sm" title="Redo (Ctrl+Shift+Z)">↪️</button>

          <span className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Device Preview */}
          {(['desktop','tablet','mobile'] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)}
              className={`p-2 rounded-lg text-sm ${previewMode===mode ? 'bg-violet-600' : 'hover:bg-zinc-800'}`}
              title={mode.charAt(0).toUpperCase()+mode.slice(1)}>
              {mode==='desktop' ? '🖥️' : mode==='tablet' ? '📱' : '📲'}
            </button>
          ))}

          <span className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Toggle sidebars */}
          <button onClick={() => setLeftOpen(!leftOpen)} className={`p-2 rounded-lg text-sm ${leftOpen?'bg-zinc-700':'hover:bg-zinc-800'}`} title="Toggle Left Panel">📋</button>
          <button onClick={() => setRightOpen(!rightOpen)} className={`p-2 rounded-lg text-sm ${rightOpen?'bg-zinc-700':'hover:bg-zinc-800'}`} title="Toggle Right Panel">⚙️</button>
          <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-lg text-sm ${isPreview?'bg-emerald-600':'hover:bg-zinc-800'}`} title="Full Preview">
            {isPreview ? '✏️' : '👁️'}
          </button>

          <span className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Export */}
          <button onClick={() => setShowExport(!showExport)} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium">Export</button>
        </div>
      </div>

      {/* ──── NOTIFICATION ──── */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm z-50 animate-pulse">{notification}</div>
      )}

      {/* ──── EXPORT MODAL ──── */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowExport(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Export Website</h3>
              <button onClick={() => setShowExport(false)} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <button onClick={() => {
                const html = generateHTML();
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${pageSettings.title.toLowerCase().replace(/\s+/g,'-')}.html`;
                a.click();
                URL.revokeObjectURL(url);
                notify('HTML downloaded!');
                setShowExport(false);
              }} className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-colors">
                <span className="text-2xl">📄</span>
                <div><div className="font-semibold">Download HTML</div><div className="text-sm text-zinc-400">Single-file website ready to host anywhere</div></div>
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText(generateHTML());
                notify('HTML copied to clipboard!');
                setShowExport(false);
              }} className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-colors">
                <span className="text-2xl">📋</span>
                <div><div className="font-semibold">Copy HTML</div><div className="text-sm text-zinc-400">Copy source code to clipboard</div></div>
              </button>
              <button onClick={() => {
                const html = generateHTML();
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                notify('Opened in new tab!');
                setShowExport(false);
              }} className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-colors">
                <span className="text-2xl">🌐</span>
                <div><div className="font-semibold">Preview in Browser</div><div className="text-sm text-zinc-400">Open in a new tab to see the final result</div></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── MAIN AREA ──── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ════ LEFT SIDEBAR ════ */}
        {leftOpen && !isPreview && (
          <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {(['elements','layers','pages'] as LeftPanel[]).map(tab => (
                <button key={tab} onClick={() => setLeftPanel(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${leftPanel===tab?'text-violet-400 border-b-2 border-violet-400':'text-zinc-500 hover:text-zinc-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {/* ELEMENTS PANEL */}
              {leftPanel === 'elements' && (
                <div className="space-y-4">
                  {CATEGORIES.map(cat => (
                    <div key={cat}>
                      <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 px-1">{cat}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SECTION_DEFS).filter(([,def]) => def.category === cat).map(([type, def]) => (
                          <button key={type} onClick={() => addSection(type)}
                            className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-500/50 rounded-xl text-xs transition-all group">
                            <span className="text-xl group-hover:scale-110 transition-transform">{def.icon}</span>
                            <span className="text-zinc-400 group-hover:text-white transition-colors">{def.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LAYERS PANEL */}
              {leftPanel === 'layers' && (
                <div className="space-y-1">
                  {sections.map((sec, idx) => {
                    const def = SECTION_DEFS[sec.type];
                    return (
                      <div key={sec.id}
                        draggable={!sec.locked}
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-violet-500'); }}
                        onDragLeave={e => e.currentTarget.classList.remove('border-violet-500')}
                        onDrop={e => { e.currentTarget.classList.remove('border-violet-500'); if (dragIdx!==null && dragIdx!==idx) moveSection(dragIdx, idx); setDragIdx(null); }}
                        onClick={() => setSelectedId(sec.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${selectedId===sec.id?'bg-violet-600/20 border-violet-500':'bg-zinc-800/50 border-transparent hover:border-zinc-700'}`}>
                        <span className="text-sm cursor-grab" title="Drag to reorder">⠿</span>
                        <span className="text-sm">{def?.icon}</span>
                        <span className="flex-1 text-sm truncate">{def?.label || sec.type}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); toggleSectionLock(sec.id); }} className="text-xs opacity-50 hover:opacity-100">{sec.locked ? '🔒' : '🔓'}</button>
                          <button onClick={e => { e.stopPropagation(); moveSection(idx, idx-1); }} className="text-xs opacity-50 hover:opacity-100" disabled={idx===0}>↑</button>
                          <button onClick={e => { e.stopPropagation(); moveSection(idx, idx+1); }} className="text-xs opacity-50 hover:opacity-100" disabled={idx===sections.length-1}>↓</button>
                          <button onClick={e => { e.stopPropagation(); duplicateSection(sec.id); }} className="text-xs opacity-50 hover:opacity-100">⧉</button>
                          {!sec.locked && <button onClick={e => { e.stopPropagation(); removeSection(sec.id); }} className="text-xs text-red-400 opacity-50 hover:opacity-100">✕</button>}
                        </div>
                      </div>
                    );
                  })}
                  {sections.length === 0 && <p className="text-zinc-600 text-sm text-center py-8">No sections yet. Add one from Elements.</p>}
                </div>
              )}

              {/* PAGES PANEL */}
              {leftPanel === 'pages' && (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-800/50 rounded-xl border border-violet-500">
                    <div className="font-medium text-sm">index.html</div>
                    <div className="text-xs text-zinc-500">Home page • {sections.length} sections</div>
                  </div>
                  <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50 opacity-50 cursor-not-allowed">
                    <div className="font-medium text-sm flex items-center gap-2">about.html <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">Pro</span></div>
                    <div className="text-xs text-zinc-500">Coming soon</div>
                  </div>
                  <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50 opacity-50 cursor-not-allowed">
                    <div className="font-medium text-sm flex items-center gap-2">contact.html <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">Pro</span></div>
                    <div className="text-xs text-zinc-500">Coming soon</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ CANVAS ════ */}
        <div className="flex-1 overflow-y-auto bg-zinc-800 flex justify-center p-4">
          <div style={{ width: previewWidth, maxWidth: '100%', transition: 'width 0.3s' }}
            className="bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">

            {/* Section list for editing */}
            {!isPreview ? (
              <div className="min-h-[600px]">
                {sections.map((sec, idx) => {
                  const def = SECTION_DEFS[sec.type];
                  const isSelected = selectedId === sec.id;
                  return (
                    <div key={sec.id}
                      onClick={() => setSelectedId(sec.id)}
                      className={`relative group transition-all ${isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-800' : 'hover:ring-2 hover:ring-zinc-400/30'}`}>
                      {/* Section toolbar */}
                      <div className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <span className="bg-zinc-900/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">{def?.icon} {def?.label}</span>
                        {!sec.locked && (
                          <>
                            <button onClick={e => { e.stopPropagation(); moveSection(idx, idx-1); }} className="bg-zinc-900/90 text-white text-xs w-6 h-6 rounded-md hover:bg-zinc-700 disabled:opacity-30" disabled={idx===0}>↑</button>
                            <button onClick={e => { e.stopPropagation(); moveSection(idx, idx+1); }} className="bg-zinc-900/90 text-white text-xs w-6 h-6 rounded-md hover:bg-zinc-700 disabled:opacity-30" disabled={idx===sections.length-1}>↓</button>
                            <button onClick={e => { e.stopPropagation(); duplicateSection(sec.id); }} className="bg-zinc-900/90 text-white text-xs w-6 h-6 rounded-md hover:bg-zinc-700">⧉</button>
                            <button onClick={e => { e.stopPropagation(); removeSection(sec.id); }} className="bg-red-600/90 text-white text-xs w-6 h-6 rounded-md hover:bg-red-500">✕</button>
                          </>
                        )}
                      </div>
                      {/* Rendered section */}
                      <div dangerouslySetInnerHTML={{ __html: renderSection(sec, siteSettings) }} />
                    </div>
                  );
                })}
                {sections.length === 0 && (
                  <div className="flex items-center justify-center h-[600px] text-zinc-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎨</div>
                      <div className="text-xl font-semibold mb-2">Start Building</div>
                      <div className="text-sm">Click elements on the left to add sections</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <iframe ref={previewRef} srcDoc={generateHTML()} className="w-full h-[800px] border-0" title="Preview" />
            )}
          </div>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        {rightOpen && !isPreview && (
          <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {(['style','settings','seo','links'] as RightPanel[]).map(tab => (
                <button key={tab} onClick={() => setRightPanel(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${rightPanel===tab?'text-violet-400 border-b-2 border-violet-400':'text-zinc-500 hover:text-zinc-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* ═══ STYLE PANEL ═══ */}
              {rightPanel === 'style' && (
                <>
                  <FieldGroup title="Colors">
                    <ColorField label="Primary" value={siteSettings.primaryColor} onChange={v => setSiteSettings(p => ({...p, primaryColor: v}))} />
                    <ColorField label="Secondary" value={siteSettings.secondaryColor} onChange={v => setSiteSettings(p => ({...p, secondaryColor: v}))} />
                    <ColorField label="Accent" value={siteSettings.accentColor} onChange={v => setSiteSettings(p => ({...p, accentColor: v}))} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-zinc-400">Dark Mode</span>
                      <button onClick={() => setSiteSettings(p => ({...p, darkMode: !p.darkMode}))}
                        className={`w-10 h-5 rounded-full transition-colors ${siteSettings.darkMode ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${siteSettings.darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </FieldGroup>
                  <FieldGroup title="Typography">
                    <SelectField label="Font Family" value={siteSettings.fontFamily} options={FONT_OPTIONS} onChange={v => setSiteSettings(p => ({...p, fontFamily: v}))} />
                    <SliderField label="Base Font Size" value={siteSettings.fontSize} min={12} max={24} unit="px" onChange={v => setSiteSettings(p => ({...p, fontSize: v}))} />
                  </FieldGroup>
                  <FieldGroup title="Layout">
                    <SliderField label="Border Radius" value={siteSettings.borderRadius} min={0} max={24} unit="px" onChange={v => setSiteSettings(p => ({...p, borderRadius: v}))} />
                    <SliderField label="Section Spacing" value={siteSettings.spacing} min={20} max={120} unit="px" onChange={v => setSiteSettings(p => ({...p, spacing: v}))} />
                    <SliderField label="Max Width" value={siteSettings.maxWidth} min={800} max={1600} step={100} unit="px" onChange={v => setSiteSettings(p => ({...p, maxWidth: v}))} />
                  </FieldGroup>
                </>
              )}

              {/* ═══ SETTINGS PANEL ═══ */}
              {rightPanel === 'settings' && (
                <>
                  {selected ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-300">{selectedDef?.icon} {selectedDef?.label}</h3>
                        <span className="text-xs text-zinc-600">{selected.type}</span>
                      </div>
                      <SectionEditor section={selected} onChange={(data) => updateSectionData(selected.id, data)} />
                    </>
                  ) : (
                    <div className="text-center py-12 text-zinc-600">
                      <div className="text-4xl mb-3">👆</div>
                      <div className="text-sm">Select a section to edit its content</div>
                    </div>
                  )}
                </>
              )}

              {/* ═══ SEO PANEL ═══ */}
              {rightPanel === 'seo' && (
                <>
                  <FieldGroup title="Page SEO">
                    <TextField label="Page Title" value={pageSettings.title} onChange={v => setPageSettings(p => ({...p, title: v}))} placeholder="My Website" />
                    <TextField label="Meta Description" value={pageSettings.description} onChange={v => setPageSettings(p => ({...p, description: v}))} placeholder="Description for search engines" />
                    <TextField label="Favicon URL" value={pageSettings.favicon} onChange={v => setPageSettings(p => ({...p, favicon: v}))} placeholder="https://..." />
                  </FieldGroup>
                  <FieldGroup title="Custom Code">
                    <TextareaField label="Custom CSS" value={pageSettings.customCss} onChange={v => setPageSettings(p => ({...p, customCss: v}))} placeholder="/* Add custom styles */" rows={4} />
                    <TextareaField label="Custom JavaScript" value={pageSettings.customJs} onChange={v => setPageSettings(p => ({...p, customJs: v}))} placeholder="// Add custom scripts" rows={4} />
                  </FieldGroup>
                </>
              )}

              {/* ═══ LINKS PANEL ═══ */}
              {rightPanel === 'links' && (
                <div className="space-y-3">
                  <div className="text-sm text-zinc-400 mb-3">Quick navigation links for testing your site:</div>
                  {sections.filter(s => s.type === 'navbar').map(nav => (
                    <div key={nav.id} className="space-y-2">
                      {(nav.data.links || []).map((link: string) => (
                        <a key={link} href={`#${link.toLowerCase()}`}
                          className="flex items-center gap-2 p-2.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-sm transition-colors">
                          🔗 <span className="text-zinc-300">{link}</span>
                          <span className="ml-auto text-zinc-600 text-xs">#{link.toLowerCase()}</span>
                        </a>
                      ))}
                    </div>
                  ))}
                  {sections.filter(s => s.type === 'navbar').length === 0 && (
                    <p className="text-zinc-600 text-sm text-center py-6">Add a Navigation Bar section to see links</p>
                  )}
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-2">Navigation links in your site are clickable. Add a navbar section to set up page navigation.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════ FIELD COMPONENTS ════════════════════════ */
function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-y" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-zinc-400">{label}</label>
        <span className="text-xs text-violet-400 font-mono">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-violet-500 h-1.5" />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:border-violet-500 focus:outline-none" />
    </div>
  );
}

/* ════════════════════════ SECTION EDITOR ════════════════════════ */
function SectionEditor({ section, onChange }: { section: Section; onChange: (data: Record<string, any>) => void }) {
  const d = section.data;

  switch (section.type) {
    case 'navbar':
      return (
        <div className="space-y-3">
          <TextField label="Brand Name" value={d.brand || ''} onChange={v => onChange({ brand: v })} />
          <TextField label="CTA Button" value={d.ctaText || ''} onChange={v => onChange({ ctaText: v })} />
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nav Links (comma separated)</label>
            <input type="text" value={(d.links || []).join(', ')} onChange={e => onChange({ links: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" placeholder="Home, Features, Pricing" />
          </div>
        </div>
      );
    case 'hero':
      return (
        <div className="space-y-3">
          <TextField label="Headline" value={d.headline || ''} onChange={v => onChange({ headline: v })} />
          <TextField label="Subheadline" value={d.subheadline || ''} onChange={v => onChange({ subheadline: v })} />
          <TextField label="Primary CTA" value={d.ctaText || ''} onChange={v => onChange({ ctaText: v })} />
          <TextField label="Secondary CTA" value={d.secondaryCta || ''} onChange={v => onChange({ secondaryCta: v })} />
          <SelectField label="Alignment" value={d.alignment || 'center'} options={['left', 'center', 'right']} onChange={v => onChange({ alignment: v })} />
          <SelectField label="Background" value={d.bgType || 'gradient'} options={['gradient', 'solid', 'image']} onChange={v => onChange({ bgType: v })} />
        </div>
      );
    case 'features':
      return (
        <div className="space-y-3">
          <TextField label="Section Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          <SelectField label="Columns" value={String(d.columns || 3)} options={['2', '3', '4']} onChange={v => onChange({ columns: Number(v) })} />
          <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">Feature Items</div>
          {(d.items || []).map((item: any, i: number) => (
            <div key={i} className="p-2 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Item {i + 1}</span>
                <button onClick={() => { const items = [...(d.items || [])]; items.splice(i, 1); onChange({ items }); }} className="text-red-400 text-xs">✕</button>
              </div>
              <input type="text" value={item.icon || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], icon: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Icon (emoji)" />
              <input type="text" value={item.title || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], title: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Title" />
              <input type="text" value={item.desc || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], desc: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Description" />
            </div>
          ))}
          <button onClick={() => onChange({ items: [...(d.items || []), { icon: '✨', title: 'New Feature', desc: 'Description' }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Feature</button>
        </div>
      );
    case 'pricing':
      return (
        <div className="space-y-3">
          <TextField label="Section Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          {(d.plans || []).map((plan: any, i: number) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{plan.name || `Plan ${i + 1}`}</span>
                <div className="flex gap-2">
                  <button onClick={() => { const plans = [...(d.plans || [])]; plans[i] = { ...plans[i], popular: !plans[i].popular }; onChange({ plans }); }}
                    className={`text-xs px-2 py-0.5 rounded ${plan.popular ? 'bg-violet-600' : 'bg-zinc-700'}`}>★</button>
                  <button onClick={() => { const plans = [...(d.plans || [])]; plans.splice(i, 1); onChange({ plans }); }} className="text-red-400 text-xs">✕</button>
                </div>
              </div>
              <input type="text" value={plan.name || ''} onChange={e => { const plans = [...(d.plans || [])]; plans[i] = { ...plans[i], name: e.target.value }; onChange({ plans }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Plan name" />
              <div className="flex gap-2">
                <input type="text" value={plan.price || ''} onChange={e => { const plans = [...(d.plans || [])]; plans[i] = { ...plans[i], price: e.target.value }; onChange({ plans }); }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Price" />
                <input type="text" value={plan.period || ''} onChange={e => { const plans = [...(d.plans || [])]; plans[i] = { ...plans[i], period: e.target.value }; onChange({ plans }); }}
                  className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="mo" />
              </div>
              <textarea value={(plan.features || []).join('\n')} onChange={e => { const plans = [...(d.plans || [])]; plans[i] = { ...plans[i], features: e.target.value.split('\n').filter(Boolean) }; onChange({ plans }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={3} placeholder="One feature per line" />
            </div>
          ))}
          <button onClick={() => onChange({ plans: [...(d.plans || []), { name: 'New Plan', price: '$49', period: 'mo', features: ['Feature 1'] }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Plan</button>
        </div>
      );
    case 'testimonials':
      return (
        <div className="space-y-3">
          <TextField label="Section Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          {(d.items || []).map((item: any, i: number) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Testimonial {i + 1}</span>
                <button onClick={() => { const items = [...(d.items || [])]; items.splice(i, 1); onChange({ items }); }} className="text-red-400 text-xs">✕</button></div>
              <input type="text" value={item.name || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], name: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Name" />
              <input type="text" value={item.role || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], role: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Role / Company" />
              <textarea value={item.text || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], text: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={2} placeholder="Quote" />
            </div>
          ))}
          <button onClick={() => onChange({ items: [...(d.items || []), { name: 'New Person', role: 'Role, Company', text: 'Great product!', avatar: '👤' }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Testimonial</button>
        </div>
      );
    case 'cta':
      return (
        <div className="space-y-3">
          <TextField label="Headline" value={d.headline || ''} onChange={v => onChange({ headline: v })} />
          <TextField label="Subheadline" value={d.subheadline || ''} onChange={v => onChange({ subheadline: v })} />
          <TextField label="Button Text" value={d.ctaText || ''} onChange={v => onChange({ ctaText: v })} />
          <SelectField label="Style" value={d.style || 'gradient'} options={['gradient', 'solid', 'outline']} onChange={v => onChange({ style: v })} />
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-3">
          <TextField label="Section Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          {(d.items || []).map((item: any, i: number) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">FAQ {i + 1}</span>
                <button onClick={() => { const items = [...(d.items || [])]; items.splice(i, 1); onChange({ items }); }} className="text-red-400 text-xs">✕</button></div>
              <input type="text" value={item.q || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], q: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Question" />
              <textarea value={item.a || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], a: e.target.value }; onChange({ items }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={2} placeholder="Answer" />
            </div>
          ))}
          <button onClick={() => onChange({ items: [...(d.items || []), { q: 'New Question?', a: 'Answer here.' }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add FAQ</button>
        </div>
      );
    case 'newsletter':
      return (
        <div className="space-y-3">
          <TextField label="Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          <TextField label="Description" value={d.description || ''} onChange={v => onChange({ description: v })} />
          <TextField label="Button Text" value={d.buttonText || ''} onChange={v => onChange({ buttonText: v })} />
        </div>
      );
    case 'team':
      return (
        <div className="space-y-3">
          <TextField label="Section Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          {(d.members || []).map((m: any, i: number) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Member {i + 1}</span>
                <button onClick={() => { const members = [...(d.members || [])]; members.splice(i, 1); onChange({ members }); }} className="text-red-400 text-xs">✕</button></div>
              <input type="text" value={m.name || ''} onChange={e => { const members = [...(d.members || [])]; members[i] = { ...members[i], name: e.target.value }; onChange({ members }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Name" />
              <input type="text" value={m.role || ''} onChange={e => { const members = [...(d.members || [])]; members[i] = { ...members[i], role: e.target.value }; onChange({ members }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Role" />
            </div>
          ))}
          <button onClick={() => onChange({ members: [...(d.members || []), { name: 'New Member', role: 'Role', avatar: '👤' }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Member</button>
        </div>
      );
    case 'contact':
      return (
        <div className="space-y-3">
          <TextField label="Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          <TextField label="Button Text" value={d.submitText || ''} onChange={v => onChange({ submitText: v })} />
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Form Fields (comma separated)</label>
            <input type="text" value={(d.fields || []).join(', ')} onChange={e => onChange({ fields: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" placeholder="name, email, message" />
          </div>
        </div>
      );
    case 'stats':
      return (
        <div className="space-y-3">
          <TextField label="Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          {(d.items || []).map((item: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={item.value || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], value: e.target.value }; onChange({ items }); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Value" />
              <input type="text" value={item.label || ''} onChange={e => { const items = [...(d.items || [])]; items[i] = { ...items[i], label: e.target.value }; onChange({ items }); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Label" />
              <button onClick={() => { const items = [...(d.items || [])]; items.splice(i, 1); onChange({ items }); }} className="text-red-400 text-xs">✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ items: [...(d.items || []), { value: '0', label: 'New' }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Stat</button>
        </div>
      );
    case 'footer':
      return (
        <div className="space-y-3">
          {(d.columns || []).map((col: any, i: number) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <input type="text" value={col.title || ''} onChange={e => { const columns = [...(d.columns || [])]; columns[i] = { ...columns[i], title: e.target.value }; onChange({ columns }); }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-medium" placeholder="Column Title" />
                <button onClick={() => { const columns = [...(d.columns || [])]; columns.splice(i, 1); onChange({ columns }); }} className="text-red-400 text-xs ml-2">✕</button>
              </div>
              <textarea value={(col.links || []).join('\n')} onChange={e => { const columns = [...(d.columns || [])]; columns[i] = { ...columns[i], links: e.target.value.split('\n').filter(Boolean) }; onChange({ columns }); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={3} placeholder="One link per line" />
            </div>
          ))}
          <button onClick={() => onChange({ columns: [...(d.columns || []), { title: 'New Column', links: ['Link 1', 'Link 2'] }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Column</button>
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-3">
          <TextField label="Title" value={d.title || ''} onChange={v => onChange({ title: v })} />
          <SelectField label="Columns" value={String(d.columns || 3)} options={['2', '3', '4']} onChange={v => onChange({ columns: Number(v) })} />
          {(d.images || []).map((img: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={img.url || ''} onChange={e => { const images = [...(d.images || [])]; images[i] = { ...images[i], url: e.target.value }; onChange({ images }); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Image URL" />
              <input type="text" value={img.caption || ''} onChange={e => { const images = [...(d.images || [])]; images[i] = { ...images[i], caption: e.target.value }; onChange({ images }); }}
                className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Caption" />
              <button onClick={() => { const images = [...(d.images || [])]; images.splice(i, 1); onChange({ images }); }} className="text-red-400 text-xs">✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ images: [...(d.images || []), { url: 'https://picsum.photos/400/300', caption: 'Image' }] })}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors">+ Add Image</button>
        </div>
      );
    default:
      return <p className="text-xs text-zinc-600">No settings for this section type.</p>;
  }
}
