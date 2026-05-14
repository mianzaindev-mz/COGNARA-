
-- === 20250514180001_extensions.sql ===
-- COGNARA Session 3 - extensions required by the master schema (Section 8)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- === 20250514180002_core_identity.sql ===
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

-- === 20250514180003_commerce.sql ===
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

-- === 20250514180004_courses_content.sql ===
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
  BEFORE UPDATE ON public.resources
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

-- === 20250514180005_learning_tools.sql ===
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

-- === 20250514180006_agent_reviews.sql ===
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

-- === 20250514180007_coach_live_peer.sql ===
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

-- === 20250514180008_platform_ops.sql ===
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

-- === 20250514180009_rls.sql ===
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

-- â”€â”€â”€ profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR cognara_is_admin()
  );

CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_service
  ON public.profiles FOR INSERT
  WITH CHECK (false);

-- â”€â”€â”€ user_settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ onboarding_progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_select
  ON public.onboarding_progress FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY onboarding_modify
  ON public.onboarding_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- â”€â”€â”€ plans (catalog) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read
  ON public.plans FOR SELECT
  USING (is_active = true OR cognara_is_admin());

-- â”€â”€â”€ subscriptions / invoices / credit_transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ ai_credits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ courses / lessons / resources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ enrollments / lesson_progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ code / notebooks / quizzes (owner-based) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
CREATE POLICY quizzes_access
  ON public.quizzes FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY questions_access
  ON public.questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.coach_id = auth.uid() OR cognara_is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.coach_id = auth.uid() OR cognara_is_admin()))
  );

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY question_options_access
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

-- â”€â”€â”€ agent / voice / reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
CREATE POLICY reviews_participant
  ON public.reviews FOR ALL
  USING (reviewer_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (reviewer_id = auth.uid() OR cognara_is_admin());

-- â”€â”€â”€ coach verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ live / peer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY live_sessions_access
  ON public.live_sessions FOR ALL
  USING (coach_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (coach_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.live_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY live_attendees_access
  ON public.live_attendees FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.peer_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY peer_sessions_access
  ON public.peer_sessions FOR ALL
  USING (host_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (host_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.peer_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY peer_attendees_access
  ON public.peer_attendees FOR ALL
  USING (student_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (student_id = auth.uid() OR cognara_is_admin());

-- â”€â”€â”€ earnings / performance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ support / notifications / audit / security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ gamification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_xp_own
  ON public.user_xp FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY badges_read
  ON public.badges FOR SELECT
  USING (true);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_badges_own
  ON public.user_badges FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());
