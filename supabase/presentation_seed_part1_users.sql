-- ================================================================
-- COGNARA Presentation Demo - Part 1: User Accounts
-- Run in Supabase SQL Editor
-- Credentials tailored specifically to your preference!
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Helper function to safely insert auth.users with custom passwords
CREATE OR REPLACE FUNCTION public.seed_demo_user(
  p_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    p_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 2. Seed auth.users entries
-- Custom credentials as requested:
SELECT public.seed_demo_user('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'admin@cognara.dev', 'admin@123', 'Admin', 'admin');
SELECT public.seed_demo_user('cccccccc-cccc-cccc-cccc-cccccccccc01', 'zainworks67@gmail.com', 'Z@in123', 'Muhammad Zain', 'coach');
SELECT public.seed_demo_user('dddddddd-dddd-dddd-dddd-dddddddddd01', 'danownz2005@gmail.com', 'D@ni123', 'Daniyal Ahmad', 'student');

-- Additional seed accounts to populate dashboard views:
SELECT public.seed_demo_user('cccccccc-cccc-cccc-cccc-cccccccccc02', 'james.miller@cognara.dev', 'Demo@1234', 'James Miller', 'coach');
SELECT public.seed_demo_user('cccccccc-cccc-cccc-cccc-cccccccccc03', 'priya.sharma@cognara.dev', 'Demo@1234', 'Dr. Priya Sharma', 'coach');
SELECT public.seed_demo_user('dddddddd-dddd-dddd-dddd-dddddddddd02', 'maria.garcia@student.edu', 'Demo@1234', 'Maria Garcia', 'student');
SELECT public.seed_demo_user('dddddddd-dddd-dddd-dddd-dddddddddd03', 'kai.tanaka@student.edu', 'Demo@1234', 'Kai Tanaka', 'student');
SELECT public.seed_demo_user('dddddddd-dddd-dddd-dddd-dddddddddd04', 'emma.wilson@student.edu', 'Demo@1234', 'Emma Wilson', 'student');
SELECT public.seed_demo_user('dddddddd-dddd-dddd-dddd-dddddddddd05', 'omar.hassan@student.edu', 'Demo@1234', 'Omar Hassan', 'student');

-- Drop the helper function
DROP FUNCTION public.seed_demo_user(UUID, TEXT, TEXT, TEXT, TEXT);

-- 3. Update Profiles with metadata (Bios, Avatars, etc.)
-- Admin Profile (Admin)
UPDATE public.profiles
SET
  full_name = 'Admin',
  username = 'admin',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  bio = 'Founder & Lead Architect of COGNARA. Systems engineer and AI enthusiast.',
  github_url = 'https://github.com/mianzaindev',
  linkedin_url = 'https://linkedin.com/in/zainwajahat',
  is_verified = true
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001';

-- Coach 1 Profile (Muhammad Zain)
UPDATE public.profiles
SET
  full_name = 'Muhammad Zain',
  username = 'muhammad_zain',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zain',
  bio = 'Lead Web Engineering Instructor at COGNARA. Senior engineer specializing in system architectures, Next.js, and cloud integrations.',
  github_url = 'https://github.com/mianzaindev',
  linkedin_url = 'https://linkedin.com/in/zainwajahat',
  is_verified = true
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc01';

-- Coach 2 Profile
UPDATE public.profiles
SET
  username = 'james_miller',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  bio = 'Full Stack Web Developer & Educator. Formerly engineer at Netflix. Specialist in modern front-end architectures (React, Next.js, WebGL).',
  github_url = 'https://github.com/jmiller-web',
  linkedin_url = 'https://linkedin.com/in/jamesmiller-web',
  is_verified = true
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc02';

-- Coach 3 Profile
UPDATE public.profiles
SET
  username = 'priya_sharma',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  bio = 'AI/ML Researcher and consultant. Ph.D. in Deep Learning from Stanford. Former Principal Scientist at OpenAI.',
  github_url = 'https://github.com/priya-ml',
  linkedin_url = 'https://linkedin.com/in/dr-priya-sharma',
  is_verified = true
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';

-- Student 1 Profile (Daniyal Ahmad)
UPDATE public.profiles
SET
  full_name = 'Daniyal Ahmad',
  username = 'daniyal_a',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniyal',
  bio = 'Computer Science undergraduate. Enthusiastic about full-stack engineering, interactive apps, and AI agents.',
  github_url = 'https://github.com/danownz'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd01';

-- Student 2 Profile
UPDATE public.profiles
SET
  username = 'maria_g',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  bio = 'Data Science undergraduate major. Enthusiastic about Neural Networks, Data Visualization, and PyTorch.',
  github_url = 'https://github.com/maria-ds'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd02';

-- Student 3 Profile
UPDATE public.profiles
SET
  username = 'kai_t',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai',
  bio = 'Self-taught developer looking for full-stack opportunities. Loving JavaScript, Tailwind, and React.',
  github_url = 'https://github.com/kai-dev-jp'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd03';

-- Student 4 Profile
UPDATE public.profiles
SET
  username = 'emma_w',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  bio = 'Aspiring designer and coder. Just getting started on my tech journey!',
  strike_count = 1,
  ban_reason = 'Warned once for spam messaging in peer session chat.'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd04';

-- Student 5 Profile
UPDATE public.profiles
SET
  username = 'omar_h',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
  bio = 'Cybersecurity student. Focused on penetration testing, threat hunting, and secure coding practices.',
  github_url = 'https://github.com/omar-security'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd05';


-- 4. Update User Settings
UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001';
UPDATE public.user_settings SET theme = 'light', onboarding_complete = true WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccc01';
UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccc02';
UPDATE public.user_settings SET theme = 'system', onboarding_complete = true WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';
UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01';
UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd02';
UPDATE public.user_settings SET theme = 'light', onboarding_complete = true WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd03';
UPDATE public.user_settings SET theme = 'light', onboarding_complete = true WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd04';
UPDATE public.user_settings SET theme = 'dark', onboarding_complete = true WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd05';


-- 5. Update/Ensure AI Credits
UPDATE public.ai_credits SET balance = 500 WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001';
UPDATE public.ai_credits SET balance = 200 WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccc01';
UPDATE public.ai_credits SET balance = 200 WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccc02';
UPDATE public.ai_credits SET balance = 200 WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';
UPDATE public.ai_credits SET balance = 50 WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd01';
UPDATE public.ai_credits SET balance = 80 WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd02';
UPDATE public.ai_credits SET balance = 40 WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd03';
UPDATE public.ai_credits SET balance = 15 WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd04';
UPDATE public.ai_credits SET balance = 120 WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddd05';
