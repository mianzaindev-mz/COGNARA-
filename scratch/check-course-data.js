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

async function check() {
  const userId = 'dddddddd-dddd-dddd-dddd-dddddddddd01'; // Daniyal Ahmad
  const slug = 'python-for-everybody-spec-2001';

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  console.log("Course:", course);

  if (course) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", userId)
      .eq("course_id", course.id)
      .maybeSingle();

    console.log("Enrollment:", enrollment);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", course.id);

    console.log("Lessons count:", lessons?.length);
    console.log("Lessons details:", lessons?.map(l => ({ id: l.id, title: l.title, video_url: l.video_url, order_index: l.order_index })));

    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("student_id", userId);
    console.log("Progress for user:", progress);
  }
}

check();
