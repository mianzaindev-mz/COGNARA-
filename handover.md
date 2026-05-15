# COGNARA™ — Project Handover

**Session:** 9 (Coach Portal + Admin Portal + UI Components)  
**Date:** 2026-05-15  
**Repository:** `C:\GitHub\COGNARA`

---

## 1. What this session did (Session 9)

### Coach Portal — Full Build (was a stub)

- **`CoachShell`** — premium sidebar layout with indigo accent, verification badge, earnings display in topbar, sign-out button
- **`coach/layout.tsx`** — auth guard (role = coach OR admin), loads profile + verification status
- **`coach/dashboard`** — 5 stat cards (Students, Active, Earnings, Rating, Completion), AI Coach Agent tools panel (PDF→Course, Generate Quiz, Analyze Students), 30-day earnings bar chart, performance multiplier breakdown with progress bars, course performance table, recent student activity feed
- **`coach/courses`** — course card grid with stats (students, lessons, rating), completion bars, price display, status badges
- **`coach/students`** — full student roster table with avatar initials, progress bars, scores, last-active timestamps, status badges (active/inactive/at-risk/completed)
- **`coach/earnings`** — stat cards, monthly revenue chart, **live earnings calculator** (shows exact breakdown: price → platform fee → Stripe → net), transaction history
- **`coach/analytics`** — completion funnel chart, lesson-by-lesson retention chart, stat cards (retention, completion, quiz scores, agent quality)
- **`coach/verification`** — 4-step wizard with progress bar, document upload zones (degree, certificate, govt ID), AI pre-screening info panel
- **`coach/quizzes`** — quiz builder page with AI Generate + Create Quiz buttons, empty state
- **`coach/settings`** — profile form, Stripe Connect setup, notification toggles
- **`coach/support`** — support page with empty state + create ticket

### Admin Portal — Full Build (was a stub)

- **`AdminShell`** — always-dark sidebar, rose accent, LIVE badge, platform health indicators (DB/AI/Pay pulse dots)
- **`admin/layout.tsx`** — strict admin-only role guard
- **`admin/dashboard`** — 5 platform health stat cards (Users, Active Today, MRR, Tickets, Uptime), 30-day revenue chart, verification queue with AI confidence scores + Review buttons, security events feed (color-coded critical/high/medium/low), platform health indicators (5 services)
- **`admin/users`** — user management table with avatar, role badges, status badges, export CSV
- **`admin/coaches`** — verification queue cards with AI confidence progress bars, approve/reject/view-docs actions
- **`admin/courses`** — course moderation table with feature/unfeature actions
- **`admin/security`** — audit log (action/user/target/IP), off-platform attempt detection alerts
- **`admin/support`** — ticket table with priority/status badges, ticket IDs
- **`admin/reports`** — user growth chart, revenue breakdown chart, top coaches leaderboard
- **`admin/settings`** — feature flag toggles (8 flags), maintenance mode button

### Shared UI Components (new)

- **`stat-card.tsx`** — reusable stat card with 9 accent colors, trend indicators, hover animations, icon slots
- **`badge.tsx`** — status badges with 7 variants + optional status dot
- **`progress-bar.tsx`** — animated progress bar with 6 colors, 3 sizes, optional label
- **`chart-bar.tsx`** — CSS-only bar chart (no external dependency), hover values, customizable height/color
- **`data-table.tsx`** — typed generic data table with sorted columns, empty state, row click
- **`empty-state.tsx`** — centered empty state with icon, title, description, action slot
- **`format.ts`** — currency, number, compact, percent, relative date, truncate utilities

---

## 2. Session 8 recap (still valid)

- Lesson progress wired to Supabase (`markLessonComplete` server action)
- Learn viewer loads `lessons.content`, shows checkmarks in curriculum sidebar
- `/progress` — real enrollment breakdown with progress bars
- `/courses` — category-tinted cards; logged-in users get **Enroll free**; enrolled users see **Open course**
- Dashboard: filterable course grid, **My next lessons** from real data

---

## 3. Master product — done vs left

### Done (cumulative)

| Area | Status |
|------|--------|
| Next.js 15, Supabase auth, migrations 01–09, RLS | Done |
| Student portal shell + dashboard stats | Done |
| Enrollments + lesson progress sync | Done (Session 8) |
| Learn viewer UI + mark complete | Done (Session 8) |
| Public catalog + enroll (free) | Done (Session 8) |
| Light/dark theme, marketing, legal, setup | Done |
| **Coach Portal — full shell + all pages** | **Done (Session 9)** |
| **Admin Portal — full shell + all pages** | **Done (Session 9)** |
| **Shared UI component library** | **Done (Session 9)** |

### Not done (backlog)

| Area | Notes |
|------|-------|
| **Mux video** | Player placeholder; wire `mux_playback_id` |
| **Stripe** | Checkout, webhooks |
| **AI agent** | Tools, credits debit, streaming |
| **Code lab** | Monaco + Judge0 |
| **Certificates** | PDF + verification |
| **Deploy** | Vercel production |

---

## 4. Run locally

```bash
npm install
# .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
npm run dev
```

1. Apply `docs/supabase/schema_bundle.sql` in Supabase SQL editor.
2. Run `docs/supabase/demo_seed.sql` (uncomment enrollment + your user UUID).
3. Open **http://localhost:3000** → register → **My courses** or **/courses** → enroll → **Mark lesson complete**.
4. Coach portal at **/coach/dashboard** (requires `role = coach` or `admin`).
5. Admin portal at **/admin/dashboard** (requires `role = admin`).

Toggle light/dark via sun/moon in headers.

---

## 5. Key files (Session 9)

| Path | Purpose |
|------|---------|
| `src/components/coach/coach-shell.tsx` | Coach sidebar + topbar shell |
| `src/app/coach/layout.tsx` | Coach auth guard + shell wrapper |
| `src/app/coach/dashboard/page.tsx` | Full coach dashboard |
| `src/app/coach/courses/page.tsx` | Course management cards |
| `src/app/coach/students/page.tsx` | Student roster table |
| `src/app/coach/earnings/page.tsx` | Earnings + calculator |
| `src/app/coach/analytics/page.tsx` | Funnel + retention charts |
| `src/app/coach/verification/page.tsx` | 4-step verification wizard |
| `src/components/admin/admin-shell.tsx` | Admin sidebar + topbar shell |
| `src/app/admin/layout.tsx` | Admin auth guard |
| `src/app/admin/dashboard/page.tsx` | Full admin dashboard |
| `src/app/admin/users/page.tsx` | User management table |
| `src/app/admin/coaches/page.tsx` | Verification queue |
| `src/app/admin/security/page.tsx` | Audit log + off-platform |
| `src/components/ui/stat-card.tsx` | Reusable stat card |
| `src/components/ui/badge.tsx` | Status badges |
| `src/components/ui/progress-bar.tsx` | Progress bars |
| `src/components/ui/chart-bar.tsx` | CSS-only bar charts |

---

## 6. Verification

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Exit code 0, all routes compiled |
| Coach portal | All 9 sub-pages render |
| Admin portal | All 8 sub-pages render |

---

*Next: Mux player, code editor (Monaco + Judge0), AI agent system, Stripe checkout, certificates.*
