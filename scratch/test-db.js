const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDB() {
  try {
    const { data: courses, error: errC } = await supabase.from('courses').select('id, title, slug');
    console.log('Courses count:', courses ? courses.length : 0);
    if (courses && courses.length > 0) {
      console.log('Sample course:', courses[0]);
    }
    
    const { data: lessons, error: errL } = await supabase.from('lessons').select('id, title').limit(5);
    console.log('Lessons count (limited):', lessons ? lessons.length : 0);

    const { data: quizzes, error: errQ } = await supabase.from('quizzes').select('id, title').limit(5);
    console.log('Quizzes count (limited):', quizzes ? quizzes.length : 0);
  } catch (e) {
    console.error("Query failed", e);
  }
  process.exit(0);
}

checkDB();
