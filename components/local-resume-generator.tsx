'use client';

import { useState } from 'react';
import { SKILL_CATEGORIES, ACHIEVEMENT_VERBS } from '@/lib/local-templates';

interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: string;
}

export default function LocalResumeGenerator() {
  const [resume, setResume] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    color: '#6366f1'
  });

  const [sections, setSections] = useState<ResumeSection[]>([
    { id: '1', type: 'experience', title: 'Work Experience', content: '' },
    { id: '2', type: 'education', title: 'Education', content: '' },
    { id: '3', type: 'skills', title: 'Skills', content: '' }
  ]);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  const addSection = (type: string) => {
    const titles: Record<string, string> = {
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
      languages: 'Languages',
      volunteer: 'Volunteer Work'
    };
    setSections([...sections, {
      id: Date.now().toString(),
      type,
      title: titles[type] || 'Custom Section',
      content: ''
    }]);
  };

  const updateSection = (id: string, field: string, value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const generateResumeHtml = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${resume.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 40px; }
    .resume { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid ${resume.color}; padding-bottom: 20px; margin-bottom: 20px; }
    .name { font-size: 32px; font-weight: bold; color: ${resume.color}; }
    .title { color: #666; margin-top: 5px; font-size: 18px; }
    .contact { display: flex; gap: 20px; margin-top: 10px; color: #666; font-size: 14px; flex-wrap: wrap; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; text-transform: uppercase; color: ${resume.color}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; font-weight: 600; }
    .content { color: #555; line-height: 1.6; font-size: 14px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill { background: ${resume.color}15; color: ${resume.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; }
    .experience-item { margin-bottom: 15px; }
    .experience-header { display: flex; justify-content: space-between; }
    .experience-role { font-weight: 600; color: #333; }
    .experience-company { color: #666; }
    .experience-date { color: #999; font-size: 13px; }
    .experience-desc { margin-top: 5px; color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <div class="name">${resume.name || 'Your Name'}</div>
      <div class="title">${resume.title || 'Job Title'}</div>
      <div class="contact">
        ${resume.email ? `<span>📧 ${resume.email}</span>` : ''}
        ${resume.phone ? `<span>📱 ${resume.phone}</span>` : ''}
        ${resume.location ? `<span>📍 ${resume.location}</span>` : ''}
        ${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
      </div>
    </div>

    ${resume.summary ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="content">${resume.summary}</div>
    </div>` : ''}

    ${sections.map(section => `
    <div class="section">
      <div class="section-title">${section.title}</div>
      ${section.type === 'skills' ? `
        <div class="skills">
          ${selectedSkills.map(skill => `<span class="skill">${skill}</span>`).join('')}
        </div>
      ` : `
        <div class="content">${section.content.split('\n').map(line => `<p style="margin-bottom:5px">• ${line}</p>`).join('')}</div>
      `}
    </div>`).join('')}
  </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resume Generator</h2>
          <p className="text-zinc-400">Create professional resumes instantly - no AI needed</p>
        </div>
        <button onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg">
          {activeTab === 'edit' ? '👁️ Preview' : '✏️ Edit'}
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Personal Info</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={resume.name} onChange={(e) => setResume(prev => ({ ...prev, name: e.target.value }))} placeholder="Full Name" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  <input type="text" value={resume.title} onChange={(e) => setResume(prev => ({ ...prev, title: e.target.value }))} placeholder="Job Title" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="email" value={resume.email} onChange={(e) => setResume(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  <input type="tel" value={resume.phone} onChange={(e) => setResume(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
                <input type="text" value={resume.location} onChange={(e) => setResume(prev => ({ ...prev, location: e.target.value }))} placeholder="Location" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                <input type="text" value={resume.linkedin} onChange={(e) => setResume(prev => ({ ...prev, linkedin: e.target.value }))} placeholder="LinkedIn URL" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                <textarea value={resume.summary} onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))} placeholder="Professional Summary..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 resize-none" />
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={resume.color} onChange={(e) => setResume(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={resume.color} onChange={(e) => setResume(prev => ({ ...prev, color: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Sections</h3>
                <div className="flex gap-2">
                  {['experience', 'education', 'projects', 'certifications'].map(type => (
                    <button key={type} onClick={() => addSection(type)} className="px-2 py-1 bg-violet-600 hover:bg-violet-700 rounded text-xs capitalize">
                      + {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {sections.map(section => (
                  <div key={section.id} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <input type="text" value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="bg-transparent font-medium" />
                      <button onClick={() => removeSection(section.id)} className="text-red-400 hover:text-red-300">×</button>
                    </div>
                    <textarea value={section.content} onChange={(e) => updateSection(section.id, 'content', e.target.value)} placeholder="Enter details (one item per line)..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm resize-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Skills</h3>
              <span className="text-sm text-zinc-400">{selectedSkills.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSkills.map(skill => (
                <span key={skill} className="bg-violet-600 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {skill}
                  <button onClick={() => toggleSkill(skill)} className="text-white/70 hover:text-white">×</button>
                </span>
              ))}
            </div>
            <button onClick={() => setShowSkillPicker(!showSkillPicker)} className="w-full p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">
              {showSkillPicker ? 'Hide Skills' : 'Browse Skills'}
            </button>
            {showSkillPicker && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="text-xs text-zinc-400 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {skills.map(skill => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-2 py-1 rounded text-xs ${selectedSkills.includes(skill) ? 'bg-violet-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <h4 className="font-medium mb-2">Achievement Phrases</h4>
              <div className="flex flex-wrap gap-1">
                {ACHIEVEMENT_VERBS.slice(0, 10).map(verb => (
                  <span key={verb} className="bg-zinc-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-zinc-600">
                    {verb}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Preview</h3>
            <div className="flex gap-2">
              <button onClick={() => { const blob = new Blob([generateResumeHtml()], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'resume.html'; a.click(); }} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">💾 Download HTML</button>
            </div>
          </div>
          <iframe srcDoc={generateResumeHtml()} className="w-full h-[800px] bg-white rounded-lg" title="Resume Preview" />
        </div>
      )}
    </div>
  );
}
