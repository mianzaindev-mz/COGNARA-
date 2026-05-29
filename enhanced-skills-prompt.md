╔══════════════════════════════════════════════════════════════════════════════════════╗
║     COGNARA — ENHANCED AGENT SKILLS: COMPLETE PRODUCTION-READY PROMPT             ║
║     Scope: New Skills · Pages · Routes · DB · Buttons · Wiring · Everything       ║
║     Rule: If it needs a page, build the page. If it needs a button, wire it.      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

READ THIS ENTIRE DOCUMENT BEFORE WRITING A SINGLE LINE OF CODE.
This prompt covers everything end-to-end: database, API routes, pages, components,
agent skills, buttons, wiring, and non-negotiable quality rules.
Nothing in this prompt is optional. Nothing is a stub. Everything is production-ready.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 0 — MANDATORY SCAN BEFORE ANY CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing any code, read these files completely and note their exact current state:

  src/lib/ai/master-agent.ts              — what skills are currently routed?
  src/lib/ai/agents/                      — every agent file, what each skill does now
  src/lib/ai/tools/agent-tools.ts         — all tool definitions, which ones are wired
  src/lib/security/security.ts            — rate limiter, injection detection, RBAC
  src/lib/security/audit-log.ts           — what is and isn't being logged
  src/app/api/agent/route.ts              — full request/response pipeline
  src/app/api/agent/jobs/route.ts         — background job endpoints
  src/app/(student)/library/             — current library page structure + tabs
  src/app/(student)/quizzes/             — current quiz pages
  src/app/(student)/progress/            — current progress page
  src/app/(student)/certificates/        — current certificate page
  src/app/(coach)/quizzes/               — quiz builder state
  src/app/(coach)/analytics/             — analytics page
  src/app/(admin)/dashboard/             — admin dashboard
  src/app/(admin)/support/               — support/ticket system
  src/app/(admin)/security/              — security events page (may not exist)
  supabase/migrations/                   — all existing migration files
  src/components/agent/AgentPanel.tsx    — current skill buttons visible to user
  src/components/agent/AgentMessage.tsx  — how messages are rendered
  package.json                           — what is already installed

  After reading: produce a one-paragraph STATUS SUMMARY per file.
  Then: list every skill button that exists in the UI with its current status (wired/stub/missing).
  Then: list every API route that touches the agent system.
  Then: list every DB table that the agent code references.
  Only then proceed to Section 1.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — DATABASE MIGRATIONS (run all before any application code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create file: supabase/migrations/0008_enhanced_skills.sql
Run in Supabase SQL editor. All IF NOT EXISTS — safe on live data.

── 1A. BUG REPORTS (enhanced with AI evaluation and exact location data) ──

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category              TEXT NOT NULL CHECK (category IN (
                          'bug','abuse','content','fraud','security','legal','performance','feature_request'
                        )),
  title                 TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 5 AND 200),
  description           TEXT NOT NULL CHECK (LENGTH(description) >= 20),

  -- EXACT LOCATION DATA (populated by the client on submit)
  page_url              TEXT,        -- full URL where bug/abuse was observed
  page_route            TEXT,        -- Next.js route e.g. /courses/[id]/lesson/[id]
  dom_selector          TEXT,        -- CSS selector of the element involved (if applicable)
  video_timestamp_secs  INT,         -- if occurred in a video lesson: seconds into the video
  lesson_id             UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  course_id             UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  screenshot_url        TEXT,        -- Supabase storage signed URL of screenshot
  screenshot_path       TEXT,        -- storage path for re-signing
  browser_info          JSONB DEFAULT '{}', -- { userAgent, viewport, os, browser, version }
  reproduction_steps    TEXT,        -- numbered steps to reproduce

  -- AI EVALUATION (populated by pipeline after submission)
  ai_category           TEXT,        -- AI-confirmed or overridden category
  ai_severity           TEXT CHECK (ai_severity IN ('S1','S2','S3','S4','S5')),
  ai_confidence         INT CHECK (ai_confidence BETWEEN 0 AND 100),
  ai_validity           TEXT CHECK (ai_validity IN ('valid','invalid','uncertain','duplicate')),
  ai_validity_reasoning TEXT,        -- 2-sentence explanation of validity verdict
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
CREATE POLICY "Reporters read own reports" ON public.bug_reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Reporters create reports" ON public.bug_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins full access" ON public.bug_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

── 1B. VIDEO TRANSCRIPTS ──

CREATE TABLE IF NOT EXISTS public.video_transcripts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id         UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- null student_id = coach/admin generated transcript (shared for all students)
  transcript_text   TEXT NOT NULL,
  transcript_segments JSONB DEFAULT '[]',
  -- segments: [{ start_secs, end_secs, text, speaker? }]
  language          TEXT DEFAULT 'en',
  source            TEXT DEFAULT 'web_speech'
                      CHECK (source IN ('web_speech','whisper','upload','manual')),
  word_count        INT,
  duration_secs     INT,
  is_public         BOOLEAN DEFAULT false, -- if coach marks it public: all enrolled students see it
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_lesson ON public.video_transcripts(lesson_id, is_public);
CREATE INDEX IF NOT EXISTS idx_transcripts_student ON public.video_transcripts(student_id, lesson_id);

ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own + public transcripts" ON public.video_transcripts FOR SELECT
  USING (student_id = auth.uid() OR is_public = true);
CREATE POLICY "Students create own transcripts" ON public.video_transcripts FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Coaches read transcripts for their lessons" ON public.video_transcripts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.lessons l JOIN public.courses c ON l.course_id = c.id
    WHERE l.id = lesson_id AND c.coach_id = auth.uid()));
CREATE POLICY "Admins full access" ON public.video_transcripts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

── 1C. LECTURE NOTES (AI-generated from transcript) ──

CREATE TABLE IF NOT EXISTS public.lecture_notes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id     UUID REFERENCES public.video_transcripts(id) ON DELETE CASCADE,
  lesson_id         UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  summary           TEXT NOT NULL,
  key_points        TEXT[] DEFAULT '{}',
  key_terms         JSONB DEFAULT '{}',    -- { term: definition }
  table_of_contents JSONB DEFAULT '[]',   -- [{ heading, timestamp_secs, page_num }]
  full_notes_md     TEXT,                 -- full markdown notes
  notebook_page_id  UUID REFERENCES public.notebook_pages(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lecture_notes_lesson ON public.lecture_notes(lesson_id, student_id);

ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own notes" ON public.lecture_notes FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Coaches read notes for their lessons" ON public.lecture_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.lessons l JOIN public.courses c ON l.course_id = c.id
    WHERE l.id = lesson_id AND c.coach_id = auth.uid()));

── 1D. GENERATED PDFs ──

CREATE TABLE IF NOT EXISTS public.generated_pdfs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'chat_export','lecture_notes','quiz_results','grade_report',
                    'certificate','solution_set','research_report','course_summary'
                  )),
  source_id       UUID,            -- quiz_id, lesson_id, session_id etc. depending on type
  storage_path    TEXT NOT NULL,
  file_size_bytes INT,
  page_count      INT,
  is_public       BOOLEAN DEFAULT false,
  expires_at      TIMESTAMPTZ,     -- null = never expires
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own PDFs" ON public.generated_pdfs FOR ALL USING (user_id = auth.uid());

── 1E. PROFESSOR GRADE SCALES ──

CREATE TABLE IF NOT EXISTS public.grade_scales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,         -- e.g. "Standard UMT Scale"
  is_default      BOOLEAN DEFAULT false, -- coach's default scale
  grades          JSONB NOT NULL,
  -- grades: [{ letter: 'A+', min_pct: 95, max_pct: 100, grade_point: 4.0, label: 'Exceptional' },
  --          { letter: 'A',  min_pct: 90, max_pct: 94,  grade_point: 4.0, label: 'Excellent'  }, ...]
  passing_grade   TEXT DEFAULT 'D',      -- minimum passing letter grade
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own scales" ON public.grade_scales FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Students read coach scales" ON public.grade_scales FOR SELECT USING (true);

── 1F. GRADED SUBMISSIONS ──

CREATE TABLE IF NOT EXISTS public.graded_submissions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id               UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  attempt_id            UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  course_id             UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  coach_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  grade_scale_id        UUID REFERENCES public.grade_scales(id),

  -- SCORE DATA
  raw_score             DECIMAL(6,2),   -- points earned
  max_score             DECIMAL(6,2),   -- points possible
  percentage            DECIMAL(5,2),   -- 0.00-100.00
  letter_grade          TEXT,           -- A+/A/B+/B/C+/C/D/F
  grade_point           DECIMAL(3,2),   -- 0.0-4.0
  passed                BOOLEAN,

  -- AI GRADING DETAILS (per question)
  question_grades       JSONB DEFAULT '[]',
  -- [{ question_id, student_answer, correct_answer, points_earned, points_possible,
  --    ai_score: 0.0-1.0, ai_feedback: string, partial_credit: boolean, graded_by: 'ai'|'exact'|'manual' }]

  -- FEEDBACK
  overall_feedback      TEXT,           -- AI-generated overall feedback
  strengths             TEXT[] DEFAULT '{}',
  areas_for_improvement TEXT[] DEFAULT '{}',
  recommended_resources TEXT[] DEFAULT '{}',

  -- PROFESSOR NOTES
  instructor_note       TEXT,           -- coach can add manual note
  instructor_override   DECIMAL(5,2),  -- if coach overrides the score

  -- STATUS
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
CREATE POLICY "Students read own grades" ON public.graded_submissions FOR SELECT
  USING (student_id = auth.uid());
CREATE POLICY "Coaches read grades for their courses" ON public.graded_submissions FOR SELECT
  USING (coach_id = auth.uid());
CREATE POLICY "Coaches update grades" ON public.graded_submissions FOR UPDATE
  USING (coach_id = auth.uid());
CREATE POLICY "Admins full access" ON public.graded_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

── 1G. SOLUTION SETS ──

CREATE TABLE IF NOT EXISTS public.solution_sets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id           UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  resource_id       UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  solutions         JSONB NOT NULL DEFAULT '[]',
  -- solutions: [{ question_id?, question_text, solution_steps: string[], final_answer: string,
  --               explanation: string, references: string[], difficulty: 'easy'|'medium'|'hard' }]
  is_released       BOOLEAN DEFAULT false, -- when true: enrolled students can see it
  released_at       TIMESTAMPTZ,
  search_queries_used TEXT[] DEFAULT '{}', -- web searches used to generate solutions
  sources_cited     JSONB DEFAULT '[]',    -- [{ title, url, snippet }]
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.solution_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own solution sets" ON public.solution_sets FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Students read released solution sets if enrolled" ON public.solution_sets FOR SELECT
  USING (is_released = true AND (
    quiz_id IS NULL OR EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      JOIN public.quizzes q ON qa.quiz_id = q.id
      WHERE q.id = solution_sets.quiz_id AND qa.student_id = auth.uid()
    )
  ));
CREATE POLICY "Admins full access" ON public.solution_sets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

── 1H. WEB RESEARCH CACHE ──

CREATE TABLE IF NOT EXISTS public.web_research_cache (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query           TEXT NOT NULL,
  query_hash      TEXT NOT NULL,  -- SHA-256 of normalized query for dedup
  results         JSONB NOT NULL DEFAULT '[]',
  -- results: [{ url, title, snippet, full_content?, fetched_at, source_type: 'webpage'|'video'|'pdf' }]
  synthesis       TEXT,           -- Groq-generated synthesis of all results
  citations       JSONB DEFAULT '[]',
  research_type   TEXT DEFAULT 'general'
                    CHECK (research_type IN ('general','academic','news','video','code','definition')),
  credits_used    INT DEFAULT 0,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_cache_user ON public.web_research_cache(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_cache_hash ON public.web_research_cache(query_hash);

ALTER TABLE public.web_research_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own research" ON public.web_research_cache FOR ALL USING (user_id = auth.uid());

── 1I. LIBRARY ACTIVITIES ──

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
  attachments     TEXT[] DEFAULT '{}',  -- storage paths
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
CREATE POLICY "Public reads published activities" ON public.library_activities FOR SELECT
  USING (is_published = true);
CREATE POLICY "Coaches manage own activities" ON public.library_activities FOR ALL
  USING (coach_id = auth.uid());
CREATE POLICY "Admins full access" ON public.library_activities FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

── 1J. ACTIVITY SUBMISSIONS ──

CREATE TABLE IF NOT EXISTS public.activity_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id         UUID NOT NULL REFERENCES public.library_activities(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number      INT DEFAULT 1,
  content             TEXT,           -- written answer
  file_paths          TEXT[] DEFAULT '{}', -- uploaded files
  quiz_attempt_id     UUID REFERENCES public.quiz_attempts(id),
  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  graded_submission_id UUID REFERENCES public.graded_submissions(id),
  status              TEXT DEFAULT 'submitted'
                        CHECK (status IN ('draft','submitted','graded','returned')),
  UNIQUE(activity_id, student_id, attempt_number)
);

ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own submissions" ON public.activity_submissions FOR ALL
  USING (student_id = auth.uid());
CREATE POLICY "Coaches read submissions for their activities" ON public.activity_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.library_activities WHERE id = activity_id AND coach_id = auth.uid()));

── 1K. SCHEDULED TASKS (enhanced, replaces agent_jobs for user-facing tasks) ──

-- agent_jobs already handles background AI tasks
-- This table is for user-created scheduled actions with rich metadata

CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'email','notification','reminder','quiz_reminder','study_reminder',
                    'deadline_alert','weekly_report','custom'
                  )),
  payload         JSONB NOT NULL DEFAULT '{}',
  -- email: { to, subject, body, template_params }
  -- notification: { title, message, action_url }
  -- reminder: { message, context }
  recurrence      TEXT DEFAULT 'once'
                    CHECK (recurrence IN ('once','daily','weekly','monthly')),
  recurrence_time TIME,              -- time of day for recurring tasks
  recurrence_day  INT,               -- 0-6 for weekly, 1-31 for monthly
  scheduled_at    TIMESTAMPTZ NOT NULL,
  next_run_at     TIMESTAMPTZ,
  last_run_at     TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','running','done','failed','cancelled')),
  run_count       INT DEFAULT 0,
  max_runs        INT,               -- null = unlimited (for recurring)
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user ON public.scheduled_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON public.scheduled_tasks(next_run_at, status);

ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.scheduled_tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins full access" ON public.scheduled_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — SKILL: BUG / REPORT / ABUSE EVALUATION + FLAGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/lib/ai/agents/bug-eval-agent.ts
Skill name in master-agent.ts: 'bug_eval'
Credit cost: 0 for all roles (reporting is always free)

2.1 — REPORT SUBMISSION FLOW (client → database → AI pipeline)

  STEP 1: REPORT SUBMISSION UI
  Build component: src/components/shared/ReportBugButton.tsx
  This button must appear in THREE places:
    a) Floating help button on every page (bottom-left, ? icon)
       → opens report modal in "bug" mode
    b) Context-menu on any content (right-click or ⋮ menu) in lesson/library
       → opens modal in "content" or "abuse" mode
    c) Flag icon on every user-generated content card (reviews, peer sessions, messages)
       → opens modal in "abuse" mode

  REPORT MODAL FIELDS:
    Category selector (pre-filled based on trigger, but editable):
      [Bug] [Abuse] [Content] [Fraud] [Security] [Feature Request]

    Title: text input, min 5 chars, max 200

    Description: textarea, min 20 chars (show char count)

    Reproduction Steps (for bugs only): numbered textarea
      "1. Go to..." "2. Click..." "3. Expected: ... Got: ..."

    LOCATION DATA (auto-captured, shown to user, editable):
      Page URL: auto-filled with window.location.href
      Page Route: auto-filled with Next.js router.pathname
      DOM Selector: if triggered from context menu on an element:
        use a utility to generate a unique CSS selector for that element:
        function getSelector(el): string — walk up DOM tree building selector string
      Video Timestamp: if user is watching a video lesson:
        auto-captured from the video player's currentTime property, shown as "3m 42s"
      Lesson/Course: auto-filled if on a lesson page

    Screenshot attachment:
      [📷 Attach Screenshot] button
      OR: "Use browser screenshot" → trigger getDisplayMedia() for screen capture
      Upload to Supabase Storage bucket 'bug-screenshots' immediately on selection
      Show thumbnail preview in modal

    Browser info: auto-captured silently:
      { userAgent: navigator.userAgent, viewport: { w: window.innerWidth, h: window.innerHeight },
        language: navigator.language }

    [Submit Report] button → POST /api/reports

  STEP 2: API ROUTE — POST /api/reports
    Auth: any authenticated user
    Rate limit: 10 reports per hour per user (prevent abuse of the report system)
    Zod validation: all fields as defined in createReportSchema
    Insert into bug_reports table
    Trigger AI evaluation pipeline asynchronously (do not block response):
      queue as agent_job: { skill: 'bug_eval', payload: { report_id: newId } }
    Return { success: true, reportId } immediately
    Show toast: "Report submitted. We'll review it shortly."

  STEP 3: AI EVALUATION PIPELINE (runs as background job)
  File: src/lib/ai/agents/bug-eval-agent.ts

  export async function evaluateReport(reportId: string): Promise<void> {
    // 1. Fetch full report from bug_reports
    // 2. Fetch reporter profile: role, strike_count, account_age_days, reports_submitted_30d
    // 3. Fetch reported user (if any): role, is_verified, strike_count, reports_received_30d
    // 4. Fetch related content (lesson/course being reported if IDs present)
    // 5. Check for duplicates: query last 100 open reports, send to Groq for similarity check
    // 6. If duplicate found: mark as duplicate, merge, notify reporter, STOP
    // 7. Run Groq classification (see prompt below)
    // 8. Determine auto-resolve eligibility
    // 9. If auto-resolvable: generate reply, mark ai_auto_resolved = true, update status
    // 10. If needs human: escalate based on severity (push admin notifications for S1/S2)
    // 11. Generate draft reply for admin
    // 12. Update bug_reports row with all AI fields
    // 13. Log to agent_audit_log
  }

  GROQ CLASSIFICATION PROMPT:
  System: "You are COGNARA's AI security and quality analyst. You analyze user reports
  on an educational platform. Return ONLY valid JSON. No markdown. No explanation.
  Start directly with {.

  Return: {
    'ai_category': 'bug'|'abuse'|'content'|'fraud'|'security'|'legal'|'performance'|'feature_request',
    'ai_severity': 'S1'|'S2'|'S3'|'S4'|'S5',
    'ai_confidence': integer 0-100,
    'ai_validity': 'valid'|'invalid'|'uncertain',
    'ai_validity_reasoning': '2 sentences max explaining your validity verdict',
    'ai_recommended_action': '1 sentence describing the recommended response',
    'auto_resolvable': boolean,
    'needs_human': boolean,
    'ai_tags': ['tag1','tag2','tag3']
  }

  SEVERITY DEFINITIONS:
  S1 CRITICAL: Platform-wide impact, data breach, active security attack, all users affected
  S2 SEVERE: Multiple users affected, revenue at risk, legal exposure, verified harassment
  S3 MODERATE: Single user significantly impacted, content violation, confirmed plagiarism
  S4 MINOR: UI glitch, broken link, minor display error, isolated inconvenience
  S5 INFORMATIONAL: Feature request, duplicate of known issue, already resolved issue

  VALIDITY DEFINITIONS:
  valid: report describes a real issue, sufficient detail, plausible given context
  invalid: clearly false, vague to the point of useless, obvious misuse of report system
  uncertain: might be valid but insufficient information to confirm"

  User: "Report title: [title]
  Category claimed by user: [category]
  Description: [description]
  Reproduction steps: [steps]
  Location: page [page_route], URL [page_url]
  Video timestamp: [timestamp] seconds
  DOM selector: [selector]
  Reporter: role=[role], strikes=[n], account age=[days] days
  Reported user (if any): role=[role], verified=[bool], strikes=[n]
  Related content: [course/lesson title if any]"

  EXACT LOCATION DISPLAY:
  When the AI evaluation is saved, format location_data into a human-readable string:
    For a bug on a lesson: "📍 Lesson: [title] in [course] at timestamp 3m 42s"
    For an abuse in a review: "📍 Review by @[username] on course [title]"
    For a page crash: "📍 Page: /courses/abc123/lesson/def456 (full URL in details)"
    For a DOM element: "📍 Element: .lesson-content > .code-block (third code block on page)"
  Store this formatted string in ai_tags or as a computed field.
  Always show it in the admin bug detail view.

2.2 — ADMIN BUG TRACKER PAGE

  Route: /admin/bugs
  Add to admin sidebar navigation between "Security" and "Support":
    🐛 Bug Reports with a count badge (open bugs count)

  PAGE LAYOUT — three-panel design:

  LEFT PANEL (240px, filter sidebar):
    Search bar (full-text across title + description)
    Category filter: checkboxes [Bug] [Abuse] [Content] [Fraud] [Security] [Legal] [Performance] [Feature]
    Severity filter: colored pills [S1] [S2] [S3] [S4] [S5] — click to toggle
    Validity filter: [Valid] [Invalid] [Uncertain] [Duplicate]
    Status filter: [Pending] [Triaged] [In Progress] [Resolved] [Won't Fix]
    Date range picker
    [Clear All Filters] button

  CENTER PANEL (flex, bug list):
    Sort: Severity (default, S1 first) | Newest | Updated
    Bulk select checkbox column
    Each row:
      [Severity Badge: S1-S5 color] [Category Icon] [Title] [Reporter@role]
      [AI Confidence %] [Location snippet] [Time ago] [Status badge]
    S1 rows: pulsing red left border
    S2 rows: solid orange left border
    Hovering row: shows quick action buttons [Assign to Me] [Resolve] [Dismiss]

  RIGHT PANEL (400px, detail on row click):
    REPORT CONTENT:
      Title + category badge + severity badge + validity badge
      Full description in scrollable area
      Reproduction steps (numbered list if provided)

    EXACT LOCATION CARD:
      📍 icon + formatted location string
      [Open Page] button → navigates to the reported URL in new tab
      Video timestamp: "[3m 42s] into the video" + [Jump to Timestamp] button
      DOM selector: shown in monospace + [Copy Selector] button
      Screenshot: thumbnail preview + [View Full] button
      Browser info: OS, browser, viewport size

    AI ANALYSIS CARD:
      Category | Severity | Confidence: [N]%
      Validity: [badge] + reasoning text
      Recommended action: [text]
      Tags: [chip list]
      Duplicate of: [link to parent if duplicate]

    REPORTER CONTEXT:
      Reporter: name, role, account age, reports submitted this month
      Reported user (if any): name, role, verified, strikes

    ACTION BUTTONS:
      [✅ Mark Resolved] [❌ Won't Fix] [⬆️ Escalate Severity]
      [👤 Assign to Me] [🔗 Merge as Duplicate] [⚡ Issue Strike to Reporter/Reported]
      All actions: confirmation modal for destructive → execute → log to audit_logs

    AI DRAFT REPLY:
      Editable textarea pre-filled with ai_draft_reply
      [Send to Reporter] button → INSERT into notifications for the reporter
      [Discard Draft] button

    RESOLUTION NOTES:
      Private text area for admin notes (not shown to reporter)

    AUDIT TRAIL:
      Timeline of all actions on this report: timestamp + admin name + action

  METRICS CARDS (at top of page, above panels):
    Total Open: [N] | S1 Critical: [N] (red) | Resolved Today: [N] | Avg Resolution Time: [X]h
    Validity Rate: [N]% valid reports | Auto-resolved: [N]%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — SKILL: VIDEO LECTURE TRANSCRIPT + NOTES + PDF EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/lib/ai/agents/transcript-agent.ts
Skill name: 'transcript'
Credit cost: 2 credits to generate transcript + notes; 1 credit to download PDF

3.1 — TRANSCRIPTION (Web Speech API real-time OR post-hoc generation)

  METHOD A — REAL-TIME (while watching video):
    In lesson viewer: show [🎙 Transcribe] toggle button next to video player.
    On enable: start SpeechRecognition with continuous: true, interimResults: true.
    Capture segments: { start_secs: video.currentTime, text: transcript, is_final: boolean }
    Store segments in component state, flush to DB every 30 seconds:
      UPSERT video_transcripts: append new segments to transcript_segments JSONB array
    Show live transcript sidebar panel that scrolls with the video.
    Clicking a transcript line: seek video to that timestamp.

  METHOD B — POST-HOC GENERATION (for past lessons):
    Student opens a completed lesson → clicks [Generate Transcript from Notes]
    If lesson has text content: Groq generates a "spoken version" from the text
    If lesson has video but no audio access: show guidance to use Method A for future lessons
    Store result in video_transcripts table

  TRANSCRIPTION DISPLAY:
    Timestamp-anchored text: "00:45 — So when we talk about variables..."
    Clickable timestamps → seeks video to that point
    Search within transcript: highlight matching text
    Copy segment: click timestamp → shows [Copy this segment] option

3.2 — AI NOTES GENERATION (from transcript)

  After transcript is saved, student clicks [Generate Notes] or it auto-triggers on lesson complete:

  export async function generateLectureNotes(transcriptId: string, studentId: string): Promise<LectureNotes> {
    // 1. Fetch full transcript text + lesson metadata
    // 2. Build Groq prompt (see below)
    // 3. Parse structured response
    // 4. Save to lecture_notes table
    // 5. Also create/append to notebook_pages for this student + lesson
    // 6. Return notes object
  }

  GROQ NOTES PROMPT:
  System: "You are an expert academic note-taker. Create structured, comprehensive lecture notes.
  Return ONLY valid JSON: {
    'title': string,
    'summary': string (3-5 sentences, dense with key info),
    'key_points': string[] (8-15 most important takeaways),
    'key_terms': { 'term': 'definition' },
    'table_of_contents': [{ 'heading': string, 'timestamp_secs': number, 'summary': string }],
    'full_notes_md': string (complete markdown notes with ## sections, bullet points, code blocks)
  }
  Notes must be: comprehensive enough to replace re-watching the lecture,
  organized with clear hierarchy, include all important definitions,
  use markdown code blocks for any code mentioned."

  User: "Lecture title: [lesson.title]\nTranscript: [transcript_text]"

3.3 — PDF EXPORT

  Export options available throughout the platform. All use react-pdf.
  npm install @react-pdf/renderer (verify it's installed, install if missing)

  FILE: src/lib/pdf/generators/

  A) CHAT EXPORT PDF (src/lib/pdf/generators/chat-export.ts)
    Export any GNARA conversation as a PDF.
    Include: COGNARA logo, session date, student name, each message with role badge,
    code blocks formatted in monospace, analogy cards preserved as styled boxes,
    table of contents if session > 2000 words.
    API route: POST /api/pdf/chat-export → { session_id } → returns storage path

  B) LECTURE NOTES PDF (src/lib/pdf/generators/lecture-notes.ts)
    Export lecture_notes record as formatted PDF.
    Include: course + lesson title, date, student name, AI badge,
    table of contents with page numbers, key terms glossary appendix.
    API route: POST /api/pdf/lecture-notes → { notes_id }

  C) QUIZ RESULTS PDF (src/lib/pdf/generators/quiz-results.ts)
    Export graded_submissions record as formatted grade report.
    Include: student name, quiz title, date, letter grade (large), score,
    per-question breakdown with student answer / correct answer / AI feedback,
    performance radar chart approximated in text form,
    coach's note if any, "Powered by COGNARA" footer.
    API route: POST /api/pdf/quiz-results → { submission_id }

  D) GRADE REPORT PDF (src/lib/pdf/generators/grade-report.ts)
    Full semester-style grade report.
    Include: all courses enrolled, all quiz scores, letter grades, GPA calculation,
    attendance equivalent (lesson completion %), GNARA insights summary.
    API route: POST /api/pdf/grade-report → { student_id, course_ids? }

  PDF GENERATION PATTERN (use for all generators):
    1. Generate PDF document using @react-pdf/renderer renderToBuffer()
    2. Upload buffer to Supabase Storage: generated-pdfs/[type]/[userId]/[timestamp].pdf
    3. INSERT into generated_pdfs table
    4. Return signed URL (1 hour expiry)
    5. Client: show [⬇ Download] button with the signed URL

  DOWNLOAD BUTTONS placement:
    Chat export: [⬇ Export Chat as PDF] button at top of every agent conversation session
    Lecture notes: [⬇ Download Notes PDF] in lecture notes panel
    Quiz results: [⬇ Download Grade Report] on quiz results page
    Grade report: [⬇ Download Full Report] on student /progress page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — SKILL: PROFESSOR-STYLE QUIZ GRADING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/lib/ai/agents/grading-agent.ts
Skill name: 'grade_quiz'
Credit cost: 0 (grading is always free — it's a platform service)

4.1 — GRADE SCALE BUILDER (coach page)

  Route: /coach/grade-scales (new page — add to coach sidebar under "Quizzes")
  Button: [+ Create Grade Scale] in coach quiz builder header

  GRADE SCALE BUILDER UI:
    Scale name input
    Table with columns: [Letter Grade] [Min %] [Max %] [Grade Point] [Label]
    Default populated with standard scale (can be modified):
      A+ | 95-100 | 4.0 | Exceptional
      A  | 90-94  | 4.0 | Excellent
      A- | 87-89  | 3.7 | Very Good
      B+ | 83-86  | 3.3 | Good
      B  | 80-82  | 3.0 | Above Average
      B- | 77-79  | 2.7 | Average
      C+ | 73-76  | 2.3 | Below Average
      C  | 70-72  | 2.0 | Satisfactory
      C- | 67-69  | 1.7 | Needs Improvement
      D  | 60-66  | 1.0 | Marginal Pass
      F  | 0-59   | 0.0 | Fail
    [+ Add Grade] button to add custom rows
    [Set as Default] toggle
    [Save Scale] → POST /api/grade-scales
    Validation: ranges must not overlap, must cover 0-100 completely, no gaps

  ASSIGN SCALE TO QUIZ:
    In quiz builder (coach): dropdown "Grade Scale" → lists coach's saved scales
    Default: coach's default scale, or platform standard if none set

4.2 — ENHANCED AI GRADING PIPELINE

  File: src/lib/ai/agents/grading-agent.ts

  export async function gradeQuizAttempt(attemptId: string): Promise<GradedSubmission> {
    // 1. Fetch quiz_attempt + all quiz_answers + quiz + questions + question_options
    // 2. Fetch grade_scale assigned to this quiz (or coach's default)
    // 3. Grade each question by type:
    //    MCQ / True-False: exact match → 1.0 or 0.0
    //    Short text: Groq semantic grading (see prompt below)
    //    Code: Judge0 execution against test cases → pass/fail ratio
    // 4. Calculate raw_score = sum(points_earned), max_score = sum(points_possible)
    // 5. percentage = (raw_score / max_score) * 100
    // 6. Map percentage to letter_grade using grade_scale grades array
    // 7. Generate overall_feedback, strengths, areas_for_improvement
    // 8. INSERT into graded_submissions
    // 9. UPDATE quiz_attempts: score = percentage, passed = (letter >= passing_grade)
    // 10. INSERT notification to student: "Your quiz has been graded"
    // 11. Return graded_submission
  }

  GROQ TEXT/SHORT-ANSWER GRADING PROMPT:
  System: "You are an academic grader. Grade this student's answer.
  Return ONLY valid JSON: {
    'score': decimal 0.0-1.0 (1.0 = full credit, 0.5 = half credit, 0.0 = no credit),
    'feedback': string (1-2 sentences: what was right, what was missing),
    'key_concepts_present': string[] (concepts the student correctly identified),
    'key_concepts_missing': string[] (important concepts the student missed),
    'partial_credit_reason': string (why partial credit if 0 < score < 1)
  }
  Grade fairly. Award partial credit when the student shows understanding of core concepts
  even if their answer is incomplete or differently worded than the model answer."

  User: "Question: [question text]
  Model answer / rubric: [correct_answer from question]
  Explanation: [explanation from question]
  Student's answer: [student_answer]
  Points possible: [points]"

  GRADE REPORT CARD (rendered via GnaraResponseRenderer):
  After grading, display in a beautiful card:
  ┌─────────────────────────────────────────────────────┐
  │  GRADE REPORT: [Quiz Title]                        │
  │  Student: [Name] | Date: [date] | Course: [title] │
  ├─────────────────────────────────────────────────────┤
  │  FINAL GRADE: A-  (88%)  GPA: 3.7                 │
  │  Raw Score: 44/50 points                           │
  ├─────────────────────────────────────────────────────┤
  │  Question-by-question breakdown (table):           │
  │  Q  | Your Answer | Score | Feedback               │
  │  1  | ...         | 5/5   | ✅ Correct              │
  │  2  | ...         | 3/5   | ⚠️ Partial: missed...  │
  ├─────────────────────────────────────────────────────┤
  │  Strengths: [bullets]                              │
  │  Needs work: [bullets]                             │
  │  Recommended: [resource links]                     │
  └─────────────────────────────────────────────────────┘

4.3 — CLASS PERFORMANCE STATISTICS (coach view)

  On /coach/quizzes/[quizId]/results (new page):
    Overall class stats: avg score, median, highest, lowest, pass rate
    Grade distribution bar chart: count of students per letter grade (A+/A/B+/B etc.)
    Question difficulty analysis: per-question % of students who got it right
    Score histogram: distribution curve
    AI insight: "Question 4 was failed by 67% of students — consider revising or providing a hint"
    Individual student table: name, score, grade, submitted at, [View Full Report] per student

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — SKILL: SOLUTION SET GENERATOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/lib/ai/agents/solution-agent.ts
Skill name: 'solution_set'
Credit cost: 3 credits (for web search + Groq synthesis)

5.1 — GENERATION FROM QUIZ/ACTIVITY

  Triggered by coach clicking [Generate Solution Set] on any quiz in /coach/quizzes.

  PIPELINE:
    1. Fetch all questions for the quiz (text, options, correct answers, explanations)
    2. For each question needing a worked solution (type: code, text, calculation):
       a. Check if question has a detailed explanation already → use as base
       b. If not: call Groq to generate step-by-step solution
       c. If question involves external knowledge: trigger inline web search (see Section 6)
    3. For code questions: run the model answer through Judge0 to verify it executes
    4. Assemble solution_set object
    5. INSERT into solution_sets table (is_released = false by default)
    6. Coach reviews → clicks [Release to Students]
    7. On release: UPDATE is_released = true, released_at = NOW()
       INSERT notifications to all enrolled students: "Solution set available for [quiz]"

  GROQ SOLUTION PROMPT (per question):
  System: "You are a subject expert creating a detailed solution guide for students.
  For this question, provide a complete worked solution.
  Return ONLY valid JSON: {
    'solution_steps': string[] (numbered steps, each a complete sentence or code block),
    'final_answer': string (clear statement of the correct answer),
    'explanation': string (why this is correct, common mistakes to avoid),
    'alternative_approaches': string[] (other valid ways to solve this, if any),
    'difficulty_notes': string (what makes this question tricky),
    'related_concepts': string[] (concepts the student should review if they got this wrong),
    'references': [{ 'title': string, 'description': string }]
  }"

5.2 — INLINE WEB SEARCH FOR SOLUTIONS

  When generating solutions for questions that reference real-world data, formulas,
  or concepts that benefit from external sources:

  export async function searchForSolution(query: string): Promise<SearchResult[]> {
    // Use SerpAPI or similar (store key in env as SERP_API_KEY)
    // OR: use Groq's web search tool if available
    // Fallback: generate without search if API unavailable
    // Cache results in web_research_cache table (24h TTL)
    // Return: [{ url, title, snippet, relevance_score }]
  }

  The agent includes sources in the solution set's sources_cited JSONB array.
  Students can see "Sources consulted" section at bottom of solution card.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — SKILL: WEB RESEARCH AGENT (Manus-style, multi-step)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/lib/ai/agents/research-agent.ts
Skill name: 'research'
Credit cost: 3 credits per research session (covers up to 10 sub-searches)
Dependencies: Add to package.json — cheerio (HTML parsing), turndown (HTML→markdown)

6.1 — MULTI-STEP RESEARCH PIPELINE

  The research agent works in autonomous steps like Manus — it plans, searches,
  reads, evaluates, and synthesizes without the user needing to prompt each step.

  export async function runResearch(query: string, studentId: string, depth: 'quick'|'deep'): Promise<ResearchReport> {
    const steps: ResearchStep[] = []

    // STEP 1: PLAN (Groq reasons about the query)
    // Ask Groq: "Break this research query into 3-5 specific sub-questions.
    //   Return JSON: { sub_questions: string[], research_type: string, key_terms: string[] }"
    const plan = await planResearch(query)
    emitProgress('Planning research...', 10)

    // STEP 2: SEARCH (for each sub-question)
    const rawResults: SearchResult[] = []
    for (const subQ of plan.sub_questions) {
      const cacheKey = hash(subQ)
      const cached = await checkResearchCache(cacheKey)
      if (cached) { rawResults.push(...cached); continue }
      const results = await webSearch(subQ) // SerpAPI or Groq web search
      rawResults.push(...results)
      await cacheResults(cacheKey, results)
      emitProgress(`Searching: ${subQ}`, 10 + (step * 15))
    }

    // STEP 3: FETCH + PARSE (top 3 most relevant URLs)
    const rankedUrls = rankByRelevance(rawResults, query).slice(0, 3)
    const fetchedContent: FetchedPage[] = []
    for (const url of rankedUrls) {
      try {
        const html = await fetch(url).then(r => r.text())
        const md = htmlToMarkdown(html) // cheerio + turndown
        const excerpt = md.slice(0, 3000)  // first 3000 chars
        fetchedContent.push({ url, title: extractTitle(html), content: excerpt })
        emitProgress(`Reading: ${extractDomain(url)}`, 55)
      } catch { /* skip inaccessible URLs */ }
    }

    // STEP 4: VIDEO ANALYSIS (if query mentions videos or YouTube)
    if (query.toLowerCase().includes('video') || query.toLowerCase().includes('youtube')) {
      const videoResults = await searchVideos(query)
      // Extract video metadata: title, channel, description, duration
      // Attempt to get auto-generated transcript if available
      fetchedContent.push(...videoResults)
      emitProgress('Analyzing videos...', 70)
    }

    // STEP 5: SYNTHESIZE (Groq reads all gathered content)
    const synthesis = await synthesizeResearch(query, fetchedContent)
    emitProgress('Synthesizing findings...', 85)

    // STEP 6: SAVE + RETURN
    const report = await saveResearchReport(studentId, query, synthesis, fetchedContent)
    emitProgress('Complete', 100)
    return report
  }

  SYNTHESIS PROMPT (Groq, non-streaming for quality):
  System: "You are a research analyst. Synthesize the following sources into a
  comprehensive, accurate answer. Use the GnaraResponseRenderer format:
  - Start with a 2-3 sentence direct answer to the query
  - Use ## headers to organize findings
  - Include relevant code examples in code blocks where applicable
  - Use > 💡 Tip: boxes for important insights
  - End with a ## Sources section listing each source with its key contribution
  - Be specific: include numbers, dates, names from the sources
  - Flag any contradictions between sources
  - Never fabricate information not in the provided sources"

6.2 — WEBSITE CONTENT FETCHING + ANALYSIS

  For any URL the user pastes in the agent panel:
    Detect URL pattern in user message
    Auto-fetch the page content: fetch(url) → parse HTML with cheerio → convert to markdown
    Analyze content: Groq reads the markdown → generates summary + key points
    Show: "I've read [domain]. Here's what it says about your question:"
    Allow: "Can you compare what [url1] and [url2] say about X?" (multi-URL comparison)

6.3 — REAL-TIME DATA QUERIES

  For queries that need live data (prices, news, statistics, current events):
    Detect real-time keywords: "current", "latest", "today", "2024", "2025", "now", "recent"
    Trigger web search automatically without waiting for explicit research request
    Show "🔍 Searching the web for current information..." spinner
    After results: show [Sources] collapsible section under the answer

6.4 — RESEARCH REPORT PAGE

  Route: /research (new page in student sidebar)
  Button: in agent panel → [📄 View Past Research] link

  PAGE LAYOUT:
    Header: "Research Library" | [+ New Research] button
    Search: filter past research by query text
    Grid of research cards: query, date, source count, [View] [Export PDF] [Delete]
    Click to expand: full synthesis, sources list, sub-questions answered
    [Export as PDF] → generates research report PDF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — SKILL: EMAIL / NOTIFICATIONS / SCHEDULED TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Skill name: 'schedule' (creates scheduled_tasks records)
Credit cost: 0 (scheduling is always free)

7.1 — NATURAL LANGUAGE TASK CREATION

  User says anything like:
    "Remind me to review Chapter 3 tomorrow at 9am"
    "Send me a quiz reminder every Sunday at 7pm"
    "Email coach@example.com my grade report on Friday"
    "Notify me when my quiz is graded"
    "Schedule a study session reminder every day at 6pm for 2 weeks"

  GNARA extracts task from natural language via Groq:
  System: "Extract a scheduled task from this message. Return ONLY valid JSON: {
    'title': string,
    'type': 'email'|'notification'|'reminder'|'quiz_reminder'|'study_reminder'|'custom',
    'scheduled_at': ISO datetime string (infer from relative time like 'tomorrow at 9am'),
    'recurrence': 'once'|'daily'|'weekly'|'monthly',
    'recurrence_time': 'HH:MM'|null,
    'recurrence_day': number|null,
    'max_runs': number|null,
    'payload': { 'message'?: string, 'to'?: string, 'subject'?: string }
  }
  For relative times: use [CURRENT_DATETIME] as the reference point."

  User: "[CURRENT_DATETIME: 2026-05-29T14:30:00Z] User message: [message]"

  After parsing: INSERT into scheduled_tasks.
  Show confirmation: "✅ Scheduled: [title] — [formatted_datetime]"
  If recurring: "Repeats [daily/weekly] at [time]"

7.2 — TASK EXECUTION ENGINE

  File: src/lib/tasks/executor.ts
  Called by: service worker (public/sw.js) on periodicsync
  Also called by: setInterval(checkDueTasks, 60000) in client layout (fallback)

  export async function checkAndRunDueTasks(userId: string): Promise<void> {
    const { data: dueTasks } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10)

    for (const task of dueTasks ?? []) {
      await runTask(task)
    }
  }

  async function runTask(task: ScheduledTask): Promise<void> {
    await supabase.from('scheduled_tasks').update({ status: 'running', last_run_at: new Date() }).eq('id', task.id)
    try {
      switch (task.type) {
        case 'email':
          await sendEmailJS(task.payload)
          break
        case 'notification':
        case 'reminder':
        case 'study_reminder':
        case 'quiz_reminder':
          await showPushNotification(task.payload.message, task.payload.action_url)
          break
      }
      const updates: Partial<ScheduledTask> = { status: 'done', run_count: task.run_count + 1, last_run_at: new Date() }
      if (task.recurrence !== 'once') {
        updates.status = 'pending'
        updates.scheduled_at = computeNextRun(task)
        if (task.max_runs && task.run_count + 1 >= task.max_runs) updates.status = 'done'
      }
      await supabase.from('scheduled_tasks').update(updates).eq('id', task.id)
    } catch (e) {
      await supabase.from('scheduled_tasks').update({ status: 'failed', error_message: String(e) }).eq('id', task.id)
    }
  }

7.3 — SCHEDULED TASKS MANAGER PAGE

  Route: /settings/tasks (accessible from user settings and agent panel)
  Button: [📅 My Scheduled Tasks] in agent panel bottom bar + in user settings sidebar

  PAGE LAYOUT:
    Header: "Scheduled Tasks" | [+ Create Task] button (opens task builder modal)
    Filter tabs: [All] [Active] [Completed] [Failed]
    Task list table:
      Icon (type-based) | Title | Type | Next Run | Recurrence | Status | [Edit] [Cancel]
    Click task → expand to show full details + run history
    [+ Create Task] modal:
      Title, Type selector, Date/time picker, Recurrence options,
      Message/Email payload fields depending on type
      [Save Task] button

7.4 — EMAILJS INTEGRATION (complete setup)

  Install if missing: npm install @emailjs/browser
  Configuration stored in localStorage (from GNARA Settings):
    gnara_emailjs_public, gnara_emailjs_service, gnara_emailjs_template

  export async function sendEmailJS(payload: EmailPayload): Promise<void> {
    const publicKey = localStorage.getItem('gnara_emailjs_public')
    const serviceId = localStorage.getItem('gnara_emailjs_service')
    const templateId = localStorage.getItem('gnara_emailjs_template')
    if (!publicKey || !serviceId || !templateId) {
      throw new Error('EmailJS not configured. Go to GNARA Settings to add credentials.')
    }
    await emailjs.send(serviceId, templateId, {
      to_email: payload.to,
      subject: payload.subject,
      message: payload.body,
      from_name: 'COGNARA',
      ...payload.template_params
    }, publicKey)
  }

  In GNARA Settings modal: add EmailJS setup section:
    [Public Key] [Service ID] [Template ID] inputs
    [Send Test Email] button → sends a test to the user's registered email
    Setup guide link: "How to set up EmailJS (free, 200 emails/month)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — LIBRARY: QUIZ / ACTIVITY TAB (new tab in existing library page)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Route: /library (existing) — add new tab
Route: /library/activities/[id] (new — activity detail page)
Route: /library/activities/[id]/take (new — take activity/quiz page)
Add to coach sidebar: /coach/activities (manage activities)

8.1 — LIBRARY TABS UPGRADE

  CURRENT TABS: [Resources] [Free Courses]
  ADD TABS: [Quizzes & Activities] [Research]

  [Quizzes & Activities] tab content:
    Filter sidebar: Category, Difficulty, Type (Quiz/Assignment/Exercise/Project),
    Graded/Ungraded toggle, Duration range, Coach name
    Activity cards grid (same visual style as course cards):
      Type badge (Quiz/Assignment/Exercise), difficulty chip, estimated time,
      coach name + avatar, graded/ungraded indicator, due date if any,
      [Start] button for new attempts, [View Results] for completed,
      Completion count, Average score across all students

8.2 — ACTIVITY DETAIL PAGE (/library/activities/[id])

  Header: activity title, type, difficulty, estimated time, coach, description
  Instructions section (rendered as markdown)
  Attachments: downloadable files coach uploaded
  Grading info: "This activity is graded. Grade scale: [scale name]. Max attempts: [n]"
  [Start Activity] button → navigates to /library/activities/[id]/take
  My Submissions section: table of past attempts with grades

8.3 — TAKE ACTIVITY PAGE (/library/activities/[id]/take)

  If type = 'quiz': render the existing quiz attempt UI
  If type = 'assignment'/'exercise': render:
    Instructions panel (left, collapsible)
    Answer editor (right): TipTap rich text OR Monaco code editor depending on activity type
    File upload section for attachments
    Character count, word count
    [Save Draft] button (auto-saves every 60 seconds)
    [Submit] button → confirmation modal "Are you sure? [n] attempts remaining after this."
    On submit: INSERT activity_submissions → trigger grading pipeline

8.4 — COACH ACTIVITY MANAGER (/coach/activities)

  List of coach's activities with status, submission count, graded count
  [+ Create Activity] button → activity creation form:
    Title, type selector, instructions (TipTap editor),
    attach files (resource uploader), grade scale selector,
    course linkage (optional), due date, max attempts
    [Publish] / [Save Draft]
  Per activity: [View Submissions] → student submission list with grade status
  Per submission: view student's answer + [Grade Manually] or [AI Grade] button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — GRADED RESULTS PAGES (students, coaches, admins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9.1 — STUDENT GRADES PAGE (/grades — new page, add to student sidebar)

  Add to student sidebar between "Progress" and "Certificates":
    📊 Grades

  PAGE LAYOUT:
    GPA SUMMARY CARD (top):
      Overall GPA: [3.4] / 4.0
      Letter Grade: B+
      Total quizzes graded: [N]
      Pass rate: [N]%

    GRADE BOOK TABLE:
      Columns: Course | Quiz/Activity | Date | Score | Grade | Status | Actions
      Color-coded grade column: A/A+ = green, B = blue, C = yellow, D/F = red
      Sortable columns
      Filter by: Course, Date range, Grade range
      Each row: [View Report] button → opens graded_submissions detail modal

    GRADED SUBMISSION DETAIL MODAL:
      Full grade report card (same as generated by grading agent)
      Per-question breakdown table
      AI feedback per wrong answer
      [Download PDF] button
      [Ask GNARA to Explain Mistakes] button → triggers 'explain_mistake' skill

    CERTIFICATES SECTION (at bottom):
      Grid of earned certificates with [View] and [Download] and [Share on LinkedIn] buttons

9.2 — COACH GRADE BOOK (/coach/grades — new page)

  Add to coach sidebar under "Students":
    📋 Grade Book

  PAGE LAYOUT:
    Filter: [All Courses] [Course selector] | [All Quizzes/Activities] | Date range

    STUDENT TABLE:
      Columns: Student Name | Course | Quiz | Score | Grade | Submitted | Graded By | Actions
      [Grade] button for ungraded submissions
      [Override Grade] button for AI-graded submissions (coach can adjust)
      [View Full Report] button

    GRADE OVERRIDE MODAL:
      Shows AI grade + AI feedback
      [Override Score] number input (percentage)
      [Add Instructor Note] textarea
      [Save Override] button → UPDATE graded_submissions.instructor_override + instructor_note

    CLASS ANALYTICS TAB:
      Grade distribution chart per quiz
      Top performers, struggling students
      AI insight card (from coach analytics agent)

9.3 — ADMIN GRADES OVERVIEW (/admin/reports/grades)

  Accessible from admin sidebar Reports section.
  Platform-wide grade statistics:
    Total submissions graded: [N]
    AI graded vs manually graded breakdown
    Platform avg grade: [X]
    Coach-by-coach average student performance
    Courses with low pass rates (flagged for admin review)
  Exportable as CSV.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — MASTER-AGENT.TS UPDATES (route all new skills)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In master-agent.ts, add routing for ALL new skills.
Every new skill must be: defined in the skill enum, have a handler function,
have a credit cost entry, have RBAC permission (who can call it), have a timeout.

New skill additions to the router:
  'bug_eval'          → bugEvalAgent.evaluateReport() | cost: 0 | roles: all
  'transcript'        → transcriptAgent.generateTranscript() | cost: 2 | roles: student
  'lecture_notes'     → transcriptAgent.generateNotes() | cost: 2 | roles: student
  'grade_quiz'        → gradingAgent.gradeQuizAttempt() | cost: 0 | roles: all
  'solution_set'      → solutionAgent.generateSolutionSet() | cost: 3 | roles: coach, admin
  'research'          → researchAgent.runResearch() | cost: 3 | roles: all
  'schedule'          → scheduleAgent.createTask() | cost: 0 | roles: all
  'explain_mistake'   → gradingAgent.explainMistakes() | cost: 1 | roles: student
  'chat_pdf'          → pdfAgent.exportChatAsPDF() | cost: 1 | roles: all
  'report_bug'        → bugEvalAgent.submitReport() | cost: 0 | roles: all
  'web_fetch'         → researchAgent.fetchAndAnalyzeURL() | cost: 1 | roles: all
  'flashcards'        → (from previous prompt) | cost: 2 | roles: student
  'code_challenge'    → (from previous prompt) | cost: 2 | roles: student
  'socratic'          → (from previous prompt) | cost: 1 | roles: student
  'concept_map'       → (from previous prompt) | cost: 3 | roles: student

Update SKILL_ENUM in api/agent/jobs/route.ts to include all new skills.
Update RBAC in security.ts skill permissions map.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — AGENT PANEL UI UPDATES (all new skill buttons + wiring)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/components/agent/AgentPanel.tsx

11.1 — SKILL BUTTONS (replace current partial list with complete wired list)

  Organize skills into tabs within the agent panel:
  [Learn] [Create] [Research] [Tools]

  LEARN tab (student):
    [🧠 Teach Me] → skill: 'teach'
    [🐛 Debug Code] → skill: 'debug', pre-fills with editor content
    [📝 Explain Mistakes] → skill: 'explain_mistake', pre-fills with last quiz attempt
    [🃏 Flashcards] → skill: 'flashcards'
    [💬 Socratic Mode] → skill: 'socratic'
    [🗺️ Concept Map] → skill: 'concept_map'
    [🎙 Transcribe Lesson] → skill: 'transcript', triggers real-time transcription
    [📓 Generate Notes] → skill: 'lecture_notes', from current lesson transcript
    [📅 Study Planner] → skill: 'study_planner'

  CREATE tab (coach + student):
    [📄 PDF → Quiz] → skill: 'quiz', file upload trigger
    [💡 Solution Set] → skill: 'solution_set' (coach only, shows disabled state for students)
    [📊 Grade This Quiz] → skill: 'grade_quiz' (triggered from quiz results page)
    [📝 Generate Course] → skill: 'generate_course' (coach)
    [🔬 Summarize] → skill: 'summarize'

  RESEARCH tab:
    [🌐 Research Topic] → skill: 'research', opens query input
    [🔗 Analyze URL] → skill: 'web_fetch', paste URL input
    [📰 Current News] → skill: 'research', type: 'news'
    [🎬 Analyze Video] → skill: 'research', type: 'video'

  TOOLS tab:
    [📤 Export Chat PDF] → skill: 'chat_pdf', exports current session
    [📅 Schedule Reminder] → skill: 'schedule', opens natural language input
    [🐛 Report a Bug] → skill: 'report_bug', opens bug report modal
    [🗂️ My Tasks] → navigates to /settings/tasks
    [🔬 Progress Report] → skill: 'progress_report'
    [🎤 Voice Mode] → skill: 'voice'

  Every skill button:
    Shows credit cost badge (or "Free" if 0)
    Shows disabled state with tooltip if user lacks credits or wrong role
    On click: sets active skill → shows skill-specific input UI → submits to agent

11.2 — SKILL-SPECIFIC INPUT UIs (appear when skill is selected)

  research: input with "What do you want to research?" placeholder +
    [Quick] / [Deep] depth toggle + [Search] button

  transcript: shows "Start Transcribing" button → triggers Web Speech API

  report_bug: opens the full bug report modal (from Section 2.1)

  schedule: natural language input "e.g. Remind me to study tomorrow at 9am"

  chat_pdf: shows session selector (current session or pick from history) + [Export] button

  web_fetch: URL input field + [Fetch and Analyze] button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — SIDEBAR NAVIGATION UPDATES (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STUDENT SIDEBAR (add to existing):
  📊 Grades            → /grades (new)
  🔬 Research          → /research (new)
  📅 My Tasks          → /settings/tasks (new or move from settings)

COACH SIDEBAR (add to existing):
  📋 Grade Book        → /coach/grades (new)
  🎯 Activities        → /coach/activities (new)
  📈 Grade Scales      → /coach/grade-scales (new, under Quizzes section)

ADMIN SIDEBAR (add to existing):
  🐛 Bug Reports       → /admin/bugs (new, with count badge)
  📊 Grades Overview   → /admin/reports/grades (new, under Reports)

Every new sidebar item:
  Must have the route created and fully functional
  Must have a count badge where relevant (bugs: open count, grades: ungraded count)
  Must be responsive on mobile (collapses into mobile nav)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — API ROUTES (all new routes, fully implemented)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every route: auth → role → Zod → rate-limit → execute → audit-log → respond.
No route returns raw Supabase errors. Every error uses AppError with HTTP status code.

POST   /api/reports
  Auth: any authenticated user | Rate limit: 10/hour
  Body Zod: { category, title, description, page_url, page_route, dom_selector?,
    video_timestamp_secs?, lesson_id?, course_id?, screenshot_path?,
    browser_info?, reproduction_steps? }
  Action: INSERT bug_reports, queue bug_eval job
  Returns: { reportId }

GET    /api/reports (student: own; admin: all with filters)
  Query: ?status=&severity=&category=&page=&limit=
  Returns: paginated bug_reports

GET    /api/reports/:id
  Auth: reporter (own) or admin
  Returns: full bug_report with enriched context

PATCH  /api/reports/:id (admin: update status, severity, assign, resolve)
  Body: { status?, assigned_to?, resolution_note?, ai_severity_override? }
  All changes logged to audit_logs

POST   /api/transcripts
  Auth: student | Rate limit: 20/hour
  Body: { lesson_id, segments[], language?, source? }
  Action: INSERT or UPSERT video_transcripts

POST   /api/transcripts/:id/notes
  Auth: student | Rate limit: 10/hour
  Action: queue transcript→notes generation as agent_job
  Returns: { jobId }

GET    /api/transcripts/:id/notes
  Auth: student (own) | Returns: lecture_notes record

POST   /api/pdf/chat-export
  Auth: any authenticated user | Body: { session_id }
  Action: generate PDF → upload to storage → INSERT generated_pdfs → return signed URL

POST   /api/pdf/lecture-notes
  Auth: student | Body: { notes_id }
  Action: generate lecture notes PDF

POST   /api/pdf/quiz-results
  Auth: student | Body: { submission_id }
  Action: generate grade report PDF

POST   /api/pdf/grade-report
  Auth: student | Body: { student_id?, course_ids? }
  Action: generate full grade report PDF

POST   /api/grade-scales
  Auth: coach | Body: { name, grades[], is_default, passing_grade }
  Action: INSERT grade_scales

GET    /api/grade-scales
  Auth: any authenticated | Returns: coach's scales or all scales

PATCH  /api/grade-scales/:id
  Auth: coach (own) | Updates grade scale

DELETE /api/grade-scales/:id
  Auth: coach (own) | Soft delete (check no active quizzes using it)

POST   /api/grading/:attemptId
  Auth: coach (for their quiz) or system (triggered automatically)
  Action: run full grading pipeline → INSERT graded_submissions
  Returns: { submissionId, percentage, letter_grade }

PATCH  /api/grading/:submissionId/override
  Auth: coach (own course) | Body: { instructor_override, instructor_note }
  Action: UPDATE graded_submissions, recalculate letter_grade

POST   /api/solution-sets
  Auth: coach | Body: { quiz_id?, title, description? }
  Action: queue solution generation job → INSERT solution_sets (draft)

PATCH  /api/solution-sets/:id/release
  Auth: coach (own) | Action: is_released=true, notify enrolled students

GET    /api/solution-sets/:id
  Auth: coach (own) or enrolled student (if is_released=true)
  Returns: full solution set with solutions array

POST   /api/research
  Auth: authenticated | Rate limit: 10/hour
  Body: { query, depth? }
  Action: run research pipeline or return cached results
  Returns: { synthesis, sources, sub_questions_answered }

GET    /api/research
  Auth: user | Returns: user's research history from web_research_cache

POST   /api/tasks
  Auth: authenticated | Body: { title, type, payload, scheduled_at, recurrence?, recurrence_time?, max_runs? }
  Action: INSERT scheduled_tasks

GET    /api/tasks
  Auth: user | Returns: user's scheduled tasks

PATCH  /api/tasks/:id
  Auth: user (own) | Body: partial task update | Action: UPDATE

DELETE /api/tasks/:id (soft delete: status = 'cancelled')
  Auth: user (own)

POST   /api/activities
  Auth: coach | Body: full activity object | Action: INSERT library_activities

GET    /api/activities
  Auth: public (published only) or coach (own all)
  Query: ?type=&difficulty=&is_graded=&course_id=

POST   /api/activities/:id/submit
  Auth: student | Body: { content?, file_paths? }
  Action: INSERT activity_submissions, queue grading job
  Returns: { submissionId }

GET    /api/activities/:id/submissions
  Auth: coach (own activity) or student (own submission)
  Returns: submissions list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 14 — ADDITIONAL GOOD-TO-HAVE SKILLS (researched, production-worthy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are additional skills that elevate the platform above all competitors.
Build every one that doesn't already exist. Check scan results first.

14.1 — PLAGIARISM DETECTOR (2 credits)
  Student submits an essay or code → GNARA checks it.
  CODE: run through Groq similarity against known patterns + ask "does this look
    copied or AI-generated?" → return { plagiarism_risk: 'low'|'medium'|'high', evidence: string[] }
  TEXT: compare against lesson content (Groq semantic similarity) + web search for exact phrases
  Result: show a plagiarism report card with risk level and specific evidence
  Coach can trigger this on any activity submission.
  DB: add plagiarism_score DECIMAL(3,2) column to activity_submissions.

14.2 — AI INTERVIEW PREP (2 credits)
  Student says "prepare me for a technical interview on [topic]".
  GNARA runs a mock interview:
    Asks questions in the style of real technical interviews (LeetCode-style, behavioral)
    Student answers (text or voice)
    GNARA evaluates answer: technical accuracy, communication clarity, completeness
    After 5-10 questions: generates interview performance report
    Suggests specific topics to brush up on
  Skill: 'interview_prep'. Render in a dedicated full-screen interview mode.

14.3 — FORMULA SHEET GENERATOR (2 credits)
  Student asks "generate a formula sheet for [topic/chapter]".
  Groq reads lesson content → extracts all formulas, equations, definitions.
  Renders as a printable-style card layout:
    Formula | Name | When to use | Example
  Export as PDF via existing PDF generator.
  Saves to student notebook.

14.4 — REAL-TIME QUIZ HINTS (0.5 credits per hint, deducted as 1 after 2 hints)
  While student is taking a quiz (quiz attempt page):
    [💡 Get Hint] button on each question (limited: max 2 hints per question)
    GNARA reads the question + student's current answer attempt (if any)
    Returns: a hint that nudges toward the answer without giving it away
    Hint appears in a collapsible card below the question
    Credits deducted after second hint on same question.

14.5 — STUDY GROUP COORDINATOR (3 credits)
  Student asks "find people studying the same thing as me".
  GNARA reads: enrolled courses, current lesson, weak topics.
  Searches: other students with same enrollment + similar progress level.
  Suggests: students to invite to a peer session + pre-populates peer session creation form.
  Adds: "Study Buddy Matched" notification to matched students.
  Privacy: only matches students who have enabled "Study Group Matching" in settings.
  DB: add allow_study_group_matching BOOLEAN to user_settings.

14.6 — SMART BOOKMARKS WITH AI CONTEXT (free, passive)
  When student bookmarks any lesson position (from Section 7 of previous prompt):
  GNARA automatically adds context to the bookmark:
    Reads the surrounding lesson content
    Generates a 1-sentence "context note": "You bookmarked here: understanding base cases in recursion"
    Suggests a follow-up question: "When you return, try answering: What's the difference between base case and recursive case?"
  Student sees this context when they return to the bookmark.

14.7 — VOICE-TO-QUIZ (3 credits)
  Student or coach records a voice explanation of a concept.
  GNARA transcribes it (Web Speech API).
  Then generates a quiz FROM the transcription:
    "You explained X, Y, Z concepts. I've created questions to test your understanding."
  Useful for: coach can record a quick explanation → auto-generate a follow-up quiz.
  DB: source type 'voice_recording' in quizzes.is_ai_generated.

14.8 — COGNITIVE LOAD DETECTOR (free, passive, coach-facing)
  Tracks: per-lesson time spent vs estimated_mins ratio.
  If student spends 3x the estimated time on a lesson: flag in coach analytics.
  Generates coach insight: "Students are spending significantly more time than expected
    on Lesson 3.4 — this may indicate the content is too dense or unclear."
  Also: if multiple students get stuck at the same point in a video (same timestamp range):
    Flag as "Common difficulty point" in coach analytics with the timestamp.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 15 — ZOD VALIDATION SCHEMAS FOR ALL NEW ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/lib/validation/schemas/enhanced-skills.schema.ts

export const createReportSchema = z.object({
  category: z.enum(['bug','abuse','content','fraud','security','legal','performance','feature_request']),
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(5000),
  page_url: z.string().url().optional(),
  page_route: z.string().max(500).optional(),
  dom_selector: z.string().max(500).optional(),
  video_timestamp_secs: z.number().int().min(0).optional(),
  lesson_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  screenshot_path: z.string().max(500).optional(),
  browser_info: z.object({ userAgent: z.string(), viewport: z.object({ w: z.number(), h: z.number() }) }).optional(),
  reproduction_steps: z.string().max(2000).optional(),
}).strict()

export const createGradeScaleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  is_default: z.boolean().default(false),
  passing_grade: z.string().max(3).default('D'),
  grades: z.array(z.object({
    letter: z.string().max(3),
    min_pct: z.number().min(0).max(100),
    max_pct: z.number().min(0).max(100),
    grade_point: z.number().min(0).max(4).multipleOf(0.1),
    label: z.string().max(50),
  })).min(2).max(15),
}).strict().refine(data => {
  const sorted = [...data.grades].sort((a,b) => a.min_pct - b.min_pct)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min_pct !== sorted[i-1].max_pct + 1) return false
  }
  return sorted[0].min_pct === 0 && sorted[sorted.length-1].max_pct === 100
}, { message: 'Grade ranges must cover 0-100 with no gaps or overlaps' })

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  type: z.enum(['email','notification','reminder','quiz_reminder','study_reminder','deadline_alert','weekly_report','custom']),
  payload: z.record(z.unknown()),
  scheduled_at: z.string().datetime(),
  recurrence: z.enum(['once','daily','weekly','monthly']).default('once'),
  recurrence_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  recurrence_day: z.number().int().min(0).max(31).optional(),
  max_runs: z.number().int().min(1).optional(),
}).strict()

export const researchSchema = z.object({
  query: z.string().trim().min(3).max(500),
  depth: z.enum(['quick','deep']).default('quick'),
}).strict()

export const createTranscriptSchema = z.object({
  lesson_id: z.string().uuid(),
  transcript_text: z.string().min(10),
  segments: z.array(z.object({
    start_secs: z.number().min(0),
    end_secs: z.number().min(0),
    text: z.string(),
    is_final: z.boolean(),
  })).optional(),
  language: z.string().length(2).default('en'),
  source: z.enum(['web_speech','whisper','upload','manual']).default('web_speech'),
}).strict()

export const gradeOverrideSchema = z.object({
  instructor_override: z.number().min(0).max(100).optional(),
  instructor_note: z.string().trim().max(1000).optional(),
}).strict().refine(d => d.instructor_override !== undefined || d.instructor_note !== undefined,
  { message: 'Must provide at least a score override or instructor note' })

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 16 — ABSOLUTE TECHNICAL NON-NEGOTIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.  SCAN FIRST. Read every file listed in Section 0 before writing any code.
    The scan is mandatory, not optional documentation. Produce the status summary.

2.  MIGRATIONS BEFORE CODE. Run Section 1 SQL completely before touching any .ts file.
    Verify every new table exists in Supabase before referencing it in application code.

3.  NO STUB BUTTONS. Every button in the new UI must call a real function.
    If a skill is not yet implemented: show a [Coming Soon] disabled state with a tooltip,
    NEVER a button that silently does nothing or throws an unhandled error.

4.  BUG REPORT LOCATION DATA. The exact location capture (URL, route, DOM selector,
    video timestamp) is not optional. It is the most valuable part of the bug report.
    Auto-capture it silently. Show it in the modal (editable). Always save it.

5.  GRADE SCALE VALIDATION. Grade ranges MUST cover 0-100 completely with no gaps.
    Enforce this in Zod schema AND in the UI (live validation as coach types).

6.  PDF GENERATION. Every generated PDF must: have COGNARA branding (logo + footer),
    proper typography (DM Sans headings, clear body text), page numbers, and a creation date.
    Never generate a blank or mostly-empty PDF — if data is insufficient, show a clear error.

7.  RESEARCH CACHING. All web research results must be cached in web_research_cache
    for 24 hours. Never hit the search API twice for the same query in 24 hours.
    Cache key: SHA-256 hash of normalized (lowercase, trimmed) query string.

8.  TRANSCRIPT SEGMENTS. Transcripts must store timestamped segments, not just raw text.
    The segments array is what enables "click to seek" behavior. Without segments,
    the transcript is much less useful. Always capture start_secs per segment.

9.  GRADING IS AUTOMATIC. When a student submits a quiz attempt, grading must trigger
    automatically (as a background job) without the student or coach doing anything.
    Notification to student when grading is complete. No manual "grade this" step for
    MCQ/true-false questions — those grade instantly and synchronously.

10. SOLUTION SETS ARE COACH-CONTROLLED. Coaches must explicitly release a solution set
    before students can see it. Default is always is_released = false.
    Students who have not attempted the quiz should not see the solution set
    even if it is released — verify this in the RLS policy and API route.

11. BUG REPORT ABUSE PREVENTION. The report system itself must be protected:
    Rate limit: 10 reports per hour per user.
    Validity check: AI marks invalid reports → if a user has 5+ invalid reports in 30 days,
    auto-create a security_event: "Report system abuse suspected" + flag for admin review.

12. ADMIN BUG PAGE MUST BE REAL. /admin/bugs is not a placeholder page. It must show
    real data from bug_reports table. The three-panel layout from Section 2.2 must be built.
    Every action button (Resolve, Assign, Escalate) must do real database updates.

13. RBAC ON ALL NEW ROUTES. Verify security.ts has permission entries for every new skill.
    Coach-only skills (solution_set, grade_quiz override): reject student calls with 403.
    Admin-only views (bug report full details, grade overview): reject non-admin with 404.

14. LIBRARY QUIZ/ACTIVITY TAB IS A REAL TAB. Not a future feature. Not a disabled button.
    The [Quizzes & Activities] tab in /library must show real data from library_activities.
    Build the full tab with its filter sidebar, activity cards, and navigation to detail page.

15. TYPESCRIPT. 0 errors. Run tsc --noEmit after all changes. Fix every error.
    Every new function has explicit return types. No implicit any. No @ts-ignore.

16. ALL PAGES HAVE LOADING + EMPTY + ERROR STATES. Every new page that fetches data
    must have: animate-pulse skeleton loading, designed empty state with CTA, error card with retry.

17. MOBILE RESPONSIVE. Every new page must work at 375px viewport width.
    Three-panel layouts (like admin bug tracker): collapse to single-panel with tab navigation on mobile.

18. SIDEBAR LINKS ARE WIRED. Every new sidebar item added in Section 12 must have
    the route created, the page built, and the link actually navigating to it.
    No sidebar link that 404s. No sidebar link that navigates to a blank page.

19. AUDIT LOGGING. Every action in the admin bug tracker (resolve, assign, escalate, override)
    must log to audit_logs. Every PDF generation must log. Every grading action must log.
    Never skip audit logging for admin actions.

20. TEST THE CRITICAL PATH. After implementation, verify these flows work end-to-end:
    □ Student reports a bug → AI evaluates it → admin sees it in /admin/bugs with severity badge
    □ Student watches lesson → transcribes → generates notes → downloads PDF
    □ Student submits quiz → gets automatically graded → sees grade report with letter grade
    □ Coach creates solution set → releases it → student sees it after completing quiz
    □ Student researches a topic → GNARA fetches web content → synthesizes → shows citations
    □ Student schedules a reminder → notification fires at the right time
    □ Library Quizzes & Activities tab shows activities → student can take one → gets graded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF PROMPT — COGNARA ENHANCED SKILLS: COMPLETE PRODUCTION-READY SPEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━