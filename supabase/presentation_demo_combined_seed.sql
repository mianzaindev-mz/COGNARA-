-- ================================================================
-- COGNARA™ Presentation Demo — Combined Seed Data
-- Clean 3-user build: Admin · Coach Zain · Student Daniyal
-- Run this in Supabase SQL Editor to populate all demo content.
-- ================================================================

-- 1. EXTENSIONS & DDL SCHEMA ALIGNMENT
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_order_in_chapter INT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS quiz_id UUID;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.grade_scales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_default      BOOLEAN DEFAULT false,
  grades          JSONB NOT NULL,
  passing_grade   TEXT DEFAULT 'D',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.graded_submissions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id               UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  attempt_id            UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  course_id             UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  coach_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  grade_scale_id        UUID REFERENCES public.grade_scales(id),
  raw_score             DECIMAL(6,2),
  max_score             DECIMAL(6,2),
  percentage            DECIMAL(5,2),
  letter_grade          TEXT,
  grade_point           DECIMAL(3,2),
  passed                BOOLEAN,
  question_grades       JSONB DEFAULT '[]',
  overall_feedback      TEXT,
  strengths             TEXT[] DEFAULT '{}',
  areas_for_improvement TEXT[] DEFAULT '{}',
  recommended_resources TEXT[] DEFAULT '{}',
  instructor_note       TEXT,
  instructor_override   DECIMAL(5,2),
  grading_method        TEXT DEFAULT 'ai' CHECK (grading_method IN ('ai','manual','hybrid','exact')),
  finalized             BOOLEAN DEFAULT false,
  finalized_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT CHECK (review_text IS NULL OR LENGTH(review_text) >= 30),
  is_verified_completion BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  coach_reply TEXT,
  coach_replied_at TIMESTAMPTZ,
  helpful_votes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.generated_pdfs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'chat_export','lecture_notes','quiz_results','grade_report',
                    'certificate','solution_set','research_report','course_summary'
                  )),
  source_id       UUID,
  storage_path    TEXT NOT NULL,
  file_size_bytes INT,
  page_count      INT,
  is_public       BOOLEAN DEFAULT false,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category              TEXT NOT NULL CHECK (category IN (
                          'bug','abuse','content','fraud','security','legal','performance','feature_request'
                        )),
  title                 TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 5 AND 200),
  description           TEXT NOT NULL CHECK (LENGTH(description) >= 20),
  page_url              TEXT,
  page_route            TEXT,
  dom_selector          TEXT,
  video_timestamp_secs  INT,
  lesson_id             UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  course_id             UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  screenshot_url        TEXT,
  screenshot_path       TEXT,
  browser_info          JSONB DEFAULT '{}',
  reproduction_steps    TEXT,
  ai_category           TEXT,
  ai_severity           TEXT CHECK (ai_severity IN ('S1','S2','S3','S4','S5')),
  ai_confidence         INT CHECK (ai_confidence BETWEEN 0 AND 100),
  ai_validity           TEXT CHECK (ai_validity IN ('valid','invalid','uncertain','duplicate')),
  ai_validity_reasoning TEXT,
  ai_recommended_action TEXT,
  ai_is_duplicate       BOOLEAN DEFAULT false,
  ai_parent_report_id   UUID REFERENCES public.bug_reports(id),
  ai_auto_resolved      BOOLEAN DEFAULT false,
  ai_draft_reply        TEXT,
  ai_tags               TEXT[] DEFAULT '{}',
  ai_evaluated_at       TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'pending_triage'
                          CHECK (status IN ('pending_triage','triaged','in_progress','resolved','closed','wont_fix','duplicate')),
  assigned_to           UUID REFERENCES public.profiles(id),
  priority              TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent','critical')),
  resolution_note       TEXT,
  resolved_by           UUID REFERENCES public.profiles(id),
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);


-- 2. CORE DATA
DO $$
DECLARE
  v_python_course UUID;
  v_webdev_course UUID;
  v_ml_course     UUID;
  v_cyber_course  UUID;

  v_coach_zain      UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc01';
  v_student_daniyal UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd01';
  v_admin_id        UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001';

  v_python_quiz UUID := 'fa000000-0000-0000-0000-000000000001';
  v_webdev_quiz UUID := 'fa000000-0000-0000-0000-000000000002';
  v_ml_quiz     UUID := 'fa000000-0000-0000-0000-000000000003';
  v_cyber_quiz  UUID := 'fa000000-0000-0000-0000-000000000004';
  v_scale_id    UUID := '95000000-cccc-0000-0000-000000000001';

  v_badge_first_steps UUID := 'bd000000-0000-0000-0000-000000000001';
  v_badge_quiz_master UUID := 'bd000000-0000-0000-0000-000000000002';
  v_badge_streak_war  UUID := 'bd000000-0000-0000-0000-000000000003';
  v_badge_code_runner UUID := 'bd000000-0000-0000-0000-000000000004';
BEGIN
  -- ================================================================
  -- 0. CLEANUP CONFLICTING SEED RECORDS
  -- ================================================================
  DELETE FROM public.user_badges WHERE user_id = v_student_daniyal;
  DELETE FROM public.badges WHERE id::text LIKE 'bd000000%';
  DELETE FROM public.user_xp WHERE user_id = v_student_daniyal;
  DELETE FROM public.notifications WHERE user_id IN (v_student_daniyal, v_coach_zain, v_admin_id);
  DELETE FROM public.ticket_messages WHERE ticket_id IN ('ab000000-0000-0000-0000-000000000001', 'ab000000-0000-0000-0000-000000000002');
  DELETE FROM public.support_tickets WHERE id IN ('ab000000-0000-0000-0000-000000000001', 'ab000000-0000-0000-0000-000000000002');
  DELETE FROM public.bug_reports WHERE id::text LIKE 'b8000000%';
  DELETE FROM public.generated_pdfs WHERE id::text LIKE 'df000000%';
  DELETE FROM public.course_reviews WHERE student_id = v_student_daniyal OR enrollment_id::text LIKE 'e0000000%';
  DELETE FROM public.peer_sessions WHERE id = 'e5000000-0000-0000-0000-000000000001';
  DELETE FROM public.live_sessions WHERE id IN ('15000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000002');
  DELETE FROM public.enrollments WHERE id::text LIKE 'e0000000%';
  DELETE FROM public.graded_submissions WHERE id::text LIKE '95000000%';
  DELETE FROM public.grade_scales WHERE id = '95000000-cccc-0000-0000-000000000001';
  DELETE FROM public.quiz_answers WHERE attempt_id::text LIKE 'aa000000%';
  DELETE FROM public.quiz_attempts WHERE id::text LIKE 'aa000000%';
  DELETE FROM public.question_options WHERE id::text LIKE 'f0000000%';
  DELETE FROM public.questions WHERE id::text LIKE 'ff000000%';
  DELETE FROM public.quizzes WHERE id::text LIKE 'fa000000%';
  DELETE FROM public.resources WHERE id::text LIKE 'ae000000%';
  DELETE FROM public.lessons WHERE id::text LIKE 'ee000000%';
  DELETE FROM public.chapters WHERE id::text LIKE 'c0000000%';

  -- Delete all other old auth users so they don't clutter profiles/users
  DELETE FROM auth.users WHERE id IN (
    'cccccccc-cccc-cccc-cccc-cccccccccc02', -- Coach James
    'cccccccc-cccc-cccc-cccc-cccccccccc03', -- Coach Priya
    'dddddddd-dddd-dddd-dddd-dddddddddd02', -- Student Maria
    'dddddddd-dddd-dddd-dddd-dddddddddd03', -- Student Kai
    'dddddddd-dddd-dddd-dddd-dddddddddd04', -- Student Emma
    'dddddddd-dddd-dddd-dddd-dddddddddd05'  -- Student Omar
  );

  -- ================================================================
  -- A. AUTH USERS (3 only)
  -- ================================================================
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, '');

  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@cognara.dev', crypt('admin@123', gen_salt('bf')), NOW(), '{"full_name": "Admin", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_coach_zain, '00000000-0000-0000-0000-000000000000', 'zainworks67@gmail.com', crypt('Z@in123', gen_salt('bf')), NOW(), '{"full_name": "Muhammad Zain", "role": "coach"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (v_student_daniyal, '00000000-0000-0000-0000-000000000000', 'danownz2005@gmail.com', crypt('D@ni123', gen_salt('bf')), NOW(), '{"full_name": "Daniyal Ahmad", "role": "student"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, role, email)
  SELECT id,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'role', 'student'),
    email
  FROM auth.users
  WHERE id IN (v_admin_id, v_coach_zain, v_student_daniyal)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  SELECT id FROM auth.users
  WHERE id IN (v_admin_id, v_coach_zain, v_student_daniyal)
  ON CONFLICT (user_id) DO NOTHING;


  -- ================================================================
  -- B. PROFILE DETAILS
  -- ================================================================
  UPDATE public.profiles SET
    full_name = 'Admin', username = 'admin',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    bio = 'Founder & Lead Architect of COGNARA. Systems engineer and AI enthusiast.',
    github_url = 'https://github.com/mianzaindev',
    linkedin_url = 'https://linkedin.com/in/zainwajahat',
    is_verified = true
  WHERE id = v_admin_id;

  UPDATE public.profiles SET
    full_name = 'Muhammad Zain', username = 'muhammad_zain',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zain',
    bio = 'Lead Engineering Instructor at COGNARA. Senior engineer specializing in system architectures, Next.js, Python, ML, and cloud integrations.',
    github_url = 'https://github.com/mianzaindev',
    linkedin_url = 'https://linkedin.com/in/zainwajahat',
    is_verified = true
  WHERE id = v_coach_zain;

  UPDATE public.profiles SET
    full_name = 'Daniyal Ahmad', username = 'daniyal_a',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniyal',
    bio = 'Computer Science undergraduate. Enthusiastic about full-stack engineering, interactive apps, and AI agents.',
    github_url = 'https://github.com/danownz'
  WHERE id = v_student_daniyal;


  -- ================================================================
  -- C. USER SETTINGS & AI CREDITS
  -- ================================================================
  UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = v_admin_id;
  UPDATE public.user_settings SET theme = 'light', onboarding_complete = true WHERE user_id = v_coach_zain;
  UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = v_student_daniyal;

  UPDATE public.ai_credits SET balance = 500 WHERE user_id = v_admin_id;
  UPDATE public.ai_credits SET balance = 200 WHERE user_id = v_coach_zain;
  UPDATE public.ai_credits SET balance = 50  WHERE user_id = v_student_daniyal;


  -- ================================================================
  -- D. COURSES (all coached by Zain)
  -- ================================================================
  SELECT id INTO v_python_course FROM public.courses WHERE slug = 'python-for-everybody-spec-2001' LIMIT 1;
  IF v_python_course IS NULL THEN
    v_python_course := 'c0000000-0000-0000-0000-000000000001';
    INSERT INTO public.courses (id, coach_id, title, slug, description, category, difficulty, is_published, price_usd, status)
    VALUES (v_python_course, v_coach_zain, 'Python for Everybody Specialization', 'python-for-everybody-spec-2001', 'Learn Python from scratch: variables, loops, functions, files, APIs, databases, and data visualization.', 'Python', 'beginner', true, 0, 'published')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.courses SET coach_id = v_coach_zain, status = 'published', is_published = true WHERE id = v_python_course;
  END IF;

  SELECT id INTO v_webdev_course FROM public.courses WHERE slug = 'complete-web-developer-bootcamp-1001' LIMIT 1;
  IF v_webdev_course IS NULL THEN
    v_webdev_course := 'c0000000-0000-0000-0000-000000000002';
    INSERT INTO public.courses (id, coach_id, title, slug, description, category, difficulty, is_published, price_usd, status)
    VALUES (v_webdev_course, v_coach_zain, 'The Complete Web Developer Bootcamp', 'complete-web-developer-bootcamp-1001', 'Master HTML, CSS, JavaScript, React, Node.js, and MongoDB from absolute zero to job-ready full-stack developer.', 'Web Development', 'beginner', true, 0, 'published')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.courses SET coach_id = v_coach_zain, status = 'published', is_published = true WHERE id = v_webdev_course;
  END IF;

  SELECT id INTO v_ml_course FROM public.courses WHERE slug = 'machine-learning-az-python-2003' LIMIT 1;
  IF v_ml_course IS NULL THEN
    v_ml_course := 'c0000000-0000-0000-0000-000000000003';
    INSERT INTO public.courses (id, coach_id, title, slug, description, category, difficulty, is_published, price_usd, status)
    VALUES (v_ml_course, v_coach_zain, 'Machine Learning A-Z: Hands-On Python', 'machine-learning-az-python-2003', 'Regression, classification, clustering, NLP, deep learning with scikit-learn, TensorFlow, and PyTorch.', 'Data Science', 'intermediate', true, 39.99, 'published')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.courses SET coach_id = v_coach_zain, status = 'published', is_published = true WHERE id = v_ml_course;
  END IF;

  SELECT id INTO v_cyber_course FROM public.courses WHERE slug = 'ethical-hacking-complete-course-6001' LIMIT 1;
  IF v_cyber_course IS NULL THEN
    v_cyber_course := 'c0000000-0000-0000-0000-000000000004';
    INSERT INTO public.courses (id, coach_id, title, slug, description, category, difficulty, is_published, price_usd, status)
    VALUES (v_cyber_course, v_coach_zain, 'Ethical Hacking: The Complete Course', 'ethical-hacking-complete-course-6001', 'Penetration testing, network security, Kali Linux, Metasploit, OWASP Top 10, and bug bounties.', 'Cybersecurity', 'intermediate', true, 34.99, 'published')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.courses SET coach_id = v_coach_zain, status = 'published', is_published = true WHERE id = v_cyber_course;
  END IF;


  -- ================================================================
  -- E. CHAPTERS
  -- ================================================================
  -- Python (3 chapters, 8 lessons: 3+3+2)
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('c0000000-0000-0000-0000-000000000101', v_python_course, 'Introduction to Programming with Python', 'Learn what programming is, write your first script, and master python syntax basics.', 1, false, 'none', 3, 45),
    ('c0000000-0000-0000-0000-000000000102', v_python_course, 'Control Flow and Logic', 'Master conditionals, loops, error handling, and structured control flows.', 2, false, 'none', 3, 50),
    ('c0000000-0000-0000-0000-000000000103', v_python_course, 'Data Structures in Python', 'Deep dive into Python built-in data types: Lists, Tuples, Dictionaries, and Sets.', 3, false, 'none', 2, 40)
  ON CONFLICT (id) DO NOTHING;

  -- Web Dev (3 chapters, 7 lessons: 2+2+3)
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('c0000000-0000-0000-0000-000000000201', v_webdev_course, 'HTML5 Essentials', 'Understand semantic elements, lists, tables, links, images, and HTML forms.', 1, false, 'none', 2, 35),
    ('c0000000-0000-0000-0000-000000000202', v_webdev_course, 'Styling with CSS3', 'Style elements, master colors, typography, border-box sizing, and responsive Flexbox.', 2, false, 'none', 2, 45),
    ('c0000000-0000-0000-0000-000000000203', v_webdev_course, 'Dynamic Pages with JavaScript', 'Learn variables, loops, DOM selection, click listeners, and dynamic DOM updates.', 3, false, 'none', 3, 60)
  ON CONFLICT (id) DO NOTHING;

  -- ML (3 chapters, 7 lessons: 2+3+2)
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('c0000000-0000-0000-0000-000000000301', v_ml_course, 'Foundations of Machine Learning', 'Introduction to the ML landscape, terminology, Jupyter, and essential libraries.', 1, false, 'none', 2, 40),
    ('c0000000-0000-0000-0000-000000000302', v_ml_course, 'Regression and Classification', 'Learn linear & logistic regression, data splitting, training, and model metrics.', 2, false, 'none', 3, 65),
    ('c0000000-0000-0000-0000-000000000303', v_ml_course, 'Unsupervised Learning', 'Clustering with K-Means, dimensionality reduction using PCA, and recommendation engines.', 3, false, 'none', 2, 50)
  ON CONFLICT (id) DO NOTHING;

  -- Cyber (2 chapters, 4 lessons: 2+2)
  INSERT INTO public.chapters (id, course_id, title, description, order_index, is_locked, wall_type, total_lessons, estimated_mins)
  VALUES
    ('c0000000-0000-0000-0000-000000000401', v_cyber_course, 'Introduction to Ethical Hacking', 'Learn what ethical hacking is, the hacker mindset, and set up your pentesting lab.', 1, false, 'none', 2, 35),
    ('c0000000-0000-0000-0000-000000000402', v_cyber_course, 'Network Security Fundamentals', 'Network scanning, port analysis, service enumeration, and security assessment.', 2, false, 'none', 2, 35)
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- F. LESSONS — Python (8 lessons)
  -- ================================================================
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('ee000000-0000-0000-0000-000000000101', v_python_course, 'c0000000-0000-0000-0000-000000000101', 'What is Programming & Python?', '## Welcome to Python for Everybody!
In this lesson, we will explore the core concept of programming. A computer is essentially a highly efficient assistant that needs precise instructions to do any task. Programming is the process of writing those instructions.

### Why Python?
Python is a high-level, interpreted programming language known for its elegant syntax and readability. It is widely used in:
- **Web Development** (Django, Flask)
- **Data Science & ML** (pandas, scikit-learn, PyTorch)
- **Scripting & Automation**

Watch the lecture video below to see Python in action!', 1, 'video', 'https://www.youtube.com/embed/kqtD5dpn9C8', 15, true, 1, true),

    ('ee000000-0000-0000-0000-000000000102', v_python_course, 'c0000000-0000-0000-0000-000000000101', 'Variables & Basic Data Types', '## Python Variables & Types
In Python, we store data in variables. Unlike static languages, Python is dynamically typed, meaning you do not need to declare a variable''s type explicitly.

### Basic Types:
1. **Integer** (int): Whole numbers like `42`
2. **Float** (float): Decimal numbers like `3.14`
3. **String** (str): Text enclosed in quotes like `"Hello COGNARA!"`
4. **Boolean** (bool): Logical values, either `True` or `False`

### Example Code:
```python
x = 10
pi = 3.14159
name = "Cognara Learner"
is_active = True

print(type(x))    # Output: <class ''int''>
print(type(name)) # Output: <class ''str''>
```', 2, 'code', NULL, 15, false, 2, true),

    ('ee000000-0000-0000-0000-000000000103', v_python_course, 'c0000000-0000-0000-0000-000000000101', 'Writing Your First Python Script', '## Hello World in Python
Let''s put our knowledge to work. Your first coding task is to write a script that displays a welcoming message.

In Python, we use the `print()` function to output text to the console.

### Challenge:
Use the code editor on the side to write:
```python
print("Hello, World!")
```
Run the code and observe the compiled stdout. You''ve officially executed your first script!', 3, 'code', NULL, 15, false, 3, true),

    ('ee000000-0000-0000-0000-000000000104', v_python_course, 'c0000000-0000-0000-0000-000000000102', 'Conditional Statements (If/Else)', '## Making Decisions in Code
In programming, we often need to run different code blocks depending on certain criteria. We achieve this with `if`, `elif`, and `else` statements.

### Structure:
Python uses **indentation** (usually 4 spaces) to define code blocks. This is a unique and critical feature of Python.

### Example Code:
```python
score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
else:
    print("Grade: C")
```
Watch the detailed walkthrough video below!', 4, 'video', 'https://www.youtube.com/embed/rfscVS0vtbw', 20, false, 1, true),

    ('ee000000-0000-0000-0000-000000000105', v_python_course, 'c0000000-0000-0000-0000-000000000102', 'Loops & Iterations', '## Repeating Operations
Loops allow you to repeat a block of code multiple times. Python has two primary types of loops:
- **for loops**: Iterate over a sequence (list, range, string).
- **while loops**: Repeat as long as a condition is `True`.

### Examples:
```python
# For Loop
for i in range(5):
    print("Iteration:", i)

# While Loop
count = 0
while count < 3:
    print("Count is:", count)
    count += 1
```', 5, 'code', NULL, 15, false, 2, true),

    ('ee000000-0000-0000-0000-000000000106', v_python_course, 'c0000000-0000-0000-0000-000000000102', 'Python Basics Assessment', 'Take this interactive quiz to evaluate your understanding of Python variables, data types, conditional statements, and loops.

You have a 15-minute time limit. A passing score of 70% is required to unlock the next chapter. Good luck!', 6, 'quiz', NULL, 15, false, 3, true),

    ('ee000000-0000-0000-0000-000000000107', v_python_course, 'c0000000-0000-0000-0000-000000000103', 'Lists, Tuples & Collections', '## Grouping Data
In Python, lists and tuples are used to store multiple items in a single variable.

### Lists (Mutable):
You can change, add, and remove items from a list after it has been created. Defined with square brackets `[]`.
```python
fruits = ["apple", "banana", "cherry"]
fruits.append("orange")
print(fruits) # Output: [''apple'', ''banana'', ''cherry'', ''orange'']
```

### Tuples (Immutable):
You CANNOT change a tuple after creation. Defined with parentheses `()`. Used for fixed collections.
```python
coordinates = (40.7128, -74.0060)
```', 7, 'text', NULL, 20, false, 1, true),

    ('ee000000-0000-0000-0000-000000000108', v_python_course, 'c0000000-0000-0000-0000-000000000103', 'Dictionaries and Sets', '## Key-Value Mappings & Unique Values
### Dictionaries (dict):
Store data in key:value pairs. They are ordered, changeable, and do not allow duplicates.
```python
student = {
    "name": "Alex Johnson",
    "major": "Computer Science",
    "gpa": 3.3
}
print(student["name"]) # Output: Alex Johnson
```

### Sets (set):
Unordered, unchangeable, and unindexed collections of unique elements.
```python
unique_numbers = {1, 2, 3, 3, 2, 4}
print(unique_numbers) # Output: {1, 2, 3, 4}
```', 8, 'code', NULL, 20, false, 2, true)
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- G. LESSONS — Web Dev (7 lessons)
  -- ================================================================
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('ee000000-0000-0000-0000-000000000201', v_webdev_course, 'c0000000-0000-0000-0000-000000000201', 'Web Architecture & HTML Intro', '## The Structure of the Web
How does a browser render a web page?
When you visit a URL, your browser sends an HTTP request to a server, which responds with HTML, CSS, and JavaScript.

- **HTML** (HyperText Markup Language) defines the structural skeleton.
- **CSS** (Cascading Style Sheets) styles the page.
- **JavaScript** provides interactivity.

In this lesson, we will write our first HTML document containing headers, paragraphs, and list elements!', 1, 'video', 'https://www.youtube.com/embed/pQN-pnXPaVg', 20, true, 1, true),

    ('ee000000-0000-0000-0000-000000000202', v_webdev_course, 'c0000000-0000-0000-0000-000000000201', 'Working with Forms and Semantic Tags', '## Structuring Modern Web Pages
Modern HTML uses semantic tags (like `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`) to tell search engines and accessibility tools exactly what purpose each element serves.

### HTML Forms:
Forms are critical for collecting user inputs.
```html
<form action="/submit" method="POST">
  <label for="username">Username:</label>
  <input type="text" id="username" name="username">
  <button type="submit">Submit</button>
</form>
```', 2, 'text', NULL, 15, false, 2, true),

    ('ee000000-0000-0000-0000-000000000203', v_webdev_course, 'c0000000-0000-0000-0000-000000000202', 'CSS Selectors & Box Model', '## Introduction to CSS3
CSS is what turns a plain text document into a beautiful, styled webpage.

### The CSS Box Model:
Every HTML element is rendered as a rectangular box. The box model consists of:
1. **Content**: The text/images.
2. **Padding**: Transparent space around content, inside borders.
3. **Border**: The outline surrounding padding.
4. **Margin**: Transparent space outside borders, separating elements.

```css
.card {
  width: 300px;
  padding: 15px;
  border: 1px solid #ddd;
  margin: 10px;
}
```', 3, 'text', NULL, 20, false, 1, true),

    ('ee000000-0000-0000-0000-000000000204', v_webdev_course, 'c0000000-0000-0000-0000-000000000202', 'Flexbox & Responsive Layouts', '## Modern CSS Layouts
Flexbox (Flexible Box Layout) is a one-dimensional layout model that makes it easy to align and distribute space among items in a container, even when their size is dynamic.

### Quick Flexbox Rules:
```css
.container {
  display: flex;
  flex-direction: row; /* or column */
  justify-content: space-between; /* horizontal alignment */
  align-items: center; /* vertical alignment */
}
```', 4, 'text', NULL, 25, false, 2, true),

    ('ee000000-0000-0000-0000-000000000205', v_webdev_course, 'c0000000-0000-0000-0000-000000000203', 'JS Basics: Variables and Functions', '## The Brain of the Web: JavaScript
JavaScript is a lightweight, interpreted scripting language with first-class functions. It runs client-side in the browser to make pages alive.

### Variables & Functions:
```javascript
let name = "Muhammad Zain";
const age = 25;

function greet(user) {
  return "Hello, " + user;
}
console.log(greet(name)); // Output: Hello, Muhammad Zain
```', 5, 'video', 'https://www.youtube.com/embed/W6NZfCO5SIk', 25, false, 1, true),

    ('ee000000-0000-0000-0000-000000000206', v_webdev_course, 'c0000000-0000-0000-0000-000000000203', 'DOM Manipulation & Click Events', '## Interacting with HTML
The **DOM** (Document Object Model) is a programming interface for web documents. It represents the page so programs can change the structure, style, and content.

### Click Handler Example:
```javascript
const button = document.querySelector("#my-button");
button.addEventListener("click", () => {
  const header = document.querySelector("h1");
  header.textContent = "Clicked!";
  header.style.color = "red";
});
```', 6, 'code', NULL, 20, false, 2, true),

    ('ee000000-0000-0000-0000-000000000207', v_webdev_course, 'c0000000-0000-0000-0000-000000000203', 'HTML & CSS Fundamentals Quiz', 'Test your knowledge on tags, box model elements, padding vs margin, flexbox layout properties, and CSS selectors.

You need a score of 60% or higher to pass this quiz!', 7, 'quiz', NULL, 15, false, 3, true)
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- H. LESSONS — ML (7 lessons, including 2 NEW for ch303)
  -- ================================================================
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('ee000000-0000-0000-0000-000000000301', v_ml_course, 'c0000000-0000-0000-0000-000000000301', 'Introduction to ML Paradigms', '## What is Machine Learning?
Machine Learning is a field of computer science that gives computers the ability to learn without being explicitly programmed.

### Three Paradigms of ML:
1. **Supervised Learning**: Model learns from labeled training data (inputs & targets).
2. **Unsupervised Learning**: Model finds hidden patterns in unlabeled data.
3. **Reinforcement Learning**: Model learns by taking actions in an environment to maximize some cumulative reward.

Watch Google''s excellent introductory lecture below!', 1, 'video', 'https://www.youtube.com/embed/7eh4d6sabA0', 20, true, 1, true),

    ('ee000000-0000-0000-0000-000000000302', v_ml_course, 'c0000000-0000-0000-0000-000000000301', 'Setting Up Your Jupyter Environment', '## Jupyter Notebooks & Data Libraries
In this course, we will use Python along with libraries like:
- **NumPy**: Linear algebra and multi-dimensional arrays.
- **pandas**: Data manipulation and DataFrame objects.
- **scikit-learn**: Machine learning algorithms, pipeline tools, and evaluation metrics.', 2, 'text', NULL, 20, false, 2, true),

    ('ee000000-0000-0000-0000-000000000303', v_ml_course, 'c0000000-0000-0000-0000-000000000302', 'Linear Regression from Scratch', '## Predicting Continuous Outcomes
Linear Regression models the relationship between a dependent scalar variable $y$ and one or more explanatory variables $x$.

### Implementation in Python:
```python
import numpy as np
from sklearn.linear_model import LinearRegression

# Generate dummy data
X = np.array([[1], [2], [3], [4]])
y = np.array([3, 5, 7, 9]) # y = 2x + 1

model = LinearRegression()
model.fit(X, y)
print("Slope:", model.coef_[0])     # Output: 2.0
print("Intercept:", model.intercept_) # Output: 1.0
```', 3, 'code', NULL, 25, false, 1, true),

    ('ee000000-0000-0000-0000-000000000304', v_ml_course, 'c0000000-0000-0000-0000-000000000302', 'Logistic Regression & Classification', '## Classifying Categorical Outcomes
Unlike Linear Regression, **Logistic Regression** is used to predict categorical outcomes (e.g., Spam vs. Not Spam, Tumor vs. Benign). It uses the **sigmoid function** to map predictions to probabilities between 0 and 1.

Watch the freeCodeCamp lecture video below for a visual breakdown of linear decision boundaries!', 4, 'video', 'https://www.youtube.com/embed/i_LwzRVP7bg', 25, false, 2, true),

    ('ee000000-0000-0000-0000-000000000305', v_ml_course, 'c0000000-0000-0000-0000-000000000302', 'Intro to Machine Learning Quiz', 'Validate your conceptual understanding of supervised vs unsupervised paradigms, parameters, features, overfitting, and sklearn syntax.

A passing score of 75% is required!', 5, 'quiz', NULL, 15, false, 3, true),

    -- NEW: ch303 Unsupervised Learning lessons
    ('ee000000-0000-0000-0000-000000000306', v_ml_course, 'c0000000-0000-0000-0000-000000000303', 'K-Means Clustering', '## Unsupervised Learning: K-Means Clustering
K-Means is one of the simplest and most popular unsupervised machine learning algorithms. It partitions data into K distinct clusters based on feature similarity.

### How K-Means Works
1. **Initialize**: Randomly place K centroids in the feature space
2. **Assign**: Each data point is assigned to its nearest centroid
3. **Update**: Recalculate centroids as the mean of assigned points
4. **Repeat**: Steps 2-3 until convergence (centroids stop moving)

### Implementation
```python
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

# Generate synthetic data
X, y_true = make_blobs(n_samples=300, centers=4, random_state=42)

# Fit K-Means
kmeans = KMeans(n_clusters=4, random_state=42)
labels = kmeans.fit_predict(X)
print("Cluster centers:", kmeans.cluster_centers_)
```

### Choosing K: The Elbow Method
Plot the Within-Cluster Sum of Squares (WCSS) for different K values. The "elbow" point indicates the optimal number of clusters.', 6, 'code', NULL, 25, false, 1, true),

    ('ee000000-0000-0000-0000-000000000307', v_ml_course, 'c0000000-0000-0000-0000-000000000303', 'Dimensionality Reduction with PCA', '## Principal Component Analysis (PCA)
PCA is a technique used to reduce the dimensionality of a dataset while retaining as much variance as possible. It transforms features into a new coordinate system called **principal components**.

### Why Reduce Dimensions?
- **Visualization**: Project high-dimensional data into 2D/3D for plotting
- **Noise Reduction**: Remove low-variance features that add noise
- **Performance**: Speed up training by reducing feature count

### Using scikit-learn
```python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# Standardize
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Apply PCA (reduce to 2 components)
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

print("Explained variance ratio:", pca.explained_variance_ratio_)
print("Total variance retained:", sum(pca.explained_variance_ratio_))
```', 7, 'text', NULL, 25, false, 2, true)
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- I. LESSONS — Cybersecurity (4 NEW lessons)
  -- ================================================================
  INSERT INTO public.lessons (id, course_id, chapter_id, title, content, order_index, type, video_url, duration_mins, is_free_preview, lesson_order_in_chapter, is_published)
  VALUES
    ('ee000000-0000-0000-0000-000000000401', v_cyber_course, 'c0000000-0000-0000-0000-000000000401', 'What is Ethical Hacking?', '## Introduction to Ethical Hacking
Ethical hacking, also known as penetration testing or "pen testing," is the practice of deliberately probing computer systems, networks, and web applications to find security vulnerabilities that a malicious hacker could exploit.

### White Hat vs Black Hat Hackers
- **White Hat (Ethical)**: Authorized security professionals who test systems with explicit written permission
- **Black Hat (Malicious)**: Unauthorized hackers who exploit systems for personal gain or damage
- **Grey Hat**: Operate without permission but without malicious intent

### The Ethical Hacking Methodology
1. **Reconnaissance**: Gather information about the target
2. **Scanning**: Identify open ports, services, and vulnerabilities
3. **Gaining Access**: Exploit discovered vulnerabilities
4. **Maintaining Access**: Establish persistence (in a controlled manner)
5. **Reporting**: Document all findings with remediation steps

Watch the introductory lecture below!', 1, 'video', 'https://www.youtube.com/embed/3Kq1MIfTWCE', 20, true, 1, true),

    ('ee000000-0000-0000-0000-000000000402', v_cyber_course, 'c0000000-0000-0000-0000-000000000401', 'Setting Up Your Pentesting Lab', '## Building a Safe Testing Environment
Before you start any penetration testing, you need a safe, isolated lab environment. **NEVER** test on systems you do not have written authorization to test.

### Required Software
- **VirtualBox** or **VMware**: Hypervisor for running virtual machines
- **Kali Linux**: The industry-standard penetration testing distribution
- **Metasploitable**: A deliberately vulnerable VM for practice

### Setting Up Kali Linux
1. Download the latest Kali ISO from `https://www.kali.org/get-kali/`
2. Create a new VM in VirtualBox (4GB RAM, 40GB disk)
3. Boot from the ISO and follow the installation wizard
4. Update packages: `sudo apt update && sudo apt upgrade`

### Essential Pre-installed Tools
| Tool | Purpose |
|------|---------|
| Nmap | Network scanning and discovery |
| Metasploit | Exploitation framework |
| Burp Suite | Web application testing |
| Wireshark | Network traffic analysis |
| John the Ripper | Password cracking |', 2, 'text', NULL, 15, false, 2, true),

    ('ee000000-0000-0000-0000-000000000403', v_cyber_course, 'c0000000-0000-0000-0000-000000000402', 'Network Scanning with Nmap', '## Network Reconnaissance with Nmap
Nmap (Network Mapper) is a free, open-source tool used for network discovery and security auditing. It is the most essential tool in any ethical hacker''s toolkit.

### Basic Nmap Commands
```bash
# Ping scan — discover live hosts
nmap -sn 192.168.1.0/24

# TCP SYN scan (most common, requires root)
sudo nmap -sS 192.168.1.100

# Service version detection
nmap -sV 192.168.1.100

# OS detection
sudo nmap -O 192.168.1.100

# Aggressive scan (OS, version, scripts, traceroute)
sudo nmap -A 192.168.1.100
```

### Understanding Nmap Output
Port states:
- **open**: A service is accepting connections
- **closed**: No service is listening, but the port is accessible
- **filtered**: A firewall is blocking the probe

Practice scanning your Metasploitable VM!', 3, 'code', NULL, 20, false, 1, true),

    ('ee000000-0000-0000-0000-000000000404', v_cyber_course, 'c0000000-0000-0000-0000-000000000402', 'Ethical Hacking Assessment', 'Take this quiz to test your understanding of ethical hacking fundamentals, legal considerations, and basic reconnaissance techniques.

A passing score of 70% is required!', 4, 'quiz', NULL, 15, false, 2, true)
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- J. RESOURCES
  -- ================================================================
  IF EXISTS (SELECT 1 FROM public.lessons WHERE id = 'ee000000-0000-0000-0000-000000000101') THEN
    INSERT INTO public.resources (id, lesson_id, coach_id, title, type, url, access_level, is_permanently_free)
    VALUES
      ('ae000000-0000-0000-0000-000000000101', 'ee000000-0000-0000-0000-000000000101', v_coach_zain, 'Official Python Tutorial', 'link', 'https://docs.python.org/3/tutorial/index.html', 'free', true),
      ('ae000000-0000-0000-0000-000000000102', 'ee000000-0000-0000-0000-000000000107', v_coach_zain, 'Python Data Structures Guide', 'pdf', 'https://docs.python.org/3/tutorial/datastructures.html', 'free', true),
      ('ae000000-0000-0000-0000-000000000201', 'ee000000-0000-0000-0000-000000000201', v_coach_zain, 'MDN Web Docs: HTML Learning Area', 'link', 'https://developer.mozilla.org/en-US/docs/Learn', 'free', true),
      ('ae000000-0000-0000-0000-000000000203', 'ee000000-0000-0000-0000-000000000203', v_coach_zain, 'CSS Box Model Explained (Interactive)', 'link', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model', 'free', true),
      ('ae000000-0000-0000-0000-000000000301', 'ee000000-0000-0000-0000-000000000301', v_coach_zain, 'Stanford CS231n Deep Learning Notes', 'link', 'https://cs231n.github.io/', 'members', false),
      ('ae000000-0000-0000-0000-000000000302', 'ee000000-0000-0000-0000-000000000302', v_coach_zain, 'scikit-learn Linear Models Tutorial', 'link', 'https://scikit-learn.org/stable/tutorial/basic/tutorial.html', 'free', true),
      ('ae000000-0000-0000-0000-000000000401', 'ee000000-0000-0000-0000-000000000401', v_coach_zain, 'OWASP Top 10 Security Risks', 'link', 'https://owasp.org/www-project-top-ten/', 'free', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;


  -- ================================================================
  -- K. GRADE SCALES & QUIZZES
  -- ================================================================
  INSERT INTO public.grade_scales (id, coach_id, name, is_default, grades, passing_grade)
  VALUES (v_scale_id, v_coach_zain, 'Standard US Letter Scale', true, '{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}'::jsonb, 'C')
  ON CONFLICT (id) DO NOTHING;

  -- Python Quiz
  IF EXISTS (SELECT 1 FROM public.lessons WHERE id = 'ee000000-0000-0000-0000-000000000106') THEN
    INSERT INTO public.quizzes(id, lesson_id, coach_id, title, time_limit_mins, pass_score, attempts_allowed, is_ai_generated)
    VALUES (v_python_quiz, 'ee000000-0000-0000-0000-000000000106', v_coach_zain, 'Python Basics Assessment', 15, 70, 3, false)
    ON CONFLICT (id) DO NOTHING;
    UPDATE public.lessons SET quiz_id = v_python_quiz, has_quiz = true WHERE id = 'ee000000-0000-0000-0000-000000000106';
  END IF;

  -- Web Dev Quiz
  IF EXISTS (SELECT 1 FROM public.lessons WHERE id = 'ee000000-0000-0000-0000-000000000207') THEN
    INSERT INTO public.quizzes(id, lesson_id, coach_id, title, time_limit_mins, pass_score, attempts_allowed, is_ai_generated)
    VALUES (v_webdev_quiz, 'ee000000-0000-0000-0000-000000000207', v_coach_zain, 'HTML & CSS Fundamentals Quiz', 10, 60, 3, false)
    ON CONFLICT (id) DO NOTHING;
    UPDATE public.lessons SET quiz_id = v_webdev_quiz, has_quiz = true WHERE id = 'ee000000-0000-0000-0000-000000000207';
  END IF;

  -- ML Quiz
  IF EXISTS (SELECT 1 FROM public.lessons WHERE id = 'ee000000-0000-0000-0000-000000000305') THEN
    INSERT INTO public.quizzes(id, lesson_id, coach_id, title, time_limit_mins, pass_score, attempts_allowed, is_ai_generated)
    VALUES (v_ml_quiz, 'ee000000-0000-0000-0000-000000000305', v_coach_zain, 'Intro to Machine Learning Quiz', 20, 75, 2, false)
    ON CONFLICT (id) DO NOTHING;
    UPDATE public.lessons SET quiz_id = v_ml_quiz, has_quiz = true WHERE id = 'ee000000-0000-0000-0000-000000000305';
  END IF;

  -- Cyber Quiz
  IF EXISTS (SELECT 1 FROM public.lessons WHERE id = 'ee000000-0000-0000-0000-000000000404') THEN
    INSERT INTO public.quizzes(id, lesson_id, coach_id, title, time_limit_mins, pass_score, attempts_allowed, is_ai_generated)
    VALUES (v_cyber_quiz, 'ee000000-0000-0000-0000-000000000404', v_coach_zain, 'Ethical Hacking Assessment', 15, 70, 3, false)
    ON CONFLICT (id) DO NOTHING;
    UPDATE public.lessons SET quiz_id = v_cyber_quiz, has_quiz = true WHERE id = 'ee000000-0000-0000-0000-000000000404';
  END IF;


  -- ================================================================
  -- L. QUESTIONS & OPTIONS
  -- ================================================================
  -- Python Quiz (5 questions)
  IF EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_python_quiz) THEN
    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000101', v_python_quiz, 'What is the output of print(type(42))?', 'mcq', 20, 1, 'In Python, the number 42 is an integer, so its type is <class ''int''>.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000001011', 'ff000000-0000-0000-0000-000000000101', '<class ''float''>', false),
      ('f0000000-0000-0000-0000-000000001012', 'ff000000-0000-0000-0000-000000000101', '<class ''int''>', true),
      ('f0000000-0000-0000-0000-000000001013', 'ff000000-0000-0000-0000-000000000101', '<class ''str''>', false),
      ('f0000000-0000-0000-0000-000000001014', 'ff000000-0000-0000-0000-000000000101', '<class ''number''>', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000102', v_python_quiz, 'A Python list is immutable (cannot be changed after creation).', 'true_false', 20, 2, 'Lists are mutable. You can append, remove, and modify items freely.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000001021', 'ff000000-0000-0000-0000-000000000102', 'True', false),
      ('f0000000-0000-0000-0000-000000001022', 'ff000000-0000-0000-0000-000000000102', 'False', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000103', v_python_quiz, 'Which keyword is used to define a function in Python?', 'mcq', 20, 3, 'The `def` keyword is used to define (declare) a new function.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000001031', 'ff000000-0000-0000-0000-000000000103', 'func', false),
      ('f0000000-0000-0000-0000-000000001032', 'ff000000-0000-0000-0000-000000000103', 'define', false),
      ('f0000000-0000-0000-0000-000000001033', 'ff000000-0000-0000-0000-000000000103', 'def', true),
      ('f0000000-0000-0000-0000-000000001034', 'ff000000-0000-0000-0000-000000000103', 'function', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000104', v_python_quiz, 'What is returned by len([1, 2, 3])?', 'mcq', 20, 4, 'The `len()` function returns the number of items in a collection. This list contains 3 items.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000001041', 'ff000000-0000-0000-0000-000000000104', '2', false),
      ('f0000000-0000-0000-0000-000000001042', 'ff000000-0000-0000-0000-000000000104', '3', true),
      ('f0000000-0000-0000-0000-000000001043', 'ff000000-0000-0000-0000-000000000104', '4', false),
      ('f0000000-0000-0000-0000-000000001044', 'ff000000-0000-0000-0000-000000000104', 'Error', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000105', v_python_quiz, 'Python supports multiple inheritance (a class inheriting from more than one parent).', 'true_false', 20, 5, 'Yes, Python explicitly supports multiple inheritance, unlike languages like Java.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000001051', 'ff000000-0000-0000-0000-000000000105', 'True', true),
      ('f0000000-0000-0000-0000-000000001052', 'ff000000-0000-0000-0000-000000000105', 'False', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Web Dev Quiz (5 questions)
  IF EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_webdev_quiz) THEN
    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000201', v_webdev_quiz, 'Which tag is used for the largest heading in HTML?', 'mcq', 20, 1, '`<h1>` defines the most important and largest heading.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000002011', 'ff000000-0000-0000-0000-000000000201', '<h6>', false),
      ('f0000000-0000-0000-0000-000000002012', 'ff000000-0000-0000-0000-000000000201', '<head>', false),
      ('f0000000-0000-0000-0000-000000002013', 'ff000000-0000-0000-0000-000000000201', '<heading>', false),
      ('f0000000-0000-0000-0000-000000002014', 'ff000000-0000-0000-0000-000000000201', '<h1>', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000202', v_webdev_quiz, 'CSS stands for Cascading Style Sheets.', 'true_false', 20, 2, 'CSS is the standard acronym for Cascading Style Sheets.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000002021', 'ff000000-0000-0000-0000-000000000202', 'True', true),
      ('f0000000-0000-0000-0000-000000002022', 'ff000000-0000-0000-0000-000000000202', 'False', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000203', v_webdev_quiz, 'Which CSS property changes the text color?', 'mcq', 20, 3, 'The `color` property is used in CSS to style the foreground text.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000002031', 'ff000000-0000-0000-0000-000000000203', 'text-color', false),
      ('f0000000-0000-0000-0000-000000002032', 'ff000000-0000-0000-0000-000000000203', 'color', true),
      ('f0000000-0000-0000-0000-000000002033', 'ff000000-0000-0000-0000-000000000203', 'font-color', false),
      ('f0000000-0000-0000-0000-000000002034', 'ff000000-0000-0000-0000-000000000203', 'style-color', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000204', v_webdev_quiz, 'The <div> tag is an inline element by default.', 'true_false', 20, 4, '`<div>` is a block-level element. Elements like `<span>`, `<a>`, and `<strong>` are inline.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000002041', 'ff000000-0000-0000-0000-000000000204', 'True', false),
      ('f0000000-0000-0000-0000-000000002042', 'ff000000-0000-0000-0000-000000000204', 'False', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000205', v_webdev_quiz, 'Which CSS property is used to change background?', 'mcq', 20, 5, '`background-color` is specifically used to change the background element color.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000002051', 'ff000000-0000-0000-0000-000000000205', 'color', false),
      ('f0000000-0000-0000-0000-000000002052', 'ff000000-0000-0000-0000-000000000205', 'bg-color', false),
      ('f0000000-0000-0000-0000-000000002053', 'ff000000-0000-0000-0000-000000000205', 'background-color', true),
      ('f0000000-0000-0000-0000-000000002054', 'ff000000-0000-0000-0000-000000000205', 'bgcolor', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ML Quiz (5 questions)
  IF EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_ml_quiz) THEN
    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000301', v_ml_quiz, 'Supervised learning requires labeled training data.', 'true_false', 20, 1, 'Supervised learning operates on input-output pairs where labels are explicitly provided.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000003011', 'ff000000-0000-0000-0000-000000000301', 'True', true),
      ('f0000000-0000-0000-0000-000000003012', 'ff000000-0000-0000-0000-000000000301', 'False', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000302', v_ml_quiz, 'Which of the following is NOT a type of machine learning?', 'mcq', 20, 2, 'Supervised, Unsupervised, and Reinforcement are standard paradigms. ''Compiled Learning'' does not exist.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000003021', 'ff000000-0000-0000-0000-000000000302', 'Supervised Learning', false),
      ('f0000000-0000-0000-0000-000000003022', 'ff000000-0000-0000-0000-000000000302', 'Unsupervised Learning', false),
      ('f0000000-0000-0000-0000-000000003023', 'ff000000-0000-0000-0000-000000000302', 'Compiled Learning', true),
      ('f0000000-0000-0000-0000-000000003024', 'ff000000-0000-0000-0000-000000000302', 'Reinforcement Learning', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000303', v_ml_quiz, 'Overfitting means the model performs well on training data but poorly on unseen test data.', 'true_false', 20, 3, 'This is the exact definition of overfitting: high variance, where model memorizes training noise instead of generalizing.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000003031', 'ff000000-0000-0000-0000-000000000303', 'True', true),
      ('f0000000-0000-0000-0000-000000003032', 'ff000000-0000-0000-0000-000000000303', 'False', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000304', v_ml_quiz, 'Which algorithm is commonly used for classification?', 'mcq', 20, 4, 'Random Forest is a highly versatile supervised classification/regression ensemble method.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000003041', 'ff000000-0000-0000-0000-000000000304', 'Linear Regression', false),
      ('f0000000-0000-0000-0000-000000003042', 'ff000000-0000-0000-0000-000000000304', 'K-Means', false),
      ('f0000000-0000-0000-0000-000000003043', 'ff000000-0000-0000-0000-000000000304', 'Random Forest', true),
      ('f0000000-0000-0000-0000-000000003044', 'ff000000-0000-0000-0000-000000000304', 'PCA', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000305', v_ml_quiz, 'What does the ''k'' in KNN stand for?', 'mcq', 20, 5, 'K-Nearest Neighbors uses ''k'' to specify the number of neighbors to inspect.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000003051', 'ff000000-0000-0000-0000-000000000305', 'Kilo', false),
      ('f0000000-0000-0000-0000-000000003052', 'ff000000-0000-0000-0000-000000000305', 'Number of nearest neighbors', true),
      ('f0000000-0000-0000-0000-000000003053', 'ff000000-0000-0000-0000-000000000305', 'Kernel size', false),
      ('f0000000-0000-0000-0000-000000003054', 'ff000000-0000-0000-0000-000000000305', 'K-Means clusters', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Cyber Quiz (5 NEW questions)
  IF EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_cyber_quiz) THEN
    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000401', v_cyber_quiz, 'Ethical hacking requires written authorization before testing a system.', 'true_false', 20, 1, 'Always obtain explicit written permission before conducting any penetration test. Testing without authorization is illegal.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000004011', 'ff000000-0000-0000-0000-000000000401', 'True', true),
      ('f0000000-0000-0000-0000-000000004012', 'ff000000-0000-0000-0000-000000000401', 'False', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000402', v_cyber_quiz, 'Which tool is commonly used for network port scanning?', 'mcq', 20, 2, 'Nmap (Network Mapper) is the industry-standard tool for network discovery and port scanning.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000004021', 'ff000000-0000-0000-0000-000000000402', 'Photoshop', false),
      ('f0000000-0000-0000-0000-000000004022', 'ff000000-0000-0000-0000-000000000402', 'Nmap', true),
      ('f0000000-0000-0000-0000-000000004023', 'ff000000-0000-0000-0000-000000000402', 'Excel', false),
      ('f0000000-0000-0000-0000-000000004024', 'ff000000-0000-0000-0000-000000000402', 'VS Code', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000403', v_cyber_quiz, 'A penetration test and a vulnerability assessment are the same thing.', 'true_false', 20, 3, 'A vulnerability assessment identifies weaknesses; a penetration test goes further by actively exploiting them to assess real-world impact.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000004031', 'ff000000-0000-0000-0000-000000000403', 'True', false),
      ('f0000000-0000-0000-0000-000000004032', 'ff000000-0000-0000-0000-000000000403', 'False', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000404', v_cyber_quiz, 'What does OWASP stand for?', 'mcq', 20, 4, 'OWASP = Open Web Application Security Project, a nonprofit focused on improving software security.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000004041', 'ff000000-0000-0000-0000-000000000404', 'Open Web Application Security Project', true),
      ('f0000000-0000-0000-0000-000000004042', 'ff000000-0000-0000-0000-000000000404', 'Online Web Attack Security Protocol', false),
      ('f0000000-0000-0000-0000-000000004043', 'ff000000-0000-0000-0000-000000000404', 'Open Wireless Access Security Plan', false),
      ('f0000000-0000-0000-0000-000000004044', 'ff000000-0000-0000-0000-000000000404', 'Organized Web Application Safeguard Program', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
    VALUES ('ff000000-0000-0000-0000-000000000405', v_cyber_quiz, 'Which Linux distribution is most popular for penetration testing?', 'mcq', 20, 5, 'Kali Linux is the industry-standard OS for penetration testing, pre-loaded with security tools.')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.question_options (id, question_id, text, is_correct) VALUES
      ('f0000000-0000-0000-0000-000000004051', 'ff000000-0000-0000-0000-000000000405', 'Ubuntu', false),
      ('f0000000-0000-0000-0000-000000004052', 'ff000000-0000-0000-0000-000000000405', 'Fedora', false),
      ('f0000000-0000-0000-0000-000000004053', 'ff000000-0000-0000-0000-000000000405', 'Kali Linux', true),
      ('f0000000-0000-0000-0000-000000004054', 'ff000000-0000-0000-0000-000000000405', 'Arch Linux', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;


  -- ================================================================
  -- M. QUIZ ATTEMPTS & ANSWERS (Daniyal only)
  -- ================================================================
  -- Daniyal attempts Python Quiz → 80% (4/5 correct)
  IF EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_python_quiz) THEN
    INSERT INTO public.quiz_attempts (id, student_id, quiz_id, score, passed, started_at, completed_at)
    VALUES ('aa000000-0000-0000-0000-000000000001', v_student_daniyal, v_python_quiz, 80, true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.quiz_answers (attempt_id, question_id, answer_text, selected_option_id, is_correct)
    VALUES
      ('aa000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000101', NULL, 'f0000000-0000-0000-0000-000000001012', true),
      ('aa000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000102', NULL, 'f0000000-0000-0000-0000-000000001021', false),
      ('aa000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000103', NULL, 'f0000000-0000-0000-0000-000000001033', true),
      ('aa000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000104', NULL, 'f0000000-0000-0000-0000-000000001042', true),
      ('aa000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000105', NULL, 'f0000000-0000-0000-0000-000000001051', true)
    ON CONFLICT DO NOTHING;
  END IF;


  -- ================================================================
  -- N. GRADED SUBMISSIONS (Daniyal only)
  -- ================================================================
  IF v_python_course IS NOT NULL AND EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = 'aa000000-0000-0000-0000-000000000001') THEN
    INSERT INTO public.graded_submissions (id, student_id, quiz_id, attempt_id, course_id, coach_id, grade_scale_id, raw_score, max_score, percentage, letter_grade, grade_point, passed, overall_feedback, strengths, areas_for_improvement, grading_method, finalized, finalized_at)
    VALUES (
      '95000000-0000-0000-0000-000000000001',
      v_student_daniyal,
      v_python_quiz,
      'aa000000-0000-0000-0000-000000000001',
      v_python_course,
      v_coach_zain,
      v_scale_id,
      80.00, 100.00, 80.00, 'B', 3.00, true,
      'Excellent effort, Daniyal! You have demonstrated a strong understanding of Python basics, variables, and function declarations. Your mistake on list mutability shows a minor gap, but overall you did fantastic. Keep up the high level of engagement!',
      ARRAY['Syntax and basic print statements', 'Variable assignments', 'Function keywords'],
      ARRAY['List mutability (lists CAN be changed after creation)'],
      'ai', true, NOW() - INTERVAL '1 hour 40 minutes'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;


  -- ================================================================
  -- O. ENROLLMENTS (Daniyal in all 4 courses)
  -- ================================================================
  -- MATH CHECK:
  --   Python:  6/8  completed = 75.00%
  --   WebDev:  3/7  completed = 42.86% → stored as 43
  --   ML:      2/7  completed = 28.57% → stored as 29
  --   Cyber:   1/4  completed = 25.00%
  -- ================================================================
  IF v_python_course IS NOT NULL THEN
    INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
    VALUES ('e0000000-0000-0000-0000-000000000001', v_student_daniyal, v_python_course, 75, NOW() - INTERVAL '15 days', 'active', NOW() - INTERVAL '2 hours')
    ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 75, status = 'active';
  END IF;

  IF v_webdev_course IS NOT NULL THEN
    INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
    VALUES ('e0000000-0000-0000-0000-000000000002', v_student_daniyal, v_webdev_course, 43, NOW() - INTERVAL '10 days', 'active', NOW() - INTERVAL '1 day')
    ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 43, status = 'active';
  END IF;

  IF v_ml_course IS NOT NULL THEN
    INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
    VALUES ('e0000000-0000-0000-0000-000000000003', v_student_daniyal, v_ml_course, 29, NOW() - INTERVAL '20 days', 'active', NOW() - INTERVAL '1 day 4 hours')
    ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 29, status = 'active';
  END IF;

  IF v_cyber_course IS NOT NULL THEN
    INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
    VALUES ('e0000000-0000-0000-0000-000000000004', v_student_daniyal, v_cyber_course, 25, NOW() - INTERVAL '5 days', 'active', NOW() - INTERVAL '6 hours')
    ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 25, status = 'active';
  END IF;


  -- ================================================================
  -- P. LESSON PROGRESS (Daniyal only — matches enrollment %)
  -- ================================================================
  -- Python: 6/8 = 75%
  INSERT INTO public.lesson_progress (student_id, lesson_id, completed, completed_at) VALUES
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000101', true, NOW() - INTERVAL '14 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000102', true, NOW() - INTERVAL '13 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000103', true, NOW() - INTERVAL '12 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000104', true, NOW() - INTERVAL '11 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000105', true, NOW() - INTERVAL '10 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000106', true, NOW() - INTERVAL '9 days')
  ON CONFLICT (student_id, lesson_id) DO NOTHING;

  -- Web Dev: 3/7 = 43%
  INSERT INTO public.lesson_progress (student_id, lesson_id, completed, completed_at) VALUES
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000201', true, NOW() - INTERVAL '9 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000202', true, NOW() - INTERVAL '8 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000203', true, NOW() - INTERVAL '7 days')
  ON CONFLICT (student_id, lesson_id) DO NOTHING;

  -- ML: 2/7 = 29%
  INSERT INTO public.lesson_progress (student_id, lesson_id, completed, completed_at) VALUES
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000301', true, NOW() - INTERVAL '19 days'),
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000302', true, NOW() - INTERVAL '18 days')
  ON CONFLICT (student_id, lesson_id) DO NOTHING;

  -- Cyber: 1/4 = 25%
  INSERT INTO public.lesson_progress (student_id, lesson_id, completed, completed_at) VALUES
    (v_student_daniyal, 'ee000000-0000-0000-0000-000000000401', true, NOW() - INTERVAL '4 days')
  ON CONFLICT (student_id, lesson_id) DO NOTHING;


  -- ================================================================
  -- Q. COURSE REVIEWS (Daniyal)
  -- ================================================================
  IF v_python_course IS NOT NULL AND EXISTS (SELECT 1 FROM public.enrollments WHERE id = 'e0000000-0000-0000-0000-000000000001') THEN
    INSERT INTO public.course_reviews (student_id, course_id, enrollment_id, rating, review_text, is_verified_completion, is_flagged, helpful_votes, created_at)
    VALUES (
      v_student_daniyal, v_python_course, 'e0000000-0000-0000-0000-000000000001',
      5,
      'Absolutely fantastic course! Muhammad Zain makes complex programming concepts super easy to grasp. The hands-on code compiler and the AI GNARA tutor are phenomenal resources. Best Python course I have taken!',
      false, false, 12, NOW() - INTERVAL '4 days'
    )
    ON CONFLICT (student_id, course_id) DO NOTHING;
  END IF;

  IF v_webdev_course IS NOT NULL AND EXISTS (SELECT 1 FROM public.enrollments WHERE id = 'e0000000-0000-0000-0000-000000000002') THEN
    INSERT INTO public.course_reviews (student_id, course_id, enrollment_id, rating, review_text, is_verified_completion, is_flagged, flag_reason, helpful_votes, created_at)
    VALUES (
      v_student_daniyal, v_webdev_course, 'e0000000-0000-0000-0000-000000000002',
      4,
      'Great course structure! The chapters on semantic HTML and Flexbox are extremely detailed. You can join my Telegram channel t.me/free_webdev_books for additional PDF textbooks!',
      false, true, 'Contains external links promotion and encouraging off-platform textbook distribution', 6, NOW() - INTERVAL '2 days'
    )
    ON CONFLICT (student_id, course_id) DO NOTHING;
  END IF;


  -- ================================================================
  -- R. NOTIFICATIONS
  -- ================================================================
  INSERT INTO public.notifications (user_id, type, title, message, action_url, is_read, created_at) VALUES
    (v_student_daniyal, 'learning', 'Quiz Graded Successfully', 'Your submission for Python Basics Assessment has been graded. You scored 80% — Grade: B.', '/grades', false, NOW() - INTERVAL '1 hour 40 minutes'),
    (v_student_daniyal, 'system', 'Upcoming Live Q&A Session', 'Muhammad Zain scheduled a Python Functions live lecture for tomorrow at 2:00 PM UTC.', '/courses', false, NOW() - INTERVAL '3 hours'),
    (v_student_daniyal, 'learning', 'Course Milestone!', 'Congratulations! You are 75% through Python for Everybody Specialization. Keep it up!', '/my-courses', true, NOW() - INTERVAL '9 days'),
    (v_coach_zain, 'system', 'New Student Enrolled', 'Daniyal Ahmad has enrolled in your Ethical Hacking course.', '/coach/courses', false, NOW() - INTERVAL '5 days'),
    (v_admin_id, 'system', 'New Bug Report', 'A new bug report has been submitted: "Interactive compiler freezing on loop scripts".', '/admin/reports', false, NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;


  -- ================================================================
  -- S. LIVE SESSIONS (by Zain)
  -- ================================================================
  IF v_python_course IS NOT NULL THEN
    INSERT INTO public.live_sessions (id, coach_id, course_id, title, description, scheduled_at, duration_mins, max_students, status, daily_room_url, daily_room_name, price_usd)
    VALUES (
      '15000000-0000-0000-0000-000000000001', v_coach_zain, v_python_course,
      'Python Q&A: Functions & OOP Deep Dive',
      'Join Muhammad Zain for a live screen-share and interactive coding session covering Python namespaces, variable scopes, lambda definitions, and designing class structures.',
      NOW() + INTERVAL '1 day 15 hours', 60, 100, 'scheduled',
      'https://cognara.daily.co/python-deep-dive', 'python-deep-dive', 0.00
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF v_webdev_course IS NOT NULL THEN
    INSERT INTO public.live_sessions (id, coach_id, course_id, title, description, scheduled_at, duration_mins, max_students, status, daily_room_url, daily_room_name, price_usd)
    VALUES (
      '15000000-0000-0000-0000-000000000002', v_coach_zain, v_webdev_course,
      'Live Code Review: Building a Portfolio Website',
      'Bring your personal portfolio HTML/CSS code files! We will walk through real-time improvements for Flexbox arrangements, responsive breakpoints, and layout designs.',
      NOW() + INTERVAL '2 days 18 hours', 90, 50, 'scheduled',
      'https://cognara.daily.co/portfolio-code-review', 'portfolio-code-review', 0.00
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;


  -- ================================================================
  -- T. PEER SESSION (hosted by Daniyal)
  -- ================================================================
  IF v_python_course IS NOT NULL THEN
    INSERT INTO public.peer_sessions (id, host_id, title, description, topic, course_ref_id, scheduled_at, duration_mins, max_students, status, daily_room_url)
    VALUES (
      'e5000000-0000-0000-0000-000000000001', v_student_daniyal,
      'DSA Practice: Binary Trees & Graphs',
      'Casual study session. We will practice recursive tree traversals and dynamic programming problems from LeetCode. Anyone looking to prepare for technical interviews is welcome!',
      'Data Structures & Algorithms', v_python_course,
      NOW() + INTERVAL '1 day 19 hours', 60, 10, 'scheduled',
      'https://cognara.daily.co/dsa-trees-practice'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;


  -- ================================================================
  -- U. BUG REPORTS (for admin dashboard)
  -- ================================================================
  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'b8000000-0000-0000-0000-000000000001', v_student_daniyal,
    'security', 'Critical security breach: exploit instructions found in private notes',
    'When reviewing the generated PDF feature, I noticed that students can write exploit scripts and instructions in their private code notes without any server-side validation or sanitation filters.',
    'https://cognara.dev/courses/python-for-everybody/lessons/code-lesson',
    'S1', 99, 'valid', 'pending_triage', 'critical', NOW() - INTERVAL '1 day'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'b8000000-0000-0000-0000-000000000002', v_student_daniyal,
    'abuse', 'Spam messages sent to peers in DSA session chat room',
    'During the peer session, a user repeatedly posted advertisements and promotional messages in the chat panel, making it impossible to discuss the binary search trees exercise.',
    'https://cognara.dev/peer-sessions/e5000000-0000-0000-0000-000000000001',
    'S2', 96, 'valid', 'in_progress', 'high', NOW() - INTERVAL '12 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'b8000000-0000-0000-0000-000000000003', v_student_daniyal,
    'bug', 'Interactive code compiler editor freezing on loop scripts',
    'When attempting to compile nested loops in Python or JavaScript inside the browser compiler panel, the UI hangs completely, requiring a hard browser refresh. Happens mostly on Safari 17.',
    'https://cognara.dev/courses/python-for-everybody/lessons/loops-and-iterations',
    'S3', 92, 'valid', 'triaged', 'normal', NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'b8000000-0000-0000-0000-000000000004', v_student_daniyal,
    'abuse', 'Spam promotional link found in lecture notes PDF comments',
    'Someone uploaded or commented a Telegram link offering free promo codes for third party courses in the general course notes resources tab.',
    'https://cognara.dev/courses/python-for-everybody/resources',
    'S3', 88, 'valid', 'triaged', 'normal', NOW() - INTERVAL '1 day 6 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'b8000000-0000-0000-0000-000000000005', v_student_daniyal,
    'content', 'Suspected plagiarized slides in Chapter 3',
    'The slides and code snippets shown in Chapter 3 for list operations are a direct copy of a paid textbook without proper attribution or reference links.',
    'https://cognara.dev/courses/python-for-everybody/chapters/3',
    'S4', 85, 'valid', 'pending_triage', 'low', NOW() - INTERVAL '1 day 18 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_category, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'b8000000-0000-0000-0000-000000000013', v_student_daniyal,
    'bug', 'Page numbers misaligned in exported grade report PDF',
    'The page numbers at the footer of the exported grade report are slightly misaligned on mobile screen sizes. This is a very minor layout bug with the PDF export.',
    'https://cognara.dev/grades', 'bug', 'S5', 95, 'invalid', 'closed', 'low', NOW() - INTERVAL '5 hours'
  )
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- V. SUPPORT TICKET (Daniyal)
  -- ================================================================
  INSERT INTO public.support_tickets (id, user_id, category, subject, status, priority, created_at)
  VALUES ('ab000000-0000-0000-0000-000000000001', v_student_daniyal, 'technical', 'How to download my completed course certificate?', 'ai_resolved', 'normal', NOW() - INTERVAL '3 days')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_type, content, created_at) VALUES
    ('ad000000-0000-0000-0000-000000000011', 'ab000000-0000-0000-0000-000000000001', v_student_daniyal, 'user', 'Hi, I completed the Python course quiz and I would like to download my certificate. How do I access it from the dashboard?', NOW() - INTERVAL '3 days'),
    ('ad000000-0000-0000-0000-000000000012', 'ab000000-0000-0000-0000-000000000001', NULL, 'ai_agent', 'Hello Daniyal! You can access your certificate by navigating to your Profile > Achievements tab. Click the "Download Certificate" button next to the completed course. If the button is not visible, make sure you have completed all lessons and passed the final assessment.', NOW() - INTERVAL '2 days 23 hours 58 minutes')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.support_tickets (id, user_id, category, subject, status, priority, created_at)
  VALUES ('ab000000-0000-0000-0000-000000000002', v_student_daniyal, 'billing', 'Duplicate charge for Machine Learning course', 'open', 'high', NOW() - INTERVAL '12 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_type, content, created_at) VALUES
    ('ad000000-0000-0000-0000-000000000021', 'ab000000-0000-0000-0000-000000000002', v_student_daniyal, 'user', 'Hi, I was charged twice for the Machine Learning A-Z course. Please check the transactions and refund the duplicate one.', NOW() - INTERVAL '12 hours'),
    ('ad000000-0000-0000-0000-000000000022', 'ab000000-0000-0000-0000-000000000002', NULL, 'ai_agent', 'Hello Daniyal! I checked your account and identified duplicate charges for the Machine Learning course. I have escalated this billing ticket to our billing admin team for processing. They will review it and issue a refund shortly.', NOW() - INTERVAL '11 hours 58 minutes')
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- W. GENERATED PDFs
  -- ================================================================
  INSERT INTO public.generated_pdfs (id, user_id, title, type, storage_path, file_size_bytes, page_count, is_public)
  VALUES ('df000000-0000-0000-0000-000000000001', v_student_daniyal, 'COGNARA Backend Exploit & Brain Dump', 'research_report', 'public/pdfs/daniyal-exploit-notes.pdf', 35600, 3, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.generated_pdfs (id, user_id, title, type, storage_path, file_size_bytes, page_count, is_public)
  VALUES ('df000000-0000-0000-0000-000000000002', v_student_daniyal, 'Promo Code & Free Telegram Access Guide', 'lecture_notes', 'public/pdfs/daniyal-promo-guide.pdf', 18500, 1, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.generated_pdfs (id, user_id, title, type, storage_path, file_size_bytes, page_count, is_public)
  VALUES ('df000000-0000-0000-0000-000000000003', v_student_daniyal, 'Python Basics Grade Report', 'grade_report', 'public/pdfs/daniyal-grade-report.pdf', 41200, 2, false)
  ON CONFLICT (id) DO NOTHING;


  -- ================================================================
  -- X. GAMIFICATION: XP & BADGES
  -- ================================================================
  INSERT INTO public.user_xp (user_id, total_xp, level, streak_days, longest_streak, last_activity)
  VALUES (v_student_daniyal, 2450, 5, 12, 18, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    streak_days = EXCLUDED.streak_days,
    longest_streak = EXCLUDED.longest_streak;

  INSERT INTO public.badges (id, name, description, icon, xp_reward, criteria) VALUES
    (v_badge_first_steps, 'First Steps', 'Completed your very first lesson on COGNARA!', '🎯', 50, '{"lessons_completed": 1}'::jsonb),
    (v_badge_quiz_master, 'Quiz Master', 'Scored 100%% on 3 assessments.', '🏆', 200, '{"perfect_quizzes": 3}'::jsonb),
    (v_badge_streak_war, 'Streak Warrior', 'Maintained a 7-day study streak.', '🔥', 150, '{"streak_days": 7}'::jsonb),
    (v_badge_code_runner, 'Code Runner', 'Executed 10 scripts successfully in the interactive compiler.', '💻', 300, '{"code_submissions": 10}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_badges (user_id, badge_id, earned_at) VALUES
    (v_student_daniyal, v_badge_first_steps, NOW() - INTERVAL '14 days'),
    (v_student_daniyal, v_badge_streak_war, NOW() - INTERVAL '5 days')
  ON CONFLICT (user_id, badge_id) DO NOTHING;


  -- ================================================================
  -- Y. UPDATE COURSE STATS (total_lessons, total_enrolled, avg_rating)
  -- ================================================================
  -- Python: 8 lessons, 1 enrolled, avg_rating 5.0
  UPDATE public.courses SET total_lessons = 8, total_enrolled = 1, avg_rating = 5.0 WHERE id = v_python_course;
  -- Web Dev: 7 lessons, 1 enrolled, avg_rating 4.0
  UPDATE public.courses SET total_lessons = 7, total_enrolled = 1, avg_rating = 4.0 WHERE id = v_webdev_course;
  -- ML: 7 lessons, 1 enrolled, no reviews
  UPDATE public.courses SET total_lessons = 7, total_enrolled = 1 WHERE id = v_ml_course;
  -- Cyber: 4 lessons, 1 enrolled, no reviews
  UPDATE public.courses SET total_lessons = 4, total_enrolled = 1 WHERE id = v_cyber_course;

END $$;
