# COGNARA™

**Where knowledge finds its place.**

AI-native EdTech platform (Next.js 15 + Supabase) for UMT PP Assignments #3 and #4 — three portals (student / coach / admin), SDG 4 alignment, and a tool-using agent architecture (see product master document).

## Run locally (first time)

1. **Create a Supabase project** and apply the SQL in `supabase/migrations/` (or paste `docs/supabase/schema_bundle.sql` once in the SQL Editor).  
2. **Configure Auth** (email/OAuth) and redirect URLs — see **[docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md)** for exact steps.  
3. Copy **`.env.example`** → **`.env.local`** and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
4. Install and start:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. If OAuth shows “connect Supabase”, open **http://localhost:3000/setup** for a built-in checklist.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) | Supabase setup, migrations order, auth URLs, smoke test, troubleshooting |
| [handover.md](./handover.md) | Session-to-session engineering continuity |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |

## Repository layout (high level)

- `src/app/` — App Router (auth, dashboards, stubs)  
- `src/lib/supabase/` — Browser + server clients, session middleware  
- `supabase/migrations/` — Postgres schema + RLS (Session 3)  
- `docs/` — Local setup and bundled SQL  

## License

Proprietary — see `LICENSE` and `TRADEMARK-NOTICE.md`.
