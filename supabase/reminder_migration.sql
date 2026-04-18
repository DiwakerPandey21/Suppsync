-- Smart Reminder System: Database Migration
-- Run in Supabase SQL Editor

-- 1. Add reminder_time column to schedules (exact clock time for push notification)
alter table schedules add column if not exists reminder_time text; -- e.g. '08:00', '14:30', '21:00'

-- 2. Add timezone to push_subscriptions
alter table push_subscriptions add column if not exists timezone text default 'Asia/Kolkata';
