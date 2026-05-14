# COGNARA — Run locally (Session 3)

This guide gets a **working browser demo** on your machine: landing page, auth, onboarding, and stub dashboards — backed by **your** Supabase project.

---

## 1. Prerequisites

| Tool | Notes |
|------|--------|
| Node.js 20+ (or 18+) | Same major Vercel recommends for Next.js 15 |
| npm | Comes with Node |
| A Supabase account | https://supabase.com — free tier is enough |

You do **not** need Stripe, Groq, or Judge0 to **see the product shell** locally. Only Supabase public URL + anon key are required for auth and DB reads the app performs today.

---

## 2. Create the Supabase project (hosted database)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. Choose a strong database password and region; wait until the project is **healthy**.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. (Optional, for server-only admin scripts later) **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` — **never** expose this in client code or commit it.

---

## 3. Apply the database schema (migrations)

The canonical SQL lives in `supabase/migrations/` (run **in filename order**). A single concatenated file for copy-paste is also at **`docs/supabase/schema_bundle.sql`** (same content; run once in SQL Editor for a fresh project).

| Order | File |
|-------|------|
| 1 | `20250514180001_extensions.sql` |
| 2 | `20250514180002_core_identity.sql` |
| 3 | `20250514180003_commerce.sql` |
| 4 | `20250514180004_courses_content.sql` |
| 5 | `20250514180005_learning_tools.sql` |
| 6 | `20250514180006_agent_reviews.sql` |
| 7 | `20250514180007_coach_live_peer.sql` |
| 8 | `20250514180008_platform_ops.sql` |
| 9 | `20250514180009_rls.sql` |

### Option A — Supabase SQL Editor (simplest)

1. Dashboard → **SQL Editor** → **New query**.
2. Paste the contents of **each file in order** → **Run**.
3. If a trigger step errors with `EXECUTE PROCEDURE` vs `EXECUTE FUNCTION`, replace that line with the other keyword (depends on Postgres minor version) and re-run that statement only.

### Option B — Supabase CLI

```bash
npm i -g supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

(`db push` applies local `supabase/migrations` to the linked remote project.)

---

## 4. Configure authentication (required to log in)

In Supabase → **Authentication → Providers**:

- Enable **Email** (confirm email is on if you want the same flow as production).
- Enable **Google** and **GitHub** if you use OAuth buttons (each needs provider credentials in Google Cloud / GitHub developer settings).

**Authentication → URL configuration**

- **Site URL:** `http://localhost:3000` (while developing).
- **Redirect URLs** (add both):

  ```
  http://localhost:3000/**
  http://localhost:3000/api/auth/callback
  ```

Email **confirm** and **password reset** links must hit routes this app implements (`/api/auth/callback`, `/reset-password`).

---

## 5. Configure the Next.js app

From the repository root:

```bash
cd C:\GitHub\COGNARA
npm install
copy .env.example .env.local
```

Edit **`.env.local`** and set at minimum:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save the file. **Never commit `.env.local`.**

---

## 6. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**

### Smoke test (happy path)

1. **Register** a student (or coach) at `/register`.
2. Confirm email (Supabase may auto-confirm in dev if you disabled confirmation — check **Authentication → Providers → Email**).
3. Complete **onboarding** (marks `user_settings.onboarding_complete`).
4. You should land on **`/dashboard`** (student) or **`/coach/dashboard`** (coach).

### Make an admin (manual)

There is no UI to promote admins (by design). In Supabase **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Then sign in as that user → `/admin/dashboard`.

---

## 7. Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |

---

## 8. Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| “Supabase is not configured” on auth forms | Missing `NEXT_PUBLIC_SUPABASE_*` in `.env.local` or dev server not restarted after editing env |
| OAuth redirects to `/login?error=oauth` | Add exact redirect URL in Supabase; provider client id/secret wrong |
| `new row violates row-level security` on signup | Ensure migrations **through `20250514180009_rls.sql`** ran; triggers use `SECURITY DEFINER` and should bypass RLS for inserts from auth |
| Trigger syntax error | Swap `EXECUTE PROCEDURE` ↔ `EXECUTE FUNCTION` for your Postgres version |
| Stuck on onboarding | Check `user_settings.onboarding_complete` for your `user_id` in Table Editor |

---

## 9. What is implemented vs not (high level)

### Implemented in repo (Session 3 + earlier)

- Full **schema** (tables, indexes, key triggers) aligned to master Section 8, split across migrations.
- **RLS** baseline with `cognara_is_admin()` helper (Session 3).
- **Auth** pages, middleware, OAuth callback route, onboarding completion writing **`user_settings.onboarding_complete`**.
- **Stub** student/coach/admin surfaces and student sidebar routes as placeholders.

### Not implemented yet (master doc Day 2+)

- Public marketing/legal route group, cookie banner, course catalog UI, real lesson viewer, Monaco/Judge0, AI agent routes with tools, Stripe webhooks, Mux/Daily, seed data from Kaggle, full admin tools, etc.

When in doubt, see **`handover.md`** for the latest continuity notes.
