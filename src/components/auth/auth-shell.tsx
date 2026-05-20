"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthShell({
  activeTab,
  title,
  subtitle,
  showBackButton,
  children,
}: {
  activeTab: "login" | "register";
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  children: React.ReactNode;
}) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDemoLogin = async (email: string, pass: string, path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${window.location.origin}/api/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.replace(data.redirectTo ?? path);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-[480px] bg-white dark:bg-[#201f1f] rounded-[32px] p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] dark:shadow-black/50 border border-cn-border relative z-10 my-4">
        
        {showBackButton && (
          <Link
            href="/login"
            className="absolute top-6 left-6 w-10 h-10 rounded-xl bg-cn-canvas hover:bg-cn-surface border border-cn-border flex items-center justify-center text-cn-ink-muted hover:text-cn-ink transition-all z-20 shadow-sm"
            title="Back to login"
            aria-label="Back to login"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
        )}

        {/* Form Content */}
        <div className="flex flex-col items-center">
          <div className="text-center w-full mb-6 mt-2">
            <h1 className="text-[32px] leading-tight font-bold text-cn-ink mb-2">{title}</h1>
            <p className="text-cn-ink-muted text-sm">{subtitle}</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex w-full rounded-xl bg-cn-canvas p-1 mb-6 border border-cn-border">
            <Link
              href="/login"
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-white dark:bg-[#1a1818] text-cn-orange shadow-sm ring-1 ring-black/5"
                  : "text-cn-ink-muted hover:text-cn-ink"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-white dark:bg-[#1a1818] text-cn-orange shadow-sm ring-1 ring-black/5"
                  : "text-cn-ink-muted hover:text-cn-ink"
              }`}
            >
              Sign Up
            </Link>
          </div>

          <div className="w-full">
            {children}
          </div>
        </div>

        {/* Demo Selector Trigger */}
        <div className="mt-8 pt-6 border-t border-cn-border">
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-cn-canvas border border-dashed border-cn-border rounded-xl text-cn-ink-muted hover:bg-cn-surface transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-cn-yellow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88a9.947 9.947 0 0112.28 0C16.43 19.18 14.03 20 12 20z"/></svg>
              </span>
              <span className="font-semibold text-sm text-cn-ink">Quick Demo Access</span>
            </div>
            <span className="text-cn-ink-subtle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
            </span>
          </button>
        </div>
      </div>

      {/* Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-cn-surface w-full max-w-[360px] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-cn-ink">Demo Accounts</h3>
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cn-canvas text-cn-ink-muted"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
              </button>
            </div>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-100">
                {error}
              </div>
            )}
            <div className="space-y-3">
              {[
                { email: "student@gmail.com", pass: "user123", role: "Student Access", path: "/dashboard", color: "text-amber-500", bg: "bg-amber-500/10", hover: "hover:ring-amber-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/></svg> },
                { email: "coach@gmail.com", pass: "coach123", role: "Coach Access", path: "/coach/dashboard", color: "text-purple-500", bg: "bg-purple-500/10", hover: "hover:ring-purple-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 8.57a1.43 1.43 0 100 2.86 1.43 1.43 0 000-2.86zM13 3C9.25 3 6.2 5.94 6.02 9.64L4.1 12.2a.5.5 0 00.4.8H6v3c0 1.1.9 2 2 2h1v3h7v-4.68c2.36-1.12 4-3.53 4-6.32 0-3.87-3.13-7-7-7zm3 7c0 .13-.01.26-.02.39l1.16.9-.38.67-1.34-.56c-.21.2-.45.37-.71.5l.1 1.1H13.8l.1-1.1c-.26-.13-.5-.3-.71-.5l-1.34.56-.38-.67 1.16-.9c-.01-.13-.02-.26-.02-.39s.01-.26.02-.39l-1.16-.9.38-.67 1.34.56c.21-.2.45-.37.71-.5L13.8 7h1.39l-.1 1.1c.26.13.5.3.71.5l1.34-.56.38.67-1.16.9c.01.13.02.26.02.39z"/></svg> },
                { email: "admin@gmail.com", pass: "admin123", role: "Admin Access", path: "/admin/dashboard", color: "text-emerald-500", bg: "bg-emerald-500/10", hover: "hover:ring-emerald-500/20", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg> }
              ].map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDemoLogin(acc.email, acc.pass, acc.path);
                  }}
                  className={`w-full flex items-center justify-between p-4 bg-cn-canvas rounded-xl hover:ring-2 ${acc.hover} group transition-all disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${acc.bg} flex items-center justify-center ${acc.color}`}>
                      {acc.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-cn-ink">{acc.role}</p>
                      <p className="text-[10px] text-cn-ink-muted">{acc.email}</p>
                    </div>
                  </div>
                  <span className={`${acc.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
