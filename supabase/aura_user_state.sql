-- AURA // cloud state for Supabase Auth users
-- Run this once in the Supabase SQL editor (or as a migration).
-- The browser only ever uses the public publishable/anon key, and these RLS
-- policies let each authenticated user read and write only their own row.

create table if not exists public.aura_user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.aura_user_state enable row level security;

-- Only signed-in users may touch the table; RLS below narrows each row to
-- its owner. The anon key alone gets nothing.
revoke all on public.aura_user_state from anon;
grant select, insert, update, delete on public.aura_user_state to authenticated;

drop policy if exists "aura_user_state_select_own" on public.aura_user_state;
create policy "aura_user_state_select_own"
  on public.aura_user_state
  for select
  using (auth.uid() = user_id);

drop policy if exists "aura_user_state_insert_own" on public.aura_user_state;
create policy "aura_user_state_insert_own"
  on public.aura_user_state
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "aura_user_state_update_own" on public.aura_user_state;
create policy "aura_user_state_update_own"
  on public.aura_user_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "aura_user_state_delete_own" on public.aura_user_state;
create policy "aura_user_state_delete_own"
  on public.aura_user_state
  for delete
  using (auth.uid() = user_id);
