import Link from "next/link";
import type { Metadata } from "next";
import { SupabaseSetupCallout } from "@/components/auth/supabase-setup-callout";

export const metadata: Metadata = {
  title: "Local setup",
  description: "Connect COGNARA to your Supabase project.",
};

const steps = [
  {
    n: 1,
    title: "Create a Supabase project",
    body: (
      <>
        In the{" "}
        <a className="font-semibold text-cn-orange hover:underline" href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
          Supabase dashboard
        </a>
        , create a project and wait until it is ready.
      </>
    ),
  },
  {
    n: 2,
    title: "Run the SQL schema",
    body: (
      <>
        Paste <code className="rounded bg-cn-canvas px-1 font-mono text-xs">docs/supabase/schema_bundle.sql</code> into the SQL Editor and run it.
      </>
    ),
  },
  {
    n: 3,
    title: "Copy API keys",
    body: (
      <>
        <span className="font-mono text-xs">Project Settings → API</span>: copy Project URL and the anon public key.
      </>
    ),
  },
  {
    n: 4,
    title: "Edit .env.local",
    body: (
      <div className="mt-3 rounded-2xl border border-cn-border bg-cn-canvas p-4 font-mono text-xs leading-relaxed text-cn-ink">
        <p className="text-cn-ink-subtle"># project root</p>
        <p className="mt-2">NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</p>
        <p>NEXT_PUBLIC_APP_URL=http://localhost:3000</p>
      </div>
    ),
  },
  {
    n: 5,
    title: "Auth redirect URLs",
    body: (
      <>
        Set Site URL to <code className="font-mono text-xs">http://localhost:3000</code> and add redirect{" "}
        <code className="break-all font-mono text-xs">http://localhost:3000/api/auth/callback</code>.
      </>
    ),
  },
] as const;

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cn-orange">Setup</p>
      <h1 className="mt-2 text-3xl font-bold text-cn-ink">Connect Supabase</h1>
      <p className="mt-3 text-cn-ink-muted">One-time steps per machine. Full detail in docs/LOCAL_SETUP.md.</p>

      <div className="mt-8">
        <SupabaseSetupCallout />
      </div>

      <ol className="mt-10 space-y-8">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cn-orange text-sm font-bold text-white">
              {s.n}
            </span>
            <div>
              <p className="font-bold text-cn-ink">{s.title}</p>
              <div className="mt-1 text-sm leading-relaxed text-cn-ink-muted">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/login"
        className="mt-12 inline-flex rounded-full bg-cn-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
      >
        Back to sign in
      </Link>
    </div>
  );
}
