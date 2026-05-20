-- Add quiz scheduling and code question support

ALTER TABLE public.quizzes
  ADD COLUMN available_from TIMESTAMPTZ,
  ADD COLUMN available_until TIMESTAMPTZ;

ALTER TABLE public.questions
  ADD COLUMN code_starter TEXT;