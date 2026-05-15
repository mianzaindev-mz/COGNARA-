import Link from "next/link";

/**
 * Shown when Supabase public env vars are missing. Uses design tokens so it
 * reads well on auth cards in both light and dark themes.
 */
export function SupabaseSetupCallout() {
  return (
    <div className="cn-callout overflow-hidden p-0">
      <div className="flex gap-4 p-5 sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cn-yellow text-cn-sidebar shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-base font-bold tracking-tight text-cn-ink">Connect Supabase to enable sign-in</p>
            <p className="mt-1.5 text-sm leading-relaxed text-cn-ink-muted">
              Social and email auth need your project URL and anon key in{" "}
              <code className="rounded-md bg-cn-surface/80 px-1.5 py-0.5 font-mono text-xs text-cn-orange">
                .env.local
              </code>
              , then restart the dev server.
            </p>
          </div>

          <ul className="space-y-2 text-xs text-cn-ink-muted">
            <li className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cn-surface/90 px-2.5 py-1 font-mono text-[11px] text-cn-orange ring-1 ring-cn-border">
                NEXT_PUBLIC_SUPABASE_URL
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cn-surface/90 px-2.5 py-1 font-mono text-[11px] text-cn-orange ring-1 ring-cn-border">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>
            </li>
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/setup"
              className="inline-flex h-11 items-center justify-center rounded-full bg-cn-orange px-5 text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover"
            >
              Open setup guide
            </Link>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-sm font-semibold text-cn-orange hover:underline sm:px-2"
            >
              Supabase dashboard ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
