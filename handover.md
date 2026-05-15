# COGNARA™ — Project Handover

**Session:** 4 (Learnify-style UI + student portal polish)  
**Date:** 2026-05-15  
**Repository:** `C:\GitHub\COGNARA`

---

## 1. Project overview

COGNARA™ is a Next.js 15 App Router application with Supabase (Postgres + Auth). This session adds a **Learnify-inspired student experience** (warm canvas, rich-black sidebar, orange primary, Kodchasan typography), wires the dashboard to **live Supabase stats** where schema exists, and unifies **auth/landing button styling** with the new palette.

---

## 2. Current state

### Done (Session 4)

- [x] **Student route group** `(student)/` with shared `StudentShell`: dark icon rail, yellow active pill, header search/notifications/profile, billing + icon sign-out.
- [x] **Dashboard** at `/dashboard`: stat cards (enrollments, streak/XP, AI credits), agent quick-launch, interactive course filter chips, demo course cards, next-lessons list, spotlight card.
- [x] **`loadStudentPortalStats`** — reads `enrollments`, `ai_credits`, `user_xp`, `agent_sessions` (graceful empty state if DB unreachable).
- [x] **`checkStudentDbHealth`** + **`DatabaseStatusBanner`** — surfaces missing migrations, profile/settings rows, or env keys on the dashboard.
- [x] **`AgentFloatingButton`** on all student pages (links to `/agent`).
- [x] **Global design tokens** in `globals.css` + **Kodchasan** in root `layout.tsx` (`#f7f7f5`, `#151313`, `#ff5734`, `#be94f5`, `#fccc42`).
- [x] **Auth + landing** primary buttons/links moved from indigo to orange; auth layout warm gradients.
- [x] **Shared `Button`** component (`src/components/ui/button.tsx`) for future reuse.
- [x] **Build / typecheck / lint** — run before handoff (see §7).

### Done (Session 3 — still valid)

- [x] Nine SQL migrations `20250514180001` … `20250514180009` + `docs/supabase/schema_bundle.sql` + `docs/LOCAL_SETUP.md`.
- [x] Onboarding via `user_settings.onboarding_complete`; env helpers in `src/lib/supabase/env.ts`.

### Not done

- [ ] Public route group, legal pages, cookie banner.
- [ ] Real course CRUD, lesson viewer, Stripe, full agent UI, Judge0, admin UI beyond stub.
- [ ] RLS: student read for published quizzes; public coach profile reads.
- [ ] Role immutability trigger on `profiles.role`.

---

## 3. Files touched (Session 4)

| Path | Purpose |
|------|---------|
| `src/app/(student)/layout.tsx` | Student shell + portal stats + floating agent button |
| `src/app/(student)/dashboard/page.tsx` | Learnify-style dashboard with DB-backed stats |
| `src/components/student/student-shell.tsx` | Sidebar, header, credits in profile chip |
| `src/components/student/dashboard-stat-card.tsx` | Stat tiles |
| `src/components/student/course-filter-chips.tsx` | Interactive filter pills |
| `src/components/student/database-status-banner.tsx` | DB health UI |
| `src/components/student/agent-floating-button.tsx` | FAB → `/agent` |
| `src/components/student/agent-quick-launch.tsx` | Agent skill shortcuts |
| `src/lib/student/portal-stats.ts` | Supabase snapshot for dashboard |
| `src/lib/student/db-health.ts` | Migration/profile connectivity checks |
| `src/components/ui/button.tsx` | Shared button variants |
| `src/components/auth/sign-out-button.tsx` | `variant="icon"` for sidebar |
| `src/components/auth/*.tsx` | Orange primary buttons |
| `src/app/(auth)/layout.tsx` | Warm auth backdrop |
| `src/app/page.tsx` | Landing palette aligned |
| `src/app/layout.tsx`, `globals.css` | Kodchasan + tokens |

Student stubs under `(student)/`: `my-courses`, `editor`, `notebook`, `agent`, `quizzes`, `progress`, `certificates`, `peer`, `billing`, `support`, `settings`, `profile`.

---

## 4. Run locally (see the UI)

1. Copy env: `copy .env.example .env.local` (Windows) and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
2. In Supabase SQL Editor, run migrations or `docs/supabase/schema_bundle.sql` (see `docs/LOCAL_SETUP.md`).
3. Configure Auth redirect URLs: `http://localhost:3000/api/auth/callback`
4. Install & start:
   ```bash
   npm install
   npm run dev
   ```
5. Open **http://localhost:3000** → register/login → **http://localhost:3000/dashboard**

If you see **ERR_CONNECTION_REFUSED**, the dev server is not running — run `npm run dev` in the project root.

---

## 5. Database checks (dashboard)

The dashboard banner reports:

| Check | Table / signal |
|-------|----------------|
| Profile | `profiles` row for `auth.uid()` |
| Settings | `user_settings` row (onboarding) |
| Credits | `ai_credits` reachable (row created by `ensure_ai_credits` trigger) |
| Enrollments | `enrollments` query (count on stat cards) |

Portal stats queries match migration schema (`student_id` on enrollments/agent_sessions, `user_id` on credits/XP).

---

## 6. Next tasks

1. User: apply SQL on Supabase if banner shows “setup needed”.
2. Seed demo courses/enrollments for non-zero dashboard counts.
3. Day 2: `(public)` layout, `/legal/*`, `/pricing`, `/courses` browse.
4. RLS: student read policies for quizzes/lessons tied to enrollments.

---

## 7. Verification

| Check | Result |
|-------|--------|
| `npm run build` | Run after Session 4 changes |
| `npm run lint` | Run after Session 4 changes |
| SQL on live Supabase | **User must run** |

---

## 8. Critical notes

- Never commit `.env.local` or service role keys.
- Onboarding flag: **`user_settings.onboarding_complete`**.
- Demo course cards are **placeholder UI** until catalog API ships; stat cards use **real** Supabase counts when schema exists.

---

*Next session: seed data + public catalog, or lesson viewer shell.*
