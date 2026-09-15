'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotData {
  purpose: string;
  business: string;
  products: string;
  faqs: string;
  tone: string;
  greeting: string;
  fallback: string;
  color: string;
}

export default function AdvancedChatbotGenerator() {
  const chatRef = useRef<HTMLDivElement>(null);
  const [chatbot, setChatbot] = useState<ChatbotData>({
    purpose: 'Customer Support',
    business: '',
    products: '',
    faqs: '',
    tone: 'Professional',
    greeting: '',
    fallback: 'I\'m not sure I understand. Can you rephrase that?',
    color: '#6366f1',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'code'>('config');
  const [generatedScript, setGeneratedScript] = useState('');

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const generateScript = async () => {
    if (!chatbot.business || !chatbot.products) {
      alert('Please fill in Business Name and Products/Services');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a chatbot script for ${chatbot.business}.

Purpose: ${chatbot.purpose}
Products/Services: ${chatbot.products}
FAQs: ${chatbot.faqs || 'Not provided'}
Tone: ${chatbot.tone}

Generate a complete chatbot script with:
1. Greeting message
2. Intent detection patterns (at least 5 intents)
3. Responses for each intent
4. Fallback message
5. Quick replies/suggestions

Return JSON:
{
  "greeting": "Hello! Welcome to...",
  "intents": [
    {"pattern": "keywords", "response": "reply", "quickReplies": ["option1", "option2"]}
  ],
  "fallback": "Sorry, I don't understand...",
  "suggestions": ["How can I help?", "Tell me about...", "Contact support"]
}`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a conversational AI designer. Create natural, helpful chatbot scripts with personality.'
      });

      const parsed = JSON.parse(response.response);
      setChatbot(prev => ({
        ...prev,
        greeting: parsed.greeting || prev.greeting,
        fallback: parsed.fallback || prev.fallback,
      }));
      setGeneratedScript(response.response);
      setActiveTab('test');

      // Start conversation with greeting
      setMessages([{
        id: '1',
        role: 'bot',
        content: parsed.greeting || `Hello! Welcome to ${chatbot.business}. How can I help you today?`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to generate:', error);
      setMessages([{
        id: '1',
        role: 'bot',
        content: `Hello! Welcome to ${chatbot.business}. How can I help you today?`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.ai.chat({
        messages: [
          { role: 'user', content: `You are a chatbot for ${chatbot.business}. Products: ${chatbot.products}. FAQs: ${chatbot.faqs}. Tone: ${chatbot.tone}. Respond to: ${input}` }
        ],
        system: 'You are a helpful customer service chatbot. Be concise and friendly.'
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: chatbot.fallback,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateEmbedCode = (): string => {
    return `<!-- ${chatbot.business} Chatbot -->
<div id="chatbot-widget" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
  <button onclick="toggleChat()" style="width:60px;height:60px;border-radius:50%;background:${chatbot.color};border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
  </button>
  <div id="chat-window" style="display:none;position:absolute;bottom:70px;right:0;width:350px;height:450px;background:white;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);overflow:hidden;">
    <div style="background:${chatbot.color};color:white;padding:16px;font-weight:bold;">${chatbot.business} Support</div>
    <div id="chat-messages" style="height:350px;overflow-y:auto;padding:16px;"></div>
    <div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px;">
      <input id="chat-input" type="text" placeholder="Type a message..." style="flex:1;padding:10px;border:1px solid #ddd;border-radius:20px;outline:none;" onkeypress="if(event.key==='Enter')sendChat()">
      <button onclick="sendChat()" style="background:${chatbot.color};color:white;border:none;border-radius:50%;width:40px;cursor:pointer;">→</button>
    </div>
  </div>
</div>
<script>
function toggleChat(){const w=document.getElementById('chat-window');w.style.display=w.style.display==='none'?'block':'none';}
function sendChat(){const i=document.getElementById('chat-input');if(!i.value.trim())return;addMsg('user',i.value);i.value='';setTimeout(()=>addMsg('bot','Thank you for your message. A support agent will be with you shortly.'),1000);}
function addMsg(role,content){const d=document.getElementById('chat-messages');const m=document.createElement('div');m.style.cssText='margin-bottom:12px;display:flex;justify-content:'+(role==='user'?'flex-end':'flex-start');m.innerHTML='<div style="max-width:80%;padding:10px 14px;border-radius:16px;background:'+(role==='user'?'${chatbot.color}':'#f0f0f0')+';color:'+(role==='user'?'white':'#333')+'">'+content+'</div>';d.appendChild(m);d.scrollTop=d.scrollHeight;}
addMsg('bot','${chatbot.greeting || `Hello! Welcome to ${chatbot.business}. How can I help you today?`}');
</script>`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Chatbot Generator</h2>
          <p className="text-zinc-400">Create and test AI chatbots for your business</p>
        </div>
        <div className="flex gap-2">
          {['config', 'test', 'code'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-violet-600' : 'bg-zinc-700'}`}>
              {tab === 'config' ? '⚙️ Configure' : tab === 'test' ? '💬 Test' : '📝 Embed'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'config' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">🤖 Chatbot Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Business Name *</label>
                <input type="text" value={chatbot.business} onChange={(e) => setChatbot(prev => ({ ...prev, business: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Purpose</label>
                <select value={chatbot.purpose} onChange={(e) => setChatbot(prev => ({ ...prev, purpose: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                  {['Customer Support', 'Sales', 'FAQ', 'Lead Generation', 'Booking', 'Custom'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Products/Services *</label>
                <textarea value={chatbot.products} onChange={(e) => setChatbot(prev => ({ ...prev, products: e.target.value }))} rows={3} placeholder="List your main products or services" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Common Questions (FAQs)</label>
                <textarea value={chatbot.faqs} onChange={(e) => setChatbot(prev => ({ ...prev, faqs: e.target.value }))} rows={3} placeholder="What are your hours?&#10;Where are you located?" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Tone</label>
                  <select value={chatbot.tone} onChange={(e) => setChatbot(prev => ({ ...prev, tone: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    {['Professional', 'Friendly', 'Casual', 'Technical'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={chatbot.color} onChange={(e) => setChatbot(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={chatbot.color} onChange={(e) => setChatbot(prev => ({ ...prev, color: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={generateScript} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-2 rounded-lg font-medium">
                {isGenerating ? '⏳ Generating...' : '✨ Generate Chatbot Script'}
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">📋 Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="p-4 text-white font-bold" style={{ backgroundColor: chatbot.color }}>
                {chatbot.business || 'Business Name'} Support
              </div>
              <div className="p-4 space-y-3 h-64 overflow-y-auto">
                <div className="flex">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%] text-sm">
                    {chatbot.greeting || `Hello! Welcome to ${chatbot.business || 'our business'}. How can I help you today?`}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-white rounded-lg px-4 py-2 max-w-[80%] text-sm" style={{ backgroundColor: chatbot.color }}>
                    Hi! I have a question.
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%] text-sm">
                    Of course! I'd be happy to help. What would you like to know?
                  </div>
                </div>
              </div>
              <div className="p-3 border-t flex gap-2">
                <input type="text" placeholder="Type a message..." className="flex-1 border rounded-full px-4 py-2 text-sm" disabled />
                <button className="text-white rounded-full w-10 h-10 flex items-center justify-center" style={{ backgroundColor: chatbot.color }}>→</button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'test' ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 text-white font-bold flex items-center gap-3" style={{ backgroundColor: chatbot.color }}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">🤖</div>
              <div>
                <div>{chatbot.business || 'Business'} Support</div>
                <div className="text-xs font-normal opacity-80">Online</div>
              </div>
            </div>

            <div ref={chatRef} className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'text-white' : 'bg-white shadow-sm'
                  }`} style={msg.role === 'user' ? { backgroundColor: chatbot.color } : {}}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-sm rounded-2xl px-4 py-3 text-sm">
                    <span className="animate-pulse">Typing...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: chatbot.color }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Embed Code</h3>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(generateEmbedCode())} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">📋 Copy Code</button>
            </div>
          </div>
          <pre className="bg-zinc-800 rounded-lg p-4 overflow-auto max-h-[400px] text-sm font-mono text-green-400">
            {generateEmbedCode()}
          </pre>
        </div>
      )}
    </div>
  );
}
