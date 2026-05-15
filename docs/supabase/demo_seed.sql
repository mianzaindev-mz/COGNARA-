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
    ('Creative Writing for Beginners', 'creative-writing', 'Storytelling fundamentals.', 'Marketing', 20),
    ('Digital Illustration Foundations', 'digital-illustration', 'Vectors and composition.', 'Computer Science', 12),
    ('Public Speaking & Leadership', 'public-speaking', 'Presence and persuasion.', 'Psychology', 24)
) AS v(title, slug, description, category, total_lessons)
WHERE p.role = 'coach'
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Lessons per course (idempotent)
INSERT INTO public.lessons (course_id, title, order_index, duration_mins, type)
SELECT c.id, l.title, l.order_index, l.duration_mins, 'video'
FROM public.courses c
CROSS JOIN (
  VALUES
    ('creative-writing', 'Introduction to creative writing', 1, 12),
    ('creative-writing', 'Finding your voice', 2, 18),
    ('creative-writing', 'Story arcs', 3, 22),
    ('digital-illustration', 'Tools and canvas setup', 1, 15),
    ('digital-illustration', 'Shape language', 2, 20),
    ('public-speaking', 'Breath and presence', 1, 14),
    ('public-speaking', 'Structuring a talk', 2, 18)
) AS l(slug, title, order_index, duration_mins)
WHERE c.slug = l.slug
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons x
    WHERE x.course_id = c.id AND x.order_index = l.order_index
  );

-- Enroll your student (uncomment and set UUID)
-- INSERT INTO public.enrollments (student_id, course_id, progress_pct)
-- SELECT 'YOUR_USER_ID'::uuid, c.id, 15
-- FROM public.courses c
-- WHERE c.slug IN ('creative-writing', 'digital-illustration')
-- ON CONFLICT (student_id, course_id) DO NOTHING;
