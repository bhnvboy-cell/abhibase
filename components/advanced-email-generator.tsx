'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface EmailData {
  type: string;
  brand: string;
  purpose: string;
  tone: string;
  cta: string;
  subject: string;
  preheader: string;
  senderName: string;
  senderEmail: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  variations: number;
}

interface GeneratedEmail {
  subject: string;
  preheader: string;
  body: string;
  html: string;
}

const EMAIL_TEMPLATES: Record<string, string> = {
  Welcome: 'Welcome to {{brand}}! We\'re thrilled to have you on board.',
  Newsletter: 'Here\'s what\'s new at {{brand}} this week.',
  Promotional: 'Special offer just for you from {{brand}}!',
  Transactional: 'Your order confirmation from {{brand}}',
  'Follow-up': 'Following up on our conversation',
  'Cold Outreach': 'Quick question about your {{brand}} goals',
};

export default function AdvancedEmailGenerator() {
  const [email, setEmail] = useState<EmailData>({
    type: 'Welcome',
    brand: '',
    purpose: '',
    tone: 'Professional',
    cta: 'Get Started',
    subject: '',
    preheader: '',
    senderName: '',
    senderEmail: '',
    logo: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    fontFamily: 'Arial, sans-serif',
    variations: 1,
  });

  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [showHtml, setShowHtml] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateEmail = async () => {
    if (!email.brand || !email.purpose) {
      alert('Please fill in Brand Name and Purpose');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a professional ${email.type} email template for "${email.brand}".

Purpose: ${email.purpose}
Tone: ${email.tone}
Call to Action: ${email.cta}

Create ${email.variations} variation(s) of this email. For each variation, provide:
1. A compelling subject line
2. Preheader text (40-90 characters)
3. The email body in HTML format with inline CSS

Requirements:
- Use ${email.primaryColor} as primary color
- Use ${email.secondaryColor} as secondary color
- Font family: ${email.fontFamily}
- Include a header with logo placeholder
- Include a clear CTA button with text "${email.cta}"
- Include a footer with unsubscribe link
- Make it responsive for mobile devices
- Use professional, clean design

Return JSON format:
{
  "variations": [
    {
      "subject": "Subject line",
      "preheader": "Preheader text",
      "body": "Plain text version",
      "html": "<html>Full HTML email</html>"
    }
  ]
}`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are an expert email marketer and HTML designer. Create beautiful, conversion-optimized email templates with clean HTML and inline CSS.'
      });

      try {
        const parsed = JSON.parse(response.response);
        setGeneratedEmails(parsed.variations || [parsed]);
      } catch {
        setGeneratedEmails([{
          subject: `${email.brand} - ${email.type}`,
          preheader: email.purpose.slice(0, 90),
          body: response.response,
          html: generateFallbackHtml(email, response.response)
        }]);
      }
    } catch (error) {
      console.error('Failed to generate email:', error);
      alert('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackHtml = (data: EmailData, content: string): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:${data.fontFamily}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden">
          <tr>
            <td style="background-color:${data.primaryColor};padding:30px;text-align:center">
              ${data.logo ? `<img src="${data.logo}" alt="${data.brand}" style="max-height:40px">` : ''}
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:24px">${data.brand}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px">
              <h2 style="color:#333;margin:0 0 20px">${data.type}</h2>
              <p style="color:#666;line-height:1.6;margin:0 0 20px">${content}</p>
              <a href="#" style="display:inline-block;background-color:${data.primaryColor};color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold">${data.cta}</a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8f9fa;padding:20px;text-align:center">
              <p style="color:#999;font-size:12px;margin:0">
                © ${new Date().getFullYear()} ${data.brand}. All rights reserved.<br>
                <a href="#" style="color:${data.primaryColor}">Unsubscribe</a> | <a href="#" style="color:${data.primaryColor}">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const current = generatedEmails[selectedVariation];
    if (!current) return;
    const blob = new Blob([current.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${email.brand.toLowerCase().replace(/\s+/g, '-')}-${email.type.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEmail(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const currentEmail = generatedEmails[selectedVariation];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advanced Email Generator</h2>
        <p className="text-zinc-400">Create professional email templates with HTML preview and multiple variations</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">📧 Email Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email Type *</label>
                <select
                  value={email.type}
                  onChange={(e) => setEmail(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                >
                  {['Welcome', 'Newsletter', 'Promotional', 'Transactional', 'Follow-up', 'Cold Outreach'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={email.brand}
                  onChange={(e) => setEmail(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Your Company"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Purpose *</label>
                <textarea
                  value={email.purpose}
                  onChange={(e) => setEmail(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="What is this email about?"
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={email.cta}
                  onChange={(e) => setEmail(prev => ({ ...prev, cta: e.target.value }))}
                  placeholder="Get Started"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={email.senderName}
                  onChange={(e) => setEmail(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="John from Company"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">🎨 Design</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={email.primaryColor} onChange={(e) => setEmail(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={email.primaryColor} onChange={(e) => setEmail(prev => ({ ...prev, primaryColor: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={email.secondaryColor} onChange={(e) => setEmail(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={email.secondaryColor} onChange={(e) => setEmail(prev => ({ ...prev, secondaryColor: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Variations</label>
                <select
                  value={email.variations}
                  onChange={(e) => setEmail(prev => ({ ...prev, variations: parseInt(e.target.value) }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
                >
                  {[1, 2, 3].map(n => (
                    <option key={n} value={n}>{n} variation{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={generateEmail}
            disabled={isGenerating}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><span className="animate-spin">⏳</span> Generating...</>
            ) : (
              <><span>✨</span> Generate Email</>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Preview</h3>
                {generatedEmails.length > 1 && (
                  <div className="flex gap-1">
                    {generatedEmails.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariation(i)}
                        className={`px-2 py-1 text-xs rounded ${selectedVariation === i ? 'bg-violet-600' : 'bg-zinc-700'}`}
                      >
                        V{i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {currentEmail && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHtml(!showHtml)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                  >
                    {showHtml ? '👁️ Preview' : '📝 HTML'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(showHtml ? currentEmail.html : currentEmail.body)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button onClick={downloadHtml} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">
                    💾 Download
                  </button>
                </div>
              )}
            </div>

            {currentEmail ? (
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="bg-zinc-100 p-3 border-b text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-zinc-600">Subject:</span>
                    <span>{currentEmail.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-600">Preheader:</span>
                    <span className="text-zinc-500">{currentEmail.preheader}</span>
                  </div>
                </div>
                {showHtml ? (
                  <pre className="p-4 text-xs overflow-auto max-h-[500px] bg-zinc-50">{currentEmail.html}</pre>
                ) : (
                  <iframe
                    srcDoc={currentEmail.html}
                    className="w-full h-[500px] border-0"
                    title="Email Preview"
                  />
                )}
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-lg p-8 min-h-[400px] flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <p className="text-6xl mb-4">📧</p>
                  <p className="text-lg">Fill in the form and click Generate</p>
                  <p className="text-sm mt-2">Create beautiful email templates in seconds</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
