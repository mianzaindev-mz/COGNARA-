"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useNotifications } from "@/hooks/use-notifications";
import { CognaraLogo } from "@/components/shared/cognara-logo";

const nav = [
  { href: "/coach/dashboard", label: "Dashboard", icon: "grid_view" },
  { href: "/coach/courses",   label: "Courses",   icon: "menu_book" },
  { href: "/coach/library",   label: "My library",  icon: "account_balance" },
  { href: "/coach/agent",     label: "Agent",    icon: "magic_button" },
  { href: "/coach/students",  label: "Students",  icon: "group" },
  { href: "/coach/analytics", label: "Analytics",  icon: "bar_chart" },
  { href: "/coach/earnings",  label: "Earnings",   icon: "wallet" },
  { href: "/coach/quizzes",   label: "Quiz builder", icon: "assignment" },
  { href: "/coach/verification", label: "Verification", icon: "verified_user" },
  { href: "/coach/support",   label: "Support",    icon: "confirmation_number" },
] as const;

type CoachShellProps = {
  displayName: string;
  monthlyEarnings?: number;
  children: React.ReactNode;
};

export function CoachShell({ displayName, monthlyEarnings, children }: CoachShellProps) {
  const pathname = usePathname();
  const initials = displayName.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
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

  return (
    <div className="coach-theme coach-mesh bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary overflow-x-hidden min-h-screen">
      {/* Sidebar Shell */}
      <aside 
        className={`coach-sidebar fixed left-0 top-0 h-screen flex flex-col items-center py-8 z-50 border-r border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isSidebarHovered ? 'w-[260px]' : 'w-[80px]'}`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        {/* Branding */}
        <div className="mb-10 w-full flex items-center px-4 overflow-hidden h-12 animate-in fade-in duration-300">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.25)]">
            <CognaraLogo variant="icon" size={32} />
          </div>
          <div className={`coach-brand-text ml-4 flex flex-col justify-center transition-all duration-300 ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <span className="text-cn-ink dark:text-white font-extrabold text-base tracking-tight whitespace-nowrap flex items-center">
              COGNARA<span className="text-[8px] opacity-40 font-bold ml-0.5">TM</span>
              <span className="text-[9px] font-black tracking-widest text-primary ml-2 uppercase">COACH</span>
            </span>
          </div>
        </div>

        {/* Sidebar Items Container */}
        <div className="flex-1 flex flex-col items-center justify-between w-full pb-8 px-4 overflow-hidden">
          {/* Navigation Pod Top */}
          <div className="flex flex-col gap-2 w-full">
            {nav.map(({ href, label, icon }, index) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link 
                  key={href} 
                  href={href} 
                  className={`coach-nav-item ${active ? 'active' : ''}`}
                >
                  <div className="coach-nav-icon">
                    <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {icon}
                    </span>
                  </div>
                  <span 
                    className="coach-nav-label font-semibold text-sm whitespace-nowrap"
                    style={{ transitionDelay: isSidebarHovered ? `${0.1 + (index * 0.05)}s` : '0s' }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Navigation Pod Bottom */}
          <div className="flex flex-col gap-2 w-full pt-6 border-t border-black/5 dark:border-white/5">
            <Link 
              href="/coach/settings" 
              className={`coach-nav-item ${pathname === '/coach/settings' ? 'active' : ''}`}
            >
              <div className="coach-nav-icon">
                <span className="material-symbols-outlined" style={pathname === '/coach/settings' ? { fontVariationSettings: "'FILL' 1" } : undefined}>settings</span>
              </div>
              <span className="coach-nav-label font-semibold text-sm whitespace-nowrap" style={{ transitionDelay: isSidebarHovered ? '0.1s' : '0s' }}>Settings</span>
            </Link>
            
            <div className="coach-nav-item hover:!text-error hover:!bg-error/10 cursor-pointer">
              <div className="coach-nav-icon">
                <span className="material-symbols-outlined">logout</span>
              </div>
              <span className="coach-nav-label font-semibold text-sm whitespace-nowrap" style={{ transitionDelay: isSidebarHovered ? '0.15s' : '0s' }}>Sign Out</span>
              <SignOutButton variant="sidebar" className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer" />
            </div>
          </div>
        </div>
      </aside>

      {/* Top App Bar */}
      <header 
        className={`coach-header fixed top-0 left-0 right-0 bg-white/40 dark:bg-background/40 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 flex justify-between items-center pr-margin-desktop py-4 z-40 transition-all duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] ${isSidebarHovered ? 'pl-[272px]' : 'pl-[96px]'}`}
      >
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <h1 className="font-headline-md text-xl font-black text-on-surface tracking-tight">Coach Studio</h1>
            <p className="text-[9px] tracking-[0.3em] text-primary/80 font-black uppercase">Elite Performance Hub</p>
          </div>
          <nav className="hidden md:flex gap-8">
            <Link href="/coach/dashboard" className={`font-bold text-sm py-2 relative transition-all ${pathname === '/coach/dashboard' ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface'}`}>
              Overview
              {pathname === '/coach/dashboard' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]"></span>}
            </Link>
            <Link href="/coach/analytics" className={`font-bold text-sm py-2 relative transition-all ${pathname === '/coach/analytics' ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface'}`}>
              Insights
              {pathname === '/coach/analytics' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]"></span>}
            </Link>
            <Link href="/coach/courses" className={`font-bold text-sm py-2 relative transition-all ${pathname === '/coach/courses' ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface'}`}>
              Tools
              {pathname === '/coach/courses' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]"></span>}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group hidden lg:block">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/20 group-focus-within:text-primary transition-colors text-xl">search</span>
            <input className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl pl-11 pr-6 py-2 w-72 text-sm focus:ring-1 focus:ring-primary/30 focus:bg-black/5 dark:focus:bg-white/5 transition-all outline-none" placeholder="Search insights..." type="text"/>
          </div>
          <div className="flex items-center gap-4 border-l border-black/5 dark:border-white/5 pl-6">
            <ThemeToggle />
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  const next = !showNotifications;
                  setShowNotifications(next);
                  if (next && unreadCount > 0) markAllAsRead();
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-on-surface-variant transition-all relative border border-black/5 dark:border-white/5"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full pulse-dot animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>}
              </button>
              
              {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-3xl">
                    <div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-black/40">
                      <h4 className="font-bold text-cn-ink dark:text-white text-sm">Notifications</h4>
                      <span className="text-xs text-primary hover:text-indigo-500 cursor-pointer font-semibold transition-colors" onClick={markAllAsRead}>Mark all as read</span>
                    </div>
                    <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                      {loading ? (
                        <div className="p-8 text-center text-black/40 dark:text-white/40 text-sm animate-pulse">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-black/40 dark:text-white/40 text-sm">
                          No new transmissions
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors text-left">
                            <p className={`text-sm ${!notif.is_read ? 'font-bold text-cn-ink dark:text-white' : 'font-semibold text-black/50 dark:text-white/50'}`}>{notif.title}</p>
                            <p className="text-xs text-black/40 dark:text-white/40 mt-1">{notif.message}</p>
                            <p className="text-[10px] text-primary mt-2 font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot"></span>
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-black/5 dark:border-white/5 text-center bg-black/5 dark:bg-black/40">
                      <Link href="/coach/settings" onClick={() => setShowNotifications(false)} className="text-xs text-black/40 dark:text-white/40 hover:text-primary font-semibold transition-colors">
                        Transmission settings
                      </Link>
                    </div>
                  </div>
                )}
            </div>
            
            <div className="flex items-center gap-3 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 px-4 py-1.5 rounded-xl group cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white font-black text-[10px] shadow-lg">{initials}</div>
              <div className="hidden xl:block">
                <p className="text-[11px] font-black leading-tight text-on-surface">{displayName}</p>
                <p className="text-[9px] text-primary font-bold leading-tight mt-0.5">${monthlyEarnings !== undefined ? monthlyEarnings.toFixed(2) : "0.00"}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary transition-colors text-lg">expand_more</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={`pt-28 px-margin-desktop pb-16 relative z-10 entrance-stagger transition-all duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] ${isSidebarHovered ? 'ml-[260px]' : 'ml-[80px]'}`}
      >
        {children}
      </main>
    </div>
  );
}
