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

// We must use the anon key to test RLS policies, NOT the service role key!
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function test() {
  console.log('Logging in as Daniyal...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'danownz2005@gmail.com',
    password: 'D@ni123'
  });

  if (authError) {
    console.error('Auth failed:', authError);
    return;
  }
  const user = authData.user;
  console.log('Logged in successfully. User ID:', user.id);

  const courseId = '550a9030-9874-4f70-b3b9-60755b2dfc6a'; // Python for Everybody

  console.log('--- Step 1: Query notebooks table ---');
  const { data: notebook, error: notebookErr } = await supabase
    .from('notebooks')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (notebookErr) {
    console.error('notebook query error:', notebookErr);
  } else {
    console.log('notebook query result:', notebook);
  }

  let activeNotebookId = notebook?.id;
  if (!activeNotebookId && !notebookErr) {
    console.log('Notebook not found. Attempting to insert...');
    const { data: newNotebook, error: createNotebookErr } = await supabase
      .from('notebooks')
      .insert({
        student_id: user.id,
        course_id: courseId,
        title: 'Python for Everybody Specialization Notebook',
      })
      .select('id')
      .single();

    if (createNotebookErr) {
      console.error('create notebook error:', createNotebookErr);
    } else {
      console.log('create notebook success:', newNotebook);
      activeNotebookId = newNotebook.id;
    }
  }

  if (activeNotebookId) {
    console.log('Using active notebook ID:', activeNotebookId);

    console.log('--- Step 2: Query notebook_pages table ---');
    const { data: page, error: pageErr } = await supabase
      .from('notebook_pages')
      .select('id, content_canvas, content_text')
      .eq('notebook_id', activeNotebookId)
      .eq('title', 'Lesson: What is Programming & Python?')
      .maybeSingle();

    if (pageErr) {
      console.error('page query error:', pageErr);
    } else {
      console.log('page query result:', page);
    }

    if (!page && !pageErr) {
      console.log('Page not found. Attempting to insert...');
      const { data: newPage, error: createPageErr } = await supabase
        .from('notebook_pages')
        .insert({
          notebook_id: activeNotebookId,
          title: 'Lesson: What is Programming & Python?',
          content_text: 'Welcome to your upgraded notebook! Select blocks or freehand draw.',
          content_canvas: {
            mode: 'modular',
            bgType: 'ruled',
            modular_blocks: [
              {
                id: 'b-welcome',
                type: 'heading',
                content: 'Notes for What is Programming & Python?',
                properties: { level: 2 },
                createdAt: new Date().toISOString(),
                lastEditedAt: new Date().toISOString(),
              }
            ],
            freehand_strokes: [],
            freehand_annotations: [],
          },
          order_index: 0,
        })
        .select('id, content_canvas, content_text')
        .single();

      if (createPageErr) {
        console.error('create page error:', createPageErr);
      } else {
        console.log('create page success:', newPage);
      }
    }
  }
}

test().catch(console.error);
