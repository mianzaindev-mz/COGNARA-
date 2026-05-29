-- supabase/migrations/20260529000001_enhanced_skills.sql
-- Enhanced Agent Skills Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1A. BUG REPORTS ──
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category              TEXT NOT NULL CHECK (category IN (
                          'bug','abuse','content','fraud','security','legal','performance','feature_request'
                        )),
  title                 TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 5 AND 200),
  description           TEXT NOT NULL CHECK (LENGTH(description) >= 20),

  -- EXACT LOCATION DATA
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

  -- AI EVALUATION
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

  -- WORKFLOW
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

CREATE INDEX IF NOT EXISTS idx_bug_reports_reporter ON public.bug_reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON public.bug_reports(ai_severity, status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_page ON public.bug_reports(page_route);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bug_reports' AND policyname = 'Reporters read own reports') THEN
    CREATE POLICY "Reporters read own reports" ON public.bug_reports FOR SELECT USING (reporter_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bug_reports' AND policyname = 'Reporters create reports') THEN
    CREATE POLICY "Reporters create reports" ON public.bug_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bug_reports' AND policyname = 'Admins full access') THEN
    CREATE POLICY "Admins full access" ON public.bug_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── 1B. VIDEO TRANSCRIPTS ──
CREATE TABLE IF NOT EXISTS public.video_transcripts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id         UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcript_text   TEXT NOT NULL,
  transcript_segments JSONB DEFAULT '[]',
  language          TEXT DEFAULT 'en',
  source            TEXT DEFAULT 'web_speech' CHECK (source IN ('web_speech','whisper','upload','manual')),
  word_count        INT,
  duration_secs     INT,
  is_public         BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_lesson ON public.video_transcripts(lesson_id, is_public);
CREATE INDEX IF NOT EXISTS idx_transcripts_student ON public.video_transcripts(student_id, lesson_id);

ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_transcripts' AND policyname = 'Students read own + public transcripts') THEN
    CREATE POLICY "Students read own + public transcripts" ON public.video_transcripts FOR SELECT USING (student_id = auth.uid() OR is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_transcripts' AND policyname = 'Students create own transcripts') THEN
    CREATE POLICY "Students create own transcripts" ON public.video_transcripts FOR INSERT WITH CHECK (student_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_transcripts' AND policyname = 'Coaches read transcripts for their lessons') THEN
    CREATE POLICY "Coaches read transcripts for their lessons" ON public.video_transcripts FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l JOIN public.courses c ON l.course_id = c.id WHERE l.id = lesson_id AND c.coach_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_transcripts' AND policyname = 'Admins full access') THEN
    CREATE POLICY "Admins full access" ON public.video_transcripts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── 1C. LECTURE NOTES ──
CREATE TABLE IF NOT EXISTS public.lecture_notes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id     UUID REFERENCES public.video_transcripts(id) ON DELETE CASCADE,
  lesson_id         UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  summary           TEXT NOT NULL,
  key_points        TEXT[] DEFAULT '{}',
  key_terms         JSONB DEFAULT '{}',
  table_of_contents JSONB DEFAULT '[]',
  full_notes_md     TEXT,
  notebook_page_id  UUID REFERENCES public.notebook_pages(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lecture_notes_lesson ON public.lecture_notes(lesson_id, student_id);

ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lecture_notes' AND policyname = 'Students manage own notes') THEN
    CREATE POLICY "Students manage own notes" ON public.lecture_notes FOR ALL USING (student_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lecture_notes' AND policyname = 'Coaches read notes for their lessons') THEN
    CREATE POLICY "Coaches read notes for their lessons" ON public.lecture_notes FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l JOIN public.courses c ON l.course_id = c.id WHERE l.id = lesson_id AND c.coach_id = auth.uid()));
  END IF;
END $$;

-- ── 1D. GENERATED PDFs ──
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

ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generated_pdfs' AND policyname = 'Users manage own PDFs') THEN
    CREATE POLICY "Users manage own PDFs" ON public.generated_pdfs FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── 1E. PROFESSOR GRADE SCALES ──
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_default      BOOLEAN DEFAULT false,
  grades          JSONB NOT NULL,
  passing_grade   TEXT DEFAULT 'D',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grade_scales' AND policyname = 'Coaches manage own scales') THEN
    CREATE POLICY "Coaches manage own scales" ON public.grade_scales FOR ALL USING (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grade_scales' AND policyname = 'Students read coach scales') THEN
    CREATE POLICY "Students read coach scales" ON public.grade_scales FOR SELECT USING (true);
  END IF;
END $$;

-- ── 1F. GRADED SUBMISSIONS ──
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

CREATE INDEX IF NOT EXISTS idx_graded_subs_student ON public.graded_submissions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_graded_subs_quiz ON public.graded_submissions(quiz_id, student_id);
CREATE INDEX IF NOT EXISTS idx_graded_subs_course ON public.graded_submissions(course_id, student_id);

ALTER TABLE public.graded_submissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'graded_submissions' AND policyname = 'Students read own grades') THEN
    CREATE POLICY "Students read own grades" ON public.graded_submissions FOR SELECT USING (student_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'graded_submissions' AND policyname = 'Coaches read grades for their courses') THEN
    CREATE POLICY "Coaches read grades for their courses" ON public.graded_submissions FOR SELECT USING (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'graded_submissions' AND policyname = 'Coaches update grades') THEN
    CREATE POLICY "Coaches update grades" ON public.graded_submissions FOR UPDATE USING (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'graded_submissions' AND policyname = 'Admins full access') THEN
    CREATE POLICY "Admins full access" ON public.graded_submissions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── 1G. SOLUTION SETS ──
CREATE TABLE IF NOT EXISTS public.solution_sets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id           UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  resource_id       UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  solutions         JSONB NOT NULL DEFAULT '[]',
  is_released       BOOLEAN DEFAULT false,
  released_at       TIMESTAMPTZ,
  search_queries_used TEXT[] DEFAULT '{}',
  sources_cited     JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.solution_sets ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'solution_sets' AND policyname = 'Coaches manage own solution sets') THEN
    CREATE POLICY "Coaches manage own solution sets" ON public.solution_sets FOR ALL USING (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'solution_sets' AND policyname = 'Students read released solution sets if enrolled') THEN
    CREATE POLICY "Students read released solution sets if enrolled" ON public.solution_sets FOR SELECT
      USING (is_released = true AND (
        quiz_id IS NULL OR EXISTS (
          SELECT 1 FROM public.quiz_attempts qa
          JOIN public.quizzes q ON qa.quiz_id = q.id
          WHERE q.id = solution_sets.quiz_id AND qa.student_id = auth.uid()
        )
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'solution_sets' AND policyname = 'Admins full access') THEN
    CREATE POLICY "Admins full access" ON public.solution_sets FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── 1H. WEB RESEARCH CACHE ──
CREATE TABLE IF NOT EXISTS public.web_research_cache (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query           TEXT NOT NULL,
  query_hash      TEXT NOT NULL,
  results         JSONB NOT NULL DEFAULT '[]',
  synthesis       TEXT,
  citations       JSONB DEFAULT '[]',
  research_type   TEXT DEFAULT 'general' CHECK (research_type IN ('general','academic','news','video','code','definition')),
  credits_used    INT DEFAULT 0,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_cache_user ON public.web_research_cache(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_cache_hash ON public.web_research_cache(query_hash);

ALTER TABLE public.web_research_cache ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_research_cache' AND policyname = 'Users manage own research') THEN
    CREATE POLICY "Users manage own research" ON public.web_research_cache FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── 1I. LIBRARY ACTIVITIES ──
CREATE TABLE IF NOT EXISTS public.library_activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id     UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  quiz_id         UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  coach_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL CHECK (type IN ('quiz','assignment','exercise','project','discussion')),
  difficulty      TEXT CHECK (difficulty IN ('beginner','intermediate','expert')),
  estimated_mins  INT,
  instructions    TEXT,
  attachments     TEXT[] DEFAULT '{}',
  is_graded       BOOLEAN DEFAULT true,
  grade_scale_id  UUID REFERENCES public.grade_scales(id),
  max_attempts    INT DEFAULT 3,
  due_date        TIMESTAMPTZ,
  is_published    BOOLEAN DEFAULT false,
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.library_activities ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_activities' AND policyname = 'Public reads published activities') THEN
    CREATE POLICY "Public reads published activities" ON public.library_activities FOR SELECT USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_activities' AND policyname = 'Coaches manage own activities') THEN
    CREATE POLICY "Coaches manage own activities" ON public.library_activities FOR ALL USING (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_activities' AND policyname = 'Admins full access') THEN
    CREATE POLICY "Admins full access" ON public.library_activities FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── 1J. ACTIVITY SUBMISSIONS ──
CREATE TABLE IF NOT EXISTS public.activity_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id         UUID NOT NULL REFERENCES public.library_activities(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number      INT DEFAULT 1,
  content             TEXT,
  file_paths          TEXT[] DEFAULT '{}',
  quiz_attempt_id     UUID REFERENCES public.quiz_attempts(id),
  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  graded_submission_id UUID REFERENCES public.graded_submissions(id),
  status              TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted','graded','returned')),
  UNIQUE(activity_id, student_id, attempt_number)
);

ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_submissions' AND policyname = 'Students manage own submissions') THEN
    CREATE POLICY "Students manage own submissions" ON public.activity_submissions FOR ALL USING (student_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_submissions' AND policyname = 'Coaches read submissions for their activities') THEN
    CREATE POLICY "Coaches read submissions for their activities" ON public.activity_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.library_activities WHERE id = activity_id AND coach_id = auth.uid()));
  END IF;
END $$;

-- ── 1K. SCHEDULED TASKS ──
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'email','notification','reminder','quiz_reminder','study_reminder',
                    'deadline_alert','weekly_report','custom'
                  )),
  payload         JSONB NOT NULL DEFAULT '{}',
  recurrence      TEXT DEFAULT 'once' CHECK (recurrence IN ('once','daily','weekly','monthly')),
  recurrence_time TIME,
  recurrence_day  INT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  next_run_at     TIMESTAMPTZ,
  last_run_at     TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed','cancelled')),
  run_count       INT DEFAULT 0,
  max_runs        INT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user ON public.scheduled_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON public.scheduled_tasks(next_run_at, status);

ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_tasks' AND policyname = 'Users manage own tasks') THEN
    CREATE POLICY "Users manage own tasks" ON public.scheduled_tasks FOR ALL USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_tasks' AND policyname = 'Admins full access') THEN
    CREATE POLICY "Admins full access" ON public.scheduled_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
