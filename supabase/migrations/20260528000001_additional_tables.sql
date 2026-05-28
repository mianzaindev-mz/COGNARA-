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
