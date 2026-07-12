-- Ombaa — Supabase schema (MVP, Flow 1)
-- Run in Supabase SQL editor. Phone auth must be enabled in Auth settings.

create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  voornaam text not null,
  leeftijd int not null check (leeftijd between 18 and 110),
  locatie text not null,
  telefoonnummer text not null,
  avatar_url text,
  interesses text[] not null default '{}',
  stem_url text,
  no_show_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- oproepen
-- ============================================================
create table if not exists public.oproepen (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  voice_url text not null,
  activiteit text,
  datum text,
  locatie text not null,
  foto_urls text[] not null default '{}',
  status text not null default 'actief' check (status in ('actief','vervuld','verlopen')),
  gekozen_reactie_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists oproepen_created_at_idx on public.oproepen (created_at desc);
create index if not exists oproepen_user_id_idx on public.oproepen (user_id);
create index if not exists oproepen_status_idx on public.oproepen (status);

alter table public.oproepen enable row level security;

drop policy if exists "oproepen_select_all" on public.oproepen;
create policy "oproepen_select_all" on public.oproepen for select using (true);

drop policy if exists "oproepen_insert_self" on public.oproepen;
create policy "oproepen_insert_self" on public.oproepen for insert with check (auth.uid() = user_id);

drop policy if exists "oproepen_update_self" on public.oproepen;
create policy "oproepen_update_self" on public.oproepen for update using (auth.uid() = user_id);

drop policy if exists "oproepen_delete_self" on public.oproepen;
create policy "oproepen_delete_self" on public.oproepen for delete using (auth.uid() = user_id);

-- ============================================================
-- reacties
-- ============================================================
create table if not exists public.reacties (
  id uuid primary key default uuid_generate_v4(),
  oproep_id uuid not null references public.oproepen(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  voice_url text not null,
  status text not null default 'wachtend' check (status in ('wachtend','gekozen','niet_gekozen')),
  created_at timestamptz not null default now(),
  unique (oproep_id, user_id)
);

create index if not exists reacties_oproep_idx on public.reacties (oproep_id, created_at);

alter table public.reacties enable row level security;

drop policy if exists "reacties_select_involved" on public.reacties;
create policy "reacties_select_involved" on public.reacties for select using (
  auth.uid() = user_id
  or auth.uid() in (select user_id from public.oproepen where id = oproep_id)
);

drop policy if exists "reacties_insert_self" on public.reacties;
create policy "reacties_insert_self" on public.reacties for insert with check (auth.uid() = user_id);

drop policy if exists "reacties_update_owner_of_oproep" on public.reacties;
create policy "reacties_update_owner_of_oproep" on public.reacties for update using (
  auth.uid() in (select user_id from public.oproepen where id = oproep_id)
);

-- ============================================================
-- chats
-- ============================================================
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  oproep_id uuid references public.oproepen(id) on delete set null,
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  laatste_bericht_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists chats_users_idx on public.chats (user_a_id, user_b_id);
create index if not exists chats_laatste_idx on public.chats (laatste_bericht_at desc);

alter table public.chats enable row level security;

drop policy if exists "chats_select_participants" on public.chats;
create policy "chats_select_participants" on public.chats for select using (
  auth.uid() = user_a_id or auth.uid() = user_b_id
);

drop policy if exists "chats_insert_participants" on public.chats;
create policy "chats_insert_participants" on public.chats for insert with check (
  auth.uid() = user_a_id or auth.uid() = user_b_id
);

drop policy if exists "chats_update_participants" on public.chats;
create policy "chats_update_participants" on public.chats for update using (
  auth.uid() = user_a_id or auth.uid() = user_b_id
);

-- ============================================================
-- berichten
-- ============================================================
create table if not exists public.berichten (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tekst text,
  voice_url text,
  created_at timestamptz not null default now(),
  check (tekst is not null or voice_url is not null)
);

create index if not exists berichten_chat_idx on public.berichten (chat_id, created_at);

alter table public.berichten enable row level security;

drop policy if exists "berichten_select_participants" on public.berichten;
create policy "berichten_select_participants" on public.berichten for select using (
  exists (
    select 1 from public.chats c
    where c.id = chat_id and (auth.uid() = c.user_a_id or auth.uid() = c.user_b_id)
  )
);

drop policy if exists "berichten_insert_participants" on public.berichten;
create policy "berichten_insert_participants" on public.berichten for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.chats c
    where c.id = chat_id and (auth.uid() = c.user_a_id or auth.uid() = c.user_b_id)
  )
);

-- Realtime
alter publication supabase_realtime add table public.berichten;
alter publication supabase_realtime add table public.reacties;

-- ============================================================
-- Storage buckets (run in Storage UI or via SQL helper)
-- ============================================================
-- Create buckets manually:
--   - voices  (public read; authenticated insert)
--   - fotos   (public read; authenticated insert)
--
-- Suggested storage policies:
--   - SELECT: bucket_id in ('voices','fotos')
--   - INSERT: auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text
