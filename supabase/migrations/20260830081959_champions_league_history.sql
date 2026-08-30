create or replace function public.get_champions_league_history(
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
  week_points bigint,
  week_rank bigint,
  participant_count bigint,
  completed_count bigint,
  fixture_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player text;
  v_fixture_count bigint;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  select count(*) into v_fixture_count
  from public.champions_league_fixtures f
  where f.season=p_season and f.week=p_week;

  return query
  with complete_players as (
    select p.player_name
    from public.champions_league_predictions p
    join public.champions_league_fixtures f on f.id=p.fixture_id
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    where f.season=p_season and f.week=p_week
    group by p.player_name
    having count(distinct p.fixture_id) = v_fixture_count
  ), scored as (
    select cp.player_name,
      coalesce(sum(case
        when p.home_score=r.home_score and p.away_score=r.away_score then 4
        when r.fixture_id is not null
          and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score) then 1
        else 0 end),0)::bigint as points,
      count(*) filter (
        where p.home_score=r.home_score and p.away_score=r.away_score
      )::bigint as exact_count,
      count(*) filter (
        where r.fixture_id is not null
          and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
      )::bigint as correct_count
    from complete_players cp
    join public.champions_league_predictions p on p.player_name=cp.player_name
    join public.champions_league_fixtures f on f.id=p.fixture_id
      and f.season=p_season and f.week=p_week
    left join public.champions_league_results r on r.fixture_id=f.id
    group by cp.player_name
  ), ranked as (
    select s.*,
      rank() over(order by s.points desc,s.exact_count desc,s.correct_count desc) as player_rank
    from scored s
  ), summary as (
    select
      coalesce((select r.points from ranked r where r.player_name=v_player),0)::bigint as points,
      (select r.player_rank from ranked r where r.player_name=v_player)::bigint as player_rank,
      (select count(*) from complete_players)::bigint as participants,
      (select count(*)
       from public.champions_league_results cr
       join public.champions_league_fixtures cf on cf.id=cr.fixture_id
       where cf.season=p_season and cf.week=p_week)::bigint as completed
  )
  select f.id,f.home_team,f.away_team,f.kickoff,
    p.home_score,p.away_score,r.home_score,r.away_score,
    s.points,s.player_rank,s.participants,s.completed,v_fixture_count
  from public.champions_league_fixtures f
  left join public.champions_league_predictions p
    on p.fixture_id=f.id and p.player_name=v_player
  left join public.champions_league_results r on r.fixture_id=f.id
  cross join summary s
  where f.season=p_season and f.week=p_week
  order by f.kickoff,f.id;
end
$$;

revoke execute on function public.get_champions_league_history(text,text,integer)
  from public, authenticated;
grant execute on function public.get_champions_league_history(text,text,integer)
  to anon;
