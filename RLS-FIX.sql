-- WPU 2026 - FINAL RLS / ADMIN FIX
-- Administrator Auth UUID: 11bd15b4-711a-4d04-8307-4c8c01202eb8
-- Run this ONCE in Supabase SQL Editor as project owner.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Register the exact WPU admin Auth user.
insert into public.admins(user_id) values('11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid) on conflict (user_id) do nothing;

drop policy if exists "admin write winners" on public.weekly_winners;
create policy "admin write winners" on public.weekly_winners for all
using ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)))
with check ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)));

drop policy if exists "admin write events" on public.events;
create policy "admin write events" on public.events for all
using ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)))
with check ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)));

drop policy if exists "admin write results" on public.results;
create policy "admin write results" on public.results for all
using ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)))
with check ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)));

drop policy if exists "admin write documents" on public.documents;
create policy "admin write documents" on public.documents for all
using ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)))
with check ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)));

drop policy if exists "admin write info" on public.wpu_info;
create policy "admin write info" on public.wpu_info for all
using ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)))
with check ((auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)));

insert into storage.buckets(id,name,public) values('wpu-media','wpu-media',true) on conflict(id) do update set public=true;

drop policy if exists "admin media write" on storage.objects;
create policy "admin media write" on storage.objects for all
using (bucket_id='wpu-media' and (auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)))
with check (bucket_id='wpu-media' and (auth.uid() = '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid or auth.uid() in (select user_id from public.admins)));

-- Verification: should return the administrator UUID.
select '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid as configured_admin_uuid;
select id,email from auth.users where id='11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid;
