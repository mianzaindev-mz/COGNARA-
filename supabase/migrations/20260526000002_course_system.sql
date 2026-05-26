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
