'use client';

import { useState, useCallback } from 'react';

/* ──────────────── TYPES ──────────────── */
interface ResumeSection {
  id: string;
  type: string;
  data: Record<string, any>;
  visible: boolean;
}

interface ResumeConfig {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photo: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  template: typeof TEMPLATES[number];
}

const SECTION_DEFS: Record<string, { label: string; icon: string; defaults: Record<string, any> }> = {
  summary:    { label: 'Professional Summary', icon: '📝', defaults: { text: 'Results-driven professional with 8+ years of experience in delivering high-impact solutions. Proven track record of leading cross-functional teams and driving innovation.' } },
  experience: { label: 'Work Experience',      icon: '💼', defaults: { items: [{ company: 'TechCorp Inc.', role: 'Senior Software Engineer', period: '2021 - Present', location: 'San Francisco, CA', bullets: ['Led development of microservices architecture serving 10M+ users','Mentored team of 5 junior developers','Reduced deployment time by 60% through CI/CD automation'] },{ company: 'StartupXYZ', role: 'Software Engineer', period: '2018 - 2021', location: 'New York, NY', bullets: ['Built real-time data pipeline processing 1M events/sec','Implemented OAuth2 authentication system','Collaborated with design team on UX improvements'] }] } },
  education:  { label: 'Education',            icon: '🎓', defaults: { items: [{ school: 'Stanford University', degree: 'M.S. Computer Science', period: '2016 - 2018', gpa: '3.9/4.0', details: 'Focus: Machine Learning & Distributed Systems' },{ school: 'UC Berkeley', degree: 'B.S. Computer Science', period: '2012 - 2016', gpa: '3.8/4.0', details: 'Dean\'s List, CS Honor Society' }] } },
  skills:     { label: 'Skills',               icon: '⚡', defaults: { categories: [{ name: 'Programming', skills: ['JavaScript','TypeScript','Python','Go','Rust'] },{ name: 'Frameworks', skills: ['React','Next.js','Node.js','FastAPI','Django'] },{ name: 'Cloud & DevOps', skills: ['AWS','Docker','Kubernetes','Terraform','GitHub Actions'] },{ name: 'Databases', skills: ['PostgreSQL','MongoDB','Redis','Elasticsearch'] }] } },
  projects:   { label: 'Projects',             icon: '🚀', defaults: { items: [{ name: 'Open Source Analytics Tool', tech: 'React, Node.js, PostgreSQL', link: 'github.com/user/analytics', description: 'Built analytics dashboard processing 1B+ events with real-time visualization and custom reporting.', stars: '2.5k' },{ name: 'AI Code Review Bot', tech: 'Python, GPT-4, GitHub API', link: 'github.com/user/codebot', description: 'Automated code review tool using LLMs to detect bugs, security issues, and suggest improvements.', stars: '1.8k' }] } },
  certifications: { label: 'Certifications',  icon: '🏆', defaults: { items: [{ name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', date: '2023' },{ name: 'Google Cloud Professional Data Engineer', issuer: 'Google', date: '2022' },{ name: 'Kubernetes Administrator (CKA)', issuer: 'CNCF', date: '2021' }] } },
  languages:  { label: 'Languages',            icon: '🌍', defaults: { items: [{ language: 'English', level: 'Native' },{ language: 'Spanish', level: 'Professional' },{ language: 'Mandarin', level: 'Basic' }] } },
  awards:     { label: 'Awards & Honors',      icon: '🏅', defaults: { items: [{ title: 'Engineer of the Year', issuer: 'TechCorp Inc.', year: '2023' },{ title: 'Best Innovation Award', issuer: 'TechCrunch Disrupt', year: '2022' }] } },
  volunteer:  { label: 'Volunteer Experience', icon: '❤️', defaults: { items: [{ org: 'Code for America', role: 'Volunteer Developer', period: '2020 - Present', description: 'Building civic tech solutions for local governments.' }] } },
  interests:  { label: 'Interests',            icon: '🎯', defaults: { items: ['Open Source Contributing','Machine Learning Research','Rock Climbing','Photography','Chess'] } },
};

function getDefaultSections(): ResumeSection[] {
  return [
    { id: 'r1', type: 'summary',    data: { ...SECTION_DEFS.summary.defaults }, visible: true },
    { id: 'r2', type: 'experience', data: { ...SECTION_DEFS.experience.defaults }, visible: true },
    { id: 'r3', type: 'education',  data: { ...SECTION_DEFS.education.defaults }, visible: true },
    { id: 'r4', type: 'skills',     data: { ...SECTION_DEFS.skills.defaults }, visible: true },
    { id: 'r5', type: 'projects',   data: { ...SECTION_DEFS.projects.defaults }, visible: true },
  ];
}

const TEMPLATES = ['modern','classic','minimal','creative','executive','bold','elegant','tech','gradient','two-tone','compact','timeline','infographic','magazine','futuristic'] as const;
const FONTS = ['Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Georgia','Garamond','Fira Code','Space Grotesk','Outfit','Sora','DM Sans','Plus Jakarta Sans','Manrope','Playfair Display','Merriweather','Nunito','Raleway','Quicksand'];

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function LocalResumeGenerator() {
  const [sections, setSections] = useState<ResumeSection[]>(getDefaultSections);
  const [config, setConfig] = useState<ResumeConfig>({
    name: 'Alex Johnson', title: 'Senior Software Engineer', email: 'alex@example.com',
    phone: '+1 (555) 123-4567', location: 'San Francisco, CA', website: 'alexjohnson.dev',
    linkedin: 'linkedin.com/in/alexjohnson', github: 'github.com/alexj', photo: '',
    primaryColor: '#6366f1', secondaryColor: '#8b5cf6', fontFamily: 'Inter', fontSize: 14, lineHeight: 1.6, template: 'modern',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftPanel, setLeftPanel] = useState<'sections' | 'add'>('sections');
  const [rightPanel, setRightPanel] = useState<'style' | 'content'>('content');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'print'>('desktop');
  const [notification, setNotification] = useState('');

  const selected = sections.find(s => s.id === selectedId);
  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 2000); };

  const addSection = (type: string) => {
    const def = SECTION_DEFS[type]; if (!def) return;
    const newSection: ResumeSection = { id: `r${Date.now()}`, type, data: JSON.parse(JSON.stringify(def.defaults)), visible: true };
    setSections([...sections, newSection]);
    setSelectedId(newSection.id);
    notify(`Added ${def.label}`);
  };

  const removeSection = (id: string) => { setSections(sections.filter(s => s.id !== id)); if (selectedId===id) setSelectedId(null); };
  const toggleVisibility = (id: string) => { setSections(prev => prev.map(s => s.id===id ? {...s, visible: !s.visible} : s)); };
  const moveSection = (from: number, to: number) => { if (to<0||to>=sections.length) return; const arr=[...sections]; const [m]=arr.splice(from,1); arr.splice(to,0,m); setSections(arr); };
  const updateData = (id: string, data: Record<string, any>) => { setSections(prev => prev.map(s => s.id===id ? {...s, data: {...s.data, ...data}} : s)); };

  // ─── HTML Generation ───
  const generateHTML = useCallback(() => {
    const c = config;
    const visibleSections = sections.filter(s => s.visible);
    const sectionHtml = visibleSections.map(s => renderSection(s, c)).join('\n');
    const photoSize = c.photo ? `<img src="${c.photo}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,0.3);margin:0 auto 16px;display:block" onerror="this.style.display='none'">` : '';
    const photoRect = c.photo ? `<img src="${c.photo}" style="width:140px;height:140px;object-fit:cover;border-radius:8px;margin:0 auto 16px;display:block" onerror="this.style.display='none'">` : '';
    const contactHtml = `<div style="font-size:12px;line-height:2">${c.email?`<div>📧 ${c.email}</div>`:''}${c.phone?`<div>📱 ${c.phone}</div>`:''}${c.location?`<div>📍 ${c.location}</div>`:''}${c.website?`<div>🌐 ${c.website}</div>`:''}${c.linkedin?`<div>💼 ${c.linkedin}</div>`:''}${c.github?`<div>🐙 ${c.github}</div>`:''}</div>`;

    // Template-specific styles and layouts
    const templateConfigs: Record<string, { bg: string; sidebar: string; header: string; layout: string; styles: string }> = {
      modern: {
        bg: '#ffffff',
        sidebar: `<div style="background:${c.primaryColor};color:#fff;padding:32px 24px;width:280px;min-height:100%">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:22px;margin:0 0 4px;font-weight:700">${c.name}</h1><div style="font-size:13px;opacity:0.9">${c.title}</div></div>${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: ''
      },
      classic: {
        bg: '#ffffff',
        sidebar: '',
        header: `<div style="text-align:center;padding:40px 32px 20px;border-bottom:3px solid ${c.primaryColor}">${photoRect}<h1 style="font-size:28px;margin:0 0 8px;color:${c.primaryColor}">${c.name}</h1><div style="font-size:16px;color:#666;margin-bottom:12px">${c.title}</div><div style="display:flex;justify-content:center;gap:16px;font-size:13px;color:#666;flex-wrap:wrap">${c.email?`<span>📧 ${c.email}</span>`:''}${c.phone?`<span>📱 ${c.phone}</span>`:''}${c.location?`<span>📍 ${c.location}</span>`:''}</div></div>`,
        layout: 'top', styles: ''
      },
      minimal: {
        bg: '#ffffff',
        sidebar: '',
        header: `<div style="padding:40px 40px 20px"><h1 style="font-size:32px;margin:0;font-weight:300;letter-spacing:2px">${c.name}</h1><div style="font-size:14px;color:#888;margin-top:8px;text-transform:uppercase;letter-spacing:3px">${c.title}</div><div style="margin-top:16px;font-size:12px;color:#999;display:flex;gap:20px;flex-wrap:wrap">${c.email?`<span>${c.email}</span>`:''}${c.phone?`<span>${c.phone}</span>`:''}${c.location?`<span>${c.location}</span>`:''}</div></div>`,
        layout: 'top', styles: '.section-title{border-bottom:1px solid #ddd;color:#333}'
      },
      creative: {
        bg: '#1a1a2e',
        sidebar: `<div style="background:linear-gradient(180deg,${c.primaryColor},${c.secondaryColor});color:#fff;padding:32px 24px;width:280px;min-height:100%">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:22px;margin:0 0 4px;font-weight:700">${c.name}</h1><div style="font-size:13px;opacity:0.9">${c.title}</div></div>${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: 'body{background:#1a1a2e}.section-title{color:${c.primaryColor}}'
      },
      executive: {
        bg: '#ffffff',
        sidebar: `<div style="background:#1a1a2e;color:#fff;padding:32px 24px;width:280px;min-height:100%">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:20px;margin:0 0 4px;font-weight:700;text-transform:uppercase;letter-spacing:2px">${c.name}</h1><div style="font-size:12px;opacity:0.7;text-transform:uppercase;letter-spacing:1px">${c.title}</div></div>${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: '.section-title{letter-spacing:2px;text-transform:uppercase}'
      },
      bold: {
        bg: '#ffffff',
        sidebar: `<div style="background:${c.primaryColor};color:#fff;padding:32px 24px;width:280px;min-height:100%">${photoSize}<h1 style="font-size:24px;margin:0;font-weight:900;text-transform:uppercase">${c.name}</h1><div style="font-size:14px;margin:8px 0 20px;opacity:0.9">${c.title}</div><hr style="border:none;border-top:2px solid rgba(255,255,255,0.3);margin:16px 0">${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: '.section-title{font-weight:900;text-transform:uppercase;letter-spacing:2px}'
      },
      elegant: {
        bg: '#fefcf8',
        sidebar: '',
        header: `<div style="text-align:center;padding:40px 32px 20px;background:linear-gradient(135deg,${c.primaryColor}08,${c.secondaryColor}08)">${photoRect}<div style="font-size:11px;text-transform:uppercase;letter-spacing:4px;color:${c.primaryColor};margin-bottom:8px">${c.title}</div><h1 style="font-size:36px;margin:0;font-family:Georgia,serif;font-weight:400;color:#2d2d2d">${c.name}</h1><div style="margin-top:16px;font-size:13px;color:#888;display:flex;justify-content:center;gap:24px;flex-wrap:wrap">${c.email?`<span>${c.email}</span>`:''}${c.phone?`<span>${c.phone}</span>`:''}${c.location?`<span>${c.location}</span>`:''}</div></div>`,
        layout: 'top', styles: '.section-title{font-family:Georgia,serif;font-weight:400;text-transform:none;font-size:18px;letter-spacing:0}'
      },
      tech: {
        bg: '#0f172a',
        sidebar: `<div style="background:#1e293b;color:#e2e8f0;padding:32px 24px;width:280px;min-height:100%;border-right:3px solid ${c.primaryColor}">${photoSize}<div style="font-family:monospace;color:${c.primaryColor};font-size:11px;margin-bottom:12px">// PROFILE</div><h1 style="font-size:20px;margin:0 0 4px;font-weight:700;font-family:monospace">${c.name}</h1><div style="font-size:12px;color:#94a3b8;font-family:monospace">${c.title}</div><hr style="border:none;border-top:1px solid #334155;margin:16px 0"><div style="font-family:monospace;color:${c.primaryColor};font-size:11px;margin-bottom:8px">// CONTACT</div>${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: 'body{background:#0f172a;color:#e2e8f0}.section-title{font-family:monospace;color:${c.primaryColor};border-bottom-color:#334155}'
      },
      gradient: {
        bg: '#ffffff',
        sidebar: `<div style="background:linear-gradient(135deg,${c.primaryColor},${c.secondaryColor});color:#fff;padding:32px 24px;width:280px;min-height:100%">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:22px;margin:0 0 4px;font-weight:700">${c.name}</h1><div style="font-size:13px;opacity:0.9">${c.title}</div></div>${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: ''
      },
      'two-tone': {
        bg: '#ffffff',
        sidebar: `<div style="background:${c.primaryColor};color:#fff;padding:32px 24px;width:280px;min-height:100%;position:relative;overflow:hidden"><div style="position:absolute;top:-50px;right:-50px;width:150px;height:150px;background:rgba(255,255,255,0.1);border-radius:50%"></div><div style="position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;background:rgba(255,255,255,0.08);border-radius:50%"></div><div style="position:relative">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:22px;margin:0 0 4px;font-weight:700">${c.name}</h1><div style="font-size:13px;opacity:0.9">${c.title}</div></div>${contactHtml}</div></div>`,
        header: '', layout: 'sidebar', styles: ''
      },
      compact: {
        bg: '#ffffff',
        sidebar: `<div style="background:${c.primaryColor};color:#fff;padding:20px;width:240px;min-height:100%">${c.photo?`<img src="${c.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.3);margin:0 auto 12px;display:block" onerror="this.style.display='none'">`:''}<div style="text-align:center;margin-bottom:16px"><h1 style="font-size:18px;margin:0 0 4px;font-weight:700">${c.name}</h1><div style="font-size:11px;opacity:0.9">${c.title}</div></div><div style="font-size:11px;line-height:2">${c.email?`<div>📧 ${c.email}</div>`:''}${c.phone?`<div>📱 ${c.phone}</div>`:''}${c.location?`<div>📍 ${c.location}</div>`:''}</div></div>`,
        header: '', layout: 'sidebar', styles: '.section-title{font-size:14px}.item-bullets li{font-size:12px}'
      },
      timeline: {
        bg: '#ffffff',
        sidebar: '',
        header: `<div style="padding:40px 40px 20px;display:flex;gap:24px;align-items:center">${photoRect}<div><h1 style="font-size:28px;margin:0 0 4px">${c.name}</h1><div style="font-size:16px;color:#666">${c.title}</div><div style="margin-top:8px;font-size:12px;color:#999;display:flex;gap:16px;flex-wrap:wrap">${c.email?`<span>${c.email}</span>`:''}${c.phone?`<span>${c.phone}</span>`:''}${c.location?`<span>${c.location}</span>`:''}</div></div></div>`,
        layout: 'top', styles: '.item{padding-left:20px;border-left:2px solid #eee;position:relative}.item::before{content:"";position:absolute;left:-5px;top:8px;width:8px;height:8px;border-radius:50%;background:' + c.primaryColor
      },
      infographic: {
        bg: '#f8fafc',
        sidebar: `<div style="background:${c.primaryColor};color:#fff;padding:32px 24px;width:280px;min-height:100%;border-radius:0 20px 20px 0">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:22px;margin:0 0 4px;font-weight:700">${c.name}</h1><div style="font-size:13px;opacity:0.9">${c.title}</div></div>${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: '.section{background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:16px}.section-title{border-bottom:none;color:${c.primaryColor}}'
      },
      magazine: {
        bg: '#ffffff',
        sidebar: '',
        header: `<div style="padding:40px 40px 20px;background:#000;color:#fff;position:relative">${photoRect?'<div style="position:absolute;top:40px;right:40px">'+photoRect+'</div>':''}<div style="max-width:60%"><div style="font-size:11px;text-transform:uppercase;letter-spacing:4px;color:${c.primaryColor};margin-bottom:8px">RESUME</div><h1 style="font-size:42px;margin:0;font-weight:900;line-height:1.1">${c.name}</h1><div style="font-size:18px;color:#ccc;margin-top:8px">${c.title}</div></div></div>`,
        layout: 'top', styles: '.section-title{font-size:14px;text-transform:uppercase;letter-spacing:3px;border-bottom:2px solid #000}'
      },
      futuristic: {
        bg: '#0a0a0a',
        sidebar: `<div style="background:linear-gradient(180deg,#1a1a2e,#0a0a0a);color:#fff;padding:32px 24px;width:280px;min-height:100%;border:1px solid #333;border-left:none">${photoSize}<div style="text-align:center;margin-bottom:24px"><h1 style="font-size:22px;margin:0 0 4px;font-weight:700;background:linear-gradient(135deg,${c.primaryColor},${c.secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${c.name}</h1><div style="font-size:13px;color:#888">${c.title}</div></div><hr style="border:none;border-top:1px solid #333;margin:16px 0">${contactHtml}</div>`,
        header: '', layout: 'sidebar', styles: 'body{background:#0a0a0a;color:#e0e0e0}.section-title{background:linear-gradient(135deg,${c.primaryColor},${c.secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent;border-bottom-color:#333}.skill-tag{border:1px solid #444;background:transparent}'
      },
    };

    const tc = templateConfigs[c.template] || templateConfigs.modern;
    const sidebarUsed = tc.layout === 'sidebar';

    const baseStyles = `@page{margin:0}body{margin:0;padding:0;font-family:${c.fontFamily},sans-serif;font-size:${c.fontSize}px;line-height:${c.lineHeight};color:#1a1a2e;background:${tc.bg}}*{box-sizing:border-box}.resume{display:flex;min-height:100vh}.main{flex:1;padding:32px}.section{margin-bottom:24px}.section-title{font-size:16px;font-weight:700;color:${c.primaryColor};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${c.primaryColor};padding-bottom:6px;margin-bottom:16px}.item{margin-bottom:16px}.item-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}.item-title{font-weight:600;font-size:15px}.item-subtitle{color:#666;font-size:13px}.item-period{color:${c.primaryColor};font-size:12px;font-weight:600}.item-location{color:#888;font-size:12px}.item-bullets{list-style:none;padding:0;margin:6px 0 0}.item-bullets li{padding:3px 0;padding-left:16px;position:relative;font-size:13px}.item-bullets li::before{content:"▸";position:absolute;left:0;color:${c.primaryColor}}.skills-grid{display:flex;flex-wrap:wrap;gap:8px}.skill-tag{background:${c.primaryColor}15;color:${c.primaryColor};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500}.project-link{color:${c.primaryColor};font-size:12px}.stars{color:#f59e0b;font-size:12px}.print-btn{position:fixed;bottom:20px;right:20px;background:${c.primaryColor};color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-weight:600;z-index:100}@media print{.print-btn{display:none}.resume{min-height:auto}}${tc.styles}`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.name} - Resume</title><style>${baseStyles}</style></head><body><div class="resume">${tc.header}${sidebarUsed?tc.sidebar:''}<div class="main">${sectionHtml}</div></div><button class="print-btn" onclick="window.print()">🖨️ Print</button></body></html>`;
  }, [sections, config]);

  function renderSection(sec: ResumeSection, c: ResumeConfig): string {
    const d = sec.data;
    const color = c.primaryColor;
    switch (sec.type) {
      case 'summary':
        return `<div class="section"><div class="section-title">Professional Summary</div><p style="margin:0;color:#444">${d.text}</p></div>`;
      case 'experience':
        return `<div class="section"><div class="section-title">Work Experience</div>${(d.items||[]).map((exp:any)=>`<div class="item"><div class="item-header"><div><div class="item-title">${exp.role}</div><div class="item-subtitle">${exp.company}</div></div><div style="text-align:right"><div class="item-period">${exp.period}</div>${exp.location?`<div class="item-location">${exp.location}</div>`:''}</div></div><ul class="item-bullets">${(exp.bullets||[]).map((b:string)=>`<li>${b}</li>`).join('')}</ul></div>`).join('')}</div>`;
      case 'education':
        return `<div class="section"><div class="section-title">Education</div>${(d.items||[]).map((edu:any)=>`<div class="item"><div class="item-header"><div><div class="item-title">${edu.degree}</div><div class="item-subtitle">${edu.school}</div></div><div style="text-align:right"><div class="item-period">${edu.period}</div>${edu.gpa?`<div class="item-location">GPA: ${edu.gpa}</div>`:''}</div></div>${edu.details?`<p style="margin:4px 0 0;font-size:13px;color:#666">${edu.details}</p>`:''}</div>`).join('')}</div>`;
      case 'skills':
        return `<div class="section"><div class="section-title">Skills</div>${(d.categories||[]).map((cat:any)=>`<div style="margin-bottom:12px"><div style="font-weight:600;font-size:13px;margin-bottom:6px">${cat.name}</div><div class="skills-grid">${(cat.skills||[]).map((sk:string)=>`<span class="skill-tag">${sk}</span>`).join('')}</div></div>`).join('')}</div>`;
      case 'projects':
        return `<div class="section"><div class="section-title">Projects</div>${(d.items||[]).map((proj:any)=>`<div class="item"><div class="item-header"><div class="item-title">${proj.name}</div><div class="item-period">${proj.tech}</div></div><p style="margin:4px 0;font-size:13px;color:#444">${proj.description}</p><div style="display:flex;gap:12px;align-items:center">${proj.link?`<span class="project-link">${proj.link}</span>`:''}${proj.stars?`<span class="stars">⭐ ${proj.stars}</span>`:''}</div></div>`).join('')}</div>`;
      case 'certifications':
        return `<div class="section"><div class="section-title">Certifications</div>${(d.items||[]).map((cert:any)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee"><div><span style="font-weight:600">🏆 ${cert.name}</span><div style="font-size:12px;color:#666">${cert.issuer}</div></div><span style="font-size:12px;color:${color}">${cert.date}</span></div>`).join('')}</div>`;
      case 'languages':
        return `<div class="section"><div class="section-title">Languages</div><div style="display:flex;flex-wrap:wrap;gap:12px">${(d.items||[]).map((lang:any)=>`<div style="padding:8px 16px;background:#f8f9fa;border-radius:8px"><span style="font-weight:600">${lang.language}</span> <span style="color:#666;font-size:12px">- ${lang.level}</span></div>`).join('')}</div></div>`;
      case 'awards':
        return `<div class="section"><div class="section-title">Awards & Honors</div>${(d.items||[]).map((aw:any)=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee"><div><span style="font-weight:600">🏅 ${aw.title}</span><div style="font-size:12px;color:#666">${aw.issuer}</div></div><span style="font-size:12px;color:${color}">${aw.year}</span></div>`).join('')}</div>`;
      case 'volunteer':
        return `<div class="section"><div class="section-title">Volunteer Experience</div>${(d.items||[]).map((v:any)=>`<div class="item"><div class="item-header"><div class="item-title">${v.role}</div><div class="item-period">${v.period}</div></div><div class="item-subtitle">${v.org}</div><p style="margin:4px 0 0;font-size:13px;color:#444">${v.description}</p></div>`).join('')}</div>`;
      case 'interests':
        return `<div class="section"><div class="section-title">Interests</div><div style="display:flex;flex-wrap:wrap;gap:8px">${(d.items||[]).map((i:string)=>`<span style="padding:6px 14px;background:#f0f0f0;border-radius:20px;font-size:13px">${i}</span>`).join('')}</div></div>`;
      default:
        return '';
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-white overflow-hidden">
      {/* ──── TOP BAR ──── */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Resume Builder</span>
          <span className="text-xs text-zinc-500">{sections.filter(s=>s.visible).length} sections</span>
        </div>
        <div className="flex items-center gap-1">
          {(['desktop','print'] as const).map(m => <button key={m} onClick={() => setPreviewMode(m)} className={`p-2 rounded-lg text-sm ${previewMode===m?'bg-emerald-600':'hover:bg-zinc-800'}`}>{m==='desktop'?'🖥️':'🖨️'}</button>)}
          <span className="w-px h-5 bg-zinc-700 mx-1" />
          <button onClick={() => setLeftOpen(!leftOpen)} className={`p-2 rounded-lg text-sm ${leftOpen?'bg-zinc-700':'hover:bg-zinc-800'}`}>📋</button>
          <button onClick={() => setRightOpen(!rightOpen)} className={`p-2 rounded-lg text-sm ${rightOpen?'bg-zinc-700':'hover:bg-zinc-800'}`}>⚙️</button>
          <span className="w-px h-5 bg-zinc-700 mx-1" />
          <button onClick={() => { navigator.clipboard.writeText(generateHTML()); notify('Copied!'); }} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">📋 Copy HTML</button>
          <button onClick={() => { const b = new Blob([generateHTML()],{type:'text/html'}); const u = URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`${config.name.toLowerCase().replace(/\s+/g,'-')}-resume.html`; a.click(); notify('Downloaded!'); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium">💾 Download</button>
        </div>
      </div>
      {notification && <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm z-50 animate-pulse">{notification}</div>}

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        {leftOpen && (
          <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
            <div className="flex border-b border-zinc-800">
              {(['sections','add'] as const).map(t => <button key={t} onClick={() => setLeftPanel(t)} className={`flex-1 py-2.5 text-xs font-medium capitalize ${leftPanel===t?'text-emerald-400 border-b-2 border-emerald-400':'text-zinc-500'}`}>{t==='sections'?'📑 Sections':'➕ Add'}</button>)}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {leftPanel === 'sections' ? (
                <div className="space-y-1">
                  {sections.map((sec, idx) => (
                    <div key={sec.id} onClick={() => setSelectedId(sec.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border ${selectedId===sec.id?'bg-emerald-600/20 border-emerald-500':'bg-zinc-800/50 border-transparent hover:border-zinc-700'}`}>
                      <span className="text-sm">{SECTION_DEFS[sec.type]?.icon}</span>
                      <span className="flex-1 text-sm truncate">{SECTION_DEFS[sec.type]?.label}</span>
                      <button onClick={e => { e.stopPropagation(); toggleVisibility(sec.id); }} className="text-xs">{sec.visible?'👁️':'🚫'}</button>
                      <button onClick={e => { e.stopPropagation(); moveSection(idx, idx-1); }} className="text-xs opacity-50 hover:opacity-100" disabled={idx===0}>↑</button>
                      <button onClick={e => { e.stopPropagation(); moveSection(idx, idx+1); }} className="text-xs opacity-50 hover:opacity-100" disabled={idx===sections.length-1}>↓</button>
                      <button onClick={e => { e.stopPropagation(); removeSection(sec.id); }} className="text-xs text-red-400 opacity-50 hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(SECTION_DEFS).map(([type, def]) => (
                    <button key={type} onClick={() => addSection(type)} className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-emerald-500/50 rounded-xl text-left transition-all group">
                      <span className="text-xl">{def.icon}</span>
                      <span className="text-sm text-zinc-400 group-hover:text-white">{def.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CANVAS */}
        <div className="flex-1 overflow-y-auto bg-zinc-800 flex justify-center p-4">
          <div style={{ width: previewMode==='print'?'210mm':'100%', maxWidth: '900px', minHeight: '1100px' }} className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: generateHTML() }} className="w-full h-full" />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        {rightOpen && (
          <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
            <div className="flex border-b border-zinc-800">
              {(['content','style'] as const).map(t => <button key={t} onClick={() => setRightPanel(t)} className={`flex-1 py-2.5 text-xs font-medium capitalize ${rightPanel===t?'text-emerald-400 border-b-2 border-emerald-400':'text-zinc-500'}`}>{t}</button>)}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {rightPanel === 'content' ? (
                selected ? <SectionEditor section={selected} onChange={(data) => updateData(selected.id, data)} /> : (
                  <>
                    <FG title="Personal Info">
                      <TF label="Full Name" value={config.name} onChange={v => setConfig(p=>({...p,name:v}))} />
                      <TF label="Job Title" value={config.title} onChange={v => setConfig(p=>({...p,title:v}))} />
                      <TF label="Email" value={config.email} onChange={v => setConfig(p=>({...p,email:v}))} />
                      <TF label="Phone" value={config.phone} onChange={v => setConfig(p=>({...p,phone:v}))} />
                      <TF label="Location" value={config.location} onChange={v => setConfig(p=>({...p,location:v}))} />
                      <TF label="Website" value={config.website} onChange={v => setConfig(p=>({...p,website:v}))} />
                      <TF label="LinkedIn" value={config.linkedin} onChange={v => setConfig(p=>({...p,linkedin:v}))} />
                      <TF label="GitHub" value={config.github} onChange={v => setConfig(p=>({...p,github:v}))} />
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Photo</label>
                        <div className="flex gap-2">
                          <input type="text" value={config.photo} onChange={e => setConfig(p=>({...p,photo:e.target.value}))} placeholder="https://..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                          <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm cursor-pointer transition-colors">📤 Upload</label>
                          <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const size = 300;
                                canvas.width = size; canvas.height = size;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  const minDim = Math.min(img.width, img.height);
                                  const sx = (img.width - minDim) / 2;
                                  const sy = (img.height - minDim) / 2;
                                  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                                  setConfig(p=>({...p, photo: canvas.toDataURL('image/jpeg', 0.9)}));
                                }
                              };
                              img.src = ev.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </div>
                        {config.photo && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={config.photo} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500" alt="Preview" />
                            <button onClick={() => setConfig(p=>({...p,photo:''}))} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                          </div>
                        )}
                      </div>
                    </FG>
                  </>
                )
              ) : (
                <>
                  <FG title="Template Style">
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => {
                        const colors: Record<string, string> = {
                          modern:'bg-indigo-600', classic:'bg-sky-600', minimal:'bg-zinc-600',
                          creative:'bg-purple-600', executive:'bg-slate-800', bold:'bg-red-600',
                          elegant:'bg-amber-700', tech:'bg-cyan-700', gradient:'bg-gradient-to-r from-indigo-500 to-purple-500',
                          'two-tone':'bg-teal-600', compact:'bg-emerald-600', timeline:'bg-orange-500',
                          infographic:'bg-pink-600', magazine:'bg-black', futuristic:'bg-violet-700',
                        };
                        return (
                          <button key={t} onClick={() => setConfig(p=>({...p,template:t}))}
                            className={`relative p-3 rounded-xl text-left transition-all border ${config.template===t?'border-emerald-500 bg-emerald-600/20':'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'}`}>
                            <div className={`w-full h-3 rounded-full mb-2 ${colors[t]||'bg-zinc-600'}`}></div>
                            <span className="text-xs font-medium capitalize">{t}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FG>
                  <FG title="Colors">
                    <CF label="Primary" value={config.primaryColor} onChange={v => setConfig(p=>({...p,primaryColor:v}))} />
                    <CF label="Secondary" value={config.secondaryColor} onChange={v => setConfig(p=>({...p,secondaryColor:v}))} />
                  </FG>
                  <FG title="Typography">
                    <SF label="Font" value={config.fontFamily} options={FONTS} onChange={v => setConfig(p=>({...p,fontFamily:v}))} />
                    <SLF label="Font Size" value={config.fontSize} min={11} max={18} unit="px" onChange={v => setConfig(p=>({...p,fontSize:v}))} />
                    <SLF label="Line Height" value={config.lineHeight} min={1.2} max={2.0} step={0.1} unit="" onChange={v => setConfig(p=>({...p,lineHeight:v}))} />
                  </FG>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Field Helpers ──── */
function FG({ title, children }: { title: string; children: React.ReactNode }) { return <div><div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">{title}</div><div className="space-y-3">{children}</div></div>; }
function TF({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) { return <div><label className="block text-xs text-zinc-400 mb-1">{label}</label><input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" /></div>; }
function TAF({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) { return <div><label className="block text-xs text-zinc-400 mb-1">{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-y" /></div>; }
function SF({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) { return <div><label className="block text-xs text-zinc-400 mb-1">{label}</label><select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>; }
function SLF({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) { return <div><div className="flex justify-between mb-1"><label className="text-xs text-zinc-400">{label}</label><span className="text-xs text-emerald-400 font-mono">{value}{unit}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5" /></div>; }
function CF({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <div className="flex items-center gap-2"><input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" /><input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" /></div>; }

/* ──── Section Editor ──── */
function SectionEditor({ section, onChange }: { section: ResumeSection; onChange: (data: Record<string, any>) => void }) {
  const d = section.data;
  switch (section.type) {
    case 'summary':
      return <TAF label="Summary" value={d.text} onChange={v => onChange({text:v})} rows={5} />;
    case 'experience':
      return <div className="space-y-3">{(d.items||[]).map((exp:any,i:number)=>(<div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2"><div className="flex justify-between items-center"><span className="text-xs text-zinc-500">Experience {i+1}</span><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div><input value={exp.role} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],role:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Role" /><input value={exp.company} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],company:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Company" /><div className="flex gap-2"><input value={exp.period} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],period:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Period" /><input value={exp.location} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],location:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Location" /></div><textarea value={(exp.bullets||[]).join('\n')} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],bullets:e.target.value.split('\n').filter(Boolean)};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={4} placeholder="Bullet points (one per line)" /></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{company:'',role:'',period:'',location:'',bullets:['']}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Experience</button></div>;
    case 'education':
      return <div className="space-y-3">{(d.items||[]).map((edu:any,i:number)=>(<div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2"><div className="flex justify-between items-center"><span className="text-xs text-zinc-500">Education {i+1}</span><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div><input value={edu.degree} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],degree:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Degree" /><input value={edu.school} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],school:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="School" /><div className="flex gap-2"><input value={edu.period} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],period:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Period" /><input value={edu.gpa} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],gpa:e.target.value};onChange({items})}} className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="GPA" /></div><input value={edu.details} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],details:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Additional details" /></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{school:'',degree:'',period:'',gpa:'',details:''}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Education</button></div>;
    case 'skills':
      return <div className="space-y-3">{(d.categories||[]).map((cat:any,i:number)=>(<div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2"><div className="flex justify-between items-center"><input value={cat.name} onChange={e=>{const categories=[...(d.categories||[])];categories[i]={...categories[i],name:e.target.value};onChange({categories})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-medium" placeholder="Category" /><button onClick={()=>{const categories=[...(d.categories||[])];categories.splice(i,1);onChange({categories})}} className="text-red-400 text-xs ml-2">✕</button></div><input value={(cat.skills||[]).join(', ')} onChange={e=>{const categories=[...(d.categories||[])];categories[i]={...categories[i],skills:e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)};onChange({categories})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Skills (comma separated)" /></div>))}<button onClick={()=>onChange({categories:[...(d.categories||[]),{name:'New Category',skills:['Skill 1']}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Category</button></div>;
    case 'projects':
      return <div className="space-y-3">{(d.items||[]).map((proj:any,i:number)=>(<div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2"><div className="flex justify-between items-center"><span className="text-xs text-zinc-500">Project {i+1}</span><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div><input value={proj.name} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],name:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Project name" /><input value={proj.tech} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],tech:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Technologies" /><textarea value={proj.description} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],description:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={2} placeholder="Description" /><div className="flex gap-2"><input value={proj.link} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],link:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Link" /><input value={proj.stars} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],stars:e.target.value};onChange({items})}} className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Stars" /></div></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{name:'',tech:'',link:'',description:'',stars:''}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Project</button></div>;
    case 'certifications':
      return <div className="space-y-3">{(d.items||[]).map((cert:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={cert.name} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],name:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Certification" /><input value={cert.issuer} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],issuer:e.target.value};onChange({items})}} className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Issuer" /><input value={cert.date} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],date:e.target.value};onChange({items})}} className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Year" /><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{name:'',issuer:'',date:''}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Certification</button></div>;
    case 'languages':
      return <div className="space-y-3">{(d.items||[]).map((lang:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={lang.language} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],language:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Language" /><select value={lang.level} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],level:e.target.value};onChange({items})}} className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"><option>Native</option><option>Fluent</option><option>Professional</option><option>Intermediate</option><option>Basic</option></select><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{language:'',level:'Intermediate'}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Language</button></div>;
    case 'awards':
      return <div className="space-y-3">{(d.items||[]).map((aw:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={aw.title} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],title:e.target.value};onChange({items})}} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Award" /><input value={aw.issuer} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],issuer:e.target.value};onChange({items})}} className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Issuer" /><input value={aw.year} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],year:e.target.value};onChange({items})}} className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Year" /><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{title:'',issuer:'',year:''}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Award</button></div>;
    case 'volunteer':
      return <div className="space-y-3">{(d.items||[]).map((v:any,i:number)=>(<div key={i} className="p-3 bg-zinc-800/50 rounded-lg space-y-2"><div className="flex justify-between items-center"><span className="text-xs text-zinc-500">Volunteer {i+1}</span><button onClick={()=>{const items=[...(d.items||[])];items.splice(i,1);onChange({items})}} className="text-red-400 text-xs">✕</button></div><input value={v.role} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],role:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Role" /><input value={v.org} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],org:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Organization" /><input value={v.period} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],period:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" placeholder="Period" /><textarea value={v.description} onChange={e=>{const items=[...(d.items||[])];items[i]={...items[i],description:e.target.value};onChange({items})}} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" rows={2} placeholder="Description" /></div>))}<button onClick={()=>onChange({items:[...(d.items||[]),{role:'',org:'',period:'',description:''}]})} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">+ Add Volunteer</button></div>;
    case 'interests':
      return <div className="space-y-3"><TAF label="Interests (one per line)" value={(d.items||[]).join('\n')} onChange={v => onChange({items:v.split('\n').filter(Boolean)})} rows={5} /></div>;
    default:
      return <p className="text-xs text-zinc-600">No settings.</p>;
  }
}
