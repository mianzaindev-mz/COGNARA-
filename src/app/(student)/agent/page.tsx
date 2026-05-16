import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AgentPanel } from "@/components/agent/AgentPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Agent — COGNARA™",
  description:
    "Your AI-powered tutor. Ask questions, debug code, generate quizzes, and get personalized learning paths.",
};

export default async function AgentPage() {
  let studentId = "demo-student";
  let creditBalance: number | null = 50;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    studentId = user.id;

    const { data: credits } = await supabase
      .from("ai_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    creditBalance = credits?.balance ?? 20;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">
            COGNARA Agent
          </h1>
          <p className="mt-0.5 text-sm text-cn-ink-muted">
            Your AI tutor — context-aware, memory-enabled, and tool-using. Not a chatbot.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-cn-orange/10 px-3 py-1.5 text-xs font-semibold text-cn-orange">
          <span className="h-2 w-2 rounded-full bg-cn-orange" />
          7 skills · Autonomous
        </div>
      </div>
      <AgentPanel studentId={studentId} initialCredits={creditBalance} />
    </div>
  );
}
