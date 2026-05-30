-- Add quiz scheduling and code question support

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;