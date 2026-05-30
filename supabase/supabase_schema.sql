-- ================================================================
-- MIGRATION: 20250514180001_extensions.sql
-- ================================================================
-- COGNARA Session 3 - extensions required by the master schema (Section 8)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ================================================================
-- MIGRATION: 20250514180002_core_identity.sql
-- ================================================================
-- COGNARA - core identity: profiles, settings, onboarding + auth.users trigger

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','coach','admin')),
  full_name TEXT,
  username TEXT UNIQUE CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,30}$'),
  avatar_url TEXT,
  bio TEXT CHECK (bio IS NULL OR LENGTH(bio) <= 500),
  github_url TEXT,
  linkedin_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  strike_count INT DEFAULT 0 CHECK (strike_count BETWEEN 0 AND 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  notifications_email BOOLEAN DEFAULT true,
  notifications_push BOOLEAN DEFAULT true,
  notifications_quiet_start TIME DEFAULT '23:00',
  notifications_quiet_end TIME DEFAULT '07:00',
  digest_mode BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small','medium','large','xlarge')),
  accessibility_mode BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  cookie_essential BOOLEAN DEFAULT true,
  cookie_analytics BOOLEAN DEFAULT false,
  cookie_functional BOOLEAN DEFAULT false,
  cookie_marketing BOOLEAN DEFAULT false,
  cookie_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  steps_completed TEXT[] DEFAULT '{}',
  finished_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF r NOT IN ('student', 'coach') THEN
    r := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    r
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_username ON public.profiles(username);


-- ================================================================
-- MIGRATION: 20250514180003_commerce.sql
-- ================================================================
-- Commerce: plans, subscriptions, credits, invoices

CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly','annual','one_time')),
  stripe_price_id TEXT,
  features JSONB,
  limits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','cancelled','paused','unpaid')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 20 CHECK (balance >= 0),
  daily_free_limit INT NOT NULL DEFAULT 20,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  lifetime_purchased INT DEFAULT 0,
  lifetime_spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  action TEXT NOT NULL,
  balance_after INT NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'paid'
    CHECK (status IN ('draft','open','paid','void','uncollectible')),
  stripe_invoice_id TEXT UNIQUE,
  pdf_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id);

CREATE OR REPLACE FUNCTION public.ensure_ai_credits_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_credits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_ai_credits ON public.profiles;
CREATE TRIGGER ensure_ai_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.ensure_ai_credits_for_profile();


-- ================================================================
-- MIGRATION: 20250514180004_courses_content.sql
-- ================================================================
-- Courses, lessons, resources, enrollments, lesson progress

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 5 AND 200),
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  language TEXT DEFAULT 'en',
  price_usd DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0),
  is_free BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT true,
  issues_certificate BOOLEAN DEFAULT true,
  preview_video_url TEXT,
  total_lessons INT DEFAULT 0,
  total_enrolled INT DEFAULT 0,
  avg_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text','video','code','quiz')),
  video_url TEXT,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  duration_mins INT,
  is_free_preview BOOLEAN DEFAULT false,
  drip_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf','image','video','link','note')),
  url TEXT,
  storage_path TEXT,
  access_level TEXT DEFAULT 'free'
    CHECK (access_level IN ('free','members','paid','preview')),
  price_usd DECIMAL(10,2) DEFAULT 0,
  is_permanently_free BOOLEAN DEFAULT false,
  ai_summary TEXT,
  ai_transcript TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.enforce_free_content_guarantee()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_permanently_free = true AND NEW.price_usd > 0 THEN
    RAISE EXCEPTION 'Content marked as permanently free cannot be changed to paid.';
  END IF;
  IF NEW.is_permanently_free = true THEN
    NEW.price_usd := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_content ON public.resources;
CREATE TRIGGER enforce_free_content
  BEFORE INSERT OR UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_free_content_guarantee();


CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_pct INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  certificate_code TEXT UNIQUE DEFAULT REPLACE(gen_random_uuid()::text, '-', ''),
  stripe_payment_id TEXT,
  UNIQUE(student_id, course_id)
);

CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  time_spent_mins INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_courses_coach_id ON public.courses(coach_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_is_published ON public.courses(is_published);
CREATE INDEX idx_lessons_course ON public.lessons(course_id, order_index);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);


-- ================================================================
-- MIGRATION: 20250514180005_learning_tools.sql
-- ================================================================
-- Code editor, notebooks, quizzes

CREATE TABLE public.code_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  execution_time DECIMAL(8,3),
  memory_used INT,
  judge0_status TEXT,
  ai_feedback TEXT,
  ai_score INT CHECK (ai_score BETWEEN 0 AND 100),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.code_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'python',
  code TEXT DEFAULT '',
  title TEXT DEFAULT 'Untitled',
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE DEFAULT REPLACE(gen_random_uuid()::text, '-', ''),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Notebook',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notebook_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Page 1',
  content_text TEXT,
  content_canvas JSONB DEFAULT '{}',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time_limit_mins INT,
  pass_score INT DEFAULT 70 CHECK (pass_score BETWEEN 0 AND 100),
  attempts_allowed INT DEFAULT 3,
  is_ai_generated BOOLEAN DEFAULT false,
  source_resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq','true_false','code','text')),
  points INT DEFAULT 1 CHECK (points > 0),
  order_index INT DEFAULT 0,
  explanation TEXT,
  code_starter TEXT
);

CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  selected_option_id UUID REFERENCES public.question_options(id),
  is_correct BOOLEAN
);

CREATE INDEX idx_code_sessions_student ON public.code_sessions(student_id);


-- ================================================================
-- MIGRATION: 20250514180006_agent_reviews.sql
-- ================================================================
-- AI agent, voice, reviews

CREATE TABLE public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL CHECK (skill IN ('teach','debug','quiz','voice','path','support','verify','coach')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content TEXT NOT NULL,
  tool_name TEXT,
  tool_result JSONB,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  learning_style TEXT CHECK (learning_style IN ('visual','auditory','reading','kinesthetic','unknown')),
  preferred_language TEXT DEFAULT 'en',
  total_sessions INT DEFAULT 0,
  last_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcript TEXT,
  agent_response TEXT,
  duration_secs INT,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('course','peer_session','resource')),
  target_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rating_content INT CHECK (rating_content BETWEEN 1 AND 5),
  rating_clarity INT CHECK (rating_clarity BETWEEN 1 AND 5),
  rating_responsiveness INT CHECK (rating_responsiveness BETWEEN 1 AND 5),
  rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
  review_text TEXT CHECK (review_text IS NULL OR LENGTH(review_text) >= 30),
  coach_reply TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  completion_pct_at_review INT,
  is_peer_content BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, target_type, target_id)
);

CREATE INDEX idx_agent_messages_session ON public.agent_messages(session_id, created_at);
CREATE INDEX idx_agent_memory_student ON public.agent_memory(student_id);
CREATE INDEX idx_reviews_target ON public.reviews(target_type, target_id);


-- ================================================================
-- MIGRATION: 20250514180007_coach_live_peer.sql
-- ================================================================
-- Coach verification, live classes, peer sessions

CREATE TABLE public.coach_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','approved','rejected','appealing')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES public.profiles(id),
  ai_confidence_score INT CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_notes TEXT,
  rejection_reason TEXT,
  appeal_text TEXT,
  appeal_submitted_at TIMESTAMPTZ
);

CREATE TABLE public.coach_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.coach_applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('degree','certificate','govt_id','linkedin','github','other')),
  storage_path TEXT NOT NULL,
  filename TEXT,
  ai_verified BOOLEAN,
  ai_result JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_mins INT DEFAULT 60,
  daily_room_url TEXT,
  daily_room_name TEXT,
  recording_url TEXT,
  price_usd DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0),
  is_free BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  max_students INT DEFAULT 50,
  waitlist_count INT DEFAULT 0,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','ended','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.live_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  ticket_purchased BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  UNIQUE(session_id, student_id)
);

CREATE TABLE public.peer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  course_ref_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_mins INT DEFAULT 60,
  max_students INT DEFAULT 10,
  price_usd DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0 AND price_usd <= 8.00),
  is_free BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  daily_room_url TEXT,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','ended','cancelled')),
  host_confirmed_student BOOLEAN NOT NULL DEFAULT false,
  host_confirmed_unverified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.peer_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.peer_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  disclaimer_confirmed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ,
  stripe_payment_id TEXT,
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_peer_sessions_host ON public.peer_sessions(host_id);


-- ================================================================
-- MIGRATION: 20250514180008_platform_ops.sql
-- ================================================================
-- Earnings, support, notifications, security, gamification

CREATE TABLE public.coach_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  gross_revenue_usd DECIMAL(10,2) DEFAULT 0,
  platform_fee_usd DECIMAL(10,2) DEFAULT 0,
  performance_bonus_usd DECIMAL(10,2) DEFAULT 0,
  stripe_processing_usd DECIMAL(10,2) DEFAULT 0,
  net_payout_usd DECIMAL(10,2) DEFAULT 0,
  performance_multiplier DECIMAL(4,2) DEFAULT 1.0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  UNIQUE(coach_id, month)
);

CREATE TABLE public.performance_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  student_count INT DEFAULT 0,
  completion_rate_pct INT DEFAULT 0,
  avg_rating DECIMAL(3,2),
  agent_quality_score INT DEFAULT 0,
  final_multiplier DECIMAL(4,2) DEFAULT 1.0,
  bonus_breakdown JSONB DEFAULT '{}',
  UNIQUE(coach_id, month)
);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'billing','technical','course_issue','account',
    'verification','abuse_report','content_flag','other')),
  subject TEXT NOT NULL CHECK (LENGTH(subject) BETWEEN 5 AND 200),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','ai_resolved','in_progress','resolved','closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user','ai_agent','admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'system','learning','billing','security',
    'social','progress','support')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.off_platform_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  pattern_matched TEXT NOT NULL,
  conversation_with UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_xp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INT DEFAULT 0 CHECK (total_xp >= 0),
  level INT DEFAULT 1 CHECK (level >= 1),
  streak_days INT DEFAULT 0 CHECK (streak_days >= 0),
  longest_streak INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  xp_reward INT DEFAULT 0,
  criteria JSONB DEFAULT '{}'
);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at);
CREATE INDEX idx_security_events_severity ON public.security_events(severity, resolved, created_at);


-- ================================================================
-- MIGRATION: 20250514180009_rls.sql
-- ================================================================
-- Row Level Security - COGNARA (Session 3 baseline)
-- Uses SECURITY DEFINER helper to avoid recursive policy evaluation on profiles.

CREATE OR REPLACE FUNCTION public.cognara_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.cognara_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cognara_is_admin() TO anon, authenticated;

-- ─── profiles ───────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_service
  ON public.profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY profiles_admin_all
  ON public.profiles FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());

-- ─── user_settings ───────────────────────────────────────────
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_select
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY user_settings_update
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_insert
  ON public.user_settings FOR INSERT
  WITH CHECK (false);

CREATE POLICY user_settings_admin_all
  ON public.user_settings FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());

-- ─── onboarding_progress ─────────────────────────────────────
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_select
  ON public.onboarding_progress FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY onboarding_modify
  ON public.onboarding_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY onboarding_admin_all
  ON public.onboarding_progress FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());

-- ─── plans (catalog) ─────────────────────────────────────────
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read
  ON public.plans FOR SELECT
  USING (is_active = true OR cognara_is_admin());

CREATE POLICY plans_admin_all
  ON public.plans FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());


-- ─── subscriptions / invoices / credit_transactions ──────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_own
  ON public.subscriptions FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_own
  ON public.invoices FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_tx_own
  ON public.credit_transactions FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

-- ─── ai_credits ───────────────────────────────────────────────
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_credits_select
  ON public.ai_credits FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY ai_credits_update
  ON public.ai_credits FOR UPDATE
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY ai_credits_insert
  ON public.ai_credits FOR INSERT
  WITH CHECK (false);

CREATE POLICY ai_credits_admin_all
  ON public.ai_credits FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());

-- ─── courses / lessons / resources ────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY courses_public_read
  ON public.courses FOR SELECT
  USING (
    (is_published = true AND deleted_at IS NULL)
    OR coach_id = auth.uid()
    OR cognara_is_admin()
  );

CREATE POLICY courses_coach_write
  ON public.courses FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY courses_coach_update
  ON public.courses FOR UPDATE
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

CREATE POLICY courses_admin_all
  ON public.courses FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());


ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lessons_read
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
        AND (
          (c.is_published = true AND c.deleted_at IS NULL)
          OR c.coach_id = auth.uid()
          OR cognara_is_admin()
        )
    )
  );

CREATE POLICY lessons_coach_write
  ON public.lessons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.coach_id = auth.uid())
    OR cognara_is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.coach_id = auth.uid())
    OR cognara_is_admin()
  );

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY resources_read
  ON public.resources FOR SELECT
  USING (
    coach_id = auth.uid()
    OR cognara_is_admin()
    OR access_level = 'free'
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = lesson_id AND c.is_published = true AND c.deleted_at IS NULL
    )
  );

CREATE POLICY resources_coach_write
  ON public.resources FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

-- ─── enrollments / lesson_progress ───────────────────────────
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY enrollments_student
  ON public.enrollments FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

CREATE POLICY enrollments_coach_read
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.coach_id = auth.uid())
    OR cognara_is_admin()
  );

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_progress_own
  ON public.lesson_progress FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

-- ─── code / notebooks / quizzes (owner-based) ───────────────
ALTER TABLE public.code_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY code_submissions_own
  ON public.code_submissions FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.code_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY code_sessions_own
  ON public.code_sessions FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY notebooks_own
  ON public.notebooks FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY notebook_pages_own
  ON public.notebook_pages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.notebooks n WHERE n.id = notebook_id AND n.student_id = auth.uid())
    OR cognara_is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.notebooks n WHERE n.id = notebook_id AND n.student_id = auth.uid())
    OR cognara_is_admin()
  );

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY quizzes_select
  ON public.quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND (c.is_published = true AND c.deleted_at IS NULL)
    )
    OR coach_id = auth.uid()
    OR cognara_is_admin()
  );

CREATE POLICY quizzes_coach_modify
  ON public.quizzes FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY questions_select
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
    )
  );

CREATE POLICY questions_modify
  ON public.questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.coach_id = auth.uid() OR cognara_is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.coach_id = auth.uid() OR cognara_is_admin()))
  );

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_options_select
  ON public.question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
    )
  );

CREATE POLICY question_options_modify
  ON public.question_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON z.id = q.quiz_id
      WHERE q.id = question_id AND (z.coach_id = auth.uid() OR cognara_is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON z.id = q.quiz_id
      WHERE q.id = question_id AND (z.coach_id = auth.uid() OR cognara_is_admin())
    )
  );


ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY quiz_attempts_own
  ON public.quiz_attempts FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY quiz_answers_own
  ON public.quiz_answers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid())
    OR cognara_is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid())
    OR cognara_is_admin()
  );

-- ─── agent / voice / reviews ─────────────────────────────────
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_sessions_own
  ON public.agent_sessions FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_messages_own
  ON public.agent_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.agent_sessions s WHERE s.id = session_id AND s.student_id = auth.uid())
    OR cognara_is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_sessions s WHERE s.id = session_id AND s.student_id = auth.uid())
    OR cognara_is_admin()
  );

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_memory_own
  ON public.agent_memory FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY voice_sessions_own
  ON public.voice_sessions FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY reviews_modify
  ON public.reviews FOR ALL
  USING (reviewer_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (reviewer_id = auth.uid() OR cognara_is_admin());


-- ─── coach verification ──────────────────────────────────────
ALTER TABLE public.coach_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY coach_applications_own
  ON public.coach_applications FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.coach_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY coach_documents_own
  ON public.coach_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.coach_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR cognara_is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.coach_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR cognara_is_admin()))
  );

-- ─── live / peer ─────────────────────────────────────────────
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_sessions_select
  ON public.live_sessions FOR SELECT
  USING (true);

CREATE POLICY live_sessions_modify
  ON public.live_sessions FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.live_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_attendees_select
  ON public.live_attendees FOR SELECT
  USING (
    student_id = auth.uid()
    OR cognara_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.live_sessions s
      WHERE s.id = session_id AND s.coach_id = auth.uid()
    )
  );

CREATE POLICY live_attendees_modify
  ON public.live_attendees FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.peer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY peer_sessions_select
  ON public.peer_sessions FOR SELECT
  USING (true);

CREATE POLICY peer_sessions_insert
  ON public.peer_sessions FOR INSERT
  WITH CHECK (host_id = auth.uid());

CREATE POLICY peer_sessions_modify
  ON public.peer_sessions FOR ALL
  USING (host_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (host_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.peer_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY peer_attendees_select
  ON public.peer_attendees FOR SELECT
  USING (
    student_id = auth.uid()
    OR cognara_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.peer_sessions s
      WHERE s.id = session_id AND s.host_id = auth.uid()
    )
  );

CREATE POLICY peer_attendees_modify
  ON public.peer_attendees FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());


-- ─── earnings / performance ──────────────────────────────────
ALTER TABLE public.coach_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY coach_earnings_access
  ON public.coach_earnings FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY performance_scores_access
  ON public.performance_scores FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

-- ─── support / notifications / audit / security ──────────────
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_tickets_access
  ON public.support_tickets FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_messages_access
  ON public.ticket_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR cognara_is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR cognara_is_admin()))
  );

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_own
  ON public.notifications FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_admin
  ON public.audit_logs FOR SELECT
  USING (cognara_is_admin());

CREATE POLICY audit_logs_insert
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY security_events_admin
  ON public.security_events FOR SELECT
  USING (cognara_is_admin());

CREATE POLICY security_events_insert
  ON public.security_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.off_platform_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY off_platform_own
  ON public.off_platform_attempts FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY off_platform_insert
  ON public.off_platform_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

-- ─── gamification ────────────────────────────────────────────
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_xp_own
  ON public.user_xp FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY badges_read
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY badges_admin_all
  ON public.badges FOR ALL
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_badges_own
  ON public.user_badges FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());



-- ================================================================
-- MIGRATION: 20260520000000_add_email_to_profiles.sql
-- ================================================================
-- Migration: Add email to public.profiles and sync with auth.users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update public.handle_new_user() trigger function to copy NEW.email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF r NOT IN ('student', 'coach') THEN
    r := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    r
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


-- ================================================================
-- MIGRATION: 20260520000001_chapters_and_badges.sql
-- ================================================================
-- Migration: 20260520000001_chapters_and_badges
-- Description: Adds chapters table, badge criteria to courses, and mini_activity to lessons.

-- 1. Create Chapters Table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  wall_type TEXT DEFAULT 'none' CHECK (wall_type IN ('none', 'cloud', 'wall')),
  x_pos DECIMAL(10,4) DEFAULT 0,
  y_pos DECIMAL(10,4) DEFAULT 0,
  z_pos DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapters_course_id ON public.chapters(course_id);

-- 2. Add badge criteria to courses
ALTER TABLE public.courses 
ADD COLUMN badge_criteria JSONB DEFAULT '{"bronze": 50, "copper": 60, "silver": 70, "gold": 80, "platinum": 90}'::jsonb,
ADD COLUMN badge_criteria_locked BOOLEAN DEFAULT false;

-- 3. Modify lessons table
ALTER TABLE public.lessons 
ADD COLUMN chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
ADD COLUMN is_graded BOOLEAN DEFAULT false;

-- 4. Update lessons type check constraint
DO $$
DECLARE conname text;
BEGIN
    SELECT constraint_name INTO conname
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'lessons' AND column_name = 'type' 
    LIMIT 1;
    
    IF conname IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.lessons DROP CONSTRAINT ' || conname;
    END IF;
END $$;

ALTER TABLE public.lessons ADD CONSTRAINT lessons_type_check CHECK (type IN ('text','video','code','quiz','mini_activity'));

-- 5. Add RLS for chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public chapters are viewable by everyone."
  ON public.chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = chapters.course_id AND courses.is_published = true
    )
  );

CREATE POLICY "Coaches can manage their own chapters."
  ON public.chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = chapters.course_id AND courses.coach_id = auth.uid()
    )
  );

-- Enrolled students can view chapters for courses they're enrolled in
CREATE POLICY "Enrolled students can view chapters."
  ON public.chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.course_id = chapters.course_id AND enrollments.student_id = auth.uid()
    )
  );


-- ================================================================
-- MIGRATION: 20260520000002_earned_badges.sql
-- ================================================================
-- Migration: 20260520000002_earned_badges
-- Description: Adds earned_badges table for tracking student achievements

CREATE TABLE public.earned_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('bronze', 'copper', 'silver', 'gold', 'platinum')),
  score DECIMAL(5,2) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, chapter_id)
);

CREATE INDEX idx_earned_badges_student_id ON public.earned_badges(student_id);
CREATE INDEX idx_earned_badges_course_id ON public.earned_badges(course_id);

-- Enable RLS
ALTER TABLE public.earned_badges ENABLE ROW LEVEL SECURITY;

-- Students can view their own badges
CREATE POLICY "Students can view their own badges"
  ON public.earned_badges FOR SELECT
  USING (auth.uid() = student_id);

-- Coaches can view badges earned in their courses
CREATE POLICY "Coaches can view badges for their courses"
  ON public.earned_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = earned_badges.course_id
      AND courses.coach_id = auth.uid()
    )
  );

-- Only service role can insert/update (or we can allow authenticated users to insert their own if validated by an edge function, but for now we will allow insert by the student doing the quiz)
CREATE POLICY "Students can insert their own badges"
  ON public.earned_badges FOR INSERT
  WITH CHECK (auth.uid() = student_id);


-- ================================================================
-- MIGRATION: 20260520000003_quiz_schedule_and_code_questions.sql
-- ================================================================
-- Add quiz scheduling and code question support

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;

-- ================================================================
-- MIGRATION: 20260522000001_agent_jobs_and_ai_reviews.sql
-- ================================================================
-- Agent background jobs and AI-assisted support/report reviews.
-- AI can recommend and flag; admins still approve final action.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_review JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_risk_score INT CHECK (ai_risk_score IS NULL OR (ai_risk_score >= 0 AND ai_risk_score <= 100)),
  ADD COLUMN IF NOT EXISTS ai_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS ai_review_status TEXT DEFAULT 'not_reviewed'
    CHECK (ai_review_status IN ('not_reviewed','pending_admin_approval','approved','rejected')),
  ADD COLUMN IF NOT EXISTS ai_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_decision_reason TEXT;

CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  audience TEXT NOT NULL DEFAULT 'student' CHECK (audience IN ('student','coach','admin')),
  skill TEXT NOT NULL CHECK (skill IN ('teach','debug','quiz','voice','path','support','verify','coach','admin')),
  prompt TEXT NOT NULL CHECK (LENGTH(prompt) BETWEEN 1 AND 10000),
  context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  result JSONB DEFAULT '{}',
  error TEXT,
  run_after TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_run_after
  ON public.agent_jobs(status, run_after, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_user_created
  ON public.agent_jobs(user_id, created_at DESC);

ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_jobs_own ON public.agent_jobs;
CREATE POLICY agent_jobs_own
  ON public.agent_jobs FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

DROP POLICY IF EXISTS agent_jobs_insert_own ON public.agent_jobs;
CREATE POLICY agent_jobs_insert_own
  ON public.agent_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

DROP POLICY IF EXISTS agent_jobs_admin_update ON public.agent_jobs;
CREATE POLICY agent_jobs_admin_update
  ON public.agent_jobs FOR UPDATE
  USING (cognara_is_admin())
  WITH CHECK (cognara_is_admin());


-- ================================================================
-- MIGRATION: 20260523000001_notebook_share_tokens.sql
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notebook_share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES public.notebook_pages(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'private_link' CHECK (visibility IN ('private_link', 'enrolled_only', 'public_link')),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notebook_share_tokens_token
  ON public.notebook_share_tokens(token)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notebook_share_tokens_page
  ON public.notebook_share_tokens(page_id, created_at DESC);

ALTER TABLE public.notebook_share_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notebook_share_tokens_owner_select ON public.notebook_share_tokens;
CREATE POLICY notebook_share_tokens_owner_select
  ON public.notebook_share_tokens FOR SELECT
  USING (created_by = auth.uid() OR cognara_is_admin());

DROP POLICY IF EXISTS notebook_share_tokens_owner_insert ON public.notebook_share_tokens;
CREATE POLICY notebook_share_tokens_owner_insert
  ON public.notebook_share_tokens FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notebook_pages p
      JOIN public.notebooks n ON n.id = p.notebook_id
      WHERE p.id = page_id
        AND n.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS notebook_share_tokens_owner_update ON public.notebook_share_tokens;
CREATE POLICY notebook_share_tokens_owner_update
  ON public.notebook_share_tokens FOR UPDATE
  USING (created_by = auth.uid() OR cognara_is_admin())
  WITH CHECK (created_by = auth.uid() OR cognara_is_admin());


-- ================================================================
-- MIGRATION: 20260526000001_gnara_schema.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: 20260526000002_course_system.sql
-- ================================================================
-- ═══════════════════════════════════════════════════════════════════
-- GNARA — Course System Schema Upgrade
-- Adds new columns to courses, lessons, enrollments, lesson_progress.
-- Creates chapter_progress, enrollment_drops, course_reviews tables.
-- Creates triggers for sync and auto-unlock.
-- All existing data is preserved (nullable columns with defaults).
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. UPGRADE courses TABLE ───────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','review','published','suspended','archived')),
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS what_you_will_learn TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS promo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS total_chapters INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_tags TEXT[] DEFAULT '{}';

-- Sync published courses to status='published'
UPDATE public.courses SET status = 'published' WHERE is_published = true AND status IS NULL;
UPDATE public.courses SET status = 'draft' WHERE status IS NULL;

-- ─── 2. UPGRADE chapters TABLE ──────────────────────────────────

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_condition TEXT DEFAULT 'previous_chapter'
    CHECK (unlock_condition IN ('none','previous_chapter')),
  ADD COLUMN IF NOT EXISTS total_lessons INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_mins INT;

-- ─── 3. UPGRADE lessons TABLE ───────────────────────────────────

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS lesson_order_in_chapter INT,
  ADD COLUMN IF NOT EXISTS unlock_condition TEXT DEFAULT 'previous_lesson'
    CHECK (unlock_condition IN ('none','previous_lesson')),
  ADD COLUMN IF NOT EXISTS pass_threshold INT DEFAULT 80
    CHECK (pass_threshold BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiz_id UUID,
  ADD COLUMN IF NOT EXISTS estimated_mins INT,
  ADD COLUMN IF NOT EXISTS resources_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── 4. CREATE chapter_progress TABLE ───────────────────────────

CREATE TABLE IF NOT EXISTS public.chapter_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  lessons_completed INT DEFAULT 0,
  total_lessons INT DEFAULT 0,
  first_unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_student
  ON public.chapter_progress(student_id, course_id);

-- ─── 5. UPGRADE lesson_progress TABLE ───────────────────────────

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS quiz_score INT,
  ADD COLUMN IF NOT EXISTS quiz_attempts_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- ─── 6. UPGRADE enrollments TABLE ───────────────────────────────

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active','dropped','completed','suspended','refunded')),
  ADD COLUMN IF NOT EXISTS dropped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS drop_reason TEXT,
  ADD COLUMN IF NOT EXISTS can_re_enroll_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_amount_usd DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS current_chapter_id UUID REFERENCES public.chapters(id),
  ADD COLUMN IF NOT EXISTS current_lesson_id UUID REFERENCES public.lessons(id);

-- ─── 7. CREATE enrollment_drops TABLE ───────────────────────────

CREATE TABLE IF NOT EXISTS public.enrollment_drops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  course_was_paid BOOLEAN NOT NULL,
  paid_amount_usd DECIMAL(10,2) DEFAULT 0.00,
  dropped_at TIMESTAMPTZ DEFAULT NOW(),
  can_re_enroll_at TIMESTAMPTZ NOT NULL,
  re_enrolled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enrollment_drops_student
  ON public.enrollment_drops(student_id, course_id);

-- ─── 8. CREATE course_reviews TABLE ─────────────────────────────

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

CREATE INDEX IF NOT EXISTS idx_course_reviews_course
  ON public.course_reviews(course_id, rating DESC);

-- ─── 9. TRIGGERS ────────────────────────────────────────────────

-- Sync courses.total_chapters
CREATE OR REPLACE FUNCTION sync_course_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.courses SET
    total_chapters = (SELECT COUNT(*) FROM public.chapters WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)),
    last_updated_at = NOW()
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_chapter_count ON public.chapters;
CREATE TRIGGER trg_sync_chapter_count
  AFTER INSERT OR UPDATE OR DELETE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION sync_course_chapter_count();

-- Sync enrollment count
CREATE OR REPLACE FUNCTION sync_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.courses SET
    total_enrolled = (SELECT COUNT(*) FROM public.enrollments WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND status = 'active')
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_enrollment_count ON public.enrollments;
CREATE TRIGGER trg_sync_enrollment_count
  AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION sync_enrollment_count();

-- Sync avg_rating from course_reviews
CREATE OR REPLACE FUNCTION sync_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.courses SET
    avg_rating = (SELECT AVG(rating) FROM public.course_reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND is_flagged = false),
    total_reviews = (SELECT COUNT(*) FROM public.course_reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND is_flagged = false)
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_course_rating ON public.course_reviews;
CREATE TRIGGER trg_sync_course_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION sync_course_rating();

-- ─── 10. RLS ────────────────────────────────────────────────────

-- chapter_progress
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own chapter progress"
  ON public.chapter_progress FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students write own chapter progress"
  ON public.chapter_progress FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own chapter progress"
  ON public.chapter_progress FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Admins full access chapter progress"
  ON public.chapter_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- enrollment_drops
ALTER TABLE public.enrollment_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own drop history"
  ON public.enrollment_drops FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins full access enrollment drops"
  ON public.enrollment_drops FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- course_reviews
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads non-flagged reviews"
  ON public.course_reviews FOR SELECT USING (is_flagged = false);

CREATE POLICY "Students manage own reviews"
  ON public.course_reviews FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins full access reviews"
  ON public.course_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 11. ADDITIONAL INDEXES ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_order ON public.lessons(chapter_id, lesson_order_in_chapter);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON public.enrollments(student_id, status);


-- ================================================================
-- MIGRATION: 20260528000001_additional_tables.sql
-- ================================================================
-- Migration: 20260528000001_additional_tables
-- Adds student engagement tables: wishlists, bookmarks, streaks, flashcard decks, code challenges.

-- ─── Course Wishlists ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_student ON public.course_wishlists(student_id, saved_at DESC);

ALTER TABLE public.course_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own wishlists."
  ON public.course_wishlists FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own wishlists."
  ON public.course_wishlists FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ─── Lesson Bookmarks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  position_note TEXT CHECK (position_note IS NULL OR LENGTH(position_note) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_student ON public.lesson_bookmarks(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_course ON public.lesson_bookmarks(course_id);

ALTER TABLE public.lesson_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own bookmarks."
  ON public.lesson_bookmarks FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own bookmarks."
  ON public.lesson_bookmarks FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ─── Course Streaks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  streak_days INT DEFAULT 0 CHECK (streak_days >= 0),
  longest_streak INT DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_streaks_student ON public.course_streaks(student_id);

ALTER TABLE public.course_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own streaks."
  ON public.course_streaks FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own streaks."
  ON public.course_streaks FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ─── Flashcard Decks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  topic TEXT NOT NULL CHECK (LENGTH(topic) BETWEEN 1 AND 200),
  cards JSONB NOT NULL DEFAULT '[]',
  card_count INT GENERATED ALWAYS AS (jsonb_array_length(cards)) STORED,
  mastered_count INT DEFAULT 0 CHECK (mastered_count >= 0),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_student ON public.flashcard_decks(student_id, updated_at DESC);

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own flashcard decks."
  ON public.flashcard_decks FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own flashcard decks."
  ON public.flashcard_decks FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ─── Code Challenges ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.code_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL CHECK (LENGTH(topic) BETWEEN 1 AND 200),
  language TEXT NOT NULL DEFAULT 'javascript',
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  prompt TEXT NOT NULL,
  solution TEXT,
  student_code TEXT,
  completed BOOLEAN DEFAULT false,
  time_taken_secs INT CHECK (time_taken_secs IS NULL OR time_taken_secs >= 0),
  score INT CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_challenges_student ON public.code_challenges(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_topic ON public.code_challenges(topic, difficulty);

ALTER TABLE public.code_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own challenges."
  ON public.code_challenges FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own challenges."
  ON public.code_challenges FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ─── Admin policies for all new tables ───────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['course_wishlists', 'lesson_bookmarks', 'course_streaks', 'flashcard_decks', 'code_challenges']
  LOOP
    EXECUTE format(
      'CREATE POLICY "Admins can view all %1$s." ON public.%1$I FOR SELECT USING (cognara_is_admin())',
      tbl
    );
  END LOOP;
END $$;


-- ================================================================
-- MIGRATION: 20260528000002_seed_courses.sql
-- ================================================================
-- Migration: 20260528000002_seed_courses
-- Seed 50 realistic courses modeled on the Kaggle Udemy Courses dataset structure.
-- Attribution: Course metadata inspired by Udemy Courses Dataset (Andrew MVD, Kaggle, CC BY 4.0).
--
-- Uses a sentinel coach profile "COGNARA Demo Coach" created inline.
-- All courses default to published = true, status = 'published'.

-- Create the auth user first to satisfy the profiles_id_fkey foreign key constraint
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'demo-coach@cognara.dev',
  crypt('DemoCoach@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "COGNARA Demo Coach", "role": "coach"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Now create/update the demo coach profile
INSERT INTO public.profiles (id, email, role, full_name, username, is_verified)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo-coach@cognara.dev',
  'coach',
  'COGNARA Demo Coach',
  'DemoCoach',
  true
)
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username, is_verified = EXCLUDED.is_verified;

-- Seed courses
INSERT INTO public.courses (coach_id, title, slug, description, category, difficulty, language, price_usd, is_published, thumbnail_url, total_lessons, total_enrolled, avg_rating)
VALUES
  -- Web Development (10)
  ('11111111-1111-1111-1111-111111111111', 'The Complete Web Developer Bootcamp', 'complete-web-developer-bootcamp-1001', 'Master HTML, CSS, JavaScript, React, Node.js, and MongoDB from absolute zero to job-ready full-stack developer.', 'Web Development', 'beginner', 'en', 0, true, NULL, 62, 18420, 4.72),
  ('11111111-1111-1111-1111-111111111111', 'Advanced React Patterns & Performance', 'advanced-react-patterns-perf-1002', 'Deep dive into compound components, render props, hooks internals, React Server Components, and performance optimization.', 'Web Development', 'advanced', 'en', 29.99, true, NULL, 38, 4210, 4.85),
  ('11111111-1111-1111-1111-111111111111', 'Next.js 14 — The Full Stack Framework', 'nextjs-14-full-stack-framework-1003', 'Build production apps with Next.js 14 App Router, Server Actions, Middleware, ISR, and deployment on Vercel.', 'Web Development', 'intermediate', 'en', 24.99, true, NULL, 44, 7835, 4.68),
  ('11111111-1111-1111-1111-111111111111', 'CSS Mastery: Modern Layouts & Animations', 'css-mastery-layouts-animations-1004', 'Flexbox, Grid, container queries, @layer, custom properties, scroll-driven animations, and responsive design.', 'Web Development', 'intermediate', 'en', 19.99, true, NULL, 30, 5620, 4.55),
  ('11111111-1111-1111-1111-111111111111', 'TypeScript for Professionals', 'typescript-for-professionals-1005', 'Master generics, conditional types, mapped types, template literals, declaration merging, and real-world patterns.', 'Web Development', 'advanced', 'en', 34.99, true, NULL, 42, 6180, 4.91),
  ('11111111-1111-1111-1111-111111111111', 'Build a SaaS with Next.js, Supabase & Stripe', 'saas-nextjs-supabase-stripe-1006', 'End-to-end SaaS: auth, RLS, subscriptions, webhooks, dashboards, email, and production deployment.', 'Web Development', 'advanced', 'en', 49.99, true, NULL, 56, 3290, 4.78),
  ('11111111-1111-1111-1111-111111111111', 'HTML & CSS for Absolute Beginners', 'html-css-absolute-beginners-1007', 'Your first website in 2 hours. Learn semantic HTML5, CSS styling, responsive design, and deploy on Netlify.', 'Web Development', 'beginner', 'en', 0, true, NULL, 18, 31200, 4.42),
  ('11111111-1111-1111-1111-111111111111', 'Vue.js 3 Complete Guide', 'vuejs-3-complete-guide-1008', 'Composition API, Pinia, Vue Router, Nuxt 3, and building real-world single page applications.', 'Web Development', 'intermediate', 'en', 24.99, true, NULL, 36, 4870, 4.61),
  ('11111111-1111-1111-1111-111111111111', 'Tailwind CSS From Scratch', 'tailwind-css-from-scratch-1009', 'Utility-first CSS framework: responsive design, custom themes, component patterns, and dark mode.', 'Web Development', 'beginner', 'en', 14.99, true, NULL, 22, 8950, 4.50),
  ('11111111-1111-1111-1111-111111111111', 'GraphQL with Apollo & Node.js', 'graphql-apollo-nodejs-1010', 'Schema design, resolvers, subscriptions, federation, caching strategies, and full-stack integration.', 'Web Development', 'intermediate', 'en', 29.99, true, NULL, 34, 2680, 4.63),

  -- Python & Data Science (10)
  ('11111111-1111-1111-1111-111111111111', 'Python for Everybody Specialization', 'python-for-everybody-spec-2001', 'Learn Python from scratch: variables, loops, functions, files, APIs, databases, and data visualization.', 'Python', 'beginner', 'en', 0, true, NULL, 48, 42500, 4.81),
  ('11111111-1111-1111-1111-111111111111', 'Data Science with Python & Pandas', 'data-science-python-pandas-2002', 'Data wrangling, EDA, visualization with matplotlib/seaborn, statistical analysis, and real datasets.', 'Data Science', 'intermediate', 'en', 29.99, true, NULL, 40, 9870, 4.73),
  ('11111111-1111-1111-1111-111111111111', 'Machine Learning A-Z: Hands-On Python', 'machine-learning-az-python-2003', 'Regression, classification, clustering, NLP, deep learning with scikit-learn, TensorFlow, and PyTorch.', 'Data Science', 'intermediate', 'en', 39.99, true, NULL, 58, 15200, 4.67),
  ('11111111-1111-1111-1111-111111111111', 'Deep Learning Specialization', 'deep-learning-specialization-2004', 'Neural networks, CNNs, RNNs, transformers, GANs, and deploying models to production.', 'Data Science', 'advanced', 'en', 49.99, true, NULL, 64, 7430, 4.88),
  ('11111111-1111-1111-1111-111111111111', 'Python Automation & Scripting', 'python-automation-scripting-2005', 'Automate Excel, PDFs, emails, web scraping, file management, and system tasks with Python.', 'Python', 'beginner', 'en', 19.99, true, NULL, 28, 11300, 4.59),
  ('11111111-1111-1111-1111-111111111111', 'Natural Language Processing with Transformers', 'nlp-with-transformers-2006', 'BERT, GPT, T5, fine-tuning, tokenization, sentiment analysis, and building NLP pipelines.', 'Data Science', 'advanced', 'en', 44.99, true, NULL, 36, 3890, 4.82),
  ('11111111-1111-1111-1111-111111111111', 'SQL for Data Analysis', 'sql-for-data-analysis-2007', 'SELECT, JOIN, subqueries, window functions, CTEs, and query optimization with PostgreSQL.', 'Data Science', 'beginner', 'en', 0, true, NULL, 24, 19600, 4.56),
  ('11111111-1111-1111-1111-111111111111', 'Statistics & Probability for Data Science', 'statistics-probability-data-science-2008', 'Descriptive stats, distributions, hypothesis testing, Bayesian reasoning, and A/B testing.', 'Data Science', 'intermediate', 'en', 24.99, true, NULL, 32, 6740, 4.71),
  ('11111111-1111-1111-1111-111111111111', 'Computer Vision with OpenCV & Python', 'computer-vision-opencv-python-2009', 'Image processing, object detection, face recognition, OCR, and real-time video analysis.', 'Data Science', 'intermediate', 'en', 34.99, true, NULL, 38, 4520, 4.64),
  ('11111111-1111-1111-1111-111111111111', 'Data Engineering with Apache Spark', 'data-engineering-apache-spark-2010', 'PySpark, DataFrames, Spark SQL, streaming, Delta Lake, and building data pipelines at scale.', 'Data Science', 'advanced', 'en', 39.99, true, NULL, 42, 2980, 4.76),

  -- Mobile Development (5)
  ('11111111-1111-1111-1111-111111111111', 'Flutter & Dart: The Complete Guide', 'flutter-dart-complete-guide-3001', 'Build beautiful cross-platform mobile apps with Flutter widgets, state management, Firebase, and publishing.', 'Mobile Development', 'intermediate', 'en', 29.99, true, NULL, 52, 8940, 4.74),
  ('11111111-1111-1111-1111-111111111111', 'React Native — Build Mobile Apps', 'react-native-build-mobile-apps-3002', 'Cross-platform iOS and Android development with React Native, Expo, navigation, and native modules.', 'Mobile Development', 'intermediate', 'en', 24.99, true, NULL, 44, 6730, 4.62),
  ('11111111-1111-1111-1111-111111111111', 'iOS Development with SwiftUI', 'ios-development-swiftui-3003', 'Build native iOS apps: SwiftUI views, Core Data, networking, animations, and App Store submission.', 'Mobile Development', 'intermediate', 'en', 34.99, true, NULL, 40, 5180, 4.69),
  ('11111111-1111-1111-1111-111111111111', 'Android Development with Kotlin', 'android-development-kotlin-3004', 'Jetpack Compose, MVVM, Room, Retrofit, coroutines, and publishing on Google Play.', 'Mobile Development', 'intermediate', 'en', 29.99, true, NULL, 38, 4650, 4.58),
  ('11111111-1111-1111-1111-111111111111', 'Mobile UI/UX Design Fundamentals', 'mobile-ui-ux-design-fundamentals-3005', 'Design principles, wireframing, prototyping in Figma, user testing, and platform guidelines.', 'Mobile Development', 'beginner', 'en', 19.99, true, NULL, 20, 7280, 4.51),

  -- DevOps & Cloud (5)
  ('11111111-1111-1111-1111-111111111111', 'Docker & Kubernetes: The Practical Guide', 'docker-kubernetes-practical-guide-4001', 'Containers, Docker Compose, Kubernetes orchestration, Helm charts, CI/CD pipelines, and monitoring.', 'DevOps', 'intermediate', 'en', 34.99, true, NULL, 46, 7620, 4.79),
  ('11111111-1111-1111-1111-111111111111', 'AWS Certified Solutions Architect', 'aws-certified-solutions-architect-4002', 'EC2, S3, VPC, Lambda, RDS, CloudFront, IAM, and exam preparation with practice tests.', 'Cloud Computing', 'intermediate', 'en', 44.99, true, NULL, 60, 12400, 4.83),
  ('11111111-1111-1111-1111-111111111111', 'CI/CD with GitHub Actions', 'ci-cd-github-actions-4003', 'Automated testing, deployment workflows, matrix builds, secrets management, and reusable actions.', 'DevOps', 'beginner', 'en', 0, true, NULL, 16, 9870, 4.47),
  ('11111111-1111-1111-1111-111111111111', 'Terraform Infrastructure as Code', 'terraform-infrastructure-as-code-4004', 'HCL syntax, providers, modules, state management, workspaces, and multi-cloud deployments.', 'DevOps', 'intermediate', 'en', 29.99, true, NULL, 28, 4350, 4.66),
  ('11111111-1111-1111-1111-111111111111', 'Linux System Administration', 'linux-system-administration-4005', 'File systems, permissions, networking, systemd, shell scripting, security hardening, and server management.', 'DevOps', 'beginner', 'en', 19.99, true, NULL, 34, 8920, 4.54),

  -- Computer Science Fundamentals (5)
  ('11111111-1111-1111-1111-111111111111', 'Data Structures & Algorithms in JavaScript', 'dsa-javascript-5001', 'Arrays, linked lists, trees, graphs, sorting, searching, dynamic programming, and Big-O analysis.', 'Computer Science', 'intermediate', 'en', 29.99, true, NULL, 50, 11800, 4.77),
  ('11111111-1111-1111-1111-111111111111', 'System Design Interview Prep', 'system-design-interview-prep-5002', 'Load balancers, caching, databases, microservices, message queues, and designing scalable systems.', 'Computer Science', 'advanced', 'en', 39.99, true, NULL, 32, 6540, 4.86),
  ('11111111-1111-1111-1111-111111111111', 'Operating Systems: Three Easy Pieces', 'operating-systems-three-easy-pieces-5003', 'Processes, threads, memory management, file systems, scheduling, and concurrency.', 'Computer Science', 'intermediate', 'en', 24.99, true, NULL, 28, 3470, 4.65),
  ('11111111-1111-1111-1111-111111111111', 'Discrete Mathematics for CS', 'discrete-math-for-cs-5004', 'Logic, sets, combinatorics, graph theory, number theory, and proofs for computer science.', 'Computer Science', 'beginner', 'en', 0, true, NULL, 24, 5890, 4.48),
  ('11111111-1111-1111-1111-111111111111', 'Compiler Design from Scratch', 'compiler-design-from-scratch-5005', 'Lexing, parsing, ASTs, type checking, code generation, and building a working compiler.', 'Computer Science', 'advanced', 'en', 34.99, true, NULL, 36, 2140, 4.89),

  -- Cybersecurity (5)
  ('11111111-1111-1111-1111-111111111111', 'Ethical Hacking: The Complete Course', 'ethical-hacking-complete-course-6001', 'Penetration testing, network security, Kali Linux, Metasploit, OWASP Top 10, and bug bounties.', 'Cybersecurity', 'intermediate', 'en', 34.99, true, NULL, 48, 9650, 4.75),
  ('11111111-1111-1111-1111-111111111111', 'Web Application Security', 'web-application-security-6002', 'XSS, CSRF, SQL injection, authentication flaws, CSP, and secure coding practices.', 'Cybersecurity', 'intermediate', 'en', 29.99, true, NULL, 30, 5240, 4.68),
  ('11111111-1111-1111-1111-111111111111', 'Network Security & Firewalls', 'network-security-firewalls-6003', 'TCP/IP, VPNs, IDS/IPS, firewall configuration, packet analysis with Wireshark, and defense-in-depth.', 'Cybersecurity', 'intermediate', 'en', 24.99, true, NULL, 26, 4180, 4.57),
  ('11111111-1111-1111-1111-111111111111', 'Cryptography Fundamentals', 'cryptography-fundamentals-6004', 'Symmetric/asymmetric encryption, hashing, digital signatures, TLS/SSL, and PKI.', 'Cybersecurity', 'beginner', 'en', 19.99, true, NULL, 22, 6730, 4.52),
  ('11111111-1111-1111-1111-111111111111', 'SOC Analyst: Blue Team Operations', 'soc-analyst-blue-team-6005', 'SIEM, log analysis, incident response, threat hunting, and security operations center workflows.', 'Cybersecurity', 'advanced', 'en', 39.99, true, NULL, 34, 3120, 4.81),

  -- Soft Skills & Career (5)
  ('11111111-1111-1111-1111-111111111111', 'Technical Interview Masterclass', 'technical-interview-masterclass-7001', 'Behavioral questions, coding challenges, system design, salary negotiation, and offer evaluation.', 'Career', 'beginner', 'en', 0, true, NULL, 20, 14500, 4.63),
  ('11111111-1111-1111-1111-111111111111', 'Git & GitHub for Teams', 'git-github-for-teams-7002', 'Branching strategies, pull requests, code reviews, conflict resolution, and CI/CD integration.', 'Career', 'beginner', 'en', 0, true, NULL, 16, 22300, 4.58),
  ('11111111-1111-1111-1111-111111111111', 'Agile & Scrum Master Certification Prep', 'agile-scrum-master-cert-7003', 'Scrum framework, sprint planning, retrospectives, Kanban, and PSM I exam preparation.', 'Career', 'beginner', 'en', 24.99, true, NULL, 18, 7840, 4.49),
  ('11111111-1111-1111-1111-111111111111', 'Clean Code: Writing Readable Software', 'clean-code-writing-readable-software-7004', 'Naming, functions, comments, formatting, error handling, testing, and refactoring patterns.', 'Career', 'intermediate', 'en', 19.99, true, NULL, 22, 8960, 4.74),
  ('11111111-1111-1111-1111-111111111111', 'Building Your Developer Portfolio', 'building-developer-portfolio-7005', 'Project selection, GitHub profile, personal website, case studies, and standing out to recruiters.', 'Career', 'beginner', 'en', 0, true, NULL, 12, 11200, 4.44),

  -- AI & Machine Learning (5)
  ('11111111-1111-1111-1111-111111111111', 'Generative AI & Prompt Engineering', 'generative-ai-prompt-engineering-8001', 'LLMs, ChatGPT, Claude, Gemini, prompt design, chain-of-thought, RAG, and building AI applications.', 'Artificial Intelligence', 'beginner', 'en', 24.99, true, NULL, 26, 16800, 4.71),
  ('11111111-1111-1111-1111-111111111111', 'Building AI Agents with LangChain', 'building-ai-agents-langchain-8002', 'Chains, tools, memory, retrieval augmentation, autonomous agents, and production deployment.', 'Artificial Intelligence', 'intermediate', 'en', 34.99, true, NULL, 32, 5430, 4.83),
  ('11111111-1111-1111-1111-111111111111', 'Reinforcement Learning: Theory to Practice', 'reinforcement-learning-theory-practice-8003', 'MDP, Q-learning, policy gradient, PPO, multi-agent RL, and OpenAI Gym environments.', 'Artificial Intelligence', 'advanced', 'en', 44.99, true, NULL, 38, 2760, 4.87),
  ('11111111-1111-1111-1111-111111111111', 'MLOps: Machine Learning in Production', 'mlops-machine-learning-production-8004', 'Model versioning, experiment tracking, feature stores, model serving, monitoring, and CI/CD for ML.', 'Artificial Intelligence', 'advanced', 'en', 39.99, true, NULL, 30, 3890, 4.79),
  ('11111111-1111-1111-1111-111111111111', 'Computer Vision Projects with PyTorch', 'computer-vision-projects-pytorch-8005', 'Image classification, object detection, segmentation, GANs, and deploying vision models.', 'Artificial Intelligence', 'intermediate', 'en', 29.99, true, NULL, 34, 4210, 4.72)

ON CONFLICT DO NOTHING;


-- ================================================================
-- MIGRATION: 20260529000001_enhanced_skills.sql
-- ================================================================
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


