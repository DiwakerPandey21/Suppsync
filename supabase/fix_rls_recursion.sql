-- Fix: Remove the self-referencing RLS policies that cause infinite recursion
-- and replace them with simple authenticated-user policies.

-- Drop the broken recursive policies
drop policy if exists "Squads are viewable by members" on squads;
drop policy if exists "Squad members viewable by members" on squad_members;

-- Replace with simple policies (squad info is social/not sensitive)
create policy "Squads are viewable by authenticated users" on squads
  for select using (auth.uid() is not null);

create policy "Squad members are viewable by authenticated users" on squad_members
  for select using (auth.uid() is not null);
