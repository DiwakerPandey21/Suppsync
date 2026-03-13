-- ============================================
-- SuppSync V8 Database Migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_value INT DEFAULT 100,
  current_value INT DEFAULT 0,
  unit TEXT DEFAULT '%',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- 2. Mood Logs
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  mood TEXT NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mood logs" ON mood_logs FOR ALL USING (auth.uid() = user_id);

-- 3. Supplement Notes / Journal
CREATE TABLE IF NOT EXISTS supplement_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE supplement_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON supplement_notes FOR ALL USING (auth.uid() = user_id);

-- 4. Community Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,
  goal_value INT DEFAULT 7,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Users create own challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users manage own participation" ON challenge_participants FOR ALL USING (auth.uid() = user_id);
