"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconUsers } from "@/components/ui/icons";

type PeerSession = {
  id: string;
  title: string;
  host: string;
  topic: string;
  date: string;
  maxSpots: number;
  registered: number;
  price: string;
  isRegistered: boolean;
};

const DEMO_SESSIONS: PeerSession[] = [
  { id: "1", title: "Data Structures Review", host: "Ali K.", topic: "DSA", date: "Tomorrow 7PM", maxSpots: 10, registered: 4, price: "Free", isRegistered: false },
  { id: "2", title: "Python Practice Problems", host: "Sara M.", topic: "Python", date: "May 20, 5PM", maxSpots: 10, registered: 8, price: "$3.00", isRegistered: false },
  { id: "3", title: "React Hooks Deep Dive", host: "Ahmed R.", topic: "React", date: "May 22, 6PM", maxSpots: 10, registered: 10, price: "$5.00", isRegistered: false },
];

export default function PeerPage() {
  const [sessions, setSessions] = useState<PeerSession[]>(DEMO_SESSIONS);
  const [registering, setRegistering] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    void loadUser();
  }, []);

  const handleRegister = async (sessionId: string) => {
    if (!userId) return;
    setRegistering(sessionId);

    // Simulate registration (in production this would write to a peer_registrations table)
    await new Promise(r => setTimeout(r, 800));

    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, registered: s.registered + 1, isRegistered: true }
        : s
    ));
    setRegistering(null);
  };

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

      <div className="rounded-2xl border border-cn-yellow/30 bg-cn-yellow/5 p-4">
        <div className="flex gap-3">
          <IconUsers className="h-5 w-5" />
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
        {sessions.map((session) => {
          const isFull = session.registered >= session.maxSpots;
          const isLoading = registering === session.id;
          return (
            <div
              key={session.id}
              className="cn-card-lift flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30"
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
                  <p className="font-bold text-cn-ink">{session.registered}/{session.maxSpots}</p>
                  <p className="text-cn-ink-subtle">Spots</p>
                </div>
                <div className="rounded-xl bg-cn-canvas p-2">
                  <p className={`font-bold ${session.price === "Free" ? "text-emerald-500" : "text-cn-ink"}`}>{session.price}</p>
                  <p className="text-cn-ink-subtle">Price</p>
                </div>
              </div>

              <button
                type="button"
                disabled={isFull || session.isRegistered || isLoading}
                onClick={() => void handleRegister(session.id)}
                className="mt-4 w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
              >
                {isLoading ? "Registering…" : session.isRegistered ? "✓ Registered" : isFull ? "Session Full" : "Register"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
