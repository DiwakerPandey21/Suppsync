-- Version 9.0 Supabase Schema Migration: Social Teams & Feed Interactions

-- 1. Squads (Private Groups) Table
create table squads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  invite_code text unique not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for squads
alter table squads enable row level security;
create policy "Squads are viewable by members" on squads for select using (
  id in (select squad_id from "squad_members" where user_id = auth.uid())
);
create policy "Anyone can create squads" on squads for insert with check (auth.uid() = created_by);
create policy "Creators can update squads" on squads for update using (auth.uid() = created_by);

-- 2. Squad Members Table
create table squad_members (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references squads(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(squad_id, user_id)
);

-- Enable RLS for squad_members
alter table squad_members enable row level security;
create policy "Squad members viewable by members" on squad_members for select using (
  squad_id in (select squad_id from "squad_members" where user_id = auth.uid())
);
create policy "Users can join via code (handled by RPC/App)" on squad_members for insert with check (auth.uid() = user_id);
create policy "Users can leave squads" on squad_members for delete using (auth.uid() = user_id);

-- 3. Feed Reactions
create table feed_reactions (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid not null, -- references social_feed but social_feed isn't a dedicated table currently (we query logs/badges), so we treat it abstractly for now, or tie to logs
  user_id uuid references auth.users(id) on delete cascade not null,
  reaction_type text not null, -- 'fire', 'muscle', '100'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(activity_id, user_id, reaction_type)
);

-- RLS for reactions
alter table feed_reactions enable row level security;
create policy "Reactions are viewable by everyone" on feed_reactions for select using (true);
create policy "Users can react" on feed_reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove their reactions" on feed_reactions for delete using (auth.uid() = user_id);

-- 4. Feed Comments
create table feed_comments (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid not null, 
  user_id uuid references auth.users(id) on delete cascade not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for comments
alter table feed_comments enable row level security;
create policy "Comments are viewable by everyone" on feed_comments for select using (true);
create policy "Users can comment" on feed_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on feed_comments for delete using (auth.uid() = user_id);
