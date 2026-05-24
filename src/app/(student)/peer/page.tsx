"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconUsers } from "@/components/ui/icons";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";
import { LiveCall } from "@/components/shared/LiveCall";
import { useToast } from "@/components/ui/toast-provider";

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
  isHost: boolean;
  status: string;
  roomUrl?: string;
};


export default function PeerPage() {
  const [sessions, setSessions] = useState<PeerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { notify } = useToast();
  
  // Video Call State
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);

  // Confirmation Modals State
  const [confirmRegister, setConfirmRegister] = useState<string | null>(null);
  const [confirmHost, setConfirmHost] = useState(false);

  // Custom interactive state for Hosting
  const [hostOpen, setHostOpen] = useState(false);
  const [hosting, setHosting] = useState(false);
  const [startingSession, setStartingSession] = useState<string | null>(null);
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
          status,
          daily_room_url,
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
            isHost,
            status: s.status,
            roomUrl: s.daily_room_url
          };
        });
        setSessions(formatted);
      }
    } catch (err: any) {
      console.error("Error loading peer sessions:", err.message);
      setError(err.message || "Failed to load peer sessions");
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
      notify({
        title: "Authentication Required",
        description: "Please log in to register for peer sessions!",
        tone: "warning"
      });
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
      notify({
        title: "Registration Failed",
        description: `Registration failed: ${err.message}`,
        tone: "error"
      });
    } finally {
      setRegistering(null);
      setConfirmRegister(null);
    }
  };

  const handleHostSubmit = async () => {
    if (!userId) {
      notify({
        title: "Authentication Required",
        description: "Please log in to host study sessions!",
        tone: "warning"
      });
      return;
    }
    if (!newSession.title || !newSession.topic || !newSession.date) {
      notify({
        title: "Required Fields",
        description: "Please fill in all required fields!",
        tone: "warning"
      });
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
          scheduled_at: new Date(newSession.date).toISOString(),
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
          status,
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
          isHost: true,
          status: data.status
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
        setConfirmHost(false);
      }
    } catch (err: any) {
      notify({
        title: "Session Creation Failed",
        description: `Failed to create session: ${err.message}`,
        tone: "error"
      });
    } finally {
      setHosting(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    setStartingSession(sessionId);
    try {
      const res = await fetch("/api/live/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: "peer" })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: "live", roomUrl: data.url } : s
      ));
      setActiveCallRoom(data.url);
    } catch (err: any) {
      notify({
        title: "Live Call Launch Failed",
        description: `Failed to start session: ${err.message}`,
        tone: "error"
      });
    } finally {
      setStartingSession(null);
    }
  };

  if (activeCallRoom) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-cn-ink">Live Peer Session</h1>
          <button 
            onClick={() => setActiveCallRoom(null)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-cn-ink hover:bg-white/10 transition"
          >
            Exit Call View
          </button>
        </div>
        <div className="flex-1 min-h-[600px]">
          <LiveCall roomUrl={activeCallRoom} onLeave={() => setActiveCallRoom(null)} />
        </div>
      </div>
    );
  }


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

      {error && (
        <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] animate-pulse"
            >
              <div className="mb-2 h-4 w-24 bg-cn-canvas rounded-lg" />
              <div className="mb-2 h-6 w-3/4 bg-cn-canvas rounded-lg" />
              <div className="mb-4 h-4 w-1/2 bg-cn-canvas rounded-lg" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-cn-canvas rounded-xl" />
                <div className="h-10 bg-cn-canvas rounded-xl" />
                <div className="h-10 bg-cn-canvas rounded-xl" />
              </div>
              <div className="mt-4 h-9 w-full bg-cn-canvas rounded-xl" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center shadow-[var(--cn-shadow-card)] animate-in fade-in duration-300">
          <IconUsers className="h-8 w-8 text-cn-ink-subtle" />
          <h3 className="text-lg font-bold text-cn-ink mt-2">No Study Sessions Scheduled</h3>
          <p className="mt-1 text-sm text-cn-ink-muted max-w-[280px]">
            Be the first to host a peer tutoring session and share your knowledge with other students!
          </p>
          <button
            type="button"
            onClick={() => setHostOpen(true)}
            className="mt-4 rounded-xl bg-cn-orange px-4 py-2 text-xs font-bold text-white transition hover:bg-cn-orange-hover"
          >
            Host First Session
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const isFull = session.registered >= session.maxSpots;
            const isRegLoading = registering === session.id;
            const isStarting = startingSession === session.id;
            
            return (
              <div
                key={session.id}
                className="cn-card-lift flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30 animate-in fade-in duration-300"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cn-lavender/20 px-2 py-0.5 text-[10px] font-bold text-cn-lavender">
                      PEER
                    </span>
                    <span className="text-[10px] text-cn-ink-subtle">{session.topic}</span>
                  </div>
                  {session.status === "live" && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-red-500 uppercase">Live</span>
                    </span>
                  )}
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

                <div className="mt-4 flex flex-col gap-2">
                  {session.status === "live" && session.isRegistered ? (
                    <button
                      type="button"
                      onClick={() => session.roomUrl && setActiveCallRoom(session.roomUrl)}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                    >
                      Join Live Call
                    </button>
                  ) : session.isHost && session.status !== "live" ? (
                    <button
                      type="button"
                      disabled={isStarting}
                      onClick={() => handleStartSession(session.id)}
                      className="w-full rounded-xl bg-cn-sidebar py-2.5 text-sm font-bold text-white transition hover:bg-cn-sidebar/90"
                    >
                      {isStarting ? "Starting..." : "Start Session Now"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isFull || session.isRegistered || isRegLoading}
                      onClick={() => setConfirmRegister(session.id)}
                      className="w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
                    >
                      {isRegLoading ? "Registering…" : session.isRegistered ? "✓ Registered" : isFull ? "Session Full" : "Register Now"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host a Session Modal */}
      {hostOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setHostOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div className="relative bg-cn-surface w-full max-w-[440px] rounded-[24px] p-8 shadow-2xl shadow-black/90 border border-white/30 animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
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

            <div className="space-y-4">
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
                    type="datetime-local"
                    required
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
                type="button"
                disabled={hosting}
                onClick={() => setConfirmHost(true)}
                className="w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50 mt-2"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <DoubleConfirmModal
        isOpen={!!confirmRegister}
        onClose={() => setConfirmRegister(null)}
        onConfirm={() => confirmRegister && handleRegister(confirmRegister)}
        title="Confirm Registration"
        description="Are you sure you want to register for this peer session? You will be expected to attend at the scheduled time."
        actionButtonText="Register Now"
      />

      <DoubleConfirmModal
        isOpen={confirmHost}
        onClose={() => setConfirmHost(false)}
        onConfirm={handleHostSubmit}
        title="Host Study Session"
        description="By hosting this session, you agree to show up on time and provide a helpful learning environment for your peers."
        confirmWord="HOST"
        actionButtonText="Publish Session"
      />
    </div>
  );
}

