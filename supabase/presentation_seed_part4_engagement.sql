-- ================================================================
-- COGNARA Presentation Demo - Part 4: Engagement & Activity Data
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Safely ensure required columns exist to support base and upgraded schemas
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

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

DO $$
DECLARE
  v_python_course UUID;
  v_webdev_course UUID;
  v_ml_course     UUID;
  v_cyber_course  UUID;
  
  v_coach_zain UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc01';
  v_coach_james UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc02';
  v_coach_priya UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc03';
  
  v_student_daniyal  UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd01';
  v_student_maria UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd02';
  v_student_kai   UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd03';
  v_student_emma  UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd04';
  v_student_omar  UUID := 'dddddddd-dddd-dddd-dddd-dddddddddd05';
  
  v_admin_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001';
  
  v_badge_first_steps UUID := 'bd000000-0000-0000-0000-000000000001';
  v_badge_quiz_master UUID := 'bd000000-0000-0000-0000-000000000002';
  v_badge_streak_war  UUID := 'bd000000-0000-0000-0000-000000000003';
  v_badge_code_runner UUID := 'bd000000-0000-0000-0000-000000000004';
  v_badge_social      UUID := 'bd000000-0000-0000-0000-000000000005';
BEGIN
  -- 1. Get course IDs
  SELECT id INTO v_python_course FROM public.courses WHERE slug = 'python-for-everybody-spec-2001' LIMIT 1;
  SELECT id INTO v_webdev_course FROM public.courses WHERE slug = 'complete-web-developer-bootcamp-1001' LIMIT 1;
  SELECT id INTO v_ml_course     FROM public.courses WHERE slug = 'machine-learning-az-python-2003' LIMIT 1;
  SELECT id INTO v_cyber_course  FROM public.courses WHERE slug = 'ethical-hacking-complete-course-6001' LIMIT 1;

  -- 2. SEED ENROLLMENTS
  -- Daniyal -> Python (75% progress, active)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000001', v_student_daniyal, v_python_course, 75, NOW() - INTERVAL '15 days', 'active', NOW() - INTERVAL '2 hours')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 75, status = 'active';

  -- Daniyal -> Web Dev (40% progress, active)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000002', v_student_daniyal, v_webdev_course, 40, NOW() - INTERVAL '10 days', 'active', NOW() - INTERVAL '1 day')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 40, status = 'active';

  -- Maria -> ML (90% progress, active)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000003', v_student_maria, v_ml_course, 90, NOW() - INTERVAL '20 days', 'active', NOW() - INTERVAL '1 day 4 hours')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 90, status = 'active';

  -- Maria -> Python (100% complete, completed)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, completed_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000004', v_student_maria, v_python_course, 100, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 'completed', NOW() - INTERVAL '5 days')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 100, status = 'completed';

  -- Kai -> Web Dev (60% progress, active)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000005', v_student_kai, v_webdev_course, 60, NOW() - INTERVAL '8 days', 'active', NOW() - INTERVAL '5 hours')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 60, status = 'active';

  -- Emma -> Python (15% progress, active)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000006', v_student_emma, v_python_course, 15, NOW() - INTERVAL '2 days', 'active', NOW() - INTERVAL '12 hours')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 15, status = 'active';

  -- Omar -> Ethical Hacking (55% progress, active)
  INSERT INTO public.enrollments (id, student_id, course_id, progress_pct, enrolled_at, status, last_accessed_at)
  VALUES ('en000000-0000-0000-0000-000000000007', v_student_omar, v_cyber_course, 55, NOW() - INTERVAL '12 days', 'active', NOW() - INTERVAL '6 hours')
  ON CONFLICT (student_id, course_id) DO UPDATE SET progress_pct = 55, status = 'active';


  -- 3. SEED COURSE REVIEWS
  -- Maria reviews Python
  INSERT INTO public.course_reviews (student_id, course_id, enrollment_id, rating, review_text, is_verified_completion, is_flagged, helpful_votes, created_at)
  VALUES (
    v_student_maria,
    v_python_course,
    'en000000-0000-0000-0000-000000000004',
    5,
    'Absolutely fantastic course! Muhammad Zain makes complex variables, programming structures, and collections super easy to grasp. The hands-on code compiler and the AI GNARA tutor are phenomenal resources. Best course I have taken!',
    true,
    false,
    18,
    NOW() - INTERVAL '4 days'
  )
  ON CONFLICT (student_id, course_id) DO NOTHING;

  -- Daniyal reviews Web Dev
  INSERT INTO public.course_reviews (student_id, course_id, enrollment_id, rating, review_text, is_verified_completion, is_flagged, helpful_votes, created_at)
  VALUES (
    v_student_daniyal,
    v_webdev_course,
    'en000000-0000-0000-0000-000000000002',
    4,
    'Great course structure! James Miller is an excellent instructor. The chapters on semantic HTML and Flexbox are extremely detailed. The JavaScript assessments could use a couple more intermediate challenges, but overall highly recommended.',
    false,
    false,
    6,
    NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (student_id, course_id) DO NOTHING;

  -- Kai reviews Web Dev
  INSERT INTO public.course_reviews (student_id, course_id, enrollment_id, rating, review_text, is_verified_completion, is_flagged, helpful_votes, created_at)
  VALUES (
    v_student_kai,
    v_webdev_course,
    'en000000-0000-0000-0000-000000000005',
    5,
    'Best web development bootcamp online! The browser terminal is extremely interactive, and scheduling live study peer groups helps keep everyone accountable. James is super active in answering questions.',
    false,
    false,
    9,
    NOW() - INTERVAL '3 days'
  )
  ON CONFLICT (student_id, course_id) DO NOTHING;

  -- Maria reviews ML (Flagged review for demonstration of flag/abuse panels)
  INSERT INTO public.course_reviews (student_id, course_id, enrollment_id, rating, review_text, is_verified_completion, is_flagged, flag_reason, helpful_votes, created_at)
  VALUES (
    v_student_maria,
    v_ml_course,
    'en000000-0000-0000-0000-000000000003',
    5,
    'Dr. Sharma explains complex linear regression math perfectly. The slides are wonderful. You should join the telegram channel t.me/freecourses101 to get the Stanford pdf guides for free instead of paying here.',
    false,
    true,
    'Contains external links promotion and encouraging off-platform textbook distribution.',
    2,
    NOW() - INTERVAL '1 day'
  )
  ON CONFLICT (student_id, course_id) DO NOTHING;


  -- 4. SEED GENERATED PDFS
  -- PDF 1: Exploit PDF (Critical)
  INSERT INTO public.generated_pdfs (id, user_id, title, type, storage_path, file_size_bytes, page_count, is_public)
  VALUES (
    'pf000000-0000-0000-0000-000000000001',
    v_student_emma,
    'COGNARA Backend Exploit & Brain Dump',
    'chat_export',
    'secure/pdfs/exploits-braindump.pdf',
    24800,
    3,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- PDF 2: Promo PDF (Medium)
  INSERT INTO public.generated_pdfs (id, user_id, title, type, storage_path, file_size_bytes, page_count, is_public)
  VALUES (
    'pf000000-0000-0000-0000-000000000002',
    v_student_daniyal,
    'Promo Code & Free Telegram Access Guide',
    'lecture_notes',
    'public/pdfs/promo-telegram.pdf',
    15400,
    1,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- PDF 3: Minor alignment report PDF (Lowest)
  INSERT INTO public.generated_pdfs (id, user_id, title, type, storage_path, file_size_bytes, page_count, is_public)
  VALUES (
    'pf000000-0000-0000-0000-000000000003',
    v_student_daniyal,
    'Python Basics Grade Report',
    'grade_report',
    'public/pdfs/daniyal-grade-report.pdf',
    41200,
    2,
    false
  )
  ON CONFLICT (id) DO NOTHING;


  -- 5. SEED BUG REPORTS & ABUSE REPORTS (FOR ADMIN DASHBOARD)
  -- Report 1: Bug Report (Original)
  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'br000000-0000-0000-0000-000000000001',
    v_student_kai,
    'bug',
    'Interactive code compiler editor freezing on loop scripts',
    'When attempting to compile nested loops in Python or JavaScript inside the browser compiler panel, the UI hangs completely, requiring a hard browser refresh. It happens mostly on Safari version 17.',
    'https://cognara.dev/courses/python-for-everybody/lessons/loops-and-iterations',
    'S3',
    92,
    'valid',
    'triaged',
    'normal',
    NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Report 2: Abuse Report (Original)
  INSERT INTO public.bug_reports (id, reporter_id, reported_user_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'br000000-0000-0000-0000-000000000002',
    v_student_daniyal,
    v_student_emma,
    'abuse',
    'Spam messaging and advertising in Peer Sessions study group',
    'Emma Wilson was repeatedly sending cryptocurrency promotional links and spamming the chat during the active DSA Practice peer study call. Extremely distracting.',
    'https://cognara.dev/peer-session/dsa-trees-practice',
    'S2',
    98,
    'valid',
    'in_progress',
    'high',
    NOW() - INTERVAL '1 day'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Report 3: Content flag (Original)
  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'br000000-0000-0000-0000-000000000003',
    v_student_omar,
    'content',
    'Suspected plagiarized slides and content in Ethical Hacking',
    'Lesson 3 slides on Network Intrusion detection seem directly copy-pasted with identical layout diagrams from a public security blog post by Sans Institute. Request review.',
    'https://cognara.dev/courses/ethical-hacking/lessons/network-intrusion',
    'S4',
    75,
    'uncertain',
    'pending_triage',
    'low',
    NOW() - INTERVAL '8 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  -- CRITICAL AI SEVERITY REPORT (S1 / CRITICAL)
  INSERT INTO public.bug_reports (id, reporter_id, reported_user_id, category, title, description, page_url, screenshot_url, ai_category, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'br000000-0000-0000-0000-000000000011',
    v_student_omar,
    v_student_emma,
    'security',
    'Critical security breach: User exporting database exploit instructions',
    'Student Emma Wilson generated and exported a chat transcript outlining SQL injection exploits and sandbox bypass vectors for the interactive compiler. Critical threat.',
    'https://cognara.dev/admin/reports',
    'secure/pdfs/exploits-braindump.pdf',
    'security',
    'S1',
    99,
    'valid',
    'pending_triage',
    'critical',
    NOW() - INTERVAL '1 hour'
  )
  ON CONFLICT (id) DO NOTHING;

  -- MEDIUM POLICY VIOLATION REPORT (S3 / NORMAL)
  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, screenshot_url, ai_category, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'br000000-0000-0000-0000-000000000012',
    v_student_daniyal,
    'abuse',
    'Adverting and spam link inside lecture notes export PDF',
    'Student Daniyal reported a PDF notes file that has Telegram links advertising external paid courses and cheat sheets. Medium policy violation.',
    'https://cognara.dev/admin/reports',
    'public/pdfs/promo-telegram.pdf',
    'abuse',
    'S3',
    88,
    'valid',
    'triaged',
    'normal',
    NOW() - INTERVAL '3 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  -- LOWEST SEVERITY FALSE ALARM REPORT (S5 / LOW)
  INSERT INTO public.bug_reports (id, reporter_id, category, title, description, page_url, screenshot_url, ai_category, ai_severity, ai_confidence, ai_validity, status, priority, created_at)
  VALUES (
    'br000000-0000-0000-0000-000000000013',
    v_student_daniyal,
    'bug',
    'Page numbers misaligned in exported grade report PDF',
    'Student Daniyal reported that the page numbers at the footer of the exported grade report are slightly misaligned on mobile screen sizes. This is a very minor layout bug.',
    'https://cognara.dev/admin/reports',
    'public/pdfs/daniyal-grade-report.pdf',
    'bug',
    'S5',
    95,
    'invalid',
    'closed',
    'low',
    NOW() - INTERVAL '5 hours'
  )
  ON CONFLICT (id) DO NOTHING;


  -- 6. SEED SUPPORT TICKETS & TICKET MESSAGES
  -- Ticket 1: Emma's Billing Ticket
  INSERT INTO public.support_tickets (id, user_id, category, subject, status, priority, created_at)
  VALUES (
    'tk000000-0000-0000-0000-000000000001',
    v_student_emma,
    'billing',
    'Charged twice for Web Developer Premium Subscription',
    'open',
    'high',
    NOW() - INTERVAL '1 day'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_type, content, created_at)
  VALUES
    ('tm000000-0000-0000-0000-000000000011', 'tk000000-0000-0000-0000-000000000001', v_student_emma, 'user', 'Hi Support, I registered for James Miller''s bootcamp subscription plan yesterday, but my credit card statement shows two identical charges of $19.99. Can I please get a refund for the duplicate transaction?', NOW() - INTERVAL '1 day'),
    ('tm000000-0000-0000-0000-000000000012', 'tk000000-0000-0000-0000-000000000001', NULL, 'ai_agent', 'Hello Emma! I am GNARA Support AI. I have reviewed your account transactions and confirmed two pending Stripe charges for the Complete Web Developer Bootcamp. I have alerted our billing administrator to process the duplicate refund. They will contact you shortly.', NOW() - INTERVAL '23 hours 50 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- Ticket 2: Kai's Technical Ticket (AI Resolved)
  INSERT INTO public.support_tickets (id, user_id, category, subject, status, priority, created_at)
  VALUES (
    'tk000000-0000-0000-0000-000000000002',
    v_student_kai,
    'technical',
    'How to export my AI chat logs to PDF?',
    'ai_resolved',
    'normal',
    NOW() - INTERVAL '3 days'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_type, content, created_at)
  VALUES
    ('tm000000-0000-0000-0000-000000000021', 'tk000000-0000-0000-0000-000000000002', v_student_kai, 'user', 'Is there any way to export or save the tutoring chats I have with GNARA inside the learning dashboard? I want to keep them as revision notes.', NOW() - INTERVAL '3 days'),
    ('tm000000-0000-0000-0000-000000000022', 'tk000000-0000-0000-0000-000000000002', NULL, 'ai_agent', 'Hi Kai! Yes! You can easily export your GNARA conversations to PDF. Inside the AI Chat panel, look at the top-right corner next to the chat title. You will find a "Download PDF" button. Clicking this compiles the session messages and downloads a premium structured PDF with formatted code blocks.', NOW() - INTERVAL '2 days 23 hours 58 minutes')
  ON CONFLICT (id) DO NOTHING;


  -- 7. SEED NOTIFICATIONS
  INSERT INTO public.notifications (user_id, type, title, message, action_url, is_read, created_at)
  VALUES
    (v_student_daniyal, 'learning', 'Quiz Graded Successfully', 'Your submission for Python Basics Assessment has been graded by Muhammad Zain. You scored 80%.', '/grades', false, NOW() - INTERVAL '1 hour 40 minutes'),
    (v_student_daniyal, 'system', 'Upcoming Live Q&A Session', 'Muhammad Zain scheduled a Python Functions live lecture for tomorrow at 2:00 PM UTC.', '/courses', false, NOW() - INTERVAL '3 hours'),
    (v_student_maria, 'learning', 'Badge Earned!', 'Congratulations! You earned the Quiz Master badge for passing 5 assessments with perfect scores.', '/achievements', true, NOW() - INTERVAL '1 day'),
    (v_student_emma, 'billing', 'Refund Processed', 'Your duplicate subscription payment of $19.99 has been successfully refunded to your credit card.', '/settings/billing', false, NOW() - INTERVAL '12 hours'),
    (v_student_omar, 'security', 'New Sign-in Detected', 'A new login was recorded from IP 182.56.22.4 (Windows, Chrome). If this wasn''t you, change your password immediately.', '/settings/security', true, NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;


  -- 8. SEED LIVE SESSIONS
  -- Muhammad Zain Live Q&A
  INSERT INTO public.live_sessions (id, coach_id, course_id, title, description, scheduled_at, duration_mins, max_students, status, daily_room_url, daily_room_name, price_usd)
  VALUES (
    'ls000000-0000-0000-0000-000000000001',
    v_coach_zain,
    v_python_course,
    'Python Q&A: Functions & OOP Deep Dive',
    'Join Muhammad Zain for a live screen-share and interactive coding session covering Python namespaces, variable scopes, lambda definitions, and designing class structures.',
    NOW() + INTERVAL '1 day 15 hours',
    60,
    100,
    'scheduled',
    'https://cognara.daily.co/python-deep-dive',
    'python-deep-dive',
    0.00
  )
  ON CONFLICT (id) DO NOTHING;

  -- James Miller Portfolio Live Call
  INSERT INTO public.live_sessions (id, coach_id, course_id, title, description, scheduled_at, duration_mins, max_students, status, daily_room_url, daily_room_name, price_usd)
  VALUES (
    'ls000000-0000-0000-0000-000000000002',
    v_coach_james,
    v_webdev_course,
    'Live Code Review: Building a Portfolio Website',
    'Bring your personal portfolio HTML/CSS code files! We will walk through real-time improvements for Flexbox arrangements, responsive breakpoints, and layout designs.',
    NOW() + INTERVAL '2 days 18 hours',
    90,
    50,
    'scheduled',
    'https://cognara.daily.co/portfolio-code-review',
    'portfolio-code-review',
    0.00
  )
  ON CONFLICT (id) DO NOTHING;


  -- 9. SEED PEER SESSIONS (STUDENT-HOSTED)
  INSERT INTO public.peer_sessions (id, host_id, title, description, topic, course_ref_id, scheduled_at, duration_mins, max_students, status, daily_room_url)
  VALUES (
    'ps000000-0000-0000-0000-000000000001',
    v_student_kai,
    'DSA Practice: Binary Trees & Graphs',
    'Casual study session. We will practice recursive tree traversals and dynamic programming problems from LeetCode. Anyone looking to prepare for technical interviews is welcome!',
    'Data Structures & Algorithms',
    v_webdev_course,
    NOW() + INTERVAL '1 day 19 hours',
    60,
    10,
    'scheduled',
    'https://cognara.daily.co/dsa-trees-practice'
  )
  ON CONFLICT (id) DO NOTHING;


  -- 10. SEED GAMIFICATION: USER XP & BADGES
  -- Students XP
  INSERT INTO public.user_xp (user_id, total_xp, level, streak_days, longest_streak, last_activity)
  VALUES
    (v_student_daniyal, 2450, 5, 12, 18, NOW()),
    (v_student_maria, 4200, 8, 28, 30, NOW()),
    (v_student_kai, 1800, 4, 7, 7, NOW()),
    (v_student_emma, 350, 1, 2, 3, NOW()),
    (v_student_omar, 1200, 3, 5, 8, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    streak_days = EXCLUDED.streak_days,
    longest_streak = EXCLUDED.longest_streak;

  -- Seed Badges
  INSERT INTO public.badges (id, name, description, icon, xp_reward, criteria)
  VALUES
    (v_badge_first_steps, 'First Steps', 'Completed your very first lesson on COGNARA!', '🎯', 50, '{"lessons_completed": 1}'::jsonb),
    (v_badge_quiz_master, 'Quiz Master', 'Scored 100% on 3 assessments.', '🏆', 200, '{"perfect_quizzes": 3}'::jsonb),
    (v_badge_streak_war, 'Streak Warrior', 'Maintained a 7-day study streak.', '🔥', 150, '{"streak_days": 7}'::jsonb),
    (v_badge_code_runner, 'Code Runner', 'Executed 10 scripts successfully in the interactive compiler.', '💻', 300, '{"code_submissions": 10}'::jsonb),
    (v_badge_social, 'Social Learner', 'Joined or hosted 3 peer study sessions.', '🤝', 100, '{"peer_sessions_joined": 3}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Assign Badges
  -- Daniyal has First Steps and Streak Warrior
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES
    (v_student_daniyal, v_badge_first_steps, NOW() - INTERVAL '14 days'),
    (v_student_daniyal, v_badge_streak_war, NOW() - INTERVAL '5 days')
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  -- Maria has First Steps, Quiz Master, and Streak Warrior
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES
    (v_student_maria, v_badge_first_steps, NOW() - INTERVAL '29 days'),
    (v_student_maria, v_badge_quiz_master, NOW() - INTERVAL '10 days'),
    (v_student_maria, v_badge_streak_war, NOW() - INTERVAL '15 days')
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  -- Kai has First Steps and Social Learner
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES
    (v_student_kai, v_badge_first_steps, NOW() - INTERVAL '7 days'),
    (v_student_kai, v_badge_social, NOW() - INTERVAL '1 day')
  ON CONFLICT (user_id, badge_id) DO NOTHING;

END $$;
