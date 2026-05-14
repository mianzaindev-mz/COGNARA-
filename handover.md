# COGNARA™ — Project Handover

**Generated:** 2026-05-14 (session 2)  
**Repository path:** `C:\GitHub\COGNARA`  
**npm package name:** `cognara` (repository folder name remains `COGNARA`)

---

## 1. Project Overview

| Field | Value |
|--------|--------|
| **Product** | COGNARA™ — AI-powered EdTech SaaS (UMT PP #3 + #4, SDG 4) |
| **Objective** | Three portals (student / coach / admin), Supabase-backed auth + RLS, AI agent system, Stripe, deployment on Vercel |
| **Architecture** | Next.js 15 App Router (`src/app`), Tailwind CSS v4, TypeScript strict, Edge `middleware` + Supabase cookie session refresh |
| **Stack (installed)** | `next@15.5.18`, `react@19.1.0`, `@supabase/supabase-js@^2.46`, `@supabase/ssr@^0.5.2`, `zod@^3.23` |

**Specification:** Master build document v2.0 (user-provided). Deviations are explicit below.

---

## 2. Current State

### Completed this session

- [x] **Supabase SSR wiring:** `src/lib/supabase/client.ts` (browser; returns `null` if env missing), `server.ts` (Server Components / Server Actions), `middleware.ts` (session refresh + route guards).
- [x] **Root middleware:** `src/middleware.ts` → `updateSession` with matcher excluding static assets.
- [x] **OAuth + PKCE callback:** `src/app/api/auth/callback/route.ts` (`exchangeCodeForSession`, typed `setAll`).
- [x] **Auth UI:** `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`, `(auth)/reset-password`; standalone `verify-email` (outside auth card layout).
- [x] **Zod validation:** `src/lib/validation/schemas/auth.schema.ts` (password rules per master doc).
- [x] **Route helpers:** `src/lib/auth/paths.ts`, `roles.ts`, `guards.ts` (`requireUser`, `requireProfile`).
- [x] **Onboarding:** `/onboarding/student`, `/onboarding/coach` + server action `completeOnboarding` (`src/app/onboarding/actions.ts`) updates `profiles.onboarding_complete`.
- [x] **Portals (stubs):** `/dashboard` (student), `/coach/dashboard`, `/admin/dashboard`; redirects `/coach` → `/coach/dashboard`, `/admin` → `/admin/dashboard`.
- [x] **Student nav stubs:** `/my-courses`, `/editor`, `/notebook`, `/agent`, `/quizzes`, `/progress`, `/certificates`, `/peer`, `/billing`, `/support`, `/settings`, `/profile` via `PortalStub`.
- [x] **Banned account page:** `/banned`.
- [x] **Branding:** Root layout uses **DM Sans** + **JetBrains Mono**; landing page (`/`) reflects COGNARA copy and SDG 4 positioning.
- [x] **SQL migration (minimal auth):** `supabase/migrations/0001_profiles_auth_trigger.sql` — `profiles` subset, RLS (select/update own), `handle_new_user` trigger on `auth.users`, `is_verified` column.
- [x] **Build / lint / typecheck:** `npm run build`, `npm run lint`, `npm run type-check` — **pass**.

### Working when configured

| Capability | Requirement |
|-------------|-------------|
| Email/password + OAuth | Supabase project with Email + Google + GitHub providers; redirect URLs include `{origin}/api/auth/callback` |
| Profile row on signup | SQL migration applied (trigger `on_auth_user_created`) |
| Role from registration | `raw_user_meta_data.role` set client-side (`student` \| `coach`); `admin` only via Supabase SQL |

### Explicit spec deviations (documented)

1. **`/courses` URL collision** in master doc (public browse vs student “My courses”). **Resolution:** public catalog will use `/courses` later; student enrolled list uses **`/my-courses`** (`paths.ts` + UI copy on dashboard).
2. **Onboarding:** Master doc references `user_settings.onboarding_complete`; implementation uses **`profiles.onboarding_complete`** for the assignment slice to avoid an extra table before Section 8 merge.
3. **Admin onboarding:** Middleware skips forced onboarding when `role === 'admin'` so manually promoted admins are not stuck.

---

## 3. Files Modified / Added (high-signal list)

| Area | Files |
|------|--------|
| Supabase | `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` |
| Middleware entry | `src/middleware.ts` |
| Auth API | `src/app/api/auth/callback/route.ts` |
| Auth pages | `src/app/(auth)/layout.tsx`, `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` |
| Verify email | `src/app/verify-email/page.tsx`, `layout.tsx` |
| Onboarding | `src/app/onboarding/actions.ts`, `student/page.tsx`, `coach/page.tsx` |
| Portals | `src/app/dashboard/page.tsx`, `banned/page.tsx`, `coach/page.tsx`, `coach/dashboard/page.tsx`, `admin/page.tsx`, `admin/dashboard/page.tsx` |
| Stubs | `src/app/my-courses/page.tsx`, `editor/page.tsx`, `notebook/page.tsx`, `agent/page.tsx`, `quizzes/page.tsx`, `progress/page.tsx`, `certificates/page.tsx`, `peer/page.tsx`, `billing/page.tsx`, `support/page.tsx`, `settings/page.tsx`, `profile/page.tsx` |
| Components | `src/components/auth/*`, `src/components/shared/portal-stub.tsx` |
| Auth lib | `src/lib/auth/paths.ts`, `roles.ts`, `guards.ts` |
| Validation | `src/lib/validation/schemas/auth.schema.ts` |
| SQL | `supabase/migrations/0001_profiles_auth_trigger.sql` |
| Branding | `src/app/layout.tsx`, `globals.css`, `page.tsx` |
| Dependencies | `package.json` / lockfile — added `@supabase/*`, `zod` |

---

## 4. Decisions Made

| Decision | Reason |
|----------|--------|
| Browser Supabase client returns `null` without public env | Prevents runtime throw on marketing pages during local dev without `.env.local`. |
| Middleware blocks protected routes when Supabase env is missing | Avoids a false sense of security (open `/dashboard` without auth). |
| Admin routes return **HTTP 404** for non-admins | Matches master doc (“404 for others”), not a soft redirect. |
| Typed `setAll` cookie arrays | Satisfies `strict` TypeScript under Next 15 + `@supabase/ssr`. |
| `EXECUTE PROCEDURE` in SQL trigger | PostgreSQL-compatible wording used in many Supabase samples; if your project errors, try `EXECUTE FUNCTION` (Postgres 14+). |

---

## 5. Problems Encountered

| Issue | Root cause | Fix | Status |
|-------|------------|-----|--------|
| `create-next-app` in `COGNARA` root (prior session) | npm disallows uppercase package name | Scaffold in `cognara/` then move | Resolved (prior) |
| `setAll` implicit `any` | Strict TS + Supabase cookie API | Explicit array element type in `server.ts`, `middleware.ts`, `api/auth/callback/route.ts` | Resolved |
| ESLint unused `Link` in `(auth)/layout.tsx` | Leftover import | Removed import | Resolved |

---

## 6. Remaining Tasks (ordered)

**P0 — Supabase project (manual)**

1. Create Supabase project; add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (server-only) `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
2. Authentication → URL configuration: add `http://localhost:3000/**` and production origins; **Redirect URLs** must include `http://localhost:3000/api/auth/callback` (and production equivalent).
3. Enable **Email**, **Google**, **GitHub** providers per master Section 9.
4. Run `supabase/migrations/0001_profiles_auth_trigger.sql` in the SQL editor (or merge with full Section 8 schema carefully — avoid duplicate conflicting `profiles` definitions).

**P1 — Day 2 (master plan)**

- Public `(public)` routes: `/pricing`, `/about`, `/courses` (browse), `/library`, legal pages, cookie banner.
- Replace stub onboarding with five-step wizards; align `profiles` / `user_settings` with Section 8 if you adopt the full schema.

**P2 — Day 3+**

- Student sidebar layout group `(student)`, lesson routes, Judge0, notebooks, quizzes data layer.

**Blockers**

- OAuth and email confirmation **will not work** until Supabase redirect URLs and provider keys are configured.

---

## 7. Verification Status

| Check | Result |
|--------|--------|
| `npm run build` | Pass |
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| Live Supabase auth E2E | **Not verified** (requires your project + keys) |

---

## 8. Important Context

- **Never commit** `.env.local` or service role keys.
- **GitHub OAuth** needs a GitHub OAuth App callback URL matching Supabase redirect settings.
- **Password reset** uses `/reset-password` + hash tokens parsed client-side (`ResetPasswordForm`).
- **Coach dashboard** selects `is_verified`; column exists after `0001` migration (or `ALTER` in same file).
- Future sessions: when importing **full Section 8 SQL**, reconcile `profiles` columns and the `handle_new_user` trigger `INSERT` list so new columns with `NOT NULL` do not break signups.

---

*Next session should start with Supabase dashboard configuration + running the SQL migration, then smoke-test register → verify email → onboarding → dashboard for student and coach.*
