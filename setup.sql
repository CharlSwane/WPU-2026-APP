-- WPU 2026 Supabase schema
create extension if not exists pgcrypto;
create table if not exists public.weekly_winners (id uuid primary key default gen_random_uuid(), week text not null, race text not null, name text not null, club text, date date, image_url text, caption text, created_at timestamptz default now());
create table if not exists public.events (id uuid primary key default gen_random_uuid(), title text not null, date date, location text, description text, images jsonb default '[]'::jsonb, created_at timestamptz default now());
create table if not exists public.results (id uuid primary key default gen_random_uuid(), title text not null, category text not null, date date, pdf_url text, created_at timestamptz default now());
create table if not exists public.documents (id uuid primary key default gen_random_uuid(), title text not null, type text not null, date date, url text, note text, created_at timestamptz default now());
create table if not exists public.wpu_info (id int primary key default 1, about text, contacts text, management text, constitution text, updated_at timestamptz default now());
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);

-- WPU administrator Auth UUID supplied for this deployment.
insert into public.admins(user_id) values('11bd15b4-711a-4d04-8307-4c8c01202eb8'::uuid) on conflict (user_id) do nothing;
insert into public.wpu_info(id,about,contacts,management,constitution) values(1,'Welkom by die WPU 2026 digitale jaarboek.','','','') on conflict(id) do nothing;

alter table public.weekly_winners enable row level security;
alter table public.events enable row level security;
alter table public.results enable row level security;
alter table public.documents enable row level security;
alter table public.wpu_info enable row level security;

-- Re-runnable policy setup.
drop policy if exists "public read winners" on public.weekly_winners;
drop policy if exists "public read events" on public.events;
drop policy if exists "public read results" on public.results;
drop policy if exists "public read documents" on public.documents;
drop policy if exists "public read info" on public.wpu_info;
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

drop policy if exists "admin write winners" on public.weekly_winners;
drop policy if exists "admin write events" on public.events;
drop policy if exists "admin write results" on public.results;
drop policy if exists "admin write documents" on public.documents;
drop policy if exists "admin write info" on public.wpu_info;
drop policy if exists "wpu_authenticated_results_insert" on public.results;
drop policy if exists "wpu_authenticated_results_update" on public.results;
drop policy if exists "wpu_authenticated_results_delete" on public.results;
create policy "wpu_authenticated_results_insert" on public.results for insert to authenticated with check (auth.uid() is not null);
create policy "wpu_authenticated_results_update" on public.results for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_results_delete" on public.results for delete to authenticated using (auth.uid() is not null);
create policy "wpu_authenticated_winners_all" on public.weekly_winners for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_events_all" on public.events for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_documents_all" on public.documents for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "wpu_authenticated_info_all" on public.wpu_info for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

grant select on public.weekly_winners, public.events, public.results, public.documents, public.wpu_info to anon, authenticated;
grant insert, update, delete on public.weekly_winners, public.events, public.results, public.documents, public.wpu_info to authenticated;

insert into storage.buckets(id,name,public) values('wpu-media','wpu-media',true) on conflict(id) do update set public=true;
drop policy if exists "public media read" on storage.objects;
drop policy if exists "admin media write" on storage.objects;
drop policy if exists "wpu_authenticated_media_write" on storage.objects;
drop policy if exists "wpu_public_media_read" on storage.objects;
create policy "wpu_public_media_read" on storage.objects for select using (bucket_id='wpu-media');
create policy "wpu_authenticated_media_write" on storage.objects for all to authenticated using (bucket_id='wpu-media' and auth.uid() is not null) with check (bucket_id='wpu-media' and auth.uid() is not null);
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;

-- After creating the Supabase Auth user, log in through the app before saving.
