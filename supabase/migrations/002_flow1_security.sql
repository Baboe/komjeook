-- Ombaa — migratie 002: Flow 1 compleet + security hardening
-- Uitvoeren in de Supabase SQL editor, NA supabase/schema.sql (001).
-- Idempotent: dit script kan veilig opnieuw worden uitgevoerd.

create extension if not exists pg_net;

-- ============================================================
-- 1. profiles — telefoonnummer eruit (staat al veilig in auth.users),
--    coördinaten + zoekradius erin, server-side limieten
-- ============================================================
alter table public.profiles drop column if exists telefoonnummer;

alter table public.profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists zoekradius_km int not null default 25;

alter table public.profiles drop constraint if exists profiles_voornaam_len;
alter table public.profiles add constraint profiles_voornaam_len
  check (char_length(voornaam) between 1 and 40);
alter table public.profiles drop constraint if exists profiles_locatie_len;
alter table public.profiles add constraint profiles_locatie_len
  check (char_length(locatie) between 1 and 80);
alter table public.profiles drop constraint if exists profiles_interesses_max;
alter table public.profiles add constraint profiles_interesses_max
  check (cardinality(interesses) <= 20);
alter table public.profiles drop constraint if exists profiles_zoekradius_range;
alter table public.profiles add constraint profiles_zoekradius_range
  check (zoekradius_km between 5 and 200);

-- Kolomrechten: clients mogen no_show_count nooit zelf zetten of wijzigen.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, voornaam, leeftijd, locatie, lat, lng, zoekradius_km, avatar_url, interesses, stem_url)
  on public.profiles to authenticated;
grant update (voornaam, leeftijd, locatie, lat, lng, zoekradius_km, avatar_url, interesses, stem_url)
  on public.profiles to authenticated;

-- ============================================================
-- 2. oproepen — coördinaten, vervuld-moment, limieten, ontbrekende FK
-- ============================================================
alter table public.oproepen
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists vervuld_at timestamptz,
  add column if not exists feedback_prompted_at timestamptz;

alter table public.oproepen drop constraint if exists oproepen_activiteit_len;
alter table public.oproepen add constraint oproepen_activiteit_len
  check (activiteit is null or char_length(activiteit) <= 120);
alter table public.oproepen drop constraint if exists oproepen_datum_len;
alter table public.oproepen add constraint oproepen_datum_len
  check (datum is null or char_length(datum) <= 60);
alter table public.oproepen drop constraint if exists oproepen_locatie_len;
alter table public.oproepen add constraint oproepen_locatie_len
  check (char_length(locatie) between 1 and 80);
alter table public.oproepen drop constraint if exists oproepen_fotos_max;
alter table public.oproepen add constraint oproepen_fotos_max
  check (cardinality(foto_urls) <= 3);
alter table public.oproepen drop constraint if exists oproepen_voice_len;
alter table public.oproepen add constraint oproepen_voice_len
  check (char_length(voice_url) <= 500);

alter table public.oproepen drop constraint if exists oproepen_gekozen_reactie_fk;
alter table public.oproepen add constraint oproepen_gekozen_reactie_fk
  foreign key (gekozen_reactie_id) references public.reacties(id) on delete set null;

-- Status en gekozen_reactie_id gaan uitsluitend via de kies_reactie-RPC en cron.
revoke update on public.oproepen from anon, authenticated;
grant update (activiteit, datum, locatie, lat, lng, foto_urls) on public.oproepen to authenticated;

-- ============================================================
-- 3. reacties — geen client-updates meer (eigenaar kon voice_url van
--    andermans reactie overschrijven); alles via kies_reactie-RPC
-- ============================================================
drop policy if exists "reacties_update_owner_of_oproep" on public.reacties;
revoke update on public.reacties from anon, authenticated;

alter table public.reacties drop constraint if exists reacties_voice_len;
alter table public.reacties add constraint reacties_voice_len
  check (char_length(voice_url) <= 500);

-- ============================================================
-- 4. chats — worden alleen nog door kies_reactie aangemaakt;
--    laatste_bericht_at via trigger i.p.v. client-update
-- ============================================================
drop policy if exists "chats_insert_participants" on public.chats;
drop policy if exists "chats_update_participants" on public.chats;
revoke insert, update on public.chats from anon, authenticated;

-- ============================================================
-- 5. berichten — lengte-limiet, gelezen-status
-- ============================================================
alter table public.berichten
  add column if not exists gelezen boolean not null default false;

alter table public.berichten drop constraint if exists berichten_tekst_len;
alter table public.berichten add constraint berichten_tekst_len
  check (tekst is null or char_length(tekst) <= 2000);

-- Deelnemers mogen alleen 'gelezen' zetten op berichten van de ander.
drop policy if exists "berichten_update_gelezen" on public.berichten;
create policy "berichten_update_gelezen" on public.berichten for update using (
  user_id <> auth.uid()
  and exists (
    select 1 from public.chats c
    where c.id = chat_id and (auth.uid() = c.user_a_id or auth.uid() = c.user_b_id)
  )
);
revoke update on public.berichten from anon, authenticated;
grant update (gelezen) on public.berichten to authenticated;

create or replace function public.bijwerken_laatste_bericht()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.chats set laatste_bericht_at = new.created_at where id = new.chat_id;
  return new;
end $$;

drop trigger if exists trg_laatste_bericht on public.berichten;
create trigger trg_laatste_bericht
  after insert on public.berichten
  for each row execute function public.bijwerken_laatste_bericht();

-- ============================================================
-- 6. Rate limiting (spam-preventie, server-side)
-- ============================================================
create or replace function public.check_oproep_limiet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.oproepen
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'te_veel_oproepen';
  end if;
  return new;
end $$;
drop trigger if exists trg_oproep_limiet on public.oproepen;
create trigger trg_oproep_limiet before insert on public.oproepen
  for each row execute function public.check_oproep_limiet();

create or replace function public.check_reactie_limiet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reacties
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'te_veel_reacties';
  end if;
  return new;
end $$;
drop trigger if exists trg_reactie_limiet on public.reacties;
create trigger trg_reactie_limiet before insert on public.reacties
  for each row execute function public.check_reactie_limiet();

create or replace function public.check_bericht_limiet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.berichten
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 200 then
    raise exception 'te_veel_berichten';
  end if;
  return new;
end $$;
drop trigger if exists trg_bericht_limiet on public.berichten;
create trigger trg_bericht_limiet before insert on public.berichten
  for each row execute function public.check_bericht_limiet();

-- ============================================================
-- 7. Push tokens (nooit publiek leesbaar — eigen tabel, self-only RLS)
-- ============================================================
create table if not exists public.push_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  token text not null check (char_length(token) <= 200),
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
drop policy if exists "push_tokens_self" on public.push_tokens;
create policy "push_tokens_self" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.stuur_push(p_user_id uuid, p_titel text, p_body text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  select token into v_token from public.push_tokens where user_id = p_user_id;
  if v_token is null then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('to', v_token, 'title', p_titel, 'body', p_body, 'data', p_data, 'sound', 'default')
  );
end $$;
revoke execute on function public.stuur_push(uuid, text, text, jsonb) from public, anon, authenticated;

-- ============================================================
-- 8. Notificatie-triggers
-- ============================================================
-- Nieuwe reactie -> eigenaar van de oproep
create or replace function public.notificeer_nieuwe_reactie()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_naam text; v_act text;
begin
  select o.user_id, o.activiteit into v_owner, v_act from public.oproepen o where o.id = new.oproep_id;
  select voornaam into v_naam from public.profiles where id = new.user_id;
  perform public.stuur_push(
    v_owner,
    'Nieuwe reactie',
    coalesce(v_naam, 'Iemand') || ' wil mee' || coalesce(' naar ' || v_act, '') || '.',
    jsonb_build_object('type', 'reactie', 'oproep_id', new.oproep_id)
  );
  return new;
end $$;
drop trigger if exists trg_notificeer_reactie on public.reacties;
create trigger trg_notificeer_reactie after insert on public.reacties
  for each row execute function public.notificeer_nieuwe_reactie();

-- Gekozen / niet gekozen -> reageerder (afwijzing altijd neutraal)
create or replace function public.notificeer_reactie_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner_naam text; v_chat_id uuid;
begin
  select p.voornaam into v_owner_naam
  from public.oproepen o join public.profiles p on p.id = o.user_id
  where o.id = new.oproep_id;

  if new.status = 'gekozen' then
    select c.id into v_chat_id from public.chats c
    where c.oproep_id = new.oproep_id order by c.created_at desc limit 1;
    perform public.stuur_push(
      new.user_id,
      'Goed nieuws!',
      coalesce(v_owner_naam, 'Iemand') || ' wil graag met jou gaan. Kom je ook?',
      jsonb_build_object('type', 'gekozen', 'chat_id', v_chat_id, 'oproep_id', new.oproep_id)
    );
  elsif new.status = 'niet_gekozen' then
    perform public.stuur_push(
      new.user_id,
      'Ombaa',
      coalesce(v_owner_naam, 'Iemand') || ' heeft iemand gevonden voor deze activiteit.',
      jsonb_build_object('type', 'vervuld', 'oproep_id', new.oproep_id)
    );
  end if;
  return new;
end $$;
drop trigger if exists trg_notificeer_reactie_status on public.reacties;
create trigger trg_notificeer_reactie_status
  after update of status on public.reacties
  for each row when (old.status is distinct from new.status)
  execute function public.notificeer_reactie_status();

-- Nieuw bericht -> andere deelnemer
create or replace function public.notificeer_bericht()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_other uuid; v_naam text;
begin
  select case when c.user_a_id = new.user_id then c.user_b_id else c.user_a_id end
    into v_other from public.chats c where c.id = new.chat_id;
  if v_other is null then return new; end if;
  select voornaam into v_naam from public.profiles where id = new.user_id;
  perform public.stuur_push(
    v_other,
    coalesce(v_naam, 'Nieuw bericht'),
    coalesce(left(new.tekst, 90), 'Spraakbericht'),
    jsonb_build_object('type', 'bericht', 'chat_id', new.chat_id)
  );
  return new;
end $$;
drop trigger if exists trg_notificeer_bericht on public.berichten;
create trigger trg_notificeer_bericht after insert on public.berichten
  for each row execute function public.notificeer_bericht();

-- ============================================================
-- 9. kies_reactie — het hele kiesproces atomair, server-side
-- ============================================================
create or replace function public.kies_reactie(p_reactie_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_reactie public.reacties%rowtype; v_oproep public.oproepen%rowtype; v_chat_id uuid;
begin
  select * into v_reactie from public.reacties where id = p_reactie_id;
  if not found then raise exception 'reactie_niet_gevonden'; end if;

  select * into v_oproep from public.oproepen
  where id = v_reactie.oproep_id and user_id = auth.uid() and status = 'actief'
  for update;
  if not found then raise exception 'niet_toegestaan'; end if;

  insert into public.chats (oproep_id, user_a_id, user_b_id)
  values (v_oproep.id, v_oproep.user_id, v_reactie.user_id)
  returning id into v_chat_id;

  update public.oproepen
    set status = 'vervuld', gekozen_reactie_id = p_reactie_id, vervuld_at = now()
    where id = v_oproep.id;
  update public.reacties set status = 'gekozen' where id = p_reactie_id;
  update public.reacties set status = 'niet_gekozen'
    where oproep_id = v_oproep.id and id <> p_reactie_id and status = 'wachtend';

  return v_chat_id;
end $$;
revoke execute on function public.kies_reactie(uuid) from public, anon;
grant execute on function public.kies_reactie(uuid) to authenticated;

-- ============================================================
-- 10. feed_oproepen — radius-matching (stadscentroïde, haversine)
-- ============================================================
create or replace function public.feed_oproepen(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km int default null
)
returns setof public.oproepen language sql stable as $$
  select o.* from public.oproepen o
  where o.status = 'actief'
    and (
      p_lat is null or p_lng is null or p_radius_km is null
      or o.lat is null or o.lng is null
      or 2 * 6371 * asin(sqrt(
          power(sin(radians(o.lat - p_lat) / 2), 2)
          + cos(radians(p_lat)) * cos(radians(o.lat))
            * power(sin(radians(o.lng - p_lng) / 2), 2)
        )) <= p_radius_km
    )
  order by o.created_at desc
  limit 100
$$;
grant execute on function public.feed_oproepen(double precision, double precision, int) to anon, authenticated;

-- ============================================================
-- 11. Ontmoetingsfeedback + no-show telling
-- ============================================================
create table if not exists public.ontmoeting_feedback (
  id uuid primary key default uuid_generate_v4(),
  oproep_id uuid not null references public.oproepen(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sterren int not null check (sterren between 1 and 5),
  iedereen_gekomen boolean not null,
  created_at timestamptz not null default now(),
  unique (oproep_id, user_id)
);
alter table public.ontmoeting_feedback enable row level security;

drop policy if exists "feedback_insert_deelnemer" on public.ontmoeting_feedback;
create policy "feedback_insert_deelnemer" on public.ontmoeting_feedback for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.oproepen o
    left join public.reacties r on r.id = o.gekozen_reactie_id
    where o.id = oproep_id and o.status = 'vervuld'
      and (o.user_id = auth.uid() or r.user_id = auth.uid())
  )
);
drop policy if exists "feedback_select_self" on public.ontmoeting_feedback;
create policy "feedback_select_self" on public.ontmoeting_feedback
  for select using (auth.uid() = user_id);

create or replace function public.verwerk_no_show()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_other uuid;
begin
  if new.iedereen_gekomen then return new; end if;
  select case when o.user_id = new.user_id then r.user_id else o.user_id end
    into v_other
  from public.oproepen o
  join public.reacties r on r.id = o.gekozen_reactie_id
  where o.id = new.oproep_id;
  if v_other is not null then
    update public.profiles set no_show_count = no_show_count + 1 where id = v_other;
  end if;
  return new;
end $$;
drop trigger if exists trg_verwerk_no_show on public.ontmoeting_feedback;
create trigger trg_verwerk_no_show after insert on public.ontmoeting_feedback
  for each row execute function public.verwerk_no_show();

-- ============================================================
-- 12. Dagelijkse taken: oproepen laten verlopen + feedbackvraag sturen
-- ============================================================
create or replace function public.dagelijkse_taken()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select o.id, o.user_id,
           (select count(*) from public.reacties re where re.oproep_id = o.id) as n
    from public.oproepen o
    where o.status = 'actief' and o.created_at < now() - interval '14 days'
  loop
    update public.oproepen set status = 'verlopen' where id = r.id;
    if r.n = 0 then
      perform public.stuur_push(r.user_id, 'Ombaa',
        'Niemand heeft gereageerd. Zin om iets nieuws te plaatsen?',
        jsonb_build_object('type', 'verlopen', 'oproep_id', r.id));
    else
      perform public.stuur_push(r.user_id, 'Ombaa', 'Je oproep is verlopen.',
        jsonb_build_object('type', 'verlopen', 'oproep_id', r.id));
    end if;
  end loop;

  for r in
    select o.id, o.user_id as eigenaar, re.user_id as reageerder
    from public.oproepen o
    join public.reacties re on re.id = o.gekozen_reactie_id
    where o.status = 'vervuld'
      and o.vervuld_at < now() - interval '24 hours'
      and o.feedback_prompted_at is null
  loop
    perform public.stuur_push(r.eigenaar, 'Hoe was de ontmoeting?',
      'Laat even weten hoe het was.', jsonb_build_object('type', 'feedback', 'oproep_id', r.id));
    perform public.stuur_push(r.reageerder, 'Hoe was de ontmoeting?',
      'Laat even weten hoe het was.', jsonb_build_object('type', 'feedback', 'oproep_id', r.id));
    update public.oproepen set feedback_prompted_at = now() where id = r.id;
  end loop;
end $$;
revoke execute on function public.dagelijkse_taken() from public, anon, authenticated;

-- pg_cron aanzetten via Dashboard > Database > Extensions, daarna plant dit blok de taak in.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('ombaa-dagelijks', '0 9 * * *', 'select public.dagelijkse_taken()');
  end if;
end $$;

-- ============================================================
-- 13. Account verwijderen (GDPR + App Store-vereiste)
-- ============================================================
create or replace function public.verwijder_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'niet_ingelogd'; end if;
  delete from storage.objects
    where bucket_id in ('voices', 'fotos')
      and (storage.foldername(name))[1] = auth.uid()::text;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.verwijder_account() from public, anon;
grant execute on function public.verwijder_account() to authenticated;

-- ============================================================
-- 14. Storage: privé-buckets, MIME- en groottelimieten, scoped toegang
--     (app bewaart paden en gebruikt signed URLs)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voices', 'voices', false, 10485760,
        array['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/mpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "voices_select" on storage.objects;
create policy "voices_select" on storage.objects for select to authenticated using (
  bucket_id = 'voices' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.oproepen o where o.voice_url = name)
    or exists (select 1 from public.profiles p where p.stem_url = name)
    or exists (
      select 1 from public.reacties r
      join public.oproepen o on o.id = r.oproep_id
      where r.voice_url = name and (r.user_id = auth.uid() or o.user_id = auth.uid())
    )
    or exists (
      select 1 from public.berichten b
      join public.chats c on c.id = b.chat_id
      where b.voice_url = name and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  )
);

-- Bezoekers (nog niet ingelogd) mogen alleen stemmen van actieve oproepen beluisteren.
drop policy if exists "voices_select_bezoeker" on storage.objects;
create policy "voices_select_bezoeker" on storage.objects for select to anon using (
  bucket_id = 'voices'
  and exists (select 1 from public.oproepen o where o.voice_url = name and o.status = 'actief')
);

drop policy if exists "voices_insert" on storage.objects;
create policy "voices_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'voices' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "voices_delete_own" on storage.objects;
create policy "voices_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'voices' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "fotos_select" on storage.objects;
create policy "fotos_select" on storage.objects for select to authenticated using (bucket_id = 'fotos');
drop policy if exists "fotos_select_bezoeker" on storage.objects;
create policy "fotos_select_bezoeker" on storage.objects for select to anon using (
  bucket_id = 'fotos'
  and exists (select 1 from public.oproepen o where name = any(o.foto_urls) and o.status = 'actief')
);
drop policy if exists "fotos_insert" on storage.objects;
create policy "fotos_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "fotos_delete_own" on storage.objects;
create policy "fotos_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
);
