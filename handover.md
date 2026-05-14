# COGNARA™ — Project Handover

**Generated:** 2026-05-14  
**Session scope:** Day 1 foundation — repository bootstrap and baseline verification  
**Repository path:** `C:\GitHub\COGNARA` (Git remote folder name may differ; npm package name is `cognara` lowercase)

---

## 1. Project Overview

| Field | Value |
|--------|--------|
| **Product** | COGNARA™ — AI-powered EdTech SaaS (SDG 4, UMT PP Assignment #3 + #4) |
| **Objective** | Production-grade Next.js + Supabase platform with three portals (student / coach / admin), multi-skill AI agent, payments, compliance, and Vercel deployment |
| **Current architecture** | Single Next.js 15 App Router app at repo root (`src/app`), Tailwind CSS v4 (via default `create-next-app@15` template), TypeScript strict mode, ESLint |
| **Technologies in use (installed)** | `next@15.5.18`, `react@19.1.0`, `react-dom@19.1.0`, `typescript`, `tailwindcss@4`, `@tailwindcss/postcss`, `eslint` + `eslint-config-next` |

**Authoritative specification:** Master build document v2.0 provided by the product owner (sections 1–27). Implementation must stay aligned with that document unless an explicit written deviation is approved.

---

## 2. Current State

### Completed

- [x] Next.js 15 application scaffolded and **relocated to repository root** (initial `create-next-app` targeted subdirectory `cognara/` because npm disallows uppercase package names for a project created in folder `COGNARA`).
- [x] `npm install` executed at repository root after file move.
- [x] **`npm run build`** — **PASS** (Next.js 15.5.18, Turbopack build).
- [x] **`npm run type-check`** (`tsc --noEmit`) — **PASS**.
- [x] **`.env.example`** added with all variable keys from master document Section 19 (empty values; safe to commit).
- [x] **`.gitignore`** updated so **`.env.example` is not ignored** (previous pattern `.env*` would have excluded it). Added `.supabase/` and `dist/` per master doc Section 7a.
- [x] **`LICENSE`** — proprietary text (short form).
- [x] **`TRADEMARK-NOTICE.md`** — COGNARA™ notice per master doc.
- [x] **`package.json`** — `version` set to `1.0.0`; `type-check` script added.

### Working / verified

| Check | Result |
|--------|--------|
| Production build | OK |
| TypeScript | OK |
| Dev script | `next dev --turbopack` (not re-run in this session after final edits; prior scaffold default) |

### Not started (explicit)

- Supabase project, SQL migrations (Section 8), RLS policies, Auth providers.
- `src/middleware.ts`, `src/lib/supabase/*`, auth pages `(auth)/*`.
- All route groups `(student)`, `(coach)`, `(admin)`, `(public)`, APIs, AI layer, Stripe, etc.

---

## 3. Files Modified / Added (this session)

| File | Purpose | Modification |
|------|---------|--------------|
| `package.json` | Project metadata & scripts | `version` → `1.0.0`; added `"type-check": "tsc --noEmit"` |
| `.gitignore` | Prevent secrets / build artifacts from being committed | Replaced blanket `.env*` with explicit env patterns + `!.env.example`; added `.supabase/`, `dist/` |
| `.env.example` | Document required environment variables | **Created** — keys only, no secrets |
| `LICENSE` | Legal proprietary notice | **Created** |
| `TRADEMARK-NOTICE.md` | Trademark assertion | **Created** |
| `handover.md` | Session continuity for humans / other AI | **Created** — full handover per project rules |
| Entire Next.js tree (`src/`, `public/`, configs) | Application baseline | **Created** via `create-next-app@15` then moved from `cognara/` subfolder to root; subdirectory removed |

**Removed:** `c:\GitHub\COGNARA\cognara\` (entire folder after move, including its `node_modules`).

**Pre-existing (unchanged by content in this session):** `.git/`, `.sixth/` (local tooling).

---

## 4. Decisions Made

| Decision | Rationale |
|----------|-----------|
| Scaffold in subdirectory `cognara` then move to root | `create-next-app` fails when the directory name is `COGNARA` (npm package name cannot contain capital letters). |
| Keep default React 19 + Tailwind 4 from `create-next-app@15` | Master document Section 18 lists React `^18.3.0` and Tailwind `^3.4.0`. Current toolchain is **newer** and **build-verified**. Downgrading is optional and should be a deliberate choice (risk: dependency drift from doc). |
| Proprietary `LICENSE` short form | Full legal review not in scope; placeholder is explicit proprietary. Replace with counsel-approved text if required. |
| `.env.example` committed; `.env.local` blocked | Matches Section 19 and security checklist. |

---

## 5. Problems Encountered

| Issue | Root cause | Fix | Status |
|-------|------------|-----|--------|
| PowerShell `&&` parse error | Older PS statement separator | Use `Set-Location`; `;` separators | Resolved |
| `create-next-app` in `.` failed | npm package name derived from folder `COGNARA` (invalid casing) | Scaffold in `cognara/` then move files | Resolved |
| `.env*` would ignore `.env.example` | Overly broad gitignore | Narrow env ignore patterns + `!.env.example` | Resolved |

---

## 6. Remaining Tasks (ordered — Day 1 onward)

**Priority P0 — Day 1 afternoon / next session**

1. Install runtime dependencies from master Section 18 (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, etc.) in controlled batches; reconcile versions with current React 19 / Tailwind 4 or pin stack per doc.
2. Create `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` (Supabase SSR pattern for Next.js 15).
3. Add `src/middleware.ts` for route protection per Section 9 (matcher + role logic).
4. Implement `(auth)/` routes: login, register, verify-email, forgot-password, reset-password.
5. Create Supabase project (manual): run Section 8 schema in SQL editor; enable RLS migrations as separate files under `supabase/migrations/` per Section 7.

**P1 — Day 2+** per master Sections 20–22 (public pages, legal, onboarding, portals).

**Blockers:** Supabase and third-party API keys must be supplied by the owner in `.env.local` (never commit).

---

## 7. Verification Status

| Test | Result |
|------|--------|
| `npm run build` | Pass |
| `npm run type-check` | Pass |
| `npm run lint` | Pass (eslint) |
| `npm run dev` + browser smoke | Not executed this session |

---

## 8. Important Context

- **Naming:** Product branding is COGNARA™; **npm `name` is `cognara`** (lowercase).
- **Do not commit:** `.env.local`, any real API keys, `SUPABASE_SERVICE_ROLE_KEY` to client bundles.
- **Do not break:** `.gitignore` must keep `.env.example` committable.
- **Master doc vs installed stack:** Document specifies React 18 + Tailwind 3 + many packages; repo currently matches **create-next-app@15 defaults** (React 19, Tailwind 4). Next implementer must either align package.json to the doc or record an intentional stack amendment in `docs/` and README.

---

*End of handover. Next session: continue Day 1 — Supabase client + auth UI + middleware.*
