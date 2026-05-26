-- ═══════════════════════════════════════════════════════════════════
-- GNARA Master Spec — Phase 3: Database Schema Additions
-- All new columns are nullable with defaults (safe for existing data)
-- All new tables have RLS enabled with appropriate policies
-- ═══════════════════════════════════════════════════════════════════

-- ─── NEW TABLES ─────────────────────────────────────────────────

-- 1. Content fingerprinting for plagiarism detection
CREATE TABLE IF NOT EXISTS public.content_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'resource')),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hash TEXT NOT NULL,
  similarity_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Platform announcements (maintenance, features, policy, downtime)
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'feature', 'policy', 'downtime')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Known issues tracker
CREATE TABLE IF NOT EXISTS public.known_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  workaround TEXT,
  affected_versions TEXT[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI triage patterns for support tickets
CREATE TABLE IF NOT EXISTS public.triage_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL,
  description TEXT,
  affected_count INT DEFAULT 0,
  severity_recommendation TEXT,
  recommended_action TEXT,
  ticket_ids UUID[] DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);

-- 5. Dropout risk predictions per student
CREATE TABLE IF NOT EXISTS public.dropout_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dropout_risk DECIMAL(3,2) NOT NULL CHECK (dropout_risk BETWEEN 0 AND 1),
  top_factors TEXT[] DEFAULT '{}',
  recommended_intervention TEXT,
  re_engagement_email_sent BOOLEAN DEFAULT false,
  re_engagement_email_sent_at TIMESTAMPTZ,
  student_returned BOOLEAN DEFAULT false,
  student_returned_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Engagement quality scores per session
CREATE TABLE IF NOT EXISTS public.engagement_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.agent_sessions(id) ON DELETE SET NULL,
  time_between_actions_avg_secs INT,
  scroll_depth_pct INT,
  quiz_retry_count INT DEFAULT 0,
  idle_periods INT DEFAULT 0,
  engagement_score INT DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  intervention_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Whiteboard recordings for coaches
CREATE TABLE IF NOT EXISTS public.whiteboard_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_secs INT,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── NEW COLUMNS ON EXISTING TABLES ────────────────────────────
-- All nullable with defaults — safe to add without data migration

-- profiles: risk tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_risk_computed_at TIMESTAMPTZ;

-- support_tickets: AI triage columns
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ai_category TEXT,
  ADD COLUMN IF NOT EXISTS ai_severity TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence INT,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommended_action TEXT,
  ADD COLUMN IF NOT EXISTS ai_auto_resolvable BOOLEAN,
  ADD COLUMN IF NOT EXISTS needs_human BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS duplicate_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_ticket_id UUID REFERENCES public.support_tickets(id),
  ADD COLUMN IF NOT EXISTS ai_draft_reply TEXT,
  ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES public.profiles(id);

-- enrollments: dropout risk tracking
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS dropout_risk DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS re_engagement_sent_at TIMESTAMPTZ;

-- agent_memory: engagement and mood tracking
ALTER TABLE public.agent_memory
  ADD COLUMN IF NOT EXISTS engagement_pattern TEXT,
  ADD COLUMN IF NOT EXISTS mood_signals JSONB DEFAULT '{}';

-- courses: content fingerprinting
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS fingerprinted_at TIMESTAMPTZ;

-- lessons: whiteboard recording link
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS recording_storage_path TEXT;


-- ─── INDEXES ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_support_tickets_severity
  ON public.support_tickets(ai_severity, status, created_at);

CREATE INDEX IF NOT EXISTS idx_support_tickets_category
  ON public.support_tickets(ai_category, status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_reported_user
  ON public.support_tickets(reported_user_id);

CREATE INDEX IF NOT EXISTS idx_dropout_predictions_student
  ON public.dropout_predictions(student_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_fingerprints_hash
  ON public.content_fingerprints(hash);

CREATE INDEX IF NOT EXISTS idx_platform_announcements_active
  ON public.platform_announcements(is_active, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_lesson
  ON public.whiteboard_recordings(lesson_id);

CREATE INDEX IF NOT EXISTS idx_engagement_scores_student
  ON public.engagement_scores(student_id, created_at DESC);


-- ─── RLS POLICIES ───────────────────────────────────────────────

-- content_fingerprints: coaches see their own, admins see all
ALTER TABLE public.content_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view own fingerprints"
  ON public.content_fingerprints FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches insert own fingerprints"
  ON public.content_fingerprints FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Admins full access fingerprints"
  ON public.content_fingerprints FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- platform_announcements: everyone can read active ones, admins manage
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active announcements"
  ON public.platform_announcements FOR SELECT
  USING (is_active = true AND start_at <= NOW() AND end_at >= NOW());

CREATE POLICY "Admins manage announcements"
  ON public.platform_announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- known_issues: everyone can read, admins manage
ALTER TABLE public.known_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads known issues"
  ON public.known_issues FOR SELECT
  USING (true);

CREATE POLICY "Admins manage known issues"
  ON public.known_issues FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- triage_patterns: admins only
ALTER TABLE public.triage_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access triage"
  ON public.triage_patterns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- dropout_predictions: admins only
ALTER TABLE public.dropout_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access dropout predictions"
  ON public.dropout_predictions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- engagement_scores: students see their own, admins see all
ALTER TABLE public.engagement_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own engagement"
  ON public.engagement_scores FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins full access engagement"
  ON public.engagement_scores FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- whiteboard_recordings: coaches see their own, enrolled students see lesson recordings
ALTER TABLE public.whiteboard_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own recordings"
  ON public.whiteboard_recordings FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Students view lesson recordings"
  ON public.whiteboard_recordings FOR SELECT
  USING (
    lesson_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.lessons l ON l.course_id = e.course_id
      WHERE l.id = whiteboard_recordings.lesson_id
      AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access recordings"
  ON public.whiteboard_recordings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
