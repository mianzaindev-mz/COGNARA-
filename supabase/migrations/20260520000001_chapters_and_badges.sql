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
