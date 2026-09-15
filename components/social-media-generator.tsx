'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface SocialPost {
  id: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  content: string;
  hashtags: string[];
  scheduled_for?: string;
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
}

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', maxLength: 280 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', maxLength: 3000 },
  { id: 'instagram', name: 'Instagram', icon: '📸', maxLength: 2200 },
  { id: 'facebook', name: 'Facebook', icon: '👤', maxLength: 63206 }
];

export function SocialMediaGenerator() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('twitter');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'humorous' | 'inspirational'>('professional');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePost = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    try {
      const platform = PLATFORMS.find(p => p.id === selectedPlatform);
      const prompt = `Create a ${platform?.name} post about "${topic}" with a ${tone} tone. 
        Max ${platform?.maxLength} characters. 
        Include relevant hashtags.
        Return JSON: { "content": "post text", "hashtags": ["tag1", "tag2"] }`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a social media content expert. Create engaging posts optimized for each platform.'
      });

      try {
        const parsed = JSON.parse(response.response);
        setGeneratedContent(parsed.content);
      } catch {
        setGeneratedContent(response.response);
      }
    } catch (error) {
      console.error('Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePost = async (status: 'draft' | 'scheduled') => {
    try {
      const newPost = {
        platform: selectedPlatform,
        content: generatedContent,
        hashtags: [],
        status,
        scheduled_for: status === 'scheduled' ? new Date(Date.now() + 3600000).toISOString() : undefined
      };
      await api.social.createPost(newPost);
      setShowCreate(false);
      setGeneratedContent('');
      setTopic('');
    } catch (error) {
      console.error('Failed to save post');
    }
  };

  const getCharacterCount = () => {
    const platform = PLATFORMS.find(p => p.id === selectedPlatform);
    return {
      current: generatedContent.length,
      max: platform?.maxLength || 280,
      percentage: (generatedContent.length / (platform?.maxLength || 280)) * 100
    };
  };

  const charCount = getCharacterCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Social Media</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg"
        >
          ✨ Generate Post
        </button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-5xl mb-4">📱</p>
          <p className="text-zinc-400 mb-2">No posts yet</p>
          <p className="text-sm text-zinc-500">Generate your first social media post with AI</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">
                  {PLATFORMS.find(p => p.id === post.platform)?.icon}
                </span>
                <span className="text-sm text-zinc-400 capitalize">{post.platform}</span>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs ${
                  post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                  post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {post.status}
                </span>
              </div>
              <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-violet-400 text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Generate Social Post</h2>
                <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              {/* Platform Selection */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Platform</label>
                <div className="flex gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        selectedPlatform === platform.id
                          ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <span>{platform.icon}</span>
                      <span className="text-sm">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1">Topic / Idea</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What do you want to post about? e.g., 'My new project launch' or 'Tips for productivity'"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 h-24 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              {/* Tone */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Tone</label>
                <div className="flex gap-2">
                  {['professional', 'casual', 'humorous', 'inspirational'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t as any)}
                      className={`px-4 py-2 rounded-lg border capitalize transition-colors ${
                        tone === t
                          ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePost}
                disabled={!topic.trim() || isGenerating}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium mb-4"
              >
                {isGenerating ? '⏳ Generating...' : '✨ Generate Post'}
              </button>

              {/* Generated Content */}
              {generatedContent && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-zinc-400">Generated Content</label>
                      <span className={`text-xs ${
                        charCount.percentage > 100 ? 'text-red-400' :
                        charCount.percentage > 80 ? 'text-yellow-400' : 'text-zinc-400'
                      }`}>
                        {charCount.current}/{charCount.max}
                      </span>
                    </div>
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 h-32 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => savePost('draft')}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => savePost('scheduled')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
                    >
                      Schedule for Later
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
