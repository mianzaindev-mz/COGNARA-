import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AgentPanel } from "@/components/agent/AgentPanel";
import type { AgentSkill } from "@/lib/ai/master-agent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Agent — COGNARA™",
  description:
    "Your AI-powered tutor. Ask questions, debug code, generate quizzes, and get personalized learning paths.",
};

/** Map dashboard ?task= query values to AgentSkill keys */
const TASK_TO_SKILL: Record<string, AgentSkill> = {
  ask: "teach",
  teach: "teach",
  debug: "debug",
  quiz: "quiz",
  voice: "voice",
  generate_course: "generate_course",
  flashcard: "flashcard",
  challenge: "challenge",
  summarize: "summarize",
  progress: "progress_report",
  progress_report: "progress_report",
  path: "path",
  support: "support",
  eli5: "eli5",
};

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const params = await searchParams;
  let studentId = "demo-student";
  let creditBalance: number | null = 50;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    studentId = user.id;

    // Demo accounts get unlimited credits (testing) — detected by known demo UUIDs
    const DEMO_IDS = [
      "00000000-0000-0000-0000-000000000000",
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ];
    if (DEMO_IDS.includes(user.id)) {
      creditBalance = 999; // unlimited for demo
    } else {
      const { data: credits } = await supabase
        .from("ai_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      creditBalance = credits?.balance ?? 20;
    }
  }

  // Resolve the ?task= query param to a valid AgentSkill
  const taskParam = params.task?.toLowerCase().trim();
  const initialSkill = taskParam ? TASK_TO_SKILL[taskParam] : undefined;

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
          12 skills · Autonomous
        </div>
      </div>
      <AgentPanel
        studentId={studentId}
        initialCredits={creditBalance}
        initialSkill={initialSkill}
      />
    </div>
  );
}
