'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  experience: { company: string; role: string; period: string; description: string }[];
  education: { school: string; degree: string; year: string }[];
  skills: string[];
  certifications: string[];
  languages: string[];
  style: string;
  color: string;
  showPhoto: boolean;
  photo: string;
}

export default function AdvancedResumeGenerator() {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [resume, setResume] = useState<ResumeData>({
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    experience: [{ company: '', role: '', period: '', description: '' }],
    education: [{ school: '', degree: '', year: '' }],
    skills: [],
    certifications: [],
    languages: [],
    style: 'Modern',
    color: '#6366f1',
    showPhoto: false,
    photo: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', period: '', description: '' }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
    }));
  };

  const removeExperience = (index: number) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '' }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
    }));
  };

  const removeEducation = (index: number) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !resume.skills.includes(skillInput.trim())) {
      setResume(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setResume(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const generateWithAI = async () => {
    if (!resume.name || !resume.title) {
      alert('Please fill in Name and Job Title');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a professional resume for:

Name: ${resume.name}
Title: ${resume.title}
${resume.summary ? `Summary: ${resume.summary}` : ''}
${resume.experience.filter(e => e.role).map(e => `Experience: ${e.role} at ${e.company} (${e.period})`).join('\n')}
${resume.education.filter(e => e.school).map(e => `Education: ${e.degree} from ${e.school} (${e.year})`).join('\n')}
Skills: ${resume.skills.join(', ')}

Create a complete, ATS-optimized resume with:
1. Professional summary (3-4 lines)
2. Work experience with bullet points and quantified achievements
3. Education section
4. Skills section
5. Optional certifications

Return JSON:
{
  "summary": "Professional summary",
  "experience": [{"company": "...", "role": "...", "period": "...", "bullets": ["bullet 1", "bullet 2"]}],
  "education": [{"school": "...", "degree": "...", "year": "..."}],
  "skills": ["skill1", "skill2"],
  "certifications": ["cert1"]
}`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a professional resume writer. Create ATS-optimized resumes with strong action verbs and quantified achievements.'
      });

      const parsed = JSON.parse(response.response);
      setResume(prev => ({
        ...prev,
        summary: parsed.summary || prev.summary,
        experience: parsed.experience?.map((e: any) => ({
          company: e.company,
          role: e.role,
          period: e.period,
          description: e.bullets?.join('\n• ') || ''
        })) || prev.experience,
        education: parsed.education || prev.education,
        skills: parsed.skills || prev.skills,
        certifications: parsed.certifications || prev.certifications,
      }));
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Resume - ${resume.name}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333}
      .resume{max-width:800px;margin:0 auto}.header{display:flex;justify-content:space-between;border-bottom:3px solid ${resume.color};padding-bottom:20px;margin-bottom:20px}
      .name{font-size:32px;font-weight:bold;color:${resume.color}}.title{color:#666;margin-top:5px}.contact{display:flex;gap:15px;font-size:12px;color:#666;flex-wrap:wrap}
      .section{margin-bottom:20px}.section-title{font-size:14px;text-transform:uppercase;color:${resume.color};border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:10px;letter-spacing:1px}
      .exp-item{margin-bottom:15px}.exp-header{display:flex;justify-content:space-between}.exp-role{font-weight:bold}.exp-company{color:#666}.exp-period{color:#999;font-size:12px}
      .exp-desc{margin-top:5px;font-size:13px;color:#555;line-height:1.6}.skills{display:flex;flex-wrap:wrap;gap:8px}
      .skill{background:#f0f0f0;padding:4px 12px;border-radius:20px;font-size:12px}.edu-item{margin-bottom:10px}
      .summary{line-height:1.6;color:#555}
      @media print{body{padding:20px}}
    </style></head><body>${resumeRef.current?.innerHTML || ''}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadResume = () => {
    const html = resumeRef.current?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html><html><head><title>Resume - ${resume.name}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333}
      .resume{max-width:800px;margin:0 auto}.header{display:flex;justify-content:space-between;border-bottom:3px solid ${resume.color};padding-bottom:20px;margin-bottom:20px}
      .name{font-size:32px;font-weight:bold;color:${resume.color}}.title{color:#666;margin-top:5px}.contact{display:flex;gap:15px;font-size:12px;color:#666;flex-wrap:wrap}
      .section{margin-bottom:20px}.section-title{font-size:14px;text-transform:uppercase;color:${resume.color};border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:10px;letter-spacing:1px}
      .exp-item{margin-bottom:15px}.exp-header{display:flex;justify-content:space-between}.exp-role{font-weight:bold}.exp-company{color:#666}.exp-period{color:#999;font-size:12px}
      .exp-desc{margin-top:5px;font-size:13px;color:#555;line-height:1.6}.skills{display:flex;flex-wrap:wrap;gap:8px}
      .skill{background:#f0f0f0;padding:4px 12px;border-radius:20px;font-size:12px}.edu-item{margin-bottom:10px}
      .summary{line-height:1.6;color:#555}
    </style></head><body><div class="resume">${html}</div></body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.name.toLowerCase().replace(/\s+/g, '-')}-resume.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResume(prev => ({ ...prev, photo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Resume Generator</h2>
          <p className="text-zinc-400">Create ATS-optimized resumes with professional formatting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
          >
            {activeTab === 'form' ? '👁️ Preview' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">👤 Personal Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Full Name *</label>
                  <input type="text" value={resume.name} onChange={(e) => setResume(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Job Title *</label>
                  <input type="text" value={resume.title} onChange={(e) => setResume(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Email</label>
                  <input type="email" value={resume.email} onChange={(e) => setResume(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                  <input type="tel" value={resume.phone} onChange={(e) => setResume(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Location</label>
                <input type="text" value={resume.location} onChange={(e) => setResume(prev => ({ ...prev, location: e.target.value }))} placeholder="City, Country" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">LinkedIn</label>
                  <input type="text" value={resume.linkedin} onChange={(e) => setResume(prev => ({ ...prev, linkedin: e.target.value }))} placeholder="linkedin.com/in/..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Portfolio</label>
                  <input type="text" value={resume.portfolio} onChange={(e) => setResume(prev => ({ ...prev, portfolio: e.target.value }))} placeholder="yoursite.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Summary & Design */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">📝 Summary & Design</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Professional Summary</label>
                <textarea value={resume.summary} onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))} rows={4} placeholder="Brief overview of your experience and goals..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Style</label>
                  <select value={resume.style} onChange={(e) => setResume(prev => ({ ...prev, style: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    {['Modern', 'Professional', 'Creative', 'Minimal', 'Executive'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={resume.color} onChange={(e) => setResume(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={resume.color} onChange={(e) => setResume(prev => ({ ...prev, color: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={generateWithAI} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-2 rounded-lg font-medium">
                {isGenerating ? '⏳ Generating...' : '✨ Auto-fill with AI'}
              </button>
            </div>
          </div>

          {/* Experience */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">💼 Experience</h3>
              <button onClick={addExperience} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">+ Add</button>
            </div>
            <div className="space-y-4">
              {resume.experience.map((exp, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-start">
                  <input type="text" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} placeholder="Job Title" className="col-span-3 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <input type="text" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Company" className="col-span-3 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <input type="text" value={exp.period} onChange={(e) => updateExperience(i, 'period', e.target.value)} placeholder="Jan 2020 - Present" className="col-span-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <textarea value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} placeholder="Key achievements..." rows={2} className="col-span-3 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm resize-none" />
                  <button onClick={() => removeExperience(i)} className="col-span-1 p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">🎓 Education</h3>
              <button onClick={addEducation} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">+ Add</button>
            </div>
            <div className="space-y-3">
              {resume.education.map((edu, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-center">
                  <input type="text" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} placeholder="Degree" className="col-span-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <input type="text" value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} placeholder="School" className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                  <div className="flex gap-1">
                    <input type="text" value={edu.year} onChange={(e) => updateEducation(i, 'year', e.target.value)} placeholder="Year" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
                    <button onClick={() => removeEducation(i)} className="p-2 bg-red-600/20 text-red-400 rounded">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">🛠️ Skills</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} placeholder="Add skill..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
              <button onClick={addSkill} className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-sm">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, i) => (
                <span key={i} className="bg-zinc-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-zinc-400 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Resume Preview */
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden" ref={resumeRef}>
          <div className="resume p-8">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 pb-4 mb-6" style={{ borderColor: resume.color }}>
              <div>
                {resume.showPhoto && resume.photo && (
                  <img src={resume.photo} alt="Photo" className="w-24 h-24 rounded-full mb-3 object-cover" />
                )}
                <h1 className="text-3xl font-bold" style={{ color: resume.color }}>{resume.name || 'Your Name'}</h1>
                <p className="text-gray-600 text-lg">{resume.title || 'Job Title'}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                  {resume.email && <span>📧 {resume.email}</span>}
                  {resume.phone && <span>📱 {resume.phone}</span>}
                  {resume.location && <span>📍 {resume.location}</span>}
                </div>
                <div className="flex gap-3 mt-1 text-sm">
                  {resume.linkedin && <span className="text-blue-600">{resume.linkedin}</span>}
                  {resume.portfolio && <span className="text-blue-600">{resume.portfolio}</span>}
                </div>
              </div>
            </div>

            {/* Summary */}
            {resume.summary && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: resume.color }}>Professional Summary</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{resume.summary}</p>
              </div>
            )}

            {/* Experience */}
            {resume.experience.some(e => e.role) && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: resume.color }}>Experience</h2>
                {resume.experience.filter(e => e.role).map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between">
                      <div>
                        <span className="font-bold">{exp.role}</span>
                        <span className="text-gray-600"> at {exp.company}</span>
                      </div>
                      <span className="text-sm text-gray-500">{exp.period}</span>
                    </div>
                    {exp.description && (
                      <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                        {exp.description.split('\n').map((line, j) => (
                          <p key={j}>• {line.replace(/^•\s*/, '')}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resume.education.some(e => e.school) && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: resume.color }}>Education</h2>
                {resume.education.filter(e => e.school).map((edu, i) => (
                  <div key={i} className="flex justify-between mb-2">
                    <div>
                      <span className="font-bold">{edu.degree}</span>
                      <span className="text-gray-600"> - {edu.school}</span>
                    </div>
                    <span className="text-sm text-gray-500">{edu.year}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {resume.skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: resume.color }}>Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${resume.color}20`, color: resume.color }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {resume.certifications.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: resume.color }}>Certifications</h2>
                <ul className="text-sm text-gray-600">
                  {resume.certifications.map((cert, i) => (
                    <li key={i} className="mb-1">✓ {cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium">🖨️ Print</button>
          <button onClick={downloadResume} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">💾 Download HTML</button>
          <button onClick={() => navigator.clipboard.writeText(resumeRef.current?.innerText || '')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg">📋 Copy Text</button>
        </div>
      </div>
    </div>
  );
}
