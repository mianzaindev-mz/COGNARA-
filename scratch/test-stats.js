const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic parser for .env.local
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

if (!url || !key) {
  console.error("Missing URL or Service Role Key!");
  process.exit(1);
}

const supabase = createClient(url, key);

const userId = 'dddddddd-dddd-dddd-dddd-dddddddddd01'; // Daniyal Ahmad

async function test() {
  console.log("Querying for user:", userId);
  
  const [
    profileRes,
    enrolledRes,
    completedRes,
    creditsRes,
    xpRes,
    sessionsRes,
    badgesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
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

  console.log("=== Profile ===");
  console.log(profileRes.error ? `Error: ${profileRes.error.message}` : profileRes.data);

  console.log("=== Enrollments ===");
  console.log("Enrolled Count:", enrolledRes.count, enrolledRes.error ? `Error: ${enrolledRes.error.message}` : '');
  console.log("Completed Count:", completedRes.count, completedRes.error ? `Error: ${completedRes.error.message}` : '');

  console.log("=== AI Credits ===");
  console.log(creditsRes.error ? `Error: ${creditsRes.error.message}` : creditsRes.data);

  console.log("=== XP ===");
  console.log(xpRes.error ? `Error: ${xpRes.error.message}` : xpRes.data);

  console.log("=== Sessions ===");
  console.log(sessionsRes.error ? `Error: ${sessionsRes.error.message}` : sessionsRes.data);

  console.log("=== Badges ===");
  console.log(badgesRes.error ? `Error: ${badgesRes.error.message}` : badgesRes.data);
}

test();
