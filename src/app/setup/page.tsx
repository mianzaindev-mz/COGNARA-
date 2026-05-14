import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local setup",
  description: "Connect COGNARA to your Supabase project.",
};

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] dark:bg-[#0A0A0A] dark:text-white">
      <header className="border-b border-neutral-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-neutral-800 dark:bg-[#0A0A0A]/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold tracking-[0.15em] text-[#6366F1]">
            COGNARA™
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 hover:text-[#6366F1] dark:text-neutral-300"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight">Connect Supabase</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Auth and the database run on Supabase. Follow these steps once per machine.
        </p>

        <ol className="mt-10 space-y-8 text-sm">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
              1
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">Create a project</p>
              <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400">
                In the{" "}
                <a
                  className="font-medium text-[#6366F1] underline-offset-2 hover:underline"
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supabase dashboard
                </a>
                , create a new project and wait until it is ready.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
              2
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">Run the SQL schema</p>
              <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400">
                Open <span className="font-mono text-xs">SQL Editor</span> in Supabase, paste the contents of{" "}
                <span className="font-mono text-xs">docs/supabase/schema_bundle.sql</span> from this repo, and run it.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
              3
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">Copy API keys</p>
              <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400">
                <span className="font-mono text-xs">Project Settings → API</span>: copy{" "}
                <strong>Project URL</strong> and the <strong>anon public</strong> key.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
              4
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">Edit <span className="font-mono">.env.local</span></p>
              <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4 font-mono text-xs leading-relaxed text-neutral-800 shadow-sm dark:border-neutral-700 dark:bg-[#141414] dark:text-neutral-200">
                <p className="text-neutral-500 dark:text-neutral-500"># project root: C:\GitHub\COGNARA\.env.local</p>
                <p className="mt-2">NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</p>
                <p>NEXT_PUBLIC_APP_URL=http://localhost:3000</p>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Restart <span className="font-mono">npm run dev</span> after saving. No quotes around values.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
              5
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">Auth URLs in Supabase</p>
              <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400">
                <span className="font-mono text-xs">Authentication → URL configuration</span>: set Site URL to{" "}
                <span className="font-mono text-xs">http://localhost:3000</span> and add redirect{" "}
                <span className="font-mono text-xs break-all">http://localhost:3000/api/auth/callback</span>.
              </p>
            </div>
          </li>
        </ol>

        <p className="mt-12 text-xs text-neutral-500 dark:text-neutral-500">
          Full detail: <span className="font-mono">docs/LOCAL_SETUP.md</span> in the repository.
        </p>
      </main>
    </div>
  );
}
