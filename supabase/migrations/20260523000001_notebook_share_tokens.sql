CREATE TABLE IF NOT EXISTS public.notebook_share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES public.notebook_pages(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'private_link' CHECK (visibility IN ('private_link', 'enrolled_only', 'public_link')),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notebook_share_tokens_token
  ON public.notebook_share_tokens(token)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notebook_share_tokens_page
  ON public.notebook_share_tokens(page_id, created_at DESC);

ALTER TABLE public.notebook_share_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notebook_share_tokens_owner_select ON public.notebook_share_tokens;
CREATE POLICY notebook_share_tokens_owner_select
  ON public.notebook_share_tokens FOR SELECT
  USING (created_by = auth.uid() OR cognara_is_admin());

DROP POLICY IF EXISTS notebook_share_tokens_owner_insert ON public.notebook_share_tokens;
CREATE POLICY notebook_share_tokens_owner_insert
  ON public.notebook_share_tokens FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notebook_pages p
      JOIN public.notebooks n ON n.id = p.notebook_id
      WHERE p.id = page_id
        AND n.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS notebook_share_tokens_owner_update ON public.notebook_share_tokens;
CREATE POLICY notebook_share_tokens_owner_update
  ON public.notebook_share_tokens FOR UPDATE
  USING (created_by = auth.uid() OR cognara_is_admin())
  WITH CHECK (created_by = auth.uid() OR cognara_is_admin());
