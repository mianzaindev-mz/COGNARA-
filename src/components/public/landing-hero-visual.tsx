export function LandingHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-cn-lavender/30 blur-2xl"
        aria-hidden
      />
      <div
        className="absolute -right-4 bottom-12 h-32 w-32 rounded-full bg-cn-orange/20 blur-3xl"
        aria-hidden
      />

      <div className="cn-hero-frame relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cn-lavender/25 via-cn-canvas to-cn-yellow/20 shadow-[var(--cn-shadow-card)]">
        <div className="aspect-[4/4.2] sm:aspect-[4/3.8]">
          <div className="absolute inset-0 bg-gradient-to-t from-cn-sidebar/20 via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <div
              className="flex h-[88%] w-[78%] flex-col items-center justify-end rounded-t-[3rem] bg-gradient-to-b from-cn-lavender/40 to-cn-orange/30 pt-8"
              aria-hidden
            >
              <span className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-cn-surface/90 text-5xl shadow-lg ring-4 ring-cn-surface">
                🎓
              </span>
              <span className="h-24 w-full rounded-t-[2rem] bg-cn-sidebar/90" />
            </div>
          </div>

          <div className="absolute bottom-6 left-6 flex items-center gap-3 rounded-2xl border border-cn-border/80 bg-cn-surface/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cn-orange text-white shadow-md">
              <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="max-w-[7rem] text-xs font-bold leading-snug text-cn-ink">
              Watch the COGNARA intro
            </span>
          </div>

          <span className="absolute right-6 top-6 rounded-full bg-cn-yellow px-3 py-1 text-xs font-bold text-cn-sidebar">
            SDG 4
          </span>
        </div>
      </div>

      <svg
        className="pointer-events-none absolute -right-2 top-1/4 h-16 w-16 text-cn-orange/40"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <path
          d="M8 32c12-20 36-20 48 0"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
