-- Migration to fix missing tables for Squads and Challenges
-- Run this ENTIRE script in one go in Supabase SQL Editor.

-- =============================================
-- 1. Challenges Table
-- =============================================
create table if not exists challenges (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  goal_type text not null,
  goal_value integer not null,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table challenges enable row level security;
create policy "Challenges are viewable by everyone" on challenges for select using (true);
create policy "Users can create challenges" on challenges for insert with check (auth.uid() = creator_id);
create policy "Creators can update challenges" on challenges for update using (auth.uid() = creator_id);

-- =============================================
-- 2. Challenge Participants Table
-- =============================================
create table if not exists challenge_participants (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references challenges(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  progress integer default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(challenge_id, user_id)
);

alter table challenge_participants enable row level security;
create policy "Participants are viewable by everyone" on challenge_participants for select using (true);
create policy "Users can join challenges" on challenge_participants for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on challenge_participants for update using (auth.uid() = user_id);

-- =============================================
-- 3. Squads Table (created WITHOUT RLS policies first)
-- =============================================
create table if not exists squads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  invite_code text unique not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table squads enable row level security;
-- Insert/Update policies that don't reference squad_members
create policy "Anyone can create squads" on squads for insert with check (auth.uid() = created_by);
create policy "Creators can update squads" on squads for update using (auth.uid() = created_by);

-- =============================================
-- 4. Squad Members Table
-- =============================================
create table if not exists squad_members (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references squads(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(squad_id, user_id)
);

alter table squad_members enable row level security;
create policy "Users can join via code" on squad_members for insert with check (auth.uid() = user_id);
create policy "Users can leave squads" on squad_members for delete using (auth.uid() = user_id);

-- =============================================
-- 5. NOW add cross-referencing RLS policies
--    (squad_members exists at this point)
-- =============================================
create policy "Squads are viewable by members" on squads for select using (
  id in (select squad_id from squad_members where user_id = auth.uid())
);

create policy "Squad members viewable by members" on squad_members for select using (
  squad_id in (select squad_id from squad_members where user_id = auth.uid())
);
