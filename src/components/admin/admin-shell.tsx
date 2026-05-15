"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const nav = [
  { href: "/admin/dashboard",  label: "Dashboard",   icon: IconGrid },
  { href: "/admin/users",      label: "Users",        icon: IconUsers },
  { href: "/admin/coaches",    label: "Coaches",      icon: IconShield },
  { href: "/admin/courses",    label: "Courses",      icon: IconBook },
  { href: "/admin/reports",    label: "Reports",      icon: IconChart },
  { href: "/admin/support",    label: "Support",      icon: IconTicket },
  { href: "/admin/security",   label: "Security",     icon: IconLock },
  { href: "/admin/settings",   label: "Settings",     icon: IconCog },
] as const;

type AdminShellProps = {
  displayName: string;
  email?: string;
  children: React.ReactNode;
};

export function AdminShell({ displayName, email, children }: AdminShellProps) {
  const pathname = usePathname();
  const initials = displayName.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#0a0a0b] font-sans text-neutral-100">
      {/* Sidebar — always dark */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 flex w-[4.5rem] flex-col border-r border-white/[0.06] bg-[#060607] py-6 sm:w-[5.25rem]">
        <Link
          href="/admin/dashboard"
          className="mb-6 flex justify-center px-2 text-center text-[10px] font-bold uppercase leading-tight tracking-tight text-rose-400"
          title="COGNARA Admin"
        >
          CN
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 pb-4">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                  active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3 px-2 pb-2">
          {/* Health indicators */}
          <div className="flex flex-col items-center gap-1.5 mb-2" title="Platform health">
            {["DB", "AI", "Pay"].map(s => (
              <div key={s} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-white/30">{s}</span>
              </div>
            ))}
          </div>
          <SignOutButton variant="icon" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col pl-[4.5rem] sm:pl-[5.25rem]">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0b]/95 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-rose-400">Admin Control</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">LIVE</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Link href="/admin/settings" className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-sm font-bold text-rose-400 ring-2 ring-[#0a0a0b]">
                  {initials}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-bold text-white">{displayName}</span>
                  <span className="block truncate text-xs text-white/40">{email}</span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

/* Icons */
function IconGrid({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>);
}
function IconUsers({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.433-2.367M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>);
}
function IconShield({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
}
function IconBook({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A9 9 0 0112 21a9 9 0 019-2.488V4.262A8.967 8.967 0 0012 6.042z" /></svg>);
}
function IconChart({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>);
}
function IconTicket({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>);
}
function IconLock({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>);
}
function IconCog({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
}
