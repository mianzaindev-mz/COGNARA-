-- ================================================================
-- COGNARA Presentation Demo - Part 3: Quizzes & Grading
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Safely ensure required columns exist to support base and upgraded schemas
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS quiz_id UUID;

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

DO $$
DECLARE
  v_python_course UUID;
  v_webdev_course UUID;
  v_ml_course UUID;
  
  v_coach_zain UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc01';
  v_coach_james UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc02';
  v_coach_priya UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc03';
  
  v_student_daniyal UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd01';
  v_student_maria UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd02';
  
  v_python_quiz UUID := 'qz000000-0000-0000-0000-000000000001';
  v_webdev_quiz UUID := 'qz000000-0000-0000-0000-000000000002';
  v_ml_quiz     UUID := 'qz000000-0000-0000-0000-000000000003';
  
  v_scale_id UUID := 'gs000000-cccc-0000-0000-000000000001';
BEGIN
  -- 1. Get course IDs
  SELECT id INTO v_python_course FROM public.courses WHERE slug = 'python-for-everybody-spec-2001' LIMIT 1;
  SELECT id INTO v_webdev_course FROM public.courses WHERE slug = 'complete-web-developer-bootcamp-1001' LIMIT 1;
  SELECT id INTO v_ml_course FROM public.courses WHERE slug = 'machine-learning-az-python-2003' LIMIT 1;

  -- 2. SEED GRADE SCALES
  INSERT INTO public.grade_scales (id, coach_id, name, is_default, grades, passing_grade)
  VALUES (
    v_scale_id,
    v_coach_zain,
    'Standard US Letter Scale',
    true,
    '{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}'::jsonb,
    'C'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. SEED QUIZZES
  INSERT INTO public.quizzes(id, lesson_id, coach_id, title, time_limit_mins, pass_score, attempts_allowed, is_ai_generated)
  VALUES
    (v_python_quiz, 'le000000-0000-0000-0000-000000000106', v_coach_zain, 'Python Basics Assessment', 15, 70, 3, false),
    (v_webdev_quiz, 'le000000-0000-0000-0000-000000000207', v_coach_james, 'HTML & CSS Fundamentals Quiz', 10, 60, 3, false),
    (v_ml_quiz, 'le000000-0000-0000-0000-000000000305', v_coach_priya, 'Intro to Machine Learning Quiz', 20, 75, 2, false)
  ON CONFLICT (id) DO NOTHING;

  -- Update the lessons to reference their quiz
  UPDATE public.lessons SET quiz_id = v_python_quiz, has_quiz = true WHERE id = 'le000000-0000-0000-0000-000000000106';
  UPDATE public.lessons SET quiz_id = v_webdev_quiz, has_quiz = true WHERE id = 'le000000-0000-0000-0000-000000000207';
  UPDATE public.lessons SET quiz_id = v_ml_quiz, has_quiz = true WHERE id = 'le000000-0000-0000-0000-000000000305';

  -- 4. SEED QUESTIONS & OPTIONS
  -- ================================================================
  -- Quiz 1: Python
  -- ================================================================
  -- Q1
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000101', v_python_quiz, 'What is the output of print(type(42))?', 'mcq', 20, 1, 'In Python, the number 42 is an integer, so its type is <class ''int''>.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000001011', 'qq000000-0000-0000-0000-000000000101', '<class ''float''>', false),
    ('qo000000-0000-0000-0000-000000001012', 'qq000000-0000-0000-0000-000000000101', '<class ''int''>', true),
    ('qo000000-0000-0000-0000-000000001013', 'qq000000-0000-0000-0000-000000000101', '<class ''str''>', false),
    ('qo000000-0000-0000-0000-000000001014', 'qq000000-0000-0000-0000-000000000101', '<class ''number''>', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q2
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000102', v_python_quiz, 'Python lists are immutable (cannot be modified after creation).', 'true_false', 20, 2, 'Lists in Python are mutable. You can add, remove, and modify elements. Tuples are the immutable collection type.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000001021', 'qq000000-0000-0000-0000-000000000102', 'True', false),
    ('qo000000-0000-0000-0000-000000001022', 'qq000000-0000-0000-0000-000000000102', 'False', true)
  ON CONFLICT (id) DO NOTHING;

  -- Q3
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000103', v_python_quiz, 'Which keyword is used to define a function in Python?', 'mcq', 20, 3, 'Python uses the keyword `def` to define functions.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000001031', 'qq000000-0000-0000-0000-000000000103', 'func', false),
    ('qo000000-0000-0000-0000-000000001032', 'qq000000-0000-0000-0000-000000000103', 'define', false),
    ('qo000000-0000-0000-0000-000000001033', 'qq000000-0000-0000-0000-000000000103', 'def', true),
    ('qo000000-0000-0000-0000-000000001034', 'qq000000-0000-0000-0000-000000000103', 'function', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q4
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000104', v_python_quiz, 'What is returned by len([1, 2, 3])?', 'mcq', 20, 4, 'The `len()` function returns the number of items in a collection. This list contains 3 items.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000001041', 'qq000000-0000-0000-0000-000000000104', '2', false),
    ('qo000000-0000-0000-0000-000000001042', 'qq000000-0000-0000-0000-000000000104', '3', true),
    ('qo000000-0000-0000-0000-000000001043', 'qq000000-0000-0000-0000-000000000104', '4', false),
    ('qo000000-0000-0000-0000-000000001044', 'qq000000-0000-0000-0000-000000000104', 'Error', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q5
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000105', v_python_quiz, 'Python supports multiple inheritance (a class inheriting from more than one parent).', 'true_false', 20, 5, 'Yes, Python explicitly supports multiple inheritance, unlike languages like Java.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000001051', 'qq000000-0000-0000-0000-000000000105', 'True', true),
    ('qo000000-0000-0000-0000-000000001052', 'qq000000-0000-0000-0000-000000000105', 'False', false)
  ON CONFLICT (id) DO NOTHING;

  -- ================================================================
  -- Quiz 2: HTML & CSS
  -- ================================================================
  -- Q1
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000201', v_webdev_quiz, 'Which tag is used for the largest heading in HTML?', 'mcq', 20, 1, '`<h1>` defines the most important and largest heading.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000002011', 'qq000000-0000-0000-0000-000000000201', '<h6>', false),
    ('qo000000-0000-0000-0000-000000002012', 'qq000000-0000-0000-0000-000000000201', '<head>', false),
    ('qo000000-0000-0000-0000-000000002013', 'qq000000-0000-0000-0000-000000000201', '<heading>', false),
    ('qo000000-0000-0000-0000-000000002014', 'qq000000-0000-0000-0000-000000000201', '<h1>', true)
  ON CONFLICT (id) DO NOTHING;

  -- Q2
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000202', v_webdev_quiz, 'CSS stands for Cascading Style Sheets.', 'true_false', 20, 2, 'CSS is the standard acronym for Cascading Style Sheets.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000002021', 'qq000000-0000-0000-0000-000000000202', 'True', true),
    ('qo000000-0000-0000-0000-000000002022', 'qq000000-0000-0000-0000-000000000202', 'False', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q3
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000203', v_webdev_quiz, 'Which CSS property changes the text color?', 'mcq', 20, 3, 'The `color` property is used in CSS to style the foreground text.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000002031', 'qq000000-0000-0000-0000-000000000203', 'text-color', false),
    ('qo000000-0000-0000-0000-000000002032', 'qq000000-0000-0000-0000-000000000203', 'color', true),
    ('qo000000-0000-0000-0000-000000002033', 'qq000000-0000-0000-0000-000000000203', 'font-color', false),
    ('qo000000-0000-0000-0000-000000002034', 'qq000000-0000-0000-0000-000000000203', 'style-color', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q4
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000204', v_webdev_quiz, 'The <div> tag is an inline element by default.', 'true_false', 20, 4, '`<div>` is a block-level element. Elements like `<span>`, `<a>`, and `<strong>` are inline.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000002041', 'qq000000-0000-0000-0000-000000000204', 'True', false),
    ('qo000000-0000-0000-0000-000000002042', 'qq000000-0000-0000-0000-000000000204', 'False', true)
  ON CONFLICT (id) DO NOTHING;

  -- Q5
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000205', v_webdev_quiz, 'Which CSS property is used to change background?', 'mcq', 20, 5, '`background-color` is specifically used to change the background element color.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000002051', 'qq000000-0000-0000-0000-000000000205', 'color', false),
    ('qo000000-0000-0000-0000-000000002052', 'qq000000-0000-0000-0000-000000000205', 'bg-color', false),
    ('qo000000-0000-0000-0000-000000002053', 'qq000000-0000-0000-0000-000000000205', 'background-color', true),
    ('qo000000-0000-0000-0000-000000002054', 'qq000000-0000-0000-0000-000000000205', 'bgcolor', false)
  ON CONFLICT (id) DO NOTHING;

  -- ================================================================
  -- Quiz 3: Machine Learning
  -- ================================================================
  -- Q1
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000301', v_ml_quiz, 'Supervised learning requires labeled training data.', 'true_false', 20, 1, 'Supervised learning operates on input-output pairs where labels are explicitly provided.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000003011', 'qq000000-0000-0000-0000-000000000301', 'True', true),
    ('qo000000-0000-0000-0000-000000003012', 'qq000000-0000-0000-0000-000000000301', 'False', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q2
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000302', v_ml_quiz, 'Which of the following is NOT a type of machine learning?', 'mcq', 20, 2, 'Supervised, Unsupervised, and Reinforcement are standard paradigms. ''Compiled Learning'' does not exist.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000003021', 'qq000000-0000-0000-0000-000000000302', 'Supervised Learning', false),
    ('qo000000-0000-0000-0000-000000003022', 'qq000000-0000-0000-0000-000000000302', 'Unsupervised Learning', false),
    ('qo000000-0000-0000-0000-000000003023', 'qq000000-0000-0000-0000-000000000302', 'Compiled Learning', true),
    ('qo000000-0000-0000-0000-000000003024', 'qq000000-0000-0000-0000-000000000302', 'Reinforcement Learning', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q3
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000303', v_ml_quiz, 'Overfitting means the model performs well on training data but poorly on unseen test data.', 'true_false', 20, 3, 'This is the exact definition of overfitting: high variance, where model memorizes training noise instead of generalizing.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000003031', 'qq000000-0000-0000-0000-000000000303', 'True', true),
    ('qo000000-0000-0000-0000-000000003032', 'qq000000-0000-0000-0000-000000000303', 'False', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q4
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000304', v_ml_quiz, 'Which algorithm is commonly used for classification?', 'mcq', 20, 4, 'Random Forest is a highly versatile supervised classification/regression ensemble method. K-Means and PCA are unsupervised. Linear Regression is for regression.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000003041', 'qq000000-0000-0000-0000-000000000304', 'Linear Regression', false),
    ('qo000000-0000-0000-0000-000000003042', 'qq000000-0000-0000-0000-000000000304', 'K-Means', false),
    ('qo000000-0000-0000-0000-000000003043', 'qq000000-0000-0000-0000-000000000304', 'Random Forest', true),
    ('qo000000-0000-0000-0000-000000003044', 'qq000000-0000-0000-0000-000000000304', 'PCA', false)
  ON CONFLICT (id) DO NOTHING;

  -- Q5
  INSERT INTO public.questions (id, quiz_id, text, type, points, order_index, explanation)
  VALUES ('qq000000-0000-0000-0000-000000000305', v_ml_quiz, 'What does the ''k'' in KNN stand for?', 'mcq', 20, 5, 'K-Nearest Neighbors uses ''k'' to specify the number of historical neighbors to inspect for voting/averaging.')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.question_options (id, question_id, text, is_correct)
  VALUES
    ('qo000000-0000-0000-0000-000000003051', 'qq000000-0000-0000-0000-000000000305', 'Kilo', false),
    ('qo000000-0000-0000-0000-000000003052', 'qq000000-0000-0000-0000-000000000305', 'Number of nearest neighbors', true),
    ('qo000000-0000-0000-0000-000000003053', 'qq000000-0000-0000-0000-000000000305', 'Kernel size', false),
    ('qo000000-0000-0000-0000-000000003054', 'qq000000-0000-0000-0000-000000000305', 'K-Means clusters', false)
  ON CONFLICT (id) DO NOTHING;


  -- 5. SEED QUIZ ATTEMPTS & ANSWERS
  -- Daniyal Ahmad (Student 1) attempts Python Quiz
  -- He scores 80% (4 correct out of 5)
  INSERT INTO public.quiz_attempts (id, student_id, quiz_id, score, passed, started_at, completed_at)
  VALUES (
    'qa000000-0000-0000-0000-000000000001',
    v_student_daniyal,
    v_python_quiz,
    80,
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Answers for Daniyal
  INSERT INTO public.quiz_answers (attempt_id, question_id, answer_text, selected_option_id, is_correct)
  VALUES
    ('qa000000-0000-0000-0000-000000000001', 'qq000000-0000-0000-0000-000000000101', NULL, 'qo000000-0000-0000-0000-000000001012', true), -- correct
    ('qa000000-0000-0000-0000-000000000001', 'qq000000-0000-0000-0000-000000000102', NULL, 'qo000000-0000-0000-0000-000000001021', false), -- incorrect (answered True)
    ('qa000000-0000-0000-0000-000000000001', 'qq000000-0000-0000-0000-000000000103', NULL, 'qo000000-0000-0000-0000-000000001033', true), -- correct
    ('qa000000-0000-0000-0000-000000000001', 'qq000000-0000-0000-0000-000000000104', NULL, 'qo000000-0000-0000-0000-000000001042', true), -- correct
    ('qa000000-0000-0000-0000-000000000001', 'qq000000-0000-0000-0000-000000000105', NULL, 'qo000000-0000-0000-0000-000000001051', true)  -- correct
  ON CONFLICT DO NOTHING;

  -- Maria Garcia (Student 2) attempts ML Quiz
  -- She scores 100% (5 correct out of 5)
  INSERT INTO public.quiz_attempts (id, student_id, quiz_id, score, passed, started_at, completed_at)
  VALUES (
    'qa000000-0000-0000-0000-000000000002',
    v_student_maria,
    v_ml_quiz,
    100,
    true,
    NOW() - INTERVAL '1 day 4 hours',
    NOW() - INTERVAL '1 day 3 hours 40 minutes'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Answers for Maria
  INSERT INTO public.quiz_answers (attempt_id, question_id, answer_text, selected_option_id, is_correct)
  VALUES
    ('qa000000-0000-0000-0000-000000000002', 'qq000000-0000-0000-0000-000000000301', NULL, 'qo000000-0000-0000-0000-000000003011', true),
    ('qa000000-0000-0000-0000-000000000002', 'qq000000-0000-0000-0000-000000000302', NULL, 'qo000000-0000-0000-0000-000000003023', true),
    ('qa000000-0000-0000-0000-000000000002', 'qq000000-0000-0000-0000-000000000303', NULL, 'qo000000-0000-0000-0000-000000003031', true),
    ('qa000000-0000-0000-0000-000000000002', 'qq000000-0000-0000-0000-000000000304', NULL, 'qo000000-0000-0000-0000-000000003043', true),
    ('qa000000-0000-0000-0000-000000000002', 'qq000000-0000-0000-0000-000000000305', NULL, 'qo000000-0000-0000-0000-000000003052', true)
  ON CONFLICT DO NOTHING;


  -- 6. SEED GRADED SUBMISSIONS
  -- Graded Submission for Daniyal
  INSERT INTO public.graded_submissions (
    id,
    student_id,
    quiz_id,
    attempt_id,
    course_id,
    coach_id,
    grade_scale_id,
    raw_score,
    max_score,
    percentage,
    letter_grade,
    grade_point,
    passed,
    overall_feedback,
    strengths,
    areas_for_improvement,
    grading_method,
    finalized,
    finalized_at
  )
  VALUES (
    'gs000000-0000-0000-0000-000000000001',
    v_student_daniyal,
    v_python_quiz,
    'qa000000-0000-0000-0000-000000000001',
    v_python_course,
    v_coach_zain,
    v_scale_id,
    80.00,
    100.00,
    80.00,
    'B',
    3.00,
    true,
    'Excellent effort, Daniyal! You have demonstrated a strong understanding of Python basics, variables, and function declarations. Your mistake on list mutability shows a minor gap, but overall you did fantastic. Keep up the high level of engagement!',
    ARRAY['Syntax and basic print statements', 'Variable assignments', 'Function keywords'],
    ARRAY['List mutability (lists CAN be changed after creation)'],
    'ai',
    true,
    NOW() - INTERVAL '1 hour 40 minutes'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Graded Submission for Maria
  INSERT INTO public.graded_submissions (
    id,
    student_id,
    quiz_id,
    attempt_id,
    course_id,
    coach_id,
    grade_scale_id,
    raw_score,
    max_score,
    percentage,
    letter_grade,
    grade_point,
    passed,
    overall_feedback,
    strengths,
    areas_for_improvement,
    grading_method,
    finalized,
    finalized_at
  )
  VALUES (
    'gs000000-0000-0000-0000-000000000002',
    v_student_maria,
    v_ml_quiz,
    'qa000000-0000-0000-0000-000000000002',
    v_ml_course,
    v_coach_priya,
    v_scale_id,
    100.00,
    100.00,
    100.00,
    'A',
    4.00,
    true,
    'Outstanding work, Maria! A perfect score. You have fully mastered the core concepts of supervised/unsupervised learning paradigms, model overfitting indicators, and the math/logic behind algorithms like Random Forest and KNN. You are fully ready for the next level.',
    ARRAY['Distinguishing learning paradigms', 'Overfitting diagnostics', 'Classification algorithms', 'KNN parameters'],
    ARRAY[]::TEXT[],
    'ai',
    true,
    NOW() - INTERVAL '1 day 3 hours 30 minutes'
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
