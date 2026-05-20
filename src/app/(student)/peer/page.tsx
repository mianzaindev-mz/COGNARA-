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
  const [sessions, setSessions] = useState<PeerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Custom interactive state for Hosting
  const [hostOpen, setHostOpen] = useState(false);
  const [hosting, setHosting] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    topic: "",
    date: "",
    maxSpots: 10,
    price: "Free",
  });

  const loadSessions = async (currentUserId: string | null) => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("peer_sessions")
        .select(`
          id,
          title,
          topic,
          scheduled_at,
          max_students,
          price_usd,
          host_id,
          profiles:host_id (
            full_name
          ),
          peer_attendees (
            student_id
          )
        `)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      if (data) {
        const formatted: PeerSession[] = data.map((s: any) => {
          const isHost = s.host_id === currentUserId;
          const attendeeIds = s.peer_attendees ? s.peer_attendees.map((a: any) => a.student_id) : [];
          const isRegistered = attendeeIds.includes(currentUserId) || isHost;
          
          const d = new Date(s.scheduled_at);
          const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

          return {
            id: s.id,
            title: s.title,
            host: isHost ? "You (Host)" : (s.profiles?.full_name || "Student Tutor"),
            topic: s.topic || "General",
            date: dateStr,
            maxSpots: s.max_students || 10,
            registered: attendeeIds.length,
            price: Number(s.price_usd) === 0 ? "Free" : `$${Number(s.price_usd).toFixed(2)}`,
            isRegistered,
          };
        });
        setSessions(formatted);
      }
    } catch (err: any) {
      console.error("Error loading peer sessions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      let currentUserId: string | null = null;
      if (user) {
        setUserId(user.id);
        currentUserId = user.id;
      }
      await loadSessions(currentUserId);
    }
    void init();
  }, []);

  const handleRegister = async (sessionId: string) => {
    if (!userId) {
      alert("Please log in to register for peer sessions!");
      return;
    }
    setRegistering(sessionId);

    const supabase = createClient();
    if (!supabase) {
      setRegistering(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("peer_attendees")
        .insert({
          session_id: sessionId,
          student_id: userId,
          disclaimer_confirmed: true
        });

      if (error) throw error;

      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, registered: s.registered + 1, isRegistered: true }
          : s
      ));
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setRegistering(null);
    }
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Please log in to host study sessions!");
      return;
    }
    if (!newSession.title || !newSession.topic || !newSession.date) {
      alert("Please fill in all required fields!");
      return;
    }

    setHosting(true);
    const supabase = createClient();
    if (!supabase) {
      setHosting(false);
      return;
    }

    try {
      const parsedPrice = newSession.price === "Free" ? 0 : Number(newSession.price);

      const { data, error } = await supabase
        .from("peer_sessions")
        .insert({
          host_id: userId,
          title: newSession.title,
          topic: newSession.topic,
          scheduled_at: newSession.date,
          max_students: Number(newSession.maxSpots),
          price_usd: parsedPrice,
          status: "scheduled",
          host_confirmed_student: true
        })
        .select(`
          id,
          title,
          topic,
          scheduled_at,
          max_students,
          price_usd,
          host_id,
          profiles:host_id (
            full_name
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        const d = new Date(data.scheduled_at);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

        const added: PeerSession = {
          id: data.id,
          title: data.title,
          host: "You (Host)",
          topic: data.topic || "General",
          date: dateStr,
          maxSpots: data.max_students || 10,
          registered: 0,
          price: Number(data.price_usd) === 0 ? "Free" : `$${Number(data.price_usd).toFixed(2)}`,
          isRegistered: true,
        };

        setSessions(prev => [added, ...prev]);
        setNewSession({
          title: "",
          topic: "",
          date: "",
          maxSpots: 10,
          price: "Free",
        });
        setHostOpen(false);
      }
    } catch (err: any) {
      alert(`Failed to create session: ${err.message}`);
    } finally {
      setHosting(false);
    }
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
          onClick={() => setHostOpen(true)}
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

      {/* Host a Session Modal */}
      {hostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-cn-surface w-full max-w-[440px] rounded-[24px] p-6 shadow-2xl border border-cn-border animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-cn-ink">Host a Study Session</h3>
              <button
                type="button"
                onClick={() => setHostOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cn-canvas text-cn-ink-muted"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => void handleHostSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Calculus Workshop"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Subject / Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calculus"
                    value={newSession.topic}
                    onChange={(e) => setNewSession(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Date & Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. May 25, 4PM"
                    value={newSession.date}
                    onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Max Spots</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={newSession.maxSpots}
                    onChange={(e) => setNewSession(prev => ({ ...prev, maxSpots: Math.max(2, Number(e.target.value)) }))}
                    className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Price (Free or $)</label>
                  <select
                    value={newSession.price}
                    onChange={(e) => setNewSession(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                  >
                    <option value="Free">Free</option>
                    <option value="1.00">$1.00</option>
                    <option value="3.00">$3.00</option>
                    <option value="5.00">$5.00</option>
                    <option value="8.00">$8.00 (Max Limit)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={hosting}
                className="w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50 mt-2"
              >
                {hosting ? "Publishing Session…" : "Create Session"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
