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
