-- Ensure the habit_history table exists with the schema the app expects.
-- This is idempotent — safe to run even if the table already exists from
-- an earlier (uncommitted) migration.

create table if not exists public.habit_history (
  id              uuid primary key default gen_random_uuid(),
  habit_id        text not null references public.habits(id) on delete cascade,
  completed_date  date not null,
  created_at      timestamptz not null default now(),
  unique (habit_id, completed_date)
);

create index if not exists habit_history_habit_id_idx       on public.habit_history (habit_id);
create index if not exists habit_history_habit_id_date_idx  on public.habit_history (habit_id, completed_date desc);

alter table public.habit_history enable row level security;

-- Owner-only access, gated through the parent habits row.
drop policy if exists "habit_history select own" on public.habit_history;
create policy "habit_history select own" on public.habit_history
  for select using (
    exists (select 1 from public.habits h where h.id = habit_history.habit_id and h.user_id = auth.uid())
  );

drop policy if exists "habit_history insert own" on public.habit_history;
create policy "habit_history insert own" on public.habit_history
  for insert with check (
    exists (select 1 from public.habits h where h.id = habit_history.habit_id and h.user_id = auth.uid())
  );

drop policy if exists "habit_history delete own" on public.habit_history;
create policy "habit_history delete own" on public.habit_history
  for delete using (
    exists (select 1 from public.habits h where h.id = habit_history.habit_id and h.user_id = auth.uid())
  );
