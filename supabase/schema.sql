-- ─────────────────────────────────────────────────────────────
-- makeawish — Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────


-- ─── TABLES ──────────────────────────────────────────────────

-- Users / Birthday profiles
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  city        TEXT,
  birth_month INTEGER     NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day   INTEGER     NOT NULL CHECK (birth_day   BETWEEN 1 AND 31),
  bio         TEXT,
  vibe        TEXT,
  notif_pref  TEXT        DEFAULT 'link' CHECK (notif_pref IN ('email', 'link')),
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Birthday wishes
CREATE TABLE IF NOT EXISTS public.wishes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name  TEXT,                   -- name if sent by a guest (non-auth)
  is_anonymous BOOLEAN     NOT NULL DEFAULT FALSE,
  text         TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  is_loved     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Replies to wishes (from the birthday person)
CREATE TABLE IF NOT EXISTS public.replies (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id    UUID        NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  from_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (wish_id, from_id)   -- one reply per wish from the birthday person
);


-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_birth      ON public.users(birth_month, birth_day);
CREATE INDEX IF NOT EXISTS idx_users_slug       ON public.users(slug);
CREATE INDEX IF NOT EXISTS idx_wishes_recipient ON public.wishes(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_sender    ON public.wishes(sender_id);
CREATE INDEX IF NOT EXISTS idx_replies_wish     ON public.replies(wish_id);


-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- USERS policies
-- Anyone can read any birthday profile (public directory)
CREATE POLICY "users: public read"
  ON public.users FOR SELECT
  USING (true);

-- Only the user themselves can insert their own profile
CREATE POLICY "users: own insert"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Only the user themselves can update their own profile
CREATE POLICY "users: own update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- WISHES policies
-- Anyone can read wishes (public wall)
CREATE POLICY "wishes: public read"
  ON public.wishes FOR SELECT
  USING (true);

-- Anyone can send a wish — authenticated users can optionally attach their id
-- Unauthenticated (anon) inserts also allowed (is_anonymous=true, sender_id=null)
CREATE POLICY "wishes: anyone can send"
  ON public.wishes FOR INSERT
  WITH CHECK (true);

-- Only the recipient can update their wishes (toggle is_loved)
CREATE POLICY "wishes: recipient can love"
  ON public.wishes FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- REPLIES policies
-- Anyone can read replies
CREATE POLICY "replies: public read"
  ON public.replies FOR SELECT
  USING (true);

-- Only the birthday person (wish recipient) can add a reply
CREATE POLICY "replies: recipient can reply"
  ON public.replies FOR INSERT
  WITH CHECK (
    auth.uid() = from_id
    AND EXISTS (
      SELECT 1 FROM public.wishes w
      WHERE w.id = wish_id
        AND w.recipient_id = auth.uid()
    )
  );


-- ─── HELPER VIEWS ────────────────────────────────────────────

-- Users with wish counts (useful for the feed)
CREATE OR REPLACE VIEW public.users_with_counts AS
SELECT
  u.*,
  COALESCE(COUNT(w.id), 0)::INTEGER AS wish_count
FROM public.users u
LEFT JOIN public.wishes w ON w.recipient_id = u.id
GROUP BY u.id;

-- Grant access to the view
GRANT SELECT ON public.users_with_counts TO anon, authenticated;


-- ─── HELPER FUNCTIONS ────────────────────────────────────────

-- Get users celebrating on a given month + day (for the feed)
CREATE OR REPLACE FUNCTION public.get_birthday_feed(p_month INTEGER, p_day INTEGER)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  slug        TEXT,
  city        TEXT,
  birth_month INTEGER,
  birth_day   INTEGER,
  bio         TEXT,
  vibe        TEXT,
  created_at  TIMESTAMPTZ,
  wish_count  BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    u.id, u.name, u.slug, u.city, u.birth_month, u.birth_day, u.bio, u.vibe, u.created_at,
    COUNT(w.id) AS wish_count
  FROM public.users u
  LEFT JOIN public.wishes w ON w.recipient_id = u.id
  WHERE u.birth_month = p_month AND u.birth_day = p_day
  GROUP BY u.id
  ORDER BY wish_count DESC, u.created_at ASC;
$$;


-- ─── REALTIME ────────────────────────────────────────────────
-- Enable realtime for wishes (so the feed updates live when someone sends a wish)
-- Run this in Supabase Dashboard → Database → Replication
-- OR uncomment and run here:

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.wishes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;


-- ─── SAMPLE DATA (optional, for testing) ─────────────────────
-- Note: These require real auth user IDs. Use Supabase Auth to create test users first,
-- then replace the UUIDs below.

-- Example birthday person entry (replace UUID with real auth user ID):
-- INSERT INTO public.users (id, name, slug, city, birth_month, birth_day, bio, vibe)
-- VALUES ('your-auth-user-uuid', 'Riya K.', 'riya-k', 'Pune', 5, 22, 'a reader, a runner, and a terrible cook', '🌿 Calm and reflective');

-- Example wish:
-- INSERT INTO public.wishes (recipient_id, sender_name, is_anonymous, text)
-- VALUES ('your-auth-user-uuid', 'A stranger', false, 'Wishing you a year full of the exact kind of joy that sneaks up on you.');
