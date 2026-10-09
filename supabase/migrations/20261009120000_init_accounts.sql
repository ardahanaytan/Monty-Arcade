-- v2: üyelik, profil, başarımlar (MONTY_ARCADE.md §11.2–11.4)
-- Başarımlar yalnızca üyelerde kalıcı; misafir başarımları tarayıcı oturumunda tutulur ve girişte
-- merge_guest_achievements ile hesaba aktarılır. Tablolara doğrudan yazma yok: yazma RPC'lerle.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ── Tablolar ────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'), -- ilk girişte seçilir; o zamana kadar null
  display_name text check (char_length(display_name) between 1 and 40),
  avatar_url text,
  showcase text[] not null default '{}' check (cardinality(showcase) <= 6), -- 'gameId:achId'
  created_at timestamptz not null default now()
);

create table public.achievements ( -- içerikten senkronize edilir (scripts/sync-achievements.mjs)
  game_id text not null,
  id text not null,
  tier text not null check (tier in ('common', 'rare', 'legendary')),
  hidden boolean not null default false,
  primary key (game_id, id)
);

create table public.game_players ( -- nadirlik paydası
  user_id uuid not null references public.profiles on delete cascade,
  game_id text not null,
  first_played_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table public.user_achievements (
  user_id uuid not null references public.profiles on delete cascade,
  game_id text not null,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, game_id, achievement_id),
  foreign key (game_id, achievement_id) references public.achievements (game_id, id) on delete cascade
);
create index user_achievements_game_idx on public.user_achievements (game_id, achievement_id);
create index user_achievements_recent_idx on public.user_achievements (user_id, unlocked_at desc);
create index game_players_game_idx on public.game_players (game_id);

-- nadirlik: açan oyuncu / o oyunu oynayan oyuncu
create view public.achievement_rarity with (security_invoker = true) as
select a.game_id,
       a.id as achievement_id,
       coalesce(
         count(ua.user_id)::float / nullif((select count(*) from public.game_players gp where gp.game_id = a.game_id), 0),
         0
       ) as ratio
from public.achievements a
left join public.user_achievements ua on ua.game_id = a.game_id and ua.achievement_id = a.id
group by a.game_id, a.id;

-- ── RLS ve yetkiler ("Automatically expose new tables" kapalı: her yetki burada açıkça) ──

alter table public.profiles enable row level security;
alter table public.achievements enable row level security;
alter table public.game_players enable row level security;
alter table public.user_achievements enable row level security;

revoke all on public.profiles, public.achievements, public.game_players, public.user_achievements,
  public.achievement_rarity from anon, authenticated;

grant select on public.profiles, public.achievements, public.game_players, public.user_achievements,
  public.achievement_rarity to anon, authenticated;
-- Profilde kullanıcının değiştirebileceği sütunlar; id, avatar ve created_at değişmez.
grant update (username, display_name, showcase) on public.profiles to authenticated;

create policy "profiller herkese açık" on public.profiles for select to anon, authenticated using (true);
create policy "kişi kendi profilini günceller" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "başarım listesi herkese açık" on public.achievements for select to anon, authenticated using (true);
create policy "oynayanlar herkese açık" on public.game_players for select to anon, authenticated using (true);
create policy "açılan başarımlar herkese açık" on public.user_achievements for select to anon, authenticated using (true);

-- ── Tetikleyiciler ─────────────────────────────────────────────────────────

-- Yeni kullanıcıya boş profil (kullanıcı adı sonra seçilir).
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'user_name'), ''), 40),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Vitrin sadece kullanıcının açtığı başarımlardan oluşabilir; kullanıcı adı bir kez seçilir.
create function private.check_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.username is not null and new.username is distinct from old.username then
    raise exception 'username_locked';
  end if;
  if new.showcase is distinct from old.showcase then
    if (select count(distinct s) from unnest(new.showcase) s) <> cardinality(new.showcase) then
      raise exception 'showcase_duplicate';
    end if;
    if exists (
      select 1 from unnest(new.showcase) s
      where not exists (
        select 1 from public.user_achievements ua
        where ua.user_id = new.id and ua.game_id || ':' || ua.achievement_id = s
      )
    ) then
      raise exception 'showcase_not_owned';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_before_update before update on public.profiles
  for each row execute function private.check_profile_update();

-- ── RPC'ler ────────────────────────────────────────────────────────────────

-- Başarım aç. Yeni açıldıysa true, zaten açıksa false.
create function public.unlock_achievement(p_game_id text, p_achievement_id text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.achievements where game_id = p_game_id and id = p_achievement_id) then
    raise exception 'unknown_achievement';
  end if;
  if exists (select 1 from public.user_achievements
             where user_id = uid and game_id = p_game_id and achievement_id = p_achievement_id) then
    return false;
  end if;
  if (select count(*) from public.user_achievements
      where user_id = uid and unlocked_at > now() - interval '1 minute') >= 10 then
    raise exception 'rate_limited';
  end if;
  insert into public.game_players (user_id, game_id) values (uid, p_game_id) on conflict do nothing;
  insert into public.user_achievements (user_id, game_id, achievement_id) values (uid, p_game_id, p_achievement_id);
  return true;
end $$;

-- Misafirin o oturumdaki başarımlarını hesaba aktar: [{ "gameId", "id", "unlockedAt" }].
-- Bilinmeyenler atlanır; tarih son 24 saat ile şimdi arasına kırpılır; en erken tarih kalır. Aktarılan sayıyı döner.
create function public.merge_guest_achievements(items jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  merged integer;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 100 then raise exception 'invalid_items'; end if;

  with input as (
    select distinct on (i ->> 'gameId', i ->> 'id')
           i ->> 'gameId' as game_id,
           i ->> 'id' as achievement_id,
           least(now(), greatest(now() - interval '1 day',
             coalesce((i ->> 'unlockedAt')::timestamptz, now()))) as unlocked_at
    from jsonb_array_elements(items) i
  ), valid as (
    select input.* from input
    join public.achievements a on a.game_id = input.game_id and a.id = input.achievement_id
  ), players as (
    insert into public.game_players (user_id, game_id)
    select distinct uid, game_id from valid
    on conflict do nothing
  ), ins as (
    insert into public.user_achievements (user_id, game_id, achievement_id, unlocked_at)
    select uid, game_id, achievement_id, unlocked_at from valid
    on conflict (user_id, game_id, achievement_id)
      do update set unlocked_at = least(public.user_achievements.unlocked_at, excluded.unlocked_at)
    returning 1
  )
  select count(*) into merged from ins;
  return merged;
end $$;

-- Hesabı ve tüm verisini sil (profil ve başarımlar cascade ile gider).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  delete from auth.users where id = uid;
end $$;

revoke execute on function public.unlock_achievement(text, text), public.merge_guest_achievements(jsonb),
  public.delete_my_account() from public, anon;
grant execute on function public.unlock_achievement(text, text), public.merge_guest_achievements(jsonb),
  public.delete_my_account() to authenticated;
revoke execute on function private.handle_new_user(), private.check_profile_update() from public, anon, authenticated;
