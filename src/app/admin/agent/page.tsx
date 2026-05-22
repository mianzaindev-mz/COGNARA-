import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Agent - Admin - COGNARA",
  description: "Internal AI agent for platform operations, verification, support, and risk review.",
};

export default async function AdminAgentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--admin-card-text-primary)]">
            COGNARA Agent
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--admin-card-text-muted)]">
            Admin workspace for verification review, support triage, content audits, policy risk,
            plagiarism signals, platform health summaries, and operational next steps.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#dc143c]/10 px-3 py-1.5 text-xs font-bold text-[#dc143c]">
          <span className="h-2 w-2 rounded-full bg-[#dc143c]" />
          Internal tools - free
        </div>
      </div>
      <AgentPanel studentId={user.id} initialCredits={999} audience="admin" />
    </div>
  );
}
