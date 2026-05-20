import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type StudentPortalStats = {
  enrolledCourses: number;
  completedCourses: number;
  streakDays: number;
  creditBalance: number | null;
  totalXp: number;
  level: number;
  recentAgentSessions: Array<{ id: string; skill: string; created_at: string }>;
  earnedBadges: Array<{ id: string; badge_type: string; course_id: string; chapter_id: string | null; score: number; earned_at: string; courses: { title: string } }>;
};

const emptyStats: StudentPortalStats = {
  enrolledCourses: 0,
  completedCourses: 0,
  streakDays: 0,
  creditBalance: null,
  totalXp: 0,
  level: 1,
  recentAgentSessions: [],
  earnedBadges: [],
};

async function loadStatsInner(
  supabase: SupabaseClient,
  userId: string,
): Promise<StudentPortalStats> {
  const [
    enrolledRes,
    completedRes,
    creditsRes,
    xpRes,
    sessionsRes,
    badgesRes,
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .not("completed_at", "is", null),
    supabase.from("ai_credits").select("balance").eq("user_id", userId).maybeSingle(),
    supabase
      .from("user_xp")
      .select("streak_days, total_xp, level")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("agent_sessions")
      .select("id, skill, created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("earned_badges")
      .select("id, badge_type, course_id, chapter_id, score, earned_at, courses(title)")
      .eq("student_id", userId)
      .order("earned_at", { ascending: false }),
  ]);

  const enrolledCourses = enrolledRes.count ?? 0;
  const completedCourses = completedRes.count ?? 0;
  const creditBalance =
    typeof creditsRes.data?.balance === "number" ? creditsRes.data.balance : null;
  const streakDays = xpRes.data?.streak_days ?? 0;
  const totalXp = xpRes.data?.total_xp ?? 0;
  const level = xpRes.data?.level ?? 1;

  const recentAgentSessions = (sessionsRes.data ?? []).map((row) => ({
    id: row.id,
    skill: row.skill,
    created_at: row.created_at,
  }));

  const earnedBadges = sessionsRes.data ? (badgesRes.data ?? []) : [];

  return {
    enrolledCourses,
    completedCourses,
    streakDays,
    creditBalance,
    totalXp,
    level,
    recentAgentSessions,
    earnedBadges,
  };
}

/** Per-request dedupe when layout + pages both need the same snapshot. */
export const loadStudentPortalStats = cache(async (userId: string): Promise<StudentPortalStats> => {
  try {
    const supabase = await createClient();
    return await loadStatsInner(supabase, userId);
  } catch {
    return emptyStats;
  }
});
