create table if not exists public.champions_league_one_time_unlocks (
  player_id bigint not null references public.players(id) on delete cascade,
  season text not null,
  week integer not null check (week > 0),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (player_id, season, week)
);

alter table public.champions_league_one_time_unlocks enable row level security;
revoke all on table public.champions_league_one_time_unlocks from public, anon, authenticated;
grant all on table public.champions_league_one_time_unlocks to service_role;

insert into public.champions_league_one_time_unlocks(player_id, season, week)
select p.id, '2026/27', 1
from public.players p
where p.name = 'HAFSA'
on conflict (player_id, season, week) do update
set consumed_at = null;

create or replace function public.get_champions_league_week(
  p_token text,
  p_season text,
  p_week integer
) returns table(
  fixture_id bigint,
  home_team text,
  away_team text,
  kickoff timestamptz,
  predicted_home smallint,
  predicted_away smallint,
  real_home smallint,
  real_away smallint,
  is_locked boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player text;
  v_player_id bigint;
  v_lock_time timestamptz;
  v_has_unlock boolean := false;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;

  select p.id into v_player_id
  from public.players p
  where p.name = v_player;

  select min(f.kickoff) into v_lock_time
  from public.champions_league_fixtures f
  where f.season=p_season and f.week=p_week;

  select exists(
    select 1
    from public.champions_league_one_time_unlocks u
    where u.player_id = v_player_id
      and u.season = p_season
      and u.week = p_week
      and u.consumed_at is null
  ) into v_has_unlock;

  return query
  select f.id,f.home_team,f.away_team,f.kickoff,p.home_score,p.away_score,r.home_score,r.away_score,
         (coalesce(now() >= v_lock_time,false) and not v_has_unlock)
  from public.champions_league_fixtures f
  left join public.champions_league_predictions p on p.fixture_id=f.id and p.player_name=v_player
  left join public.champions_league_results r on r.fixture_id=f.id
  where f.season=p_season and f.week=p_week
  order by f.kickoff,f.id;
end
$$;

create or replace function public.save_champions_league_predictions(
  p_token text,
  p_season text,
  p_week integer,
  p_predictions jsonb
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player text;
  v_player_id bigint;
  v_lock_time timestamptz;
  v_fixture_count integer;
  v_valid_count integer;
  v_has_unlock boolean := false;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  if jsonb_typeof(p_predictions) <> 'array' then raise exception 'Tahmin listesi geçersiz'; end if;

  select p.id into v_player_id
  from public.players p
  where p.name = v_player;

  select min(f.kickoff),count(*) into v_lock_time,v_fixture_count
  from public.champions_league_fixtures f
  where f.season=p_season and f.week=p_week;
  if v_fixture_count=0 then raise exception 'Fikstür bulunamadı'; end if;

  select exists(
    select 1
    from public.champions_league_one_time_unlocks u
    where u.player_id = v_player_id
      and u.season = p_season
      and u.week = p_week
      and u.consumed_at is null
  ) into v_has_unlock;

  if now() >= v_lock_time and not v_has_unlock then raise exception 'Tahmin süresi doldu'; end if;
  if jsonb_array_length(p_predictions)<>v_fixture_count then raise exception 'Tüm maçları doldurun'; end if;

  with submitted as (
    select x.fixture_id,x.home_score,x.away_score
    from jsonb_to_recordset(p_predictions) as x(fixture_id bigint,home_score integer,away_score integer)
  )
  select count(distinct s.fixture_id) into v_valid_count
  from submitted s
  join public.champions_league_fixtures f on f.id=s.fixture_id
  where f.season=p_season and f.week=p_week
    and s.home_score between 0 and 20 and s.away_score between 0 and 20;
  if v_valid_count<>v_fixture_count then raise exception 'Tahminler eksik veya geçersiz'; end if;

  insert into public.champions_league_predictions(player_name,fixture_id,home_score,away_score,updated_at)
  select v_player,x.fixture_id,x.home_score::smallint,x.away_score::smallint,now()
  from jsonb_to_recordset(p_predictions) as x(fixture_id bigint,home_score integer,away_score integer)
  on conflict (player_name,fixture_id) do update
  set home_score=excluded.home_score,away_score=excluded.away_score,updated_at=now();

  if v_has_unlock then
    update public.champions_league_one_time_unlocks u
    set consumed_at = now()
    where u.player_id = v_player_id
      and u.season = p_season
      and u.week = p_week
      and u.consumed_at is null;
  end if;

  return true;
end
$$;

revoke execute on function public.get_champions_league_week(text,text,integer) from public, authenticated;
revoke execute on function public.save_champions_league_predictions(text,text,integer,jsonb) from public, authenticated;
grant execute on function public.get_champions_league_week(text,text,integer) to anon;
grant execute on function public.save_champions_league_predictions(text,text,integer,jsonb) to anon;
