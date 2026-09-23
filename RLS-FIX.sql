-- WPU 2026 - RLS / ADMIN FIX
-- Run this in Supabase SQL Editor as the project owner.
-- IMPORTANT: replace the email below with the SAME email you use
-- on the WPU Admin Aanmelding screen.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Add your existing Supabase Auth user as an administrator.
-- This is safe because this SQL is run by the Supabase project owner,
-- not by the public app user.
insert into public.admins(user_id)
select id
from auth.users
where lower(email) = lower('YOUR-ADMIN-EMAIL-HERE')
on conflict (user_id) do nothing;

-- Re-apply the write policies for every admin-managed section.

drop policy if exists "admin write winners" on public.weekly_winners;
drop policy if exists "admin write events" on public.events;
drop policy if exists "admin write results" on public.results;
drop policy if exists "admin write documents" on public.documents;
drop policy if exists "admin write info" on public.wpu_info;
drop policy if exists "admin media write" on storage.objects;

create policy "admin write winners"
on public.weekly_winners for all
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));

create policy "admin write events"
on public.events for all
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));

create policy "admin write results"
on public.results for all
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));

create policy "admin write documents"
on public.documents for all
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));

create policy "admin write info"
on public.wpu_info for all
using (auth.uid() in (select user_id from public.admins))
with check (auth.uid() in (select user_id from public.admins));

create policy "admin media write"
on storage.objects for all
using (
  bucket_id='wpu-media'
  and auth.uid() in (select user_id from public.admins)
)
with check (
  bucket_id='wpu-media'
  and auth.uid() in (select user_id from public.admins)
);

-- Verify the admin was found.
select a.user_id, u.email
from public.admins a
join auth.users u on u.id = a.user_id
where lower(u.email) = lower('YOUR-ADMIN-EMAIL-HERE');
