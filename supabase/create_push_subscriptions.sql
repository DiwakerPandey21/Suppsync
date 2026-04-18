-- Create push_subscriptions table (was never created!)
-- Run this in Supabase SQL Editor

create table if not exists push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_type text default 'Desktop',
  timezone text default 'Asia/Kolkata',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- RLS: users can manage their own subscriptions, server can read all
alter table push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

-- Allow service role / anon to read all subscriptions (needed for cron)
create policy "Push subscriptions readable for reminders" on push_subscriptions
  for select using (true);
