"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    async function loadNotifications() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data);
      setLoading(false);

      // Listen for realtime notifications
      let channel: any = null;
      if (typeof supabase.channel === "function") {
        channel = supabase
          .channel("realtime_notifications")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload: any) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          })
          .subscribe();
      }

      return () => {
        if (channel && typeof supabase.removeChannel === "function") {
          supabase.removeChannel(channel);
        }
      };
    }
    loadNotifications();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen && unreadCount > 0 && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Mark all as read locally instantly for UI responsiveness
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        
        // Update database
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
      }
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-cn-surface dark:hover:bg-white/5 text-cn-ink-subtle transition-all relative border border-transparent hover:border-cn-border dark:hover:border-white/5 group"
        title="Notifications"
      >
        <svg className="w-5 h-5 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse border border-cn-canvas dark:border-background"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl overflow-hidden border-cn-border dark:border-white/10 origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-cn-surface/90 dark:bg-black/60 px-5 py-4 border-b border-cn-border dark:border-white/5 flex justify-between items-center backdrop-blur-xl">
            <h3 className="font-bold text-cn-ink dark:text-white">Notifications</h3>
            {unreadCount > 0 && <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full font-black">{unreadCount} New</span>}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-cn-canvas/40 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl">
            {loading ? (
              <div className="p-8 text-center text-cn-ink-subtle text-sm animate-pulse">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-cn-ink-subtle font-medium text-sm">No new notifications</p>
                <p className="text-[10px] text-cn-ink-muted mt-1 uppercase tracking-widest">You're all caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-cn-border dark:divide-white/5">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 transition-colors hover:bg-cn-surface/50 dark:hover:bg-white/[0.02] ${!notif.is_read ? 'bg-indigo-500/5' : ''}`}>
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${!notif.is_read ? 'bg-indigo-500 text-white shadow-md' : 'bg-cn-border dark:bg-white/10 text-cn-ink-subtle'}`}>
                         {notif.type === 'billing' ? <span className="text-xs">💰</span> : notif.type === 'learning' ? <span className="text-xs">📚</span> : <span className="text-xs">🔔</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.is_read ? 'font-bold text-cn-ink dark:text-white' : 'font-medium text-cn-ink-subtle dark:text-white/80'}`}>{notif.title}</p>
                        <p className="text-xs text-cn-ink-muted mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-2">{formatTime(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
