create or replace function public.get_match_statistics(p_fixture_id bigint)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with target as (
    select
      s.payload,
      s.fixture_id,
      s.week,
      s.season,
      s.home_team,
      s.away_team,
      s.fetched_at,
      f.kickoff
    from public.match_statistics_snapshots s
    join public.fixtures f on f.id=s.fixture_id
    where s.fixture_id=p_fixture_id
  )
  select t.payload || jsonb_build_object(
    'fixture_id',t.fixture_id,
    'week',t.week,
    'home_team',t.home_team,
    'away_team',t.away_team,
    'kickoff',t.kickoff,
    'fetched_at',t.fetched_at,
    '_game_results',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'fixture_id',f.id,
          'date',f.kickoff,
          'home_team',f.home_team,
          'away_team',f.away_team,
          'home_score',r.home_score,
          'away_score',r.away_score,
          'updated_at',r.updated_at
        ) order by f.kickoff desc,f.id desc
      )
      from public.fixtures f
      join public.results r on r.fixture_id=f.id
      where f.season=t.season
        and f.kickoff<t.kickoff
        and r.home_score is not null
        and r.away_score is not null
    ),'[]'::jsonb),
    '_standings',coalesce((
      with team_games as (
        select
          f.home_team as team,
          1 as played,
          (r.home_score>r.away_score)::int as win,
          (r.home_score=r.away_score)::int as draw,
          (r.home_score<r.away_score)::int as lose,
          r.home_score as goals_for,
          r.away_score as goals_against,
          case when r.home_score>r.away_score then 3 when r.home_score=r.away_score then 1 else 0 end as points
        from public.fixtures f
        join public.results r on r.fixture_id=f.id
        where f.season=t.season and f.kickoff<t.kickoff
          and r.home_score is not null and r.away_score is not null
        union all
        select
          f.away_team,
          1,
          (r.away_score>r.home_score)::int,
          (r.away_score=r.home_score)::int,
          (r.away_score<r.home_score)::int,
          r.away_score,
          r.home_score,
          case when r.away_score>r.home_score then 3 when r.away_score=r.home_score then 1 else 0 end
        from public.fixtures f
        join public.results r on r.fixture_id=f.id
        where f.season=t.season and f.kickoff<t.kickoff
          and r.home_score is not null and r.away_score is not null
      ), totals as (
        select team,sum(played) as played,sum(win) as win,sum(draw) as draw,sum(lose) as lose,
          sum(goals_for) as goals_for,sum(goals_against) as goals_against,
          sum(goals_for-goals_against) as goal_diff,sum(points) as points
        from team_games group by team
      ), ranked as (
        select *,rank() over(order by points desc,goal_diff desc,goals_for desc,team) as rank
        from totals
      )
      select jsonb_agg(to_jsonb(ranked) order by rank,team) from ranked
    ),'[]'::jsonb)
  )
  from target t;
$$;

revoke all on function public.get_match_statistics(bigint) from public;
grant execute on function public.get_match_statistics(bigint) to anon,authenticated;
