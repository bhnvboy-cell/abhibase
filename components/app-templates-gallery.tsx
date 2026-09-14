'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  items: TemplateItem[];
  installs: number;
  rating: number;
}

interface TemplateItem {
  type: 'task' | 'note' | 'project' | 'habit';
  title: string;
  description?: string;
  priority?: string;
  frequency?: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📦' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'project-management', name: 'Project Management', icon: '📊' },
  { id: 'content', name: 'Content Creation', icon: '✍️' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'health', name: 'Health & Fitness', icon: '💪' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'business', name: 'Business', icon: '🏢' }
];

const PRESET_TEMPLATES: AppTemplate[] = [
  {
    id: 'freelancer',
    name: 'Freelancer Dashboard',
    description: 'Manage clients, projects, invoices and time tracking',
    category: 'business',
    icon: '💼',
    color: 'from-blue-500 to-cyan-500',
    items: [
      { type: 'project', title: 'Client Projects', description: 'Track all client work' },
      { type: 'task', title: 'Follow up with {{client}}', priority: 'high' },
      { type: 'note', title: 'Meeting notes template', description: 'Standard meeting format' },
      { type: 'habit', title: 'Log daily hours', frequency: 'daily' }
    ],
    installs: 1250,
    rating: 4.8
  },
  {
    id: 'content-creator',
    name: 'Content Creator Kit',
    description: 'Plan, create and schedule content across platforms',
    category: 'content',
    icon: '🎬',
    color: 'from-pink-500 to-rose-500',
    items: [
      { type: 'project', title: 'YouTube Videos', description: 'Video production pipeline' },
      { type: 'task', title: 'Research trending topics', priority: 'medium' },
      { type: 'note', title: 'Video script template', description: 'Hook, Content, CTA format' },
      { type: 'habit', title: 'Post daily stories', frequency: 'daily' }
    ],
    installs: 890,
    rating: 4.7
  },
  {
    id: 'student',
    name: 'Student Success Kit',
    description: 'Organize classes, assignments, study sessions and exams',
    category: 'learning',
    icon: '🎓',
    color: 'from-violet-500 to-purple-500',
    items: [
      { type: 'project', title: 'Current Semester', description: 'All courses and assignments' },
      { type: 'task', title: 'Complete assignment for {{subject}}', priority: 'high' },
      { type: 'note', title: 'Lecture notes template', description: 'Cornell notes method' },
      { type: 'habit', title: 'Study 2 hours daily', frequency: 'daily' }
    ],
    installs: 2100,
    rating: 4.9
  },
  {
    id: 'startup',
    name: 'Startup Launchpad',
    description: 'From idea to launch - MVP, tasks, metrics and growth',
    category: 'project-management',
    icon: '🚀',
    color: 'from-orange-500 to-amber-500',
    items: [
      { type: 'project', title: 'MVP Development', description: 'Minimum viable product' },
      { type: 'task', title: 'Define core features', priority: 'urgent' },
      { type: 'note', title: 'Business model canvas', description: 'Lean canvas format' },
      { type: 'habit', title: 'Daily standup', frequency: 'daily' }
    ],
    installs: 750,
    rating: 4.6
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    description: 'Workouts, nutrition, body metrics and progress photos',
    category: 'health',
    icon: '💪',
    color: 'from-emerald-500 to-teal-500',
    items: [
      { type: 'project', title: 'Fitness Goals', description: '12-week transformation' },
      { type: 'task', title: 'Leg day workout', priority: 'medium' },
      { type: 'note', title: 'Workout log template', description: 'Sets, reps, weights' },
      { type: 'habit', title: 'Morning workout', frequency: 'daily' }
    ],
    installs: 1500,
    rating: 4.8
  },
  {
    id: 'writer',
    name: 'Writer\'s Workshop',
    description: 'Book planning, chapters, character profiles and outlines',
    category: 'content',
    icon: '✍️',
    color: 'from-indigo-500 to-blue-500',
    items: [
      { type: 'project', title: 'Book Project', description: 'Novel writing pipeline' },
      { type: 'task', title: 'Write chapter {{number}}', priority: 'high' },
      { type: 'note', title: 'Character profile template', description: 'Background, motivation, arc' },
      { type: 'habit', title: 'Write 1000 words', frequency: 'daily' }
    ],
    installs: 650,
    rating: 4.7
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance',
    description: 'Budget tracking, expenses, savings goals and investments',
    category: 'finance',
    icon: '💰',
    color: 'from-yellow-500 to-orange-500',
    items: [
      { type: 'project', title: 'Financial Goals', description: 'Savings and investments' },
      { type: 'task', title: 'Review monthly budget', priority: 'medium' },
      { type: 'note', title: 'Expense tracker template', description: 'Category, amount, date' },
      { type: 'habit', title: 'Log daily expenses', frequency: 'daily' }
    ],
    installs: 1800,
    rating: 4.9
  },
  {
    id: 'event-planner',
    name: 'Event Planner',
    description: 'Plan events, track vendors, manage guests and budgets',
    category: 'project-management',
    icon: '🎉',
    color: 'from-fuchsia-500 to-pink-500',
    items: [
      { type: 'project', title: 'Event Planning', description: 'Wedding / Conference / Party' },
      { type: 'task', title: 'Book venue', priority: 'urgent' },
      { type: 'note', title: 'Vendor comparison sheet', description: 'Price, quality, reviews' },
      { type: 'habit', title: 'Follow up with vendors', frequency: 'weekly' }
    ],
    installs: 420,
    rating: 4.5
  }
];

export function AppTemplatesGallery() {
  const [templates, setTemplates] = useState<AppTemplate[]>(PRESET_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const installTemplate = async (template: AppTemplate) => {
    setIsInstalling(true);
    try {
      // Create projects, tasks, notes, habits from template
      for (const item of template.items) {
        switch (item.type) {
          case 'project':
            await api.projects.create({
              name: item.title,
              description: item.description || '',
              color: 'violet'
            });
            break;
          case 'task':
            await api.tasks.create({
              title: item.title,
              priority: item.priority || 'medium',
              due_date: null
            });
            break;
          case 'note':
            await api.notes.create({
              title: item.title,
              content: item.description || '',
              tags: []
            });
            break;
          case 'habit':
            await api.habits.create({
              name: item.title,
              icon: '🔄',
              color: 'violet',
              target_per_week: item.frequency === 'daily' ? 7 : 1
            });
            break;
        }
      }
      
      alert(`✅ "${template.name}" installed successfully!`);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to install template');
      alert('Failed to install template');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Template Gallery</h2>
        <p className="text-zinc-400">Pre-built templates to get started quickly</p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {template.icon}
            </div>
            <h3 className="font-semibold mb-1">{template.name}</h3>
            <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{template.description}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-zinc-400">
                <span>⭐</span>
                <span>{template.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <span>📥</span>
                <span>{template.installs.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <span>{template.items.length} items</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center text-2xl`}>
                    {selectedTemplate.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
                    <p className="text-sm text-zinc-400">{selectedTemplate.category}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTemplate(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <p className="text-zinc-300 mb-6">{selectedTemplate.description}</p>

              <div className="mb-6">
                <h4 className="text-sm text-zinc-400 mb-3">What's included:</h4>
                <div className="space-y-2">
                  {selectedTemplate.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-lg">
                        {item.type === 'project' ? '📁' :
                         item.type === 'task' ? '✅' :
                         item.type === 'note' ? '📝' : '🔄'}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-zinc-400">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => installTemplate(selectedTemplate)}
                disabled={isInstalling}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-3 rounded-lg font-medium"
              >
                {isInstalling ? '⏳ Installing...' : '📥 Install Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
