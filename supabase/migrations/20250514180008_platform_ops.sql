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
