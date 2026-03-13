-- ============================================
-- SuppSync V7 Database Migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. XP & Leveling System
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- 2. Leaderboard Cache
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  xp INT DEFAULT 0,
  streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" ON leaderboard_cache
  FOR SELECT USING (true);

CREATE POLICY "Users can update own leaderboard entry" ON leaderboard_cache
  FOR ALL USING (auth.uid() = user_id);

-- 3. Expiry Tracker
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS expiry_date DATE;
