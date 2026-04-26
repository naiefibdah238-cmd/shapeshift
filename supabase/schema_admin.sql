-- Shape.shift — Admin schema extension
-- Run this in the Supabase SQL editor AFTER the main schema.sql

-- Profiles table: stores per-user flags (admin status, etc.)
CREATE TABLE IF NOT EXISTS profiles (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Each user can read their own profile (NavBar uses this to show/hide Admin link)
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Set yourself as admin
-- Go to Supabase Dashboard → Authentication → Users
-- Copy your user UUID, paste it below, then run just this block:
-- ─────────────────────────────────────────────────────────────
--
-- INSERT INTO profiles (user_id, is_admin)
-- VALUES ('PASTE_YOUR_USER_UUID_HERE', TRUE)
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = TRUE;
