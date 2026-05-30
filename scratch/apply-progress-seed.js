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

async function run() {
  console.log("Seeding lesson progress to match enrollment progress...");

  const students = {
    daniyal: 'dddddddd-dddd-dddd-dddd-dddddddddd01',
    maria: 'dddddddd-dddd-dddd-dddd-dddddddddd02',
    kai: 'dddddddd-dddd-dddd-dddd-dddddddddd03',
    emma: 'dddddddd-dddd-dddd-dddd-dddddddddd04',
    omar: 'dddddddd-dddd-dddd-dddd-dddddddddd05',
  };

  // 1. Fetch courses to map slugs to IDs
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, slug");

  if (coursesError || !courses) {
    console.error("Failed to load courses:", coursesError);
    return;
  }

  const courseMap = {};
  courses.forEach(c => {
    courseMap[c.slug] = c.id;
  });

  const pythonId = courseMap['python-for-everybody-spec-2001'];
  const webdevId = courseMap['complete-web-developer-bootcamp-1001'];
  const mlId = courseMap['machine-learning-az-python-2003'];

  console.log("Course IDs - Python:", pythonId, "WebDev:", webdevId, "ML:", mlId);

  // Clear existing lesson progress to start fresh
  const { error: deleteError } = await supabase
    .from("lesson_progress")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
  
  if (deleteError) {
    console.warn("Warn delete lesson_progress:", deleteError);
  }

  // 2. Define progress records to insert
  const progressToInsert = [];

  // Daniyal Python (75% -> 6 lessons: 101 to 106)
  if (pythonId) {
    for (let i = 1; i <= 6; i++) {
      progressToInsert.push({
        student_id: students.daniyal,
        lesson_id: `ee000000-0000-0000-0000-00000000010${i}`,
        completed: true,
        completed_at: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Maria Python (100% -> 8 lessons)
    for (let i = 1; i <= 8; i++) {
      progressToInsert.push({
        student_id: students.maria,
        lesson_id: `ee000000-0000-0000-0000-00000000010${i}`,
        completed: true,
        completed_at: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Emma Python (15% -> 1 lesson)
    progressToInsert.push({
      student_id: students.emma,
      lesson_id: 'ee000000-0000-0000-0000-000000000101',
      completed: true,
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Daniyal Web Dev (40% -> 3 lessons)
  if (webdevId) {
    for (let i = 1; i <= 3; i++) {
      progressToInsert.push({
        student_id: students.daniyal,
        lesson_id: `ee000000-0000-0000-0000-00000000020${i}`,
        completed: true,
        completed_at: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Kai Web Dev (60% -> 4 lessons)
    for (let i = 1; i <= 4; i++) {
      progressToInsert.push({
        student_id: students.kai,
        lesson_id: `ee000000-0000-0000-0000-00000000020${i}`,
        completed: true,
        completed_at: new Date(Date.now() - (8 - i) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Maria ML (90% -> 4 lessons out of 5)
  if (mlId) {
    for (let i = 1; i <= 4; i++) {
      progressToInsert.push({
        student_id: students.maria,
        lesson_id: `ee000000-0000-0000-0000-00000000030${i}`,
        completed: true,
        completed_at: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  const { error: insertError } = await supabase
    .from("lesson_progress")
    .insert(progressToInsert);

  if (insertError) {
    console.error("Failed to insert lesson progress:", insertError);
  } else {
    console.log(`Successfully seeded ${progressToInsert.length} lesson progress records.`);
  }

  // 3. Set correct progress percentages in enrollments
  const enrollmentsToUpdate = [
    { student_id: students.daniyal, course_id: pythonId, pct: 75 },
    { student_id: students.maria, course_id: pythonId, pct: 100, completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { student_id: students.emma, course_id: pythonId, pct: 15 },
    { student_id: students.daniyal, course_id: webdevId, pct: 40 },
    { student_id: students.kai, course_id: webdevId, pct: 60 },
    { student_id: students.maria, course_id: mlId, pct: 90 },
  ];

  for (const item of enrollmentsToUpdate) {
    if (!item.course_id) continue;
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        progress_pct: item.pct,
        completed_at: item.completed_at || null,
        status: item.pct >= 100 ? 'completed' : 'active'
      })
      .eq("student_id", item.student_id)
      .eq("course_id", item.course_id);

    if (updateError) {
      console.error(`Failed to update enrollment for student ${item.student_id}:`, updateError);
    } else {
      console.log(`Updated student ${item.student_id} course progress to ${item.pct}%.`);
    }
  }

  console.log("Database seeding completed.");
}

run();
