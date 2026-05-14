# COGNARA™ — Project Handover

**Session:** 3 (database + local run documentation)  
**Date:** 2026-05-14  
**Repository:** `C:\GitHub\COGNARA`

---

## 1. Project overview

COGNARA™ is a Next.js 15 App Router application with Supabase (Postgres + Auth + future Storage). Session 3 adds the **full baseline database schema** (master document Section 8) as ordered SQL migrations, **RLS policies**, alignment of onboarding with **`user_settings.onboarding_complete`**, and **`docs/LOCAL_SETUP.md`** + **`docs/supabase/schema_bundle.sql`** so you can run the product locally against a hosted Supabase project.

---

## 2. Current state

### Done (Session 3)

- [x] **Nine SQL migrations** under `supabase/migrations/` (`20250514180001` … `20250514180009`): extensions, identity (`profiles`, `user_settings`, `onboarding_progress`, `handle_new_user` + `on_auth_user_created`), commerce + **`ensure_ai_credits`** trigger, courses/content + free-resource trigger, learning tools, agent/reviews, coach/live/peer, platform ops, **RLS** with `cognara_is_admin()` helper.
- [x] **Removed** obsolete `0001_profiles_auth_trigger.sql` (replaced by the new chain).
- [x] **`docs/supabase/schema_bundle.sql`** — concatenation of all migrations for one-shot paste in Supabase SQL Editor.
- [x] **`docs/LOCAL_SETUP.md`** — step-by-step: create Supabase project, run SQL, configure Auth URLs, `.env.local`, `npm run dev`, admin promotion SQL, troubleshooting.
- [x] **`supabase/config.toml`** — minimal stub for optional Supabase CLI use.
- [x] **App alignment:** `user_settings.onboarding_complete` used in `middleware.ts`, `onboarding/actions.ts`, and `lib/auth/guards.ts` (master schema stores onboarding on `user_settings`, not `profiles`).
- [x] **Onboarding redirect logic:** incomplete = `onboarding_complete !== true` (covers missing row); completed users hitting `/onboarding` redirect to `/dashboard`.
- [x] **README.md** replaced with COGNARA-focused quick start linking to `docs/LOCAL_SETUP.md`.
- [x] **Build / typecheck / lint:** `npm run build`, `npm run type-check`, `npm run lint` — pass.

### Not done (still out of scope)

- [ ] **Public** route group, legal pages, cookie banner (Day 2).
- [ ] **Real** course CRUD UI, lesson viewer, payments, AI agent tools, Judge0, seed from Kaggle, admin UI beyond stub.
- [ ] **RLS refinement:** e.g. students reading **published quizzes** for enrolled courses (current `quizzes` policies are coach/admin-centric); public **profile** read for `/coach/[username]` when you build it.
- [ ] **Role immutability:** no DB trigger yet preventing `profiles.role` self-escalation to `admin` via crafted update (mitigate with trigger or strict `WITH CHECK`).

---

## 3. Files touched (Session 3)

| Path | Purpose |
|------|---------|
| `supabase/migrations/20250514180001_extensions.sql` | `uuid-ossp`, `pg_trgm` |
| `supabase/migrations/20250514180002_core_identity.sql` | `profiles`, `user_settings`, `onboarding_progress`, `handle_new_user` |
| `supabase/migrations/20250514180003_commerce.sql` | billing tables + `ensure_ai_credits` trigger |
| `supabase/migrations/20250514180004_courses_content.sql` | courses, lessons, resources, enrollments, progress, free-content trigger |
| `supabase/migrations/20250514180005_learning_tools.sql` | code, notebooks, quizzes |
| `supabase/migrations/20250514180006_agent_reviews.sql` | agent, voice, reviews |
| `supabase/migrations/20250514180007_coach_live_peer.sql` | verification, live, peer |
| `supabase/migrations/20250514180008_platform_ops.sql` | earnings, support, notifications, audit, security, gamification |
| `supabase/migrations/20250514180009_rls.sql` | `cognara_is_admin()` + table policies |
| `supabase/config.toml` | Optional CLI config |
| `docs/LOCAL_SETUP.md` | Local + Supabase runbook |
| `docs/supabase/schema_bundle.sql` | Generated bundle (concat of migrations) |
| `README.md` | Product entry + links |
| `src/lib/supabase/middleware.ts` | Read onboarding from `user_settings`; incomplete if not `true` |
| `src/app/onboarding/actions.ts` | Updates `user_settings.onboarding_complete` |
| `src/lib/auth/guards.ts` | `requireProfile` reads `user_settings` |
| **Deleted** | `supabase/migrations/0001_profiles_auth_trigger.sql` |

---

## 4. Decisions

| Decision | Reason |
|----------|--------|
| Split migrations (01–09) | Easier debugging than one giant file; Supabase CLI applies in name order. |
| `EXECUTE PROCEDURE` on triggers | Broader Postgres compatibility; swap to `EXECUTE FUNCTION` if your instance rejects `PROCEDURE`. |
| `cognara_is_admin()` SECURITY DEFINER | Avoids infinite RLS recursion when policies reference `profiles` for admin checks. |
| Tightened `profiles` SELECT RLS | Removed world-readable `profiles` SELECT; public coach pages will need an explicit policy or Edge/API route later. |
| `schema_bundle.sql` in repo | Lets you paste once in SQL Editor without stitching files manually. |

---

## 5. Problems / risks

| Item | Mitigation |
|------|------------|
| Trigger keyword mismatch | Documented in `docs/LOCAL_SETUP.md` — swap `PROCEDURE` / `FUNCTION`. |
| Quiz RLS vs enrolled students | Documented as follow-up when quiz-taking UI ships. |
| `schema_bundle.sql` must be regenerated if migrations change | Re-run the PowerShell concat from `docs/LOCAL_SETUP.md` pattern or maintain manually. |

---

## 6. Next tasks (suggested order)

1. User: create Supabase project → run SQL → configure Auth → `.env.local` → `npm run dev` (see `docs/LOCAL_SETUP.md`).
2. Day 2: `(public)` layout, `/legal/*`, `/pricing`, `/courses` browse, cookie banner.
3. RLS: add **student read** policies for quizzes/lessons where `enrollments` ties student to course.

---

## 7. Verification

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| SQL applied on live Supabase | **Not executed in this environment** — user must run |

---

## 8. Critical notes

- **Never** commit `.env.local` or `SUPABASE_SERVICE_ROLE_KEY` to client bundles.
- Onboarding flag lives in **`user_settings.onboarding_complete`** per master Section 8.
- After schema changes, regenerate **`docs/supabase/schema_bundle.sql`** if you rely on the single-file workflow.

---

*Next session: Day 2 public shell + legal, or RLS refinements + first real `/courses` browse — pick based on demo deadline.*
