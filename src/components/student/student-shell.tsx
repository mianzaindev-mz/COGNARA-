"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useNotifications } from "@/hooks/use-notifications";
import { CognaraLogo } from "@/components/shared/cognara-logo";

const nav = [
  { href: "/dashboard", label: "Home", icon: "dashboard", activeFill: true },
  { href: "/my-courses", label: "Courses", icon: "book_2", activeFill: false },
  { href: "/library", label: "Library", icon: "local_library", activeFill: false },
  { href: "/editor", label: "Code lab", icon: "terminal", activeFill: false },
  { href: "/notebook", label: "Notebook", icon: "auto_stories", activeFill: false },
  { href: "/agent", label: "Agent", icon: "magic_button", activeFill: false },
  { href: "/quizzes", label: "Quizzes", icon: "assignment", activeFill: false },
  { href: "/progress", label: "Progress", icon: "bar_chart_4_bars", activeFill: false },
  { href: "/peer", label: "Peer", icon: "hub", activeFill: false },
] as const;

type StudentShellProps = {
  displayName: string;
  email: string | undefined;
  creditBalance: number | null;
  children: React.ReactNode;
};

export function StudentShell({ displayName, email, children }: StudentShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
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
  const handle = email?.split("@")[0] ? `@${email.split("@")[0]}` : "@learner";

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/my-courses")
      return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/learn");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Parallax Effect for Background Blobs
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const blobs = document.querySelectorAll('.parallax-blob');
      blobs.forEach(blob => {
        const speed = parseFloat(blob.getAttribute('data-speed') || "0");
        const x = (window.innerWidth - e.clientX * speed) / 20;
        const y = (window.innerHeight - e.clientY * speed) / 20;
        (blob as HTMLElement).style.transform = `translateX(${x}px) translateY(${y}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="student-portal font-body-md text-on-surface selection:bg-primary/30 min-h-screen bg-background overflow-x-hidden relative">
      {/* Subtle Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[10%] w-[700px] h-[700px] glow-accent-purple parallax-blob" data-speed="0.05"></div>
        <div className="absolute bottom-[20%] left-[-10%] w-[800px] h-[800px] glow-accent-teal parallax-blob" data-speed="-0.03"></div>
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] glow-accent-yellow parallax-blob" data-speed="0.04"></div>
      </div>

      {/* Persistent Sidebar */}
      <aside className="fixed left-0 top-0 h-full bg-surface-container-lowest/20 backdrop-blur-3xl border-r border-black/5 dark:border-white/5 shadow-[25px_0_50px_rgba(0,0,0,0.05)] dark:shadow-[25px_0_50px_rgba(0,0,0,0.4)] flex flex-col py-8 z-[60] overflow-hidden group/sidebar" id="main-sidebar">
        {/* Brand */}
        <Link href="/" className="mb-10 px-5 flex items-center gap-4 shrink-0 h-10">
          <CognaraLogo 
            variant="full" 
            size={32} 
            className="[&>span.flex-col]:opacity-0 [&>span.flex-col]:-translate-x-2.5 [&>span.flex-col]:transition-all [&>span.flex-col]:duration-500 [&>span.flex-col]:pointer-events-none group-hover/sidebar:[&>span.flex-col]:opacity-100 group-hover/sidebar:[&>span.flex-col]:translate-x-0 group-hover/sidebar:[&>span.flex-col]:pointer-events-auto" 
          />
        </Link>

        {/* Navigation Group */}
        <div className="nav-glass-container flex flex-col custom-scrollbar overflow-y-auto overflow-x-hidden h-fit shrink-0">
          <nav className="space-y-1">
            {nav.map(({ href, label, icon, activeFill }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
                  <div className="nav-icon-wrapper">
                    <span className={`material-symbols-outlined text-[24px] ${active ? '' : 'text-on-surface-variant'}`} style={active && activeFill ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {icon}
                    </span>
                  </div>
                  <span className={`nav-text ${active ? '' : 'text-on-surface-variant'}`}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Flexible Spacer */}
        <div className="flex-1"></div>

        {/* System Group */}
        <div className="nav-glass-container mb-2 shrink-0">
          <nav className="space-y-1">

            
            <Link href="/settings" className={`nav-item ${isActive("/settings") ? 'active' : ''}`}>
              <div className="nav-icon-wrapper">
                <span className={`material-symbols-outlined text-[20px] ${isActive("/settings") ? '' : 'text-on-surface-variant'}`} style={isActive("/settings") ? { fontVariationSettings: "'FILL' 1" } : undefined}>settings_suggest</span>
              </div>
              <span className={`nav-text ${isActive("/settings") ? '' : 'text-on-surface-variant'}`}>Settings</span>
            </Link>
            <Link href="/billing" className={`nav-item ${isActive("/billing") ? 'active' : ''}`}>
              <div className="nav-icon-wrapper">
                <span className={`material-symbols-outlined text-[20px] ${isActive("/billing") ? '' : 'text-on-surface-variant'}`} style={isActive("/billing") ? { fontVariationSettings: "'FILL' 1" } : undefined}>account_balance_wallet</span>
              </div>
              <span className={`nav-text ${isActive("/billing") ? '' : 'text-on-surface-variant'}`}>Billing</span>
            </Link>
            <div className="nav-item group/signout cursor-pointer">
              <div className="nav-icon-wrapper">
                <span className="material-symbols-outlined text-[20px] text-error/80 group-hover/signout:text-error transition-colors">power_settings_new</span>
              </div>
              <div className="nav-text relative w-full h-full flex items-center">
                <SignOutButton variant="sidebar" className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer" />
                <span className="text-error/80 font-bold uppercase tracking-wider group-hover/signout:text-error">Sign out</span>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[88px] min-h-screen pb-20 relative z-10 transition-all duration-300">
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-margin-desktop h-[80px] sticky top-0 z-50 bg-surface-container-lowest/30 backdrop-blur-2xl border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-label-md tracking-widest uppercase text-[10px]">Student Workspace / Dashboard</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden lg:block search-focus rounded-full transition-all">
              <input 
                className="bg-surface-container-low/30 border border-black/5 dark:border-white/5 rounded-full pl-6 pr-32 py-2.5 text-sm focus:ring-0 w-80 transition-all outline-none backdrop-blur-md placeholder:text-on-surface-variant/40" 
                placeholder="Search courses, lessons..." 
                type="text"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-3 pr-1">
                <span className="text-[10px] font-bold text-on-surface-variant/30 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-black/5 dark:border-white/5 tracking-tighter">⌘K</span>
                <button className="w-9 h-9 bg-primary/90 hover:bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 interactive-element transition-all group-hover:scale-105 active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/billing" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-cn-orange/10 hover:bg-cn-orange/20 text-cn-orange font-bold transition-all interactive-element group shadow-lg shadow-cn-orange/5">
                <span className="material-symbols-outlined text-[18px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-sm">Upgrade Now</span>
              </Link>
              <button 
                onClick={toggleTheme}
                className="p-2 text-on-surface-variant interactive-element hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <span className="material-symbols-outlined">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              </button>
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => {
                    const next = !showNotifications;
                    setShowNotifications(next);
                    if (next && unreadCount > 0) markAllAsRead();
                  }}
                  className="relative p-2 text-on-surface-variant interactive-element hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                >
                  <span className="material-symbols-outlined">notifications_active</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface-container-high border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center">
                      <h4 className="font-bold text-on-surface">Notifications</h4>
                      <span className="text-xs text-primary cursor-pointer hover:underline" onClick={markAllAsRead}>Mark all as read</span>
                    </div>
                    <div className="flex flex-col max-h-[300px] overflow-y-auto">
                      {loading ? (
                        <div className="p-8 text-center text-on-surface-variant text-sm animate-pulse">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-on-surface-variant text-sm">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                            <p className={`text-sm ${!notif.is_read ? 'font-bold text-on-surface' : 'font-semibold text-on-surface-variant'}`}>{notif.title}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{notif.message}</p>
                            <p className="text-[10px] text-primary mt-2">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-black/10 dark:border-white/10 text-center">
                      <Link href="/settings" onClick={() => setShowNotifications(false)} className="text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors">
                        Notification settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-black/10 dark:border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="font-label-md text-on-surface leading-none">{displayName}</p>
                  <p className="text-[10px] text-on-surface-variant opacity-70">{handle}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center border border-black/10 dark:border-white/20 text-white font-bold shadow-lg interactive-element">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
