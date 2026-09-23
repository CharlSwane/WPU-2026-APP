-- WPU 2026 -> future-year archive migration
-- Run ONCE in Supabase SQL Editor. It preserves old overall records by year.

alter table public.weekly_overalls add column if not exists year int;
update public.weekly_overalls set year=extract(year from date)::int where year is null and date is not null;
update public.weekly_overalls set year=2026 where year is null;
alter table public.weekly_overalls alter column year set not null;

-- The original table used category as the only unique key. Remove that constraint.
alter table public.weekly_overalls drop constraint if exists weekly_overalls_category_key;
alter table public.weekly_overalls drop constraint if exists weekly_overalls_category_year_key;
create unique index if not exists weekly_overalls_category_year_key on public.weekly_overalls(category,year);

-- Keep the existing admin/public RLS behaviour.
alter table public.weekly_overalls enable row level security;
drop policy if exists "public read weekly overalls" on public.weekly_overalls;
drop policy if exists "admin write weekly overalls" on public.weekly_overalls;
drop policy if exists "WPU ADMIN WEEKLY OVERALLS" on public.weekly_overalls;

create policy "public read weekly overalls"
on public.weekly_overalls for select to public using (true);

create policy "admin write weekly overalls"
on public.weekly_overalls for all to public
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));
