-- WPU 2026 APP - FIX WEEKLY OVERALLS FOR YEAR ARCHIVES
-- Run ONCE in Supabase SQL Editor.
-- This preserves separate records for the same category in different years.

alter table public.weekly_overalls add column if not exists year int;

update public.weekly_overalls
set year=extract(year from date)::int
where year is null and date is not null;

update public.weekly_overalls
set year=2026
where year is null;

alter table public.weekly_overalls alter column year set not null;

-- Remove the old category-only UNIQUE constraint.
alter table public.weekly_overalls
  drop constraint if exists weekly_overalls_category_key;

-- Remove an old category/year constraint/index before recreating it cleanly.
alter table public.weekly_overalls
  drop constraint if exists weekly_overalls_category_year_key;

drop index if exists public.weekly_overalls_category_year_key;

-- One current record per CATEGORY PER YEAR.
create unique index if not exists weekly_overalls_category_year_key
  on public.weekly_overalls(category, year);

-- RLS
alter table public.weekly_overalls enable row level security;

drop policy if exists "public read weekly overalls" on public.weekly_overalls;
drop policy if exists "admin write weekly overalls" on public.weekly_overalls;
drop policy if exists "WPU ADMIN WEEKLY OVERALLS" on public.weekly_overalls;

create policy "public read weekly overalls"
on public.weekly_overalls
for select to public
using (true);

create policy "admin write weekly overalls"
on public.weekly_overalls
for all to public
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));
