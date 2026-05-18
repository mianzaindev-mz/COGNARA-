# COGNARA™

**Where knowledge finds its place.**

AI-native EdTech platform built with **Next.js 15**, **Supabase**, and **Groq AI** — designed for UMT PP Assignments #3 and #4. Three portals (Student, Coach, Admin), SDG 4 alignment, and a tool-using agent architecture.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Agent** | Groq-powered tutor (llama-3.3-70b) with skill routing: teach, debug, quiz, voice |
| **Code Lab** | In-browser editor with real execution via JDoodle (200 free runs/day, 18+ languages) |
| **Voice Mode** | Native speech-to-text & text-to-speech — zero external dependencies |
| **Three Portals** | Student dashboard, Coach portal, Admin panel — role-based access, all wired to Supabase |
| **Custom SVG Logo** | Book + neural sparkle mark with `icon`, `full`, `tagline` variants and `onDark` mode |
| **Working Search** | Real-time course search via Supabase `ilike` filtering |
| **Page Transitions** | Smooth fade+slide animations, staggered card grids, 3D tilt cards |
| **Credit System** | AI usage tracked with daily free credits and per-action costs |
| **Certificates** | Earned from completed courses with verifiable codes and LinkedIn sharing |
| **Notebooks** | Rich text editor with code blocks, headings, highlights |
| **Dark/Light Theme** | Full theme support across every component and page |
| **Security** | Rate limiting, XSS protection, HSTS, RLS on 30+ database tables |

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/COGNARA.git
cd COGNARA
npm install
```

### 2. Set up Supabase

1. Create a [Supabase](https://supabase.com) project
2. Run `docs/supabase/schema_bundle.sql` in the SQL Editor
3. Run `docs/supabase/demo_seed.sql` to seed demo courses
4. Configure Auth → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/api/auth/callback`
5. Disable "Confirm email" in Auth → Settings for local dev

### 3. Configure environment

Copy `.env.example` → `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
GROQ_API_KEY=your-groq-api-key
JDOODLE_CLIENT_ID=your-jdoodle-client-id
JDOODLE_CLIENT_SECRET=your-jdoodle-client-secret
```

| Service | Where to get keys |
|---------|-------------------|
| Supabase | [supabase.com](https://supabase.com) → Project Settings → API |
| Groq | [console.groq.com](https://console.groq.com) → API Keys (free tier) |
| JDoodle | [jdoodle.com](https://www.jdoodle.com) → API → Client Credentials (free: 200/day) |

### 4. Run

```bash
npm run dev
```

Open **http://localhost:3000** — register, explore the dashboard, run code, chat with the AI agent.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, register, password reset
│   ├── (student)/          # Student dashboard, courses, editor, agent
│   ├── (coach)/            # Coach portal with course management
│   ├── (public)/           # Landing page, pricing, about
│   └── api/                # API routes (agent, compiler, auth)
├── components/
│   ├── student/            # Student-specific UI (shell, cards, stats)
│   ├── coach/              # Coach-specific UI (shell, analytics)
│   ├── agent/              # AI chat, voice button, messages
│   ├── shared/             # Sidebar tooltip, search, brand
│   └── ui/                 # Primitives (button, badge, input)
├── lib/
│   ├── ai/                 # Agent orchestration, skill routing
│   ├── compiler/           # Multi-backend code execution
│   ├── security/           # Rate limiter, sanitizer
│   └── supabase/           # Client factories, middleware
└── docs/
    └── supabase/           # Schema bundle, seed data, migrations
```

---

## 🛠 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript strict check |

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) | Supabase setup, auth config, smoke tests |
| [handover.md](./handover.md) | Engineering continuity and session history |

---

## 🔒 Security

- **Authentication:** Supabase Auth with JWT + Row Level Security on all tables
- **Rate Limiting:** Sliding window per IP and per user on all API endpoints
- **Input Sanitization:** XSS stripping, off-platform detection, code size limits
- **Headers:** HSTS, X-Frame-Options DENY, Content-Type nosniff
- **Session:** Server-side verification prevents ID spoofing

---

## 📄 License

Proprietary — see `LICENSE` and `TRADEMARK-NOTICE.md`.
