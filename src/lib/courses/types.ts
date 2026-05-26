/**
 * Shared types and constants for the COGNARA course system.
 * All business logic modules import from here to stay consistent.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum concurrent active enrollments per student */
export const MAX_ACTIVE_ENROLLMENTS = 5;

/** Cooldown period (ms) before re-enrolling in a free course after drop */
export const FREE_RE_ENROLL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Demo account IDs start with this prefix */
export const DEMO_ID_PREFIX = "00000000-0000-0000-0000-";

// ─── Error handling ──────────────────────────────────────────────────────────

export type CourseError = {
  code: string;
  message: string;
  status: number;
};

export function err(code: string, message: string, status = 400): CourseError {
  return { code, message, status };
}

// ─── Row types (matching Supabase table shapes) ──────────────────────────────

export type CourseRow = {
  id: string;
  coach_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  language: string;
  price_usd: number;
  is_free: boolean;
  is_published: boolean;
  is_featured: boolean;
  requires_verification: boolean;
  issues_certificate: boolean;
  preview_video_url: string | null;
  total_lessons: number;
  total_enrolled: number;
  avg_rating: number | null;
  badge_criteria: Record<string, number> | null;
  badge_criteria_locked: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ChapterRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_locked: boolean;
  wall_type: "none" | "cloud" | "wall";
  x_pos: number;
  y_pos: number;
  z_pos: number;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  content: string | null;
  order_index: number;
  type: "text" | "video" | "code" | "quiz" | "mini_activity";
  video_url: string | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  duration_mins: number | null;
  is_free_preview: boolean;
  is_graded: boolean;
  drip_days: number;
  created_at: string;
};

export type EnrollmentRow = {
  id: string;
  student_id: string;
  course_id: string;
  progress_pct: number;
  enrolled_at: string;
  completed_at: string | null;
  certificate_url: string | null;
  certificate_code: string | null;
  stripe_payment_id: string | null;
};

export type LessonProgressRow = {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  time_spent_mins: number;
  completed_at: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true when the user ID matches the demo-account prefix pattern */
export function isDemoAccount(userId: string): boolean {
  return userId.startsWith(DEMO_ID_PREFIX);
}
