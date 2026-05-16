"use client";

const DEMO_SESSIONS = [
  { id: "1", title: "Data Structures Review", host: "Ali K.", topic: "DSA", date: "Tomorrow 7PM", spots: "4/10", price: "Free", status: "open" },
  { id: "2", title: "Python Practice Problems", host: "Sara M.", topic: "Python", date: "May 18, 5PM", spots: "8/10", price: "$3.00", status: "open" },
  { id: "3", title: "React Hooks Deep Dive", host: "Ahmed R.", topic: "React", date: "May 20, 6PM", spots: "10/10", price: "$5.00", status: "full" },
];

export default function PeerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Peer Sessions</h1>
          <p className="mt-0.5 text-sm text-cn-ink-muted">
            Learn with fellow students. Host or join peer tutoring sessions.
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-cn-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
        >
          + Host a Session
        </button>
      </div>

      {/* Peer disclaimer */}
      <div className="rounded-2xl border border-cn-yellow/30 bg-cn-yellow/5 p-4">
        <div className="flex gap-3">
          <span className="text-lg">👥</span>
          <div>
            <p className="text-sm font-bold text-cn-ink">PEER SESSION — UNVERIFIED</p>
            <p className="mt-0.5 text-xs text-cn-ink-muted">
              Hosted by students. Not endorsed by COGNARA. Content may contain errors.
              All peer sessions capped at $8.00 max.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_SESSIONS.map((session) => (
          <div
            key={session.id}
            className="flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-cn-lavender/20 px-2 py-0.5 text-[10px] font-bold text-cn-lavender">
                PEER
              </span>
              <span className="text-[10px] text-cn-ink-subtle">{session.topic}</span>
            </div>
            <h3 className="mb-1 font-bold text-cn-ink">{session.title}</h3>
            <p className="text-xs text-cn-ink-muted">Hosted by {session.host}</p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-cn-canvas p-2">
                <p className="font-bold text-cn-ink">{session.date.split(",")[0]}</p>
                <p className="text-cn-ink-subtle">Date</p>
              </div>
              <div className="rounded-xl bg-cn-canvas p-2">
                <p className="font-bold text-cn-ink">{session.spots}</p>
                <p className="text-cn-ink-subtle">Spots</p>
              </div>
              <div className="rounded-xl bg-cn-canvas p-2">
                <p className={`font-bold ${session.price === "Free" ? "text-emerald-500" : "text-cn-ink"}`}>{session.price}</p>
                <p className="text-cn-ink-subtle">Price</p>
              </div>
            </div>

            <button
              type="button"
              disabled={session.status === "full"}
              className="mt-4 w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
            >
              {session.status === "full" ? "Session Full" : "Register"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
