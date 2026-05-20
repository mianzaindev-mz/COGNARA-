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
