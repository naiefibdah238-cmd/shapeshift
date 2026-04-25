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

-- Food log
CREATE TABLE IF NOT EXISTS food_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL,
  meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snacks')),
  food_name   TEXT NOT NULL,
  calories    INTEGER NOT NULL DEFAULT 0,
  protein_g   NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g     NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g       NUMERIC(6,1) NOT NULL DEFAULT 0,
  grams       NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food log"
  ON food_log FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS food_log_user_date
  ON food_log (user_id, logged_date DESC);

-- Nutrition targets (one row per user)
CREATE TABLE IF NOT EXISTS nutrition_targets (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  calories   INTEGER NOT NULL DEFAULT 2500,
  protein_g  INTEGER NOT NULL DEFAULT 180,
  carbs_g    INTEGER NOT NULL DEFAULT 250,
  fat_g      INTEGER NOT NULL DEFAULT 80,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nutrition targets"
  ON nutrition_targets FOR ALL
  USING (auth.uid() = user_id);
