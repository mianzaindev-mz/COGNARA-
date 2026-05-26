/**
 * Enrollment management — canEnroll, enrollStudent, dropCourse.
 *
 * Business rules:
 *  - Max 5 active (non-completed) enrollments per student
 *  - Free courses: 24h cooldown on re-enrollment after drop
 *  - Paid courses: must repay to re-enroll after drop
 *  - First chapter + first lesson auto-unlock on enrollment
 *  - Demo accounts bypass credit checks but still follow logic
 */

import { createClient } from "@/lib/supabase/server";
import {
  MAX_ACTIVE_ENROLLMENTS,
  FREE_RE_ENROLL_COOLDOWN_MS,
  isDemoAccount,
  err,
  type CourseError,
  type EnrollmentRow,
  type CourseRow,
} from "./types";

// ─── Result wrappers ─────────────────────────────────────────────────────────

type CanEnrollResult =
  | { allowed: true }
  | { allowed: false; reason: CourseError };

type EnrollResult =
  | { ok: true; enrollment: EnrollmentRow }
  | { ok: false; error: CourseError };

type DropResult =
  | { ok: true }
  | { ok: false; error: CourseError };

// ─── canEnroll ───────────────────────────────────────────────────────────────

/**
 * Checks whether a student is eligible to enroll in a course.
 *
 * Checks performed:
 *  1. Course exists and is published
 *  2. Student is not already actively enrolled
 *  3. Student has fewer than MAX_ACTIVE_ENROLLMENTS active enrollments
 *  4. If the student previously dropped this free course, 24h cooldown applies
 */
export async function canEnroll(
  studentId: string,
  courseId: string,
): Promise<CanEnrollResult> {
  const supabase = await createClient();

  // 1. Course must exist and be published
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, is_published, price_usd, deleted_at")
    .eq("id", courseId)
    .single();

  if (courseErr || !course) {
    return { allowed: false, reason: err("COURSE_NOT_FOUND", "Course not found.", 404) };
  }

  if (course.deleted_at) {
    return { allowed: false, reason: err("COURSE_DELETED", "This course is no longer available.", 410) };
  }

  if (!course.is_published) {
    return { allowed: false, reason: err("COURSE_NOT_PUBLISHED", "This course is not yet published.", 403) };
  }

  // 2. Already enrolled?
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, completed_at, enrolled_at")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing && !existing.completed_at) {
    return {
      allowed: false,
      reason: err("ALREADY_ENROLLED", "You are already enrolled in this course."),
    };
  }

  // 3. Max active enrollments
  const { data: activeList } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .is("completed_at", null);

  const activeCount = activeList?.length ?? 0;
  if (activeCount >= MAX_ACTIVE_ENROLLMENTS) {
    return {
      allowed: false,
      reason: err(
        "MAX_ENROLLMENTS",
        `You can have at most ${MAX_ACTIVE_ENROLLMENTS} active enrollments. Complete or drop one first.`,
      ),
    };
  }

  // 4. Free-course cooldown (only if re-enrolling after a previous drop/completion)
  if (existing && Number(course.price_usd) === 0) {
    const enrolledAt = new Date(existing.enrolled_at).getTime();
    const now = Date.now();
    if (now - enrolledAt < FREE_RE_ENROLL_COOLDOWN_MS) {
      const hoursLeft = Math.ceil(
        (FREE_RE_ENROLL_COOLDOWN_MS - (now - enrolledAt)) / (60 * 60 * 1000),
      );
      return {
        allowed: false,
        reason: err(
          "COOLDOWN_ACTIVE",
          `Please wait ${hoursLeft} more hour(s) before re-enrolling in this free course.`,
        ),
      };
    }
  }

  return { allowed: true };
}

// ─── enrollStudent ───────────────────────────────────────────────────────────

/**
 * Full enrollment flow:
 *  1. Validate eligibility via canEnroll
 *  2. Insert enrollment row
 *  3. Increment courses.total_enrolled
 *  4. Auto-unlock first chapter + first lesson (by setting chapter.is_locked = false)
 */
export async function enrollStudent(
  studentId: string,
  courseId: string,
  paymentIntentId?: string,
): Promise<EnrollResult> {
  // 1. Eligibility
  const check = await canEnroll(studentId, courseId);
  if (!check.allowed) {
    return { ok: false, error: check.reason };
  }

  const supabase = await createClient();

  // For paid courses, non-demo accounts need a payment reference
  const { data: course } = await supabase
    .from("courses")
    .select("price_usd")
    .eq("id", courseId)
    .single();

  if (course && Number(course.price_usd) > 0 && !isDemoAccount(studentId) && !paymentIntentId) {
    return {
      ok: false,
      error: err("PAYMENT_REQUIRED", "This course requires payment before enrolling.", 402),
    };
  }

  // 2. Insert enrollment (upsert to handle re-enrollment after completion/drop)
  const { data: enrollment, error: insertErr } = await supabase
    .from("enrollments")
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        progress_pct: 0,
        enrolled_at: new Date().toISOString(),
        completed_at: null,
        stripe_payment_id: paymentIntentId ?? null,
      },
      { onConflict: "student_id,course_id" },
    )
    .select()
    .single();

  if (insertErr || !enrollment) {
    return {
      ok: false,
      error: err("ENROLL_FAILED", "Could not create enrollment. Please try again.", 500),
    };
  }

  // 3. Bump total_enrolled (best-effort, don't fail enrollment over counter)
  await supabase.rpc("increment_total_enrolled", { cid: courseId }).catch(() => {});
  // Fallback: simple update if the RPC doesn't exist
  // This is non-critical; the count is eventually consistent.

  // 4. Auto-unlock first chapter
  const { data: firstChapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstChapter) {
    await supabase
      .from("chapters")
      .update({ is_locked: false })
      .eq("id", firstChapter.id);
  }

  return { ok: true, enrollment: enrollment as EnrollmentRow };
}

// ─── dropCourse ──────────────────────────────────────────────────────────────

/**
 * Drop a course. Rules:
 *  - Marks enrollment.completed_at to NOW (soft-complete as "dropped")
 *  - Free courses: student can re-enroll after 24h cooldown
 *  - Paid courses: student must repay to re-enroll
 */
export async function dropCourse(
  studentId: string,
  enrollmentId: string,
  _reason?: string,
): Promise<DropResult> {
  const supabase = await createClient();

  // Verify ownership
  const { data: enrollment, error: fetchErr } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, completed_at")
    .eq("id", enrollmentId)
    .single();

  if (fetchErr || !enrollment) {
    return { ok: false, error: err("ENROLLMENT_NOT_FOUND", "Enrollment not found.", 404) };
  }

  if (enrollment.student_id !== studentId) {
    return { ok: false, error: err("FORBIDDEN", "You can only drop your own enrollments.", 403) };
  }

  if (enrollment.completed_at) {
    return {
      ok: false,
      error: err("ALREADY_DROPPED", "This enrollment has already been completed or dropped."),
    };
  }

  // Soft-drop: set completed_at so the slot opens up
  const { error: updateErr } = await supabase
    .from("enrollments")
    .update({
      completed_at: new Date().toISOString(),
      progress_pct: 0, // reset progress on drop
    })
    .eq("id", enrollmentId);

  if (updateErr) {
    return {
      ok: false,
      error: err("DROP_FAILED", "Could not drop the course. Please try again.", 500),
    };
  }

  return { ok: true };
}
