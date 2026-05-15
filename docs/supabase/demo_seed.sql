-- COGNARA demo seed (run AFTER schema_bundle.sql)
-- Replace YOUR_USER_ID with auth.users.id from Supabase Table Editor → Authentication → Users

-- Example: enroll one student in sample courses (idempotent on slug)

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

-- Lessons for creative-writing (minimal)
INSERT INTO public.lessons (course_id, title, order_index, duration_mins, type)
SELECT c.id, l.title, l.order_index, l.duration_mins, 'video'
FROM public.courses c
CROSS JOIN (
  VALUES
    ('Introduction to creative writing', 1, 12),
    ('Finding your voice', 2, 18),
    ('Story arcs', 3, 22)
) AS l(title, order_index, duration_mins)
WHERE c.slug = 'creative-writing'
  AND NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = c.id);

-- Enrollment for your student (set UUID below)
-- INSERT INTO public.enrollments (student_id, course_id, progress_pct)
-- SELECT 'YOUR_USER_ID'::uuid, id, 25 FROM public.courses WHERE slug = 'creative-writing'
-- ON CONFLICT (student_id, course_id) DO NOTHING;
