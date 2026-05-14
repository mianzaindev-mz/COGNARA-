export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F4F5] dark:bg-[#050505]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full bg-[#6366F1]/25 blur-3xl dark:bg-[#6366F1]/20" />
        <div className="absolute -right-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-[#818CF8]/20 blur-3xl dark:bg-[#4F46E5]/15" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10B981]/5 blur-2xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/95 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-900/[0.04] backdrop-blur-md dark:border-neutral-800 dark:bg-[#141414]/95 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] dark:ring-white/[0.06]">
          {children}
        </div>

        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
          COGNARA™ — Where knowledge finds its place.
        </p>
      </div>
    </div>
  );
}
