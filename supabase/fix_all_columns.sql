-- COMBINED FIX: Add ALL missing columns to schedules table
-- Run this in Supabase SQL Editor

-- V10: Chronobiology columns
alter table schedules add column if not exists trigger_type text default 'fixed';
alter table schedules add column if not exists offset_mins integer default 0;

-- Smart Reminders: Alarm time column
alter table schedules add column if not exists reminder_time text;

-- Push subscriptions: timezone column
alter table push_subscriptions add column if not exists timezone text default 'Asia/Kolkata';
