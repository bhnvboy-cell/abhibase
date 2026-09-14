# AbhiBase

> **Your life, one base.** AI-powered productivity platform with website builder, app generator, and 46+ features.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🔐 Security Notice

**NEVER commit API keys, passwords, or secrets to GitHub!**

| File | Status | Contains |
|------|--------|----------|
| `.env.local` | ✅ SAFE (in .gitignore) | API keys, passwords |
| `.env.example` | ✅ SAFE (no real values) | Template only |
| `database.sql` | ✅ SAFE | Schema only |

**After cloning, users must create their own `.env.local` with their own keys.**

---

## 🚀 What is AbhiBase?

AbhiBase is a **free, open-source** productivity platform that combines:
- **Project management** (tasks, notes, habits, projects)
- **AI-powered builders** (apps, websites, generators)
- **Business tools** (invoices, expenses, meetings)
- **Enterprise security** (2FA, audit logs, sessions)

**100% free. Self-hosted. No limits.**

---

## ✨ Features

### 📋 Productivity Suite
| Feature | Description |
|---------|-------------|
| 📝 Notes | AI-powered notes with summarization |
| ✅ Tasks | Kanban boards with drag-and-drop |
| 🔥 Habits | Weekly targets, streaks, tracking |
| 📅 Planner | Calendar with events |
| 📁 Projects | Team collaboration with comments |
| 💰 Expenses | Split bills, settlements |
| 📹 Meetings | Notes with AI summary & action items |

### 🤖 AI Builders
| Builder | Description |
|---------|-------------|
| 🏗️ App Builder | Generate database apps from natural language |
| 🌐 Website Builder | Create websites with 8 templates |
| 📧 Email Templates | Professional email generator |
| 📄 Resume/CV | ATS-friendly resume builder |
| 💰 Invoices | Professional invoice generator |
| 📊 Reports | Business report generator |
| 📝 Forms | Custom form builder |
| 🤖 Chatbots | Customer support chatbot scripts |
| ❓ Quizzes | Interactive quiz generator |
| 🎨 Logos | Brand identity generator |

### 🧠 Intelligence
- 📈 Analytics dashboard with charts
- ⚡ Automations (triggers & actions)
- 🎨 Template gallery (8+ templates)
- 🔗 Integrations (Slack, Discord, Telegram)
- 🌿 Branches (data snapshots)

### 🔒 Security
- 🔐 Two-factor authentication (2FA)
- 📋 Audit logs
- 💻 Session management
- 🔑 API key management

### 📱 Platform
- 📱 PWA (install on any device)
- 📴 Offline support
- 🌍 Self-hosted
- 🔓 Open source
- 💯 100% free

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Backend | Node.js, PostgreSQL |
| Auth | JWT (custom) |
| AI | Groq, Mistral, Gemini, Local fallback |
| Database | PostgreSQL 18 |
| PWA | Service Worker, Web Manifest |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/abhibase.git
cd abhibase
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE abhibase;"

# Run migrations
psql -U postgres -d abhibase -f database.sql
psql -U postgres -d abhibase -f migrations/003_add_enterprise_features.sql
psql -U postgres -d abhibase -f migrations/004_add_generated_apps.sql
psql -U postgres -d abhibase -f migrations/005_add_websites.sql
```

### 4. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/abhibase
AUTH_SECRET=your-random-secret-here

# AI Keys (get free keys - no credit card needed!)
GEMINI_API_KEY=your-gemini-key
```

> ⚠️ **IMPORTANT: Never commit API keys to GitHub!**
> `.env.local` is in `.gitignore` and won't be uploaded.

### 5. Get Free API Keys (Optional but Recommended)

| Provider | How to Get | Free Tier |
|----------|------------|-----------|
| **Gemini** | [aistudio.google.com](https://aistudio.google.com) | 15 RPM, 1M tokens/day |
| **Groq** | [console.groq.com](https://console.groq.com) | 30 RPM, 14,400 req/day |
| **Mistral** | [console.mistral.ai](https://console.mistral.ai) | 1 RPM, 500K tokens/month |

**Gemini Setup (Recommended):**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Copy the key
4. Add to `.env.local`: `GEMINI_API_KEY=your-key-here`

### 6. Start development server
```bash
npm run dev
```

### 7. Open in browser
```
http://localhost:3000
```

---

## 🔑 Default Login

| Field | Value |
|-------|-------|
| Email | admin@abhibase.com |
| Password | admin123 |

---

## 📁 Project Structure

```
abhibase/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication
│   │   ├── notes/             # Notes CRUD
│   │   ├── tasks/             # Tasks CRUD
│   │   ├── habits/            # Habits CRUD
│   │   ├── projects/          # Projects CRUD
│   │   ├── expenses/          # Expenses CRUD
│   │   ├── meetings/          # Meetings CRUD
│   │   ├── payments/          # Invoices CRUD
│   │   ├── social/            # Social posts CRUD
│   │   ├── websites/          # Websites CRUD
│   │   ├── apps/              # Generated apps
│   │   ├── ai/                # AI chat, summarize
│   │   ├── analytics/         # Analytics data
│   │   ├── automations/       # Automations CRUD
│   │   ├── templates/         # Templates CRUD
│   │   ├── integrations/      # Integrations CRUD
│   │   ├── branches/          # Branches CRUD
│   │   ├── security/          # 2FA, audit logs, sessions
│   │   ├── settings/          # Notification prefs, API keys
│   │   └── uploads/           # File uploads
│   ├── dashboard/             # Dashboard pages
│   │   ├── notes/
│   │   ├── tasks/
│   │   ├── habits/
│   │   ├── planner/
│   │   ├── projects/
│   │   ├── expenses/
│   │   ├── meetings/
│   │   ├── analytics/
│   │   ├── automations/
│   │   ├── templates/
│   │   ├── templates-gallery/
│   │   ├── integrations/
│   │   ├── branches/
│   │   ├── payments/
│   │   ├── social/
│   │   ├── generators/        # Generator Hub
│   │   ├── app-builder/       # AI App Builder
│   │   ├── website-builder/   # Website Generator
│   │   ├── settings/
│   │   └── security/
│   ├── websites/[slug]/       # Published websites
│   └── layout.tsx
├── components/
│   ├── ui/                    # UI components
│   ├── sidebar.tsx
│   ├── ai-chat.tsx
│   ├── file-upload.tsx
│   ├── payment-tracker.tsx
│   ├── meeting-notes.tsx
│   ├── social-media-generator.tsx
│   ├── security-settings.tsx
│   ├── generator-hub.tsx
│   ├── app-builder.tsx
│   ├── website-generator.tsx
│   └── app-templates-gallery.tsx
├── lib/
│   ├── api.ts                 # API client
│   ├── types.ts               # TypeScript types
│   ├── db.ts                  # Database pool
│   ├── email.ts               # Email utility
│   └── store.ts               # State management
├── migrations/                # Database migrations
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── offline.html           # Offline page
└── package.json
```

---

## 🎯 Usage

### Dashboard
Access the main dashboard at `/dashboard` to see:
- Recent notes and tasks
- Habit streaks
- Upcoming events
- Quick actions

### AI Chat
Click the floating chat button (bottom-right) to:
- Ask questions
- Summarize content
- Generate ideas
- Get help

### Website Builder
1. Go to **Intelligence → Website Builder**
2. Choose a template or describe your site
3. AI generates complete HTML/CSS/JS
4. Preview, edit, and publish
5. Get live URL: `your-site.abhibase.app`

### App Builder
1. Go to **Intelligence → App Builder**
2. Describe your app in natural language
3. AI generates database schema, API routes, UI
4. Install with one click

### Generator Hub
1. Go to **Intelligence → Generator Hub**
2. Choose a generator (Email, Resume, Invoice, etc.)
3. Fill in the details
4. AI generates professional content
5. Copy, download, or use directly

---

## 🔧 API Reference

### Authentication
```typescript
api.auth.me()           // Get current user
api.auth.signUp()       // Create account
api.auth.signIn()       // Login
api.auth.signOut()      // Logout
```

### Notes
```typescript
api.notes.list()        // Get all notes
api.notes.create()      // Create note
api.notes.update()      // Update note
api.notes.remove()      // Delete note
```

### Tasks
```typescript
api.tasks.list()        // Get all tasks
api.tasks.create()      // Create task
api.tasks.update()      // Update task
api.tasks.remove()      // Delete task
```

### Websites
```typescript
api.websites.list()     // Get all websites
api.websites.create()   // Create website
api.websites.update()   // Update website
api.websites.delete()   // Delete website
```

### AI
```typescript
api.ai.chat()           // Chat with AI
api.ai.summarize()      // Summarize content
api.ai.generateContent() // Generate content
```

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted
```bash
# Build
npm run build

# Start
npm start
```

---

## 🤝 Contributing

1. Fork the repo
2. Create branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👥 Contributors

| | Name | Role |
|---|------|------|
| 👨‍💻 | **M.P.ABHINAV** | Lead Developer |
| 👨‍💻 | **M.P.ABHIRAM** | Backend Developer |
| 👨‍💻 | **M.P.SAMVED** | Frontend Developer |

---

## 🙏 Support

- ⭐ Star this repo
- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve docs

---

## 🔗 Links

- **Live Demo**: [abhibase.app](https://abhibase.app)
- **Documentation**: [docs.abhibase.app](https://docs.abhibase.app)
- **GitHub**: [github.com/MP-Abhinav/abhibase](https://github.com/MP-Abhinav/abhibase)

---

## 📊 Stats

![](https://img.shields.io/github/stars/MP-Abhinav/abhibase?style=social)
![](https://img.shields.io/github/forks/MP-Abhinav/abhibase?style=social)
![](https://img.shields.io/github/issues/MP-Abhinav/abhibase)
![](https://img.shields.io/github/license/MP-Abhinav/abhibase)

---

**Built with ❤️ by M.P.ABHINAV, M.P.ABHIRAM & M.P.SAMVED**
