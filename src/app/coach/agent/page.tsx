import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Agent - Coach - COGNARA",
  description: "Role-aware AI agent for course creation, quizzes, grading, and student support.",
};

export default async function CoachAgentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-cn-ink dark:text-white">
            COGNARA Agent
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-on-surface-variant/70">
            Coach workspace for course planning, quiz creation, lesson polishing, grading rubrics,
            plagiarism review planning, and student intervention ideas.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Coach tools - free
        </div>
      </div>
      <AgentPanel studentId={user.id} initialCredits={999} audience="coach" />
    </div>
  );
}
