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
