"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import { CognaraLogo } from "@/components/shared/cognara-logo";
import { useNotifications } from "@/hooks/use-notifications";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/users",     label: "Users",     icon: "group" },
  { href: "/admin/coaches",   label: "Coaches",   icon: "verified_user" },
  { href: "/admin/courses",   label: "Courses",   icon: "menu_book" },
  { href: "/admin/reports",   label: "Reports",   icon: "bar_chart" },
  { href: "/admin/support",   label: "Support",   icon: "support_agent" },
] as const;

type AdminShellProps = {
  displayName: string;
  email?: string;
  children: React.ReactNode;
};

export function AdminShell({ displayName, email, children }: AdminShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [signingOut, setSigningOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/demo-login", { method: "DELETE" }).catch(() => {});
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out failed:", err);
      window.location.href = "/login";
    }
  }

  return (
    <div className={`admin-theme ${theme} min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] font-sans selection:bg-[#dc143c]/30 selection:text-white transition-colors duration-300`}>
      {/* Dynamic Font and Icon sheets loading */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Side Navigation Sidebar */}
      <aside
        id="sidebar"
        className="fixed left-0 top-0 h-full z-50 bg-[var(--admin-sidebar-bg)] backdrop-blur-3xl border-r border-[var(--admin-border)] flex flex-col shadow-[var(--admin-sidebar-shadow)] transition-all duration-400 group/sidebar"
      >
        {/* Sidebar Header Section */}
        <Link href="/admin/dashboard" className="h-20 flex items-center px-5 gap-3.5 shrink-0">
          <div className="shrink-0 flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(220,20,60,0.25)]">
            <CognaraLogo variant="icon" size={32} />
          </div>
          <span className="sidebar-content text-headline-sm font-extrabold tracking-tight text-[var(--admin-card-text-primary)]">
            COGNARA
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col mt-6 gap-2 px-2">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center h-12 px-4 gap-4 transition-all rounded-xl border ${
                  active
                    ? "text-[var(--admin-sidebar-active-text)] bg-[var(--admin-sidebar-active-bg)] border-[var(--admin-sidebar-active-border)] sidebar-active-pill"
                    : "text-[var(--admin-card-text-muted)] opacity-60 hover:opacity-100 hover:text-[var(--admin-card-text-primary)] hover:bg-[var(--admin-sidebar-hover-bg)] border-transparent"
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${active ? "text-[#dc143c]" : ""}`}>
                  {icon}
                </span>
                <span className="sidebar-content font-label-caps text-[11px] tracking-[0.15em] uppercase">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 mb-6 space-y-1">
          <Link
            href="/admin/settings"
            className="flex items-center h-12 w-full px-4 gap-4 text-[var(--admin-card-text-muted)] opacity-60 hover:opacity-100 hover:text-[#dc143c] hover:bg-[#dc143c]/10 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="sidebar-content font-label-caps text-[11px] tracking-[0.15em] uppercase">
              Settings
            </span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center h-12 w-full px-4 gap-4 text-[var(--admin-card-text-muted)] opacity-60 hover:opacity-100 hover:text-[#dc143c] hover:bg-[#dc143c]/10 rounded-xl transition-all"
            style={signingOut ? { opacity: 0.5, pointerEvents: "none" } : undefined}
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="sidebar-content font-label-caps text-[11px] tracking-[0.15em] uppercase">
              {signingOut ? "Signing out..." : "Sign out"}
            </span>
          </button>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 right-0 left-[80px] group-hover/sidebar:left-[260px] h-20 flex justify-between items-center px-10 z-40 bg-[var(--admin-header-bg)] backdrop-blur-xl border-b border-[var(--admin-border)] transition-all duration-400">
        <div className="flex items-center gap-8">
          <h1 className="font-label-caps text-[11px] font-black tracking-[0.25em] text-[#dc143c] uppercase">
            Platform Control
          </h1>
          <div className="flex items-center gap-3 bg-[var(--admin-teal)]/5 px-4 py-1.5 rounded-full border border-[var(--admin-teal)]/10">
            <div className="w-2 h-2 rounded-full pulse-teal"></div>
            <span className="text-[10px] font-bold text-[var(--admin-teal)] tracking-widest uppercase">
              System Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="relative group/search">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-card-text-subtle)] group-hover/search:text-[#dc143c] text-lg transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder="Search systems..."
              className="bg-[var(--admin-input-bg)] border border-[var(--admin-input-border)] rounded-full pl-11 pr-6 py-2 text-sm w-56 focus:w-72 focus:border-[var(--admin-input-focus-border)] focus:bg-[var(--admin-input-focus-bg)] transition-all outline-none text-[var(--admin-card-text-primary)] placeholder-[var(--admin-card-text-subtle)]"
            />
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[var(--admin-card-text-muted)] opacity-60 hover:opacity-100 hover:text-[#dc143c] transition-colors"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              <span className="material-symbols-outlined">
                {theme === "light" ? "dark_mode" : "light_mode"}
              </span>
            </button>
            
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  const next = !showNotifications;
                  setShowNotifications(next);
                  if (next && unreadCount > 0) markAllAsRead();
                }}
                className="relative p-2 text-[var(--admin-card-text-muted)] opacity-60 hover:opacity-100 hover:text-[#dc143c] transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--admin-sidebar-bg)] border border-[var(--admin-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-[var(--admin-border)] flex justify-between items-center">
                    <h4 className="font-bold text-[var(--admin-card-text-primary)]">Notifications</h4>
                    <span className="text-xs text-[#dc143c] cursor-pointer hover:underline" onClick={markAllAsRead}>Mark all as read</span>
                  </div>
                  <div className="flex flex-col max-h-[300px] overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center text-[var(--admin-card-text-subtle)] text-sm animate-pulse">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-[var(--admin-card-text-subtle)] text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-[var(--admin-border)] hover:bg-[var(--admin-card-text-primary)]/[0.04] cursor-pointer transition-colors">
                          <p className={`text-sm ${!notif.is_read ? 'font-bold text-[var(--admin-card-text-primary)]' : 'font-semibold text-[var(--admin-card-text-muted)]'}`}>{notif.title}</p>
                          <p className="text-xs text-[var(--admin-card-text-subtle)] mt-1">{notif.message}</p>
                          <p className="text-[10px] text-[#dc143c] mt-2">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-[var(--admin-border)] text-center">
                    <Link href="/admin/settings" onClick={() => setShowNotifications(false)} className="text-xs text-[var(--admin-card-text-muted)] hover:text-[#dc143c] font-semibold transition-colors">
                      Notification settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-[1px] h-6 bg-[var(--admin-border)]"></div>

            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-[var(--admin-card-text-primary)]">{displayName}</span>
                <span className="text-[9px] text-[var(--admin-card-text-subtle)] font-bold tracking-widest uppercase">
                  Superuser
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dc143c] to-[#920022] flex items-center justify-center text-white font-bold ring-1 ring-white/10 group-hover:shadow-[0_0_20px_rgba(220,20,60,0.3)] transition-all">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pl-[80px] group-hover/sidebar:pl-[260px] pt-20 pb-24 min-h-screen transition-all duration-400">
        <div className="max-w-[1600px] mx-auto p-12 space-y-12">{children}</div>
      </main>

      {/* Premium Status Footer */}
      <footer className="fixed bottom-0 right-0 left-[80px] group-hover/sidebar:left-[260px] h-12 flex items-center px-10 z-40 bg-[var(--admin-sidebar-bg)] backdrop-blur-2xl border-t border-[var(--admin-border)] shadow-[var(--admin-footer-shadow)] transition-all duration-400">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <span className="font-data-mono text-[9px] text-[var(--admin-card-text-subtle)] font-bold tracking-[0.2em] uppercase">
              Net Status
            </span>
            <div className="w-16 h-1 bg-[var(--admin-card-text-primary)]/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#dc143c] w-3/4 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--admin-card-text-primary)]/[0.02] rounded-full border border-[var(--admin-border)]">
              <div className="w-1.5 h-1.5 rounded-full pulse-teal"></div>
              <span className="font-data-mono text-[9px] font-bold text-[var(--admin-card-text-muted)] tracking-wider">
                Core DB
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--admin-card-text-primary)]/[0.02] rounded-full border border-[var(--admin-border)]">
              <div className="w-1.5 h-1.5 rounded-full pulse-teal"></div>
              <span className="font-data-mono text-[9px] font-bold text-[var(--admin-card-text-muted)] tracking-wider">
                AI Engine
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--admin-card-text-primary)]/[0.02] rounded-full border border-[var(--admin-border)]">
              <div className="w-1.5 h-1.5 rounded-full pulse-teal"></div>
              <span className="font-data-mono text-[9px] font-bold text-[var(--admin-card-text-muted)] tracking-wider">
                Gateway
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--admin-card-text-primary)]/[0.02] rounded-full border border-[var(--admin-border)]">
              <div className="w-1.5 h-1.5 rounded-full pulse-amber"></div>
              <span className="font-data-mono text-[9px] font-bold text-[var(--admin-card-text-muted)] tracking-wider">
                Media Stream
              </span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-10">
          <div className="flex items-center gap-3">
            <span className="font-data-mono text-[9px] text-[var(--admin-card-text-subtle)] font-bold tracking-widest uppercase">
              Latency
            </span>
            <span className="font-data-mono text-[10px] text-[var(--admin-teal)] font-black">14MS</span>
          </div>
          <div className="w-[1px] h-4 bg-[var(--admin-border)]"></div>
          <span className="font-data-mono text-[9px] text-[var(--admin-card-text-subtle)] font-bold tracking-[0.2em]">
            v1.9.0-BETA
          </span>
        </div>
      </footer>
    </div>
  );
}
