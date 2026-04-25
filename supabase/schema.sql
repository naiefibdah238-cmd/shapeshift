-- Shape.shift — Supabase schema
-- Run this in the Supabase SQL editor after creating your project

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL DEFAULT 'My hybrid week',
  inputs           JSONB NOT NULL,
  schedule         JSONB NOT NULL,
  programming_notes TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row-level security: users can only touch their own plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS plans_user_id_created_at
  ON plans (user_id, created_at DESC);
