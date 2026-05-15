-- COGNARA demo seed (run AFTER schema_bundle.sql)
-- Replace YOUR_USER_ID with auth.users.id from Supabase → Authentication → Users

INSERT INTO public.courses (coach_id, title, slug, description, category, difficulty, price_usd, is_published, total_lessons)
SELECT
  p.id,
  v.title,
  v.slug,
  v.description,
  v.category,
  'beginner',
  0,
  true,
  v.total_lessons
FROM public.profiles p
CROSS JOIN (
  VALUES
    ('Creative Writing for Beginners', 'creative-writing', 'Storytelling fundamentals and daily practice.', 'Marketing', 20),
    ('Digital Illustration Foundations', 'digital-illustration', 'Vectors, composition, and color for beginners.', 'Computer Science', 12),
    ('Public Speaking & Leadership', 'public-speaking', 'Presence, structure, and persuasive delivery.', 'Psychology', 24)
) AS v(title, slug, description, category, total_lessons)
WHERE p.role = 'coach'
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.lessons (course_id, title, content, order_index, duration_mins, type)
SELECT c.id, l.title, l.content, l.order_index, l.duration_mins, 'video'
FROM public.courses c
CROSS JOIN (
  VALUES
    ('creative-writing', 'Introduction to creative writing', 'Warm up with freewriting and observation exercises. Set a 10-minute timer and capture three scenes from your day.', 1, 12),
    ('creative-writing', 'Finding your voice', 'Compare two authors you admire. List what makes their voice distinct — rhythm, vocabulary, perspective.', 2, 18),
    ('creative-writing', 'Story arcs', 'Map a three-act outline for a 800-word short story. Identify the inciting incident and climax.', 3, 22),
    ('digital-illustration', 'Tools and canvas setup', 'Configure your workspace: brushes, layers, and export presets for web and print.', 1, 15),
    ('digital-illustration', 'Shape language', 'Study silhouettes in reference photos. Sketch five thumbnails using only geometric shapes.', 2, 20),
    ('public-speaking', 'Breath and presence', 'Practice box breathing before speaking. Record a 60-second introduction and review posture.', 1, 14),
    ('public-speaking', 'Structuring a talk', 'Use problem → insight → action. Draft bullet points for a five-minute talk.', 2, 18)
) AS l(slug, title, content, order_index, duration_mins)
WHERE c.slug = l.slug
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons x
    WHERE x.course_id = c.id AND x.order_index = l.order_index
  );

-- Enroll your student (uncomment and set UUID)
-- INSERT INTO public.enrollments (student_id, course_id, progress_pct)
-- SELECT 'YOUR_USER_ID'::uuid, c.id, 0
-- FROM public.courses c
-- WHERE c.slug IN ('creative-writing', 'digital-illustration')
-- ON CONFLICT (student_id, course_id) DO NOTHING;
