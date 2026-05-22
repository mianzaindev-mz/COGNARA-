import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { IconShieldAlert } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Security — Admin — COGNARA™" };

const auditLog = [
  { action: "user.ban", user: "admin@demo.cognara.app", target: "bilal@example.com", time: "10m ago", ip: "192.168.1.42" },
  { action: "coach.approve", user: "admin@demo.cognara.app", target: "zara@example.com", time: "3h ago", ip: "192.168.1.42" },
  { action: "course.hide", user: "admin@demo.cognara.app", target: "Suspicious Course", time: "5h ago", ip: "192.168.1.42" },
  { action: "user.role_change", user: "admin@demo.cognara.app", target: "coach@demo.cognara.app", time: "1d ago", ip: "192.168.1.42" },
  { action: "ticket.resolve", user: "admin@demo.cognara.app", target: "Ticket #0042", time: "2d ago", ip: "192.168.1.42" },
];

const offPlatform = [
  { user: "User #4821", message: "Let's move to WhatsApp for disc...", pattern: "messaging_app", time: "12m ago" },
  { user: "User #3102", message: "Send payment via PayPal.me/...", pattern: "payment_app", time: "2h ago" },
];

export default function AdminSecurityPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Security & Audit</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Monitor platform security and admin actions</p>
      </section>

      {/* Audit Log */}
      <section className="rounded-2xl border border-cn-border bg-cn-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-cn-border">
          <h2 className="text-base font-bold text-cn-ink">Audit Log</h2>
        </div>
        <div className="divide-y divide-cn-border">
          {auditLog.map((log, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-cn-canvas transition-colors">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{log.action}</Badge>
                <div>
                  <p className="text-sm text-cn-ink">
                    <span className="text-cn-ink-subtle">{log.user}</span> → <span className="font-semibold">{log.target}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-cn-ink-subtle">{log.time}</p>
                <p className="text-[10px] text-cn-ink-subtle font-mono">{log.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Off-Platform Attempts */}
      <section className="rounded-2xl border border-rose-500/20 bg-cn-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-cn-ink">Off-Platform Attempts</h2>
          <Badge variant="danger" size="sm">{offPlatform.length} detected</Badge>
        </div>
        <div className="space-y-3">
          {offPlatform.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3">
              <IconShieldAlert className="h-5 w-5 text-rose-500" />
              <div className="flex-1">
                <p className="text-sm text-cn-ink">{item.user}: &ldquo;{item.message}&rdquo;</p>
                <p className="mt-1 text-xs text-cn-ink-subtle">Pattern: <code className="bg-cn-canvas px-1 rounded text-rose-500 dark:text-rose-400">{item.pattern}</code> · {item.time}</p>
              </div>
              <Link
                href="/admin/support"
                className="shrink-0 rounded-lg bg-cn-canvas px-3 py-1.5 text-[10px] font-bold text-cn-ink hover:bg-cn-surface"
              >
                Investigate
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
