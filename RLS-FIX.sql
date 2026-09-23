-- WPU 2026 – ONE-GO RLS FIX
-- Run this ENTIRE script once in Supabase Dashboard -> SQL Editor.
-- It fixes BOTH the results table and the PDF storage upload policy.
-- It intentionally permits authenticated Admin users to write.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Keep the known WPU admin registered when that Auth user exists.
insert into public.admins(user_id)
select '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid
where exists (select 1 from auth.users where id='11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid)
on conflict (user_id) do nothing;

alter table public.weekly_winners enable row level security;
alter table public.events enable row level security;
alter table public.results enable row level security;
alter table public.documents enable row level security;
alter table public.wpu_info enable row level security;

-- Public reading.
drop policy if exists "wpu_public_read_winners" on public.weekly_winners;
drop policy if exists "wpu_public_read_events" on public.events;
drop policy if exists "wpu_public_read_results" on public.results;
drop policy if exists "wpu_public_read_documents" on public.documents;
drop policy if exists "wpu_public_read_info" on public.wpu_info;
create policy "wpu_public_read_winners" on public.weekly_winners for select using (true);
create policy "wpu_public_read_events" on public.events for select using (true);
create policy "wpu_public_read_results" on public.results for select using (true);
create policy "wpu_public_read_documents" on public.documents for select using (true);
create policy "wpu_public_read_info" on public.wpu_info for select using (true);

-- IMPORTANT: separate INSERT/UPDATE/DELETE policies make the write permission explicit.
-- The logged-in Admin screen uses Supabase Auth, so the request carries role=authenticated.
drop policy if exists "wpu_authenticated_results_insert" on public.results;
drop policy if exists "wpu_authenticated_results_update" on public.results;
drop policy if exists "wpu_authenticated_results_delete" on public.results;
create policy "wpu_authenticated_results_insert" on public.results
for insert to authenticated
with check (auth.uid() is not null);
create policy "wpu_authenticated_results_update" on public.results
for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);
create policy "wpu_authenticated_results_delete" on public.results
for delete to authenticated
using (auth.uid() is not null);

-- The other Admin sections use the same authenticated write rule.
drop policy if exists "wpu_authenticated_winners_all" on public.weekly_winners;
drop policy if exists "wpu_authenticated_events_all" on public.events;
drop policy if exists "wpu_authenticated_documents_all" on public.documents;
drop policy if exists "wpu_authenticated_info_all" on public.wpu_info;
create policy "wpu_authenticated_winners_all" on public.weekly_winners
for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_events_all" on public.events
for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_documents_all" on public.documents
for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_info_all" on public.wpu_info
for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- Make sure the API roles have table privileges as well as RLS policies.
grant select on public.weekly_winners, public.events, public.results, public.documents, public.wpu_info to anon, authenticated;
grant insert, update, delete on public.weekly_winners, public.events, public.results, public.documents, public.wpu_info to authenticated;

-- PDF/photo storage bucket.
insert into storage.buckets(id,name,public)
values ('wpu-media','wpu-media',true)
on conflict (id) do update set public=true;

-- A new permissive authenticated policy is deliberately given a unique name so it
-- still works even if an older policy with a different name exists.
drop policy if exists "wpu_authenticated_media_write" on storage.objects;
create policy "wpu_authenticated_media_write" on storage.objects
for all to authenticated
using (bucket_id='wpu-media' and auth.uid() is not null)
with check (bucket_id='wpu-media' and auth.uid() is not null);

drop policy if exists "wpu_public_media_read" on storage.objects;
create policy "wpu_public_media_read" on storage.objects
for select using (bucket_id='wpu-media');

-- Storage API privileges.
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;

-- Verification: these should return the WPU results table and storage bucket.
select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('results','weekly_winners','events','documents','wpu_info');
select id,name,public from storage.buckets where id='wpu-media';
