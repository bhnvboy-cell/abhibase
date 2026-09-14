'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type GeneratorType = 'email' | 'resume' | 'invoice' | 'report' | 'form' | 'chatbot' | 'quiz' | 'logo';

interface Generator {
  id: GeneratorType;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: GeneratorField[];
}

interface GeneratorField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

const GENERATORS: Generator[] = [
  {
    id: 'email',
    name: 'Email Template',
    description: 'Professional email templates for marketing, transactions, and outreach',
    icon: '📧',
    color: 'from-blue-500 to-cyan-500',
    fields: [
      { name: 'type', label: 'Email Type', type: 'select', options: ['Welcome', 'Newsletter', 'Promotional', 'Transactional', 'Follow-up', 'Cold Outreach'], required: true },
      { name: 'brand', label: 'Brand/Company Name', type: 'text', placeholder: 'Your Company', required: true },
      { name: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'What is this email about?', required: true },
      { name: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Friendly', 'Urgent', 'Casual', 'Formal'] },
      { name: 'cta', label: 'Call to Action', type: 'text', placeholder: 'Shop Now, Learn More, Sign Up' }
    ]
  },
  {
    id: 'resume',
    name: 'Resume/CV',
    description: 'ATS-friendly resumes and cover letters',
    icon: '📄',
    color: 'from-emerald-500 to-teal-500',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'title', label: 'Job Title', type: 'text', placeholder: 'Software Engineer', required: true },
      { name: 'experience', label: 'Years of Experience', type: 'number', required: true },
      { name: 'skills', label: 'Key Skills', type: 'textarea', placeholder: 'JavaScript, React, Node.js...', required: true },
      { name: 'education', label: 'Education', type: 'textarea', placeholder: 'BS Computer Science, MIT 2020' },
      { name: 'achievements', label: 'Key Achievements', type: 'textarea', placeholder: 'Increased sales by 50%, Led team of 10...' },
      { name: 'style', label: 'Resume Style', type: 'select', options: ['Modern', 'Professional', 'Creative', 'Minimal', 'Executive'] }
    ]
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Professional invoices with payment details',
    icon: '💰',
    color: 'from-yellow-500 to-orange-500',
    fields: [
      { name: 'businessName', label: 'Business Name', type: 'text', required: true },
      { name: 'clientName', label: 'Client Name', type: 'text', required: true },
      { name: 'services', label: 'Services/Items', type: 'textarea', placeholder: 'Web Design - $500\nSEO Optimization - $300', required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'INR', 'EUR', 'GBP'], required: true },
      { name: 'dueDays', label: 'Payment Due (days)', type: 'number', placeholder: '30' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Thank you for your business!' }
    ]
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Business reports, analytics, and project summaries',
    icon: '📊',
    color: 'from-violet-500 to-purple-500',
    fields: [
      { name: 'title', label: 'Report Title', type: 'text', required: true },
      { name: 'type', label: 'Report Type', type: 'select', options: ['Weekly Summary', 'Monthly Report', 'Project Update', 'Analytics', 'Financial', 'Custom'], required: true },
      { name: 'data', label: 'Key Data/Metrics', type: 'textarea', placeholder: 'Revenue: $10,000\nUsers: 500\nGrowth: 15%', required: true },
      { name: 'period', label: 'Time Period', type: 'text', placeholder: 'January 2024' },
      { name: 'audience', label: 'Audience', type: 'select', options: ['Team', 'Management', 'Clients', 'Stakeholders'] }
    ]
  },
  {
    id: 'form',
    name: 'Form Builder',
    description: 'Custom forms for surveys, registrations, and feedback',
    icon: '📝',
    color: 'from-pink-500 to-rose-500',
    fields: [
      { name: 'type', label: 'Form Type', type: 'select', options: ['Contact', 'Survey', 'Registration', 'Feedback', 'Application', 'Order', 'Custom'], required: true },
      { name: 'title', label: 'Form Title', type: 'text', required: true },
      { name: 'fields', label: 'Form Fields', type: 'textarea', placeholder: 'Name (text, required)\nEmail (email, required)\nMessage (textarea)', required: true },
      { name: 'style', label: 'Style', type: 'select', options: ['Modern', 'Minimal', 'Colorful', 'Dark', 'Corporate'] },
      { name: 'submitText', label: 'Submit Button Text', type: 'text', placeholder: 'Submit' }
    ]
  },
  {
    id: 'chatbot',
    name: 'Chatbot',
    description: 'AI chatbot scripts for customer support',
    icon: '🤖',
    color: 'from-indigo-500 to-blue-500',
    fields: [
      { name: 'purpose', label: 'Chatbot Purpose', type: 'select', options: ['Customer Support', 'Sales', 'FAQ', 'Lead Generation', 'Booking', 'Custom'], required: true },
      { name: 'business', label: 'Business Name', type: 'text', required: true },
      { name: 'products', label: 'Products/Services', type: 'textarea', placeholder: 'List your main products or services', required: true },
      { name: 'faqs', label: 'Common Questions', type: 'textarea', placeholder: 'What are your hours?\nWhere are you located?\nWhat payment do you accept?' },
      { name: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Friendly', 'Casual', 'Technical'] }
    ]
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Interactive quizzes for education and marketing',
    icon: '❓',
    color: 'from-amber-500 to-yellow-500',
    fields: [
      { name: 'topic', label: 'Quiz Topic', type: 'text', required: true },
      { name: 'type', label: 'Quiz Type', type: 'select', options: ['Multiple Choice', 'True/False', 'Mixed', 'Personality', 'Knowledge Assessment'], required: true },
      { name: 'questions', label: 'Number of Questions', type: 'number', placeholder: '10' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard', 'Mixed'] },
      { name: 'purpose', label: 'Purpose', type: 'select', options: ['Education', 'Lead Generation', 'Fun', 'Assessment', 'Training'] }
    ]
  },
  {
    id: 'logo',
    name: 'Logo/Brand',
    description: 'Logo concepts and brand identity guidelines',
    icon: '🎨',
    color: 'from-fuchsia-500 to-pink-500',
    fields: [
      { name: 'brand', label: 'Brand Name', type: 'text', required: true },
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Technology, Fashion, Food...', required: true },
      { name: 'values', label: 'Brand Values', type: 'textarea', placeholder: 'Innovation, Trust, Quality...' },
      { name: 'style', label: 'Style', type: 'select', options: ['Modern', 'Classic', 'Playful', 'Luxury', 'Minimal', 'Bold'], required: true },
      { name: 'colors', label: 'Preferred Colors', type: 'text', placeholder: 'Blue, White, or leave empty for AI suggestion' }
    ]
  }
];

export function GeneratorHub() {
  const [selectedGenerator, setSelectedGenerator] = useState<Generator | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{ generator: string; content: string; date: string }[]>([]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const generate = async () => {
    if (!selectedGenerator) return;
    
    // Validate required fields
    const missingFields = selectedGenerator.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      alert(`Please fill in required fields:\n${missingFields.join(', ')}`);
      return;
    }
    
    setIsGenerating(true);
    try {
      const prompt = buildPrompt(selectedGenerator, formData);
      
      const response = await api.ai.chat({
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: getSystemPrompt(selectedGenerator.id)
      });

      setGeneratedContent(response.content);
      setHistory([...history, {
        generator: selectedGenerator.name,
        content: response.content,
        date: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPrompt = (generator: Generator, data: Record<string, any>): string => {
    const fieldValues = generator.fields
      .map(f => `${f.label}: ${data[f.name] || 'Not provided'}`)
      .join('\n');

    return `Generate a ${generator.name} based on the following details:\n\n${fieldValues}\n\nMake it professional, well-formatted, and ready to use.`;
  };

  const getSystemPrompt = (type: GeneratorType): string => {
    const prompts: Record<GeneratorType, string> = {
      email: 'You are an expert email copywriter. Create professional, engaging email templates with proper formatting, subject lines, and clear calls to action.',
      resume: 'You are a professional resume writer and career coach. Create ATS-optimized resumes with strong action verbs, quantified achievements, and proper formatting.',
      invoice: 'You are an accounting professional. Create clean, professional invoices with clear line items, payment terms, and legal compliance.',
      report: 'You are a business analyst. Create clear, data-driven reports with executive summaries, key findings, and actionable recommendations.',
      form: 'You are a UX designer specializing in forms. Create user-friendly forms with clear labels, validation rules, and optimal field order.',
      chatbot: 'You are a conversational AI designer. Create natural, helpful chatbot scripts with personality, error handling, and escalation paths.',
      quiz: 'You are an educational content creator. Create engaging, accurate quiz questions with clear answers and explanations.',
      logo: 'You are a brand strategist and designer. Create detailed logo concepts with color psychology, typography recommendations, and brand guidelines.'
    };
    return prompts[type];
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadContent = (format: 'txt' | 'html') => {
    const blob = new Blob([generatedContent], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedGenerator?.name.toLowerCase().replace(/\s+/g, '-') || 'generated'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Generator Hub</h2>
        <p className="text-zinc-400">Create professional content with AI - emails, resumes, invoices, and more</p>
      </div>

      {/* Generator Grid */}
      {!selectedGenerator && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GENERATORS.map((gen) => (
            <button
              key={gen.id}
              onClick={() => setSelectedGenerator(gen)}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-left hover:border-zinc-700 transition-all hover:scale-[1.02] group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gen.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                {gen.icon}
              </div>
              <h3 className="font-semibold mb-1">{gen.name}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2">{gen.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Generator Form */}
      {selectedGenerator && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedGenerator(null); setFormData({}); setGeneratedContent(''); }}
                  className="text-zinc-400 hover:text-white"
                >
                  ← Back
                </button>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedGenerator.color} flex items-center justify-center text-xl`}>
                  {selectedGenerator.icon}
                </div>
                <h3 className="font-semibold">{selectedGenerator.name}</h3>
              </div>
            </div>

            <div className="space-y-4">
              {selectedGenerator.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm text-zinc-400 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {field.type === 'text' || field.type === 'number' ? (
                    <input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}

              <button
                onClick={generate}
                disabled={isGenerating}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 mt-6"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate {selectedGenerator.name}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Generated Output</h3>
              {generatedContent && (
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={() => downloadContent('txt')}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                  >
                    📥 TXT
                  </button>
                  <button
                    onClick={() => downloadContent('html')}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                  >
                    🌐 HTML
                  </button>
                </div>
              )}
            </div>

            {generatedContent ? (
              <div className="bg-zinc-800/50 rounded-lg p-4 min-h-[400px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContent}</pre>
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-lg p-4 min-h-[400px] flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <p className="text-4xl mb-2">{selectedGenerator.icon}</p>
                  <p>Fill in the form and click Generate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !selectedGenerator && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Generations</h3>
          <div className="space-y-2">
            {history.slice(-5).reverse().map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <p className="font-medium">{item.generator}</p>
                  <p className="text-xs text-zinc-400">{new Date(item.date).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setGeneratedContent(item.content)}
                  className="text-violet-400 hover:text-violet-300 text-sm"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
