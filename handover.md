# COGNARA™ — Project Handover

**Session:** 7 (white page fix + combined Learnify/EDUBRINK marketing)  
**Date:** 2026-05-15  
**Repository:** `C:\GitHub\COGNARA`

---

## 1. What this session did (Session 7)

### White page fix
- **Cause:** Stale dev server on **port 3000** while a fresh build was on **3002**; missing Tailwind tokens (`text-cn-ink-subtle`) could also make text invisible in edge cases.
- **Fix:** Solid hex tokens in `globals.css`, `app/error.tsx`, restart dev on 3000.
- **Use:** http://localhost:3000 (if port busy, check terminal for the actual port).

### Combined Learnify + EDUBRINK home
- Hero gradient banner, path chips, stats grid, course preview cards, how-it-works, dark CTA.
- Header search pill (Learnify) + cream marketing sections (EDUBRINK).

## 1b. Session 6 recap

### Functional

- **`loadStudentEnrollments`** — joins `enrollments` → `courses` for real progress on dashboard / my-courses.
- **`/my-courses`** — enrolled course cards with Continue → `/learn/[slug]`.
- **Lesson viewer shell** — `/learn/[slug]` (Learnify layout: player area, tabs, curriculum sidebar) and `/learn/[slug]/lesson/[order]`.
- **`docs/supabase/demo_seed.sql`** — sample published courses + lessons (uncomment enrollment block with your user id).
- **Dashboard** — uses live enrollments when present; demo cards only when count is zero.

### UI polish

- **`CourseCard`** shared component with category tints (light + dark).
- Stat cards, filter chips, portal stub, agent blocks → **`cn-*` tokens**.

### Session 5 recap (still valid)

### UI/UX (Learnify reference — light + dark)

- **Design tokens** in `src/app/globals.css`: canvas, surface, ink, orange, yellow, lavender, sidebar, callout gradient — with `.dark` overrides.
- **Theme system**: `ThemeProvider` + `ThemeToggle` (persists to `localStorage`, applies `light` / `dark` on `<html>`).
- **Auth**: split layout — dark brand panel (desktop) + `cn-card` form; works in both themes.
- **Fixed “Social sign-in needs Supabase keys”** → `SupabaseSetupCallout` (gradient card, env chips, setup + dashboard links) — no more harsh dark box on login.
- **OAuth buttons**: full-color Google icon, rounded-2xl controls using tokens.
- **Student shell**: token-based colors + theme toggle in header.
- **Marketing** moved under `(public)/` with shared header/footer.

### Functional (Day 2 from master doc)

- [x] **`(public)` route group**: layout, header, footer.
- [x] **`/courses`** — loads published courses from Supabase when configured; Learnify-style demo cards otherwise.
- [x] **`/pricing`** — tier cards (Stripe noted as later).
- [x] **`/legal/privacy`**, **`/legal/terms`** — placeholder legal copy.
- [x] **`/setup`** — moved into public shell; embeds setup callout + numbered steps.
- [x] **Cookie banner** — consent stored in `localStorage`.
- [x] **Landing `/`** — Learnify palette, links to courses/register.

### Still using demo/placeholder UI

- Dashboard shows **demo** course cards only when the student has **zero** enrollments.
- Video/Mux player, lesson body content, agent tools, editor/Judge0, Stripe.
- Coach/admin full UIs.

---

## 2. Master product prompt — done vs left

*Aligned to COGNARA master build doc (Sections 8, 17, Day 1–3 + Day 2 public).*

### Done (cumulative)

| Area | Status |
|------|--------|
| Next.js 15 App Router, TypeScript, Tailwind | Done |
| Supabase client/server/middleware, env helpers | Done |
| Auth: register, login, forgot/reset password, verify email, OAuth callback | Done |
| Auth: banned route, role in `profiles`, onboarding → `user_settings.onboarding_complete` | Done |
| **Database**: migrations 01–09, RLS + `cognara_is_admin()`, schema bundle, LOCAL_SETUP | Done (user must run SQL on hosted Supabase) |
| **Student portal shell**: sidebar, header, dashboard, stats from DB, agent quick-launch, FAB | Done |
| **Enrollments + lesson viewer shell** (`/learn/[slug]`) | Done (Session 6) |
| **Student route stubs**: my-courses, editor, notebook, agent, quizzes, progress, certificates, peer, billing, settings, profile, support | Scaffolded |
| **Coach / admin** entry + dashboard stubs | Scaffolded |
| **Public**: home, courses browse, pricing, legal, setup, cookie banner | Done (this session) |
| **UI**: Learnify-inspired tokens, light/dark theme, auth split layout | Done (this session) |
| Feature flags module | Done |
| README, handover, trademark/license files | Done |

### Not done (master doc backlog)

| Area | Notes |
|------|--------|
| **Payments** | Stripe checkout, webhooks, subscriptions |
| **Course product** | Coach CRUD, **full** lesson content + video (Mux), progress sync on complete |
| **Code lab** | Monaco + Judge0 execution |
| **AI agent** | Tool routes, credits debit, memory, streaming UI |
| **Quizzes** | Take flow; RLS for enrolled students |
| **Peer / live** | Daily rooms, scheduling |
| **Certificates** | PDF generation, verification |
| **Coach verification** | Upload flow, admin queue UI |
| **Admin** | Full ops: users, moderation, analytics |
| **Seed data** | Kaggle / demo catalog in Supabase |
| **RLS hardening** | Role self-escalation trigger; public coach profile policy |
| **Mobile / Phase 2** | Per feature flags (jobs, hackathons, etc.) |
| **Deploy** | Vercel production env, custom domain |

---

## 3. Run locally

```bash
npm install
copy .env.example .env.local   # Windows
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
npm run dev
```

Open **http://localhost:3000**. Sign in: **http://localhost:3000/login**. Dashboard: **http://localhost:3000/dashboard**.

If OAuth shows the setup callout, fill `.env.local` and restart dev — or open **http://localhost:3000/setup**.

Toggle **light/dark** via the sun/moon control (auth header, public header, student header).

---

## 4. Key files (Session 5)

| Path | Purpose |
|------|---------|
| `src/app/globals.css` | Learnify tokens + `.cn-card` / `.cn-callout` |
| `src/components/theme/*` | Theme provider + toggle |
| `src/components/auth/supabase-setup-callout.tsx` | Fixed setup window |
| `src/app/(auth)/layout.tsx` | Split auth layout |
| `src/app/(public)/*` | Marketing + legal + courses + setup |
| `src/lib/courses/public-catalog.ts` | Published courses query |

---

## 5. Verification

| Check | Result |
|-------|--------|
| `npm run build` | Pass (Session 5) |
| SQL on live Supabase | User must apply migrations |

---

*Next: run `demo_seed.sql` + enroll your user, wire lesson completion → `progress_pct`, then agent/Stripe per master schedule.*
