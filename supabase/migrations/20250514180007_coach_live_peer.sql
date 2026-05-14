-- Coach verification, live classes, peer sessions

CREATE TABLE public.coach_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','approved','rejected','appealing')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES public.profiles(id),
  ai_confidence_score INT CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_notes TEXT,
  rejection_reason TEXT,
  appeal_text TEXT,
  appeal_submitted_at TIMESTAMPTZ
);

CREATE TABLE public.coach_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.coach_applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('degree','certificate','govt_id','linkedin','github','other')),
  storage_path TEXT NOT NULL,
  filename TEXT,
  ai_verified BOOLEAN,
  ai_result JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_mins INT DEFAULT 60,
  daily_room_url TEXT,
  daily_room_name TEXT,
  recording_url TEXT,
  price_usd DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0),
  is_free BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  max_students INT DEFAULT 50,
  waitlist_count INT DEFAULT 0,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','ended','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.live_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  ticket_purchased BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  UNIQUE(session_id, student_id)
);

CREATE TABLE public.peer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  course_ref_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_mins INT DEFAULT 60,
  max_students INT DEFAULT 10,
  price_usd DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0 AND price_usd <= 8.00),
  is_free BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  daily_room_url TEXT,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','ended','cancelled')),
  host_confirmed_student BOOLEAN NOT NULL DEFAULT false,
  host_confirmed_unverified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.peer_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.peer_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  disclaimer_confirmed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ,
  stripe_payment_id TEXT,
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_peer_sessions_host ON public.peer_sessions(host_id);
