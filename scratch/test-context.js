const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[match[1]] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

// Mimic loadCourseLearnContext
async function testLoadContext() {
  const userId = 'dddddddd-dddd-dddd-dddd-dddddddddd01'; // Daniyal
  const slug = 'python-for-everybody-spec-2001';

  try {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, slug, category, difficulty, thumbnail_url, description, total_lessons, total_enrolled")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    console.log("Course fetch error:", courseError);
    console.log("Course fetch data:", course);

    if (!course) return;

    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("progress_pct")
      .eq("student_id", userId)
      .eq("course_id", course.id)
      .maybeSingle();

    console.log("Enrollment fetch error:", enrollError);
    console.log("Enrollment fetch data:", enrollment);

    if (!enrollment) return;

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, title, content, order_index, duration_mins, type, is_graded")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true });

    console.log("Lessons fetch error:", lessonsError);
    console.log("Lessons count:", lessons?.length);

    const lessonIds = (lessons ?? []).map((l) => l.id);
    let completedLessonIds = [];
    if (lessonIds.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("student_id", userId)
        .eq("completed", true)
        .in("lesson_id", lessonIds);
      
      console.log("Progress fetch error:", progressError);
      completedLessonIds = (progress ?? []).map((p) => p.lesson_id);
    }
    console.log("Completed lesson IDs:", completedLessonIds);

  } catch (e) {
    console.error("Caught error:", e);
  }
}

testLoadContext();
