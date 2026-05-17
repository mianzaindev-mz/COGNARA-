export default function MyCoursesLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded-lg bg-cn-border" />
        <div className="mt-2 h-4 w-32 rounded bg-cn-border" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 w-20 rounded-full bg-cn-border" />
        ))}
      </div>

      {/* Course grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-2xl border border-cn-border bg-cn-surface p-5">
            <div className="h-32 w-full rounded-xl bg-cn-border mb-4" />
            <div className="h-3 w-16 rounded bg-cn-border mb-2" />
            <div className="h-5 w-3/4 rounded bg-cn-border mb-2" />
            <div className="h-3 w-full rounded bg-cn-border mb-4" />
            <div className="h-2 w-full rounded-full bg-cn-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
