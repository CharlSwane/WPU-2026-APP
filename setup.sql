-- WPU 2026 Supabase schema
create extension if not exists pgcrypto;
create table if not exists public.weekly_winners (id uuid primary key default gen_random_uuid(), week text not null, race text not null, name text not null, club text, date date, image_url text, caption text, created_at timestamptz default now());
create table if not exists public.events (id uuid primary key default gen_random_uuid(), title text not null, date date, location text, description text, images jsonb default '[]'::jsonb, created_at timestamptz default now());
create table if not exists public.results (id uuid primary key default gen_random_uuid(), title text not null, category text not null, date date, pdf_url text, created_at timestamptz default now());
create table if not exists public.documents (id uuid primary key default gen_random_uuid(), title text not null, type text not null, date date, url text, note text, created_at timestamptz default now());
create table if not exists public.wpu_info (id int primary key default 1, about text, contacts text, management text, constitution text, updated_at timestamptz default now());
create table if not exists public.weekly_overalls (id uuid primary key default gen_random_uuid(), category text not null unique, date date, champion_pdf_url text, best_bird_pdf_url text, updated_at timestamptz default now());
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
insert into public.wpu_info(id,about,contacts,management,constitution) values(1,'Welkom by die WPU 2026 digitale jaarboek.','','','') on conflict(id) do nothing;

alter table public.weekly_winners enable row level security;
alter table public.events enable row level security;
alter table public.results enable row level security;
alter table public.documents enable row level security;
alter table public.wpu_info enable row level security;

-- Re-runnable policy setup: remove older copies first.
drop policy if exists "public read winners" on public.weekly_winners;
drop policy if exists "admin write winners" on public.weekly_winners;
drop policy if exists "public read events" on public.events;
drop policy if exists "admin write events" on public.events;
drop policy if exists "public read results" on public.results;
drop policy if exists "admin write results" on public.results;
drop policy if exists "public read documents" on public.documents;
drop policy if exists "admin write documents" on public.documents;
drop policy if exists "public read info" on public.wpu_info;
drop policy if exists "admin write info" on public.wpu_info;
drop policy if exists "public media read" on storage.objects;
drop policy if exists "admin media write" on storage.objects;

create policy "public read winners" on public.weekly_winners for select using (true);
create policy "admin write winners" on public.weekly_winners for all using (auth.uid() in (select user_id from public.admins)) with check (auth.uid() in (select user_id from public.admins));
create policy "public read events" on public.events for select using (true);
create policy "admin write events" on public.events for all using (auth.uid() in (select user_id from public.admins)) with check (auth.uid() in (select user_id from public.admins));
create policy "public read results" on public.results for select using (true);
create policy "admin write results" on public.results for all using (auth.uid() in (select user_id from public.admins)) with check (auth.uid() in (select user_id from public.admins));
create policy "public read documents" on public.documents for select using (true);
create policy "admin write documents" on public.documents for all using (auth.uid() in (select user_id from public.admins)) with check (auth.uid() in (select user_id from public.admins));
create policy "public read info" on public.wpu_info for select using (true);
create policy "admin write info" on public.wpu_info for all using (auth.uid() in (select user_id from public.admins)) with check (auth.uid() in (select user_id from public.admins));

insert into storage.buckets(id,name,public) values('wpu-media','wpu-media',true) on conflict(id) do update set public=true;
create policy "public media read" on storage.objects for select using (bucket_id='wpu-media');
create policy "admin media write" on storage.objects for all using (bucket_id='wpu-media' and auth.uid() in (select user_id from public.admins)) with check (bucket_id='wpu-media' and auth.uid() in (select user_id from public.admins));

-- After creating your Auth user, run this with that user's UUID:
-- insert into public.admins(user_id) values('YOUR-AUTH-USER-UUID');


-- Weekly overall champion / best bird: one current record per category.
alter table public.weekly_overalls alter column champion_name drop not null;
alter table public.weekly_overalls alter column best_bird_name drop not null;
alter table public.weekly_overalls add column if not exists champion_pdf_url text;
alter table public.weekly_overalls add column if not exists best_bird_pdf_url text;
alter table public.weekly_overalls add column if not exists updated_at timestamptz default now();

alter table public.weekly_overalls enable row level security;
drop policy if exists "public read weekly overalls" on public.weekly_overalls;
drop policy if exists "admin write weekly overalls" on public.weekly_overalls;
create policy "public read weekly overalls" on public.weekly_overalls for select using (true);
create policy "admin write weekly overalls" on public.weekly_overalls for all using (auth.uid() in (select user_id from public.admins)) with check (auth.uid() in (select user_id from public.admins));


-- Archive support for weekly overall PDFs: one record per category per year.
alter table public.weekly_overalls add column if not exists year int;
update public.weekly_overalls set year=extract(year from date)::int where year is null and date is not null;
update public.weekly_overalls set year=2026 where year is null;
alter table public.weekly_overalls alter column year set not null;
alter table public.weekly_overalls drop constraint if exists weekly_overalls_category_key;
alter table public.weekly_overalls drop constraint if exists weekly_overalls_category_year_key;
create unique index if not exists weekly_overalls_category_year_key on public.weekly_overalls(category,year);
