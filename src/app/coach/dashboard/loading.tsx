export default function CoachDashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div>
        <div className="h-8 w-56 rounded-lg bg-cn-border" />
        <div className="mt-2 h-4 w-64 rounded bg-cn-border" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-2xl border border-cn-border bg-cn-surface p-5">
            <div className="h-3 w-20 rounded bg-cn-border mb-3" />
            <div className="h-7 w-16 rounded bg-cn-border" />
          </div>
        ))}
      </div>

      {/* AI Tools */}
      <div className="rounded-2xl border border-cn-border bg-cn-surface p-6">
        <div className="h-5 w-36 rounded bg-cn-border mb-5" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-cn-border bg-cn-canvas p-4">
              <div className="h-8 w-8 rounded bg-cn-border mb-3" />
              <div className="h-4 w-32 rounded bg-cn-border mb-2" />
              <div className="h-3 w-full rounded bg-cn-border" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart + performance */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="h-5 w-40 rounded bg-cn-border mb-4" />
          <div className="h-36 w-full rounded-xl bg-cn-border" />
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="h-5 w-36 rounded bg-cn-border mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-3 w-24 rounded bg-cn-border mb-2" />
                <div className="h-2 w-full rounded-full bg-cn-border" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
