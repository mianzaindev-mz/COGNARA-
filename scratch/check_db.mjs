import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data: courses } = await supabase.from('courses').select('id, slug, title');
  console.log('Courses:', courses);

  const { data: notebooks } = await supabase.from('notebooks').select('id, student_id, course_id, title');
  console.log('Notebooks:', notebooks);
}

run().catch(console.error);
