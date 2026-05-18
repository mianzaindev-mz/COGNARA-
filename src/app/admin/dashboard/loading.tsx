export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded-lg bg-cn-border" />
        <div className="mt-2 h-4 w-56 rounded bg-cn-border" />
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

      {/* Revenue + queue */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="h-5 w-40 rounded bg-cn-border mb-4" />
          <div className="h-36 w-full rounded-xl bg-cn-border" />
        </div>
        <div className="lg:col-span-2 cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="h-5 w-32 rounded bg-cn-border mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-full rounded-xl bg-cn-border" />
            ))}
          </div>
        </div>
      </div>

      {/* Security events */}
      <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
        <div className="h-5 w-32 rounded bg-cn-border mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 w-full rounded-xl bg-cn-border" />
          ))}
        </div>
      </div>
    </div>
  );
}
