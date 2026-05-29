"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidUUID } from "@/lib/utils/uuid";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user || !isValidUUID(user.id)) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active) return;
      if (data) setNotifications(data);
      setLoading(false);

      // Listen for realtime notifications
      if (typeof supabase.channel === "function") {
        const channelName = `realtime_notifications_${user.id}`;
        
        try {
          if (typeof supabase.getChannels === "function" && typeof supabase.removeChannel === "function") {
            const existing = supabase.getChannels().find((c: any) => c.name === channelName);
            if (existing) {
              await supabase.removeChannel(existing);
            }
          }
        } catch (err) {
          console.warn("Failed to remove existing channel:", err);
        }

        if (!active) return;

        const newChannel = supabase
          .channel(channelName)
          .on(
            "postgres_changes", 
            { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, 
            (payload: any) => {
              setNotifications((prev) => [payload.new as AppNotification, ...prev]);
            }
          );

        if (!active) return;

        channel = newChannel;
        newChannel.subscribe();
      }
    }

    loadNotifications();

    return () => {
      active = false;
      if (channel && typeof supabase.removeChannel === "function") {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const markAllAsRead = async () => {
    const supabase = supabaseRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isValidUUID(user.id)) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead
  };
}
