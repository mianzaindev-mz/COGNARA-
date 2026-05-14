-- AI agent, voice, reviews

CREATE TABLE public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL CHECK (skill IN ('teach','debug','quiz','voice','path','support','verify','coach')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content TEXT NOT NULL,
  tool_name TEXT,
  tool_result JSONB,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  learning_style TEXT CHECK (learning_style IN ('visual','auditory','reading','kinesthetic','unknown')),
  preferred_language TEXT DEFAULT 'en',
  total_sessions INT DEFAULT 0,
  last_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcript TEXT,
  agent_response TEXT,
  duration_secs INT,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('course','peer_session','resource')),
  target_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rating_content INT CHECK (rating_content BETWEEN 1 AND 5),
  rating_clarity INT CHECK (rating_clarity BETWEEN 1 AND 5),
  rating_responsiveness INT CHECK (rating_responsiveness BETWEEN 1 AND 5),
  rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
  review_text TEXT CHECK (review_text IS NULL OR LENGTH(review_text) >= 30),
  coach_reply TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  completion_pct_at_review INT,
  is_peer_content BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, target_type, target_id)
);

CREATE INDEX idx_agent_messages_session ON public.agent_messages(session_id, created_at);
CREATE INDEX idx_agent_memory_student ON public.agent_memory(student_id);
CREATE INDEX idx_reviews_target ON public.reviews(target_type, target_id);
