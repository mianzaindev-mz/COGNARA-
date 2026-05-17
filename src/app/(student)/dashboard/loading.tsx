export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Welcome heading skeleton */}
      <div>
        <div className="h-8 w-64 rounded-lg bg-cn-border" />
        <div className="mt-2 h-4 w-48 rounded bg-cn-border" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-cn-border bg-cn-surface p-5">
            <div className="h-3 w-20 rounded bg-cn-border mb-3" />
            <div className="h-7 w-16 rounded bg-cn-border" />
          </div>
        ))}
      </div>

      {/* Course cards row */}
      <div>
        <div className="h-5 w-32 rounded bg-cn-border mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-cn-border bg-cn-surface p-5">
              <div className="h-3 w-12 rounded bg-cn-border mb-3" />
              <div className="h-5 w-full rounded bg-cn-border mb-2" />
              <div className="h-3 w-3/4 rounded bg-cn-border mb-4" />
              <div className="h-2 w-full rounded-full bg-cn-border" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="h-5 w-40 rounded bg-cn-border mb-4" />
          <div className="h-32 w-full rounded-xl bg-cn-border" />
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="h-5 w-36 rounded bg-cn-border mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cn-border shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-full rounded bg-cn-border mb-1.5" />
                  <div className="h-2 w-1/2 rounded bg-cn-border" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
