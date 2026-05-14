-- COGNARA - core identity: profiles, settings, onboarding + auth.users trigger

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','coach','admin')),
  full_name TEXT,
  username TEXT UNIQUE CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,30}$'),
  avatar_url TEXT,
  bio TEXT CHECK (bio IS NULL OR LENGTH(bio) <= 500),
  github_url TEXT,
  linkedin_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  strike_count INT DEFAULT 0 CHECK (strike_count BETWEEN 0 AND 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  notifications_email BOOLEAN DEFAULT true,
  notifications_push BOOLEAN DEFAULT true,
  notifications_quiet_start TIME DEFAULT '23:00',
  notifications_quiet_end TIME DEFAULT '07:00',
  digest_mode BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small','medium','large','xlarge')),
  accessibility_mode BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  cookie_essential BOOLEAN DEFAULT true,
  cookie_analytics BOOLEAN DEFAULT false,
  cookie_functional BOOLEAN DEFAULT false,
  cookie_marketing BOOLEAN DEFAULT false,
  cookie_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  steps_completed TEXT[] DEFAULT '{}',
  finished_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF r NOT IN ('student', 'coach') THEN
    r := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    r
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_username ON public.profiles(username);
