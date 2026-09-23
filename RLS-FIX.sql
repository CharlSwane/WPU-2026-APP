-- WPU 2026 – FINAL SUPABASE RLS FIX
-- Admin Auth UUID supplied by the owner:
-- 11bd15b4-711a-4d04-8307-4c8c01202eb8
--
-- Run this entire script in Supabase Dashboard -> SQL Editor.
-- Do NOT put the service_role/secret key into config.js or the browser.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Register the exact Auth user as a WPU administrator.
insert into public.admins(user_id)
values ('11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid)
on conflict (user_id) do nothing;

-- Database write policies.
do $$
declare
  admin_id uuid := '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid;
  exists_user boolean;
begin
  select exists(select 1 from auth.users where id = admin_id) into exists_user;
  if not exists_user then
    raise exception 'WPU ADMIN UUID % does not exist in auth.users. Create/login the Supabase Auth user first.', admin_id;
  end if;
end $$;

alter table public.weekly_winners enable row level security;
alter table public.events enable row level security;
alter table public.results enable row level security;
alter table public.documents enable row level security;
alter table public.wpu_info enable row level security;

drop policy if exists "admin write winners" on public.weekly_winners;
create policy "admin write winners" on public.weekly_winners
for all
using (auth.role() = 'authenticated' and auth.uid() is not null)
with check (auth.role() = 'authenticated' and auth.uid() is not null);

drop policy if exists "admin write events" on public.events;
create policy "admin write events" on public.events
for all
using (auth.role() = 'authenticated' and auth.uid() is not null)
with check (auth.role() = 'authenticated' and auth.uid() is not null);

drop policy if exists "admin write results" on public.results;
create policy "admin write results" on public.results
for all
using (auth.role() = 'authenticated' and auth.uid() is not null)
with check (auth.role() = 'authenticated' and auth.uid() is not null);

drop policy if exists "admin write documents" on public.documents;
create policy "admin write documents" on public.documents
for all
using (auth.role() = 'authenticated' and auth.uid() is not null)
with check (auth.role() = 'authenticated' and auth.uid() is not null);

drop policy if exists "admin write info" on public.wpu_info;
create policy "admin write info" on public.wpu_info
for all
using (auth.role() = 'authenticated' and auth.uid() is not null)
with check (auth.role() = 'authenticated' and auth.uid() is not null);

-- Storage used for result PDFs, winner photos and event photos.
insert into storage.buckets(id,name,public)
values ('wpu-media','wpu-media',true)
on conflict (id) do update set public=true;

drop policy if exists "admin media write" on storage.objects;
create policy "admin media write" on storage.objects
for all
using (
  bucket_id='wpu-media'
  and (auth.role() = 'authenticated' and auth.uid() is not null)
)
with check (
  bucket_id='wpu-media'
  and (auth.role() = 'authenticated' and auth.uid() is not null)
);

-- Public read policies.
drop policy if exists "public read winners" on public.weekly_winners;
create policy "public read winners" on public.weekly_winners for select using (true);
drop policy if exists "public read events" on public.events;
create policy "public read events" on public.events for select using (true);
drop policy if exists "public read results" on public.results;
create policy "public read results" on public.results for select using (true);
drop policy if exists "public read documents" on public.documents;
create policy "public read documents" on public.documents for select using (true);
drop policy if exists "public read info" on public.wpu_info;
create policy "public read info" on public.wpu_info for select using (true);

-- Verification results.
select 'ADMIN UUID' as check_name, '11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid as value;
select id,email,confirmed_at from auth.users where id='11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid;
select user_id from public.admins where user_id='11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid;
