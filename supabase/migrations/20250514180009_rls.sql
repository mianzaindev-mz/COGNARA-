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

-- ─── onboarding_progress ─────────────────────────────────────
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_select
  ON public.onboarding_progress FOR SELECT
  USING (user_id = auth.uid() OR cognara_is_admin());

CREATE POLICY onboarding_modify
  ON public.onboarding_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── plans (catalog) ─────────────────────────────────────────
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read
  ON public.plans FOR SELECT
  USING (is_active = true OR cognara_is_admin());

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
CREATE POLICY reviews_participant
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

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_badges_own
  ON public.user_badges FOR ALL
  USING (user_id = auth.uid() OR cognara_is_admin())
  WITH CHECK (user_id = auth.uid() OR cognara_is_admin());
