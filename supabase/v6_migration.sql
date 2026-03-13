-- ============================================
-- SuppSync V6 Database Migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Public Profiles (extend existing profiles table)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Follow System
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 3. Activity Feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Community Protocols (extend existing protocols table)
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS is_community BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;

-- 5. Workouts
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  name TEXT,
  duration_min INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Streak Recovery
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freezes INT DEFAULT 2;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freeze_used_dates DATE[] DEFAULT '{}';

-- 7. RLS Policies
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Anyone can see follows" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can see activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);
