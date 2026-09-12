-- Champions League 2026/27 - Week 2
-- Times are stored in UTC (Türkiye is UTC+3 in October).

insert into public.champions_league_fixtures(season,week,home_team,away_team,kickoff)
select v.season,v.week,v.home_team,v.away_team,v.kickoff
from (values
  ('2026/27',2,'Lens','Sporting CP','2026-10-13 16:45:00+00'::timestamptz),
  ('2026/27',2,'Sabah','Slavia Prag','2026-10-13 16:45:00+00'::timestamptz),
  ('2026/27',2,'Arsenal','Lille','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Galatasaray','Barcelona','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Leipzig','PSV','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Inter','Club Brugge','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Atletico Madrid','Manchester United','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Viking','Bayern Münih','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Villarreal','Napoli','2026-10-13 19:00:00+00'::timestamptz),
  ('2026/27',2,'Feyenoord','Como','2026-10-14 16:45:00+00'::timestamptz),
  ('2026/27',2,'LASK','Liverpool','2026-10-14 16:45:00+00'::timestamptz),
  ('2026/27',2,'Aston Villa','Fenerbahçe','2026-10-14 19:00:00+00'::timestamptz),
  ('2026/27',2,'Real Betis','Porto','2026-10-14 19:00:00+00'::timestamptz),
  ('2026/27',2,'Roma','Real Madrid','2026-10-14 19:00:00+00'::timestamptz),
  ('2026/27',2,'Manchester City','PSG','2026-10-14 19:00:00+00'::timestamptz),
  ('2026/27',2,'Shakhtar Donetsk','AEK','2026-10-14 19:00:00+00'::timestamptz),
  ('2026/27',2,'Bodo/Glimt','Borussia Dortmund','2026-10-14 19:00:00+00'::timestamptz),
  ('2026/27',2,'Slovan Bratislava','Stuttgart','2026-10-14 19:00:00+00'::timestamptz)
) as v(season,week,home_team,away_team,kickoff)
where not exists (
  select 1 from public.champions_league_fixtures f
  where f.season=v.season and f.week=v.week and f.home_team=v.home_team and f.away_team=v.away_team
);

-- Seed the same recommendation source used by the existing robot flow.
insert into public.robot_match_predictions(competition,fixture_id,season,week,home_score,away_score,source,generated_at)
select 'champions_league',f.id,f.season,f.week,v.home_score,v.away_score,'robot_model_v1',now()
from (values
  ('Lens','Sporting CP',1::smallint,2::smallint),
  ('Sabah','Slavia Prag',0::smallint,2::smallint),
  ('Arsenal','Lille',2::smallint,1::smallint),
  ('Galatasaray','Barcelona',1::smallint,2::smallint),
  ('Leipzig','PSV',2::smallint,1::smallint),
  ('Inter','Club Brugge',2::smallint,0::smallint),
  ('Atletico Madrid','Manchester United',1::smallint,1::smallint),
  ('Viking','Bayern Münih',0::smallint,3::smallint),
  ('Villarreal','Napoli',1::smallint,1::smallint),
  ('Feyenoord','Como',2::smallint,1::smallint),
  ('LASK','Liverpool',1::smallint,2::smallint),
  ('Aston Villa','Fenerbahçe',2::smallint,1::smallint),
  ('Real Betis','Porto',1::smallint,1::smallint),
  ('Roma','Real Madrid',1::smallint,2::smallint),
  ('Manchester City','PSG',2::smallint,2::smallint),
  ('Shakhtar Donetsk','AEK',2::smallint,1::smallint),
  ('Bodo/Glimt','Borussia Dortmund',1::smallint,2::smallint),
  ('Slovan Bratislava','Stuttgart',0::smallint,2::smallint)
) as v(home_team,away_team,home_score,away_score)
join public.champions_league_fixtures f
  on f.season='2026/27' and f.week=2 and f.home_team=v.home_team and f.away_team=v.away_team
where not exists (
  select 1 from public.robot_match_predictions r
  where r.competition='champions_league' and r.fixture_id=f.id and r.season=f.season and r.week=f.week
);

create or replace function public.get_champions_robot_predictions(p_season text, p_week integer)
returns table(fixture_id bigint, home_score smallint, away_score smallint)
language sql
stable
security definer
set search_path=''
as $$
  select r.fixture_id,r.home_score,r.away_score
  from public.robot_match_predictions r
  join public.champions_league_fixtures f on f.id=r.fixture_id
  where r.competition='champions_league'
    and r.season=p_season and r.week=p_week
    and f.season=p_season and f.week=p_week
  order by f.kickoff,f.id;
$$;
revoke all on function public.get_champions_robot_predictions(text,integer) from public;
grant execute on function public.get_champions_robot_predictions(text,integer) to anon, authenticated;

-- Opportunity scoring: Week 2 Manchester City - PSG gets x2 (2 / 8 points).
create or replace function public.champions_match_points(
  p_fixture_id bigint,
  p_home smallint,
  p_away smallint,
  r_home smallint,
  r_away smallint
) returns bigint
language plpgsql
stable
set search_path=''
as $$
declare
  base_points bigint := 0;
  multiplier bigint := 1;
begin
  if r_home is null or r_away is null or p_home is null or p_away is null then
    return 0;
  end if;
  if p_home=r_home and p_away=r_away then
    base_points := 4;
  elsif sign(p_home-p_away)=sign(r_home-r_away) then
    base_points := 1;
  end if;
  if exists (
    select 1 from public.champions_league_fixtures f
    where f.id=p_fixture_id and f.season='2026/27' and f.week=2
      and f.home_team='Manchester City' and f.away_team='PSG'
  ) then
    multiplier := 2;
  end if;
  return base_points * multiplier;
end;
$$;

-- Competition-aware statistics for Champions League matches. It derives form,
-- recent games and table points from already completed Champions League games.
create or replace function public.get_champions_match_statistics(p_fixture_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  target record;
  payload jsonb;
begin
  select * into target from public.champions_league_fixtures where id=p_fixture_id;
  if not found then return null; end if;

  with games as (
    select f.id as fixture_id,f.kickoff as date,f.home_team,f.away_team,r.home_score,r.away_score,r.updated_at
    from public.champions_league_fixtures f
    join public.champions_league_results r on r.fixture_id=f.id
    where f.season=target.season and f.kickoff<target.kickoff
      and r.home_score is not null and r.away_score is not null
  ), team_games as (
    select home_team as team,
           case when home_score>away_score then 3 when home_score=away_score then 1 else 0 end as pts
    from games
    union all
    select away_team as team,
           case when away_score>home_score then 3 when away_score=home_score then 1 else 0 end as pts
    from games
  ), standings as (
    select team,sum(pts)::int as points,dense_rank() over(order by sum(pts) desc,team)::int as rank
    from team_games group by team
  ), home_recent as (
    select * from games where home_team=target.home_team or away_team=target.home_team order by date desc limit 5
  ), away_recent as (
    select * from games where home_team=target.away_team or away_team=target.away_team order by date desc limit 5
  ), h2h as (
    select * from games
    where (home_team=target.home_team and away_team=target.away_team)
       or (home_team=target.away_team and away_team=target.home_team)
    order by date desc limit 5
  )
  select jsonb_build_object(
    'fixture_id',target.id,'week',target.week,'kickoff',target.kickoff,
    'home_team',target.home_team,'away_team',target.away_team,'fetched_at',now(),
    'home',jsonb_build_object(
      'name',target.home_team,
      'rank',(select rank from standings where team=target.home_team),
      'points',coalesce((select points from standings where team=target.home_team),0),
      'form',coalesce((select jsonb_agg(outcome order by date) from (
        select date,case when (home_team=target.home_team and home_score>away_score) or (away_team=target.home_team and away_score>home_score) then 'W'
                         when home_score=away_score then 'D' else 'L' end as outcome from home_recent order by date desc
      ) q),'[]'::jsonb),
      'recent_matches',coalesce((select jsonb_agg(jsonb_build_object('fixture_id',fixture_id,'date',date,'home_team',home_team,'away_team',away_team,'home_score',home_score,'away_score',away_score) order by date desc) from home_recent),'[]'::jsonb)
    ),
    'away',jsonb_build_object(
      'name',target.away_team,
      'rank',(select rank from standings where team=target.away_team),
      'points',coalesce((select points from standings where team=target.away_team),0),
      'form',coalesce((select jsonb_agg(outcome order by date) from (
        select date,case when (home_team=target.away_team and home_score>away_score) or (away_team=target.away_team and away_score>home_score) then 'W'
                         when home_score=away_score then 'D' else 'L' end as outcome from away_recent order by date desc
      ) q),'[]'::jsonb),
      'recent_matches',coalesce((select jsonb_agg(jsonb_build_object('fixture_id',fixture_id,'date',date,'home_team',home_team,'away_team',away_team,'home_score',home_score,'away_score',away_score) order by date desc) from away_recent),'[]'::jsonb)
    ),
    'head_to_head',coalesce((select jsonb_agg(jsonb_build_object('fixture_id',fixture_id,'date',date,'home_team',home_team,'away_team',away_team,'home_score',home_score,'away_score',away_score) order by date desc) from h2h),'[]'::jsonb)
  ) into payload;
  return payload;
end;
$$;
revoke all on function public.get_champions_match_statistics(bigint) from public;
grant execute on function public.get_champions_match_statistics(bigint) to anon, authenticated;
