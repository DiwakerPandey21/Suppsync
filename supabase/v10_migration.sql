-- Version 10.0 Supabase Schema Migration: The Frontier Update

-- 1. Genotypes Table (DNA Integration)
create table genotypes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  marker_name text not null, -- e.g., 'MTHFR C677T', 'COMT V158M'
  status text not null, -- 'Normal', 'Heterozygous', 'Homozygous Mutated'
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, marker_name)
);

-- RLS for Genotypes
alter table genotypes enable row level security;
create policy "Users can view own genotypes" on genotypes for select using (auth.uid() = user_id);
create policy "Users can insert own genotypes" on genotypes for insert with check (auth.uid() = user_id);
create policy "Users can update own genotypes" on genotypes for update using (auth.uid() = user_id);
create policy "Users can delete own genotypes" on genotypes for delete using (auth.uid() = user_id);


-- 2. Stack Versions (Git for Biohacking)
create table stack_versions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  version_name text not null, -- e.g., 'Sleep Protocol v1.2'
  stack_snapshot_json jsonb not null, -- Full snapshot of the supplements and schedules at this point in time
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Stack Versions
alter table stack_versions enable row level security;
create policy "Users can view own stack versions" on stack_versions for select using (auth.uid() = user_id);
create policy "Users can insert own stack versions" on stack_versions for insert with check (auth.uid() = user_id);
create policy "Users can update own stack versions" on stack_versions for update using (auth.uid() = user_id);
create policy "Users can delete own stack versions" on stack_versions for delete using (auth.uid() = user_id);


-- 3. Enhance Schedules Table for Chronobiology
-- We add 'trigger_type' (e.g., 'fixed', 'sunrise', 'sunset', 'solar_noon')
-- and 'offset_mins' (e.g., 30 means 30 mins after, -60 means 1 hr before)
alter table schedules 
add column if not exists trigger_type text default 'fixed',
add column if not exists offset_mins integer default 0;
