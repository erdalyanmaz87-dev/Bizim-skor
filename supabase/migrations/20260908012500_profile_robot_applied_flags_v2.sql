create or replace function public.get_player_public_profile_v2(
  p_token text,
  p_player_name text,
  p_week integer default null
)
returns table(
  player_name text,
  week integer,
  week_rank bigint,
  week_points bigint,
  week_exact bigint,
  week_correct bigint,
  general_rank bigint,
  sezu_rank bigint,
  champions_rank bigint,
  special_kind text,
  fixture_id bigint,
  home_team text,
  away_team text,
  kickoff timestamp with time zone,
  predicted_home smallint,
  predicted_away smallint,
  real_home smallint,
  real_away smallint,
  match_points bigint,
  robot_applied boolean,
  participant_count bigint,
  completed_count bigint,
  fixture_count bigint
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_player text;
  v_target text;
  v_week integer;
  v_week_four_complete boolean;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  select p.name into v_target
  from public.players p
  where lower(trim(p.name))=lower(trim(p_player_name)) and coalesce(p.is_active,true)
  limit 1;
  if v_target is null then raise exception 'Oyuncu bulunamadı'; end if;

  if p_week is not null then
    if not exists(select 1 from public.fixtures f where f.week=p_week) then
      raise exception 'Hafta bulunamadı';
    end if;
    v_week:=p_week;
  else
    select max(f.week) into v_week from public.fixtures f where f.kickoff<=now();
    if v_week is null then select min(f.week) into v_week from public.fixtures f; end if;
  end if;

  select exists(select 1 from public.fixtures f where f.week=4)
    and not exists(
      select 1
      from public.fixtures f
      left join public.results r on r.fixture_id=f.id
      where f.week=4 and (r.fixture_id is null or r.home_score is null or r.away_score is null)
    ) into v_week_four_complete;

  return query
  with week_totals as (
    select p.player_name,
      coalesce(sum(case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
        else 0 end),0)::bigint as points,
      count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint as exact_count,
      count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint as correct_count
    from public.predictions p
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    left join public.results r on r.fixture_id=p.fixture_id
    where p.week=v_week
    group by p.player_name
  ), week_point_ranked as (
    select wt.*,pl.created_at,dense_rank() over(order by wt.points desc) as point_rank
    from week_totals wt join public.players pl on pl.name=wt.player_name
  ), week_ranked as (
    select wpr.*,
      case when wpr.point_rank<=3 then wpr.point_rank else 3+
        row_number() over(partition by (wpr.point_rank>3)
          order by wpr.points desc,wpr.exact_count desc,wpr.correct_count desc,wpr.created_at,wpr.player_name collate "tr-x-icu")
      end as player_rank
    from week_point_ranked wpr
  ), sezu_totals as (
    select p.player_name,
      coalesce(sum(case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when p.week=4 and p.fixture_id=30 then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when p.week=4 and p.fixture_id=30 then 2 else 1 end
        else 0 end),0)::bigint as points
    from public.predictions p
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    left join public.results r on r.fixture_id=p.fixture_id
    where p.week in(3,4)
    group by p.player_name
  ), sezu_point_ranked as (
    select st.*,pl.created_at,dense_rank() over(order by st.points desc) as point_rank
    from sezu_totals st join public.players pl on pl.name=st.player_name
  ), sezu_ranked as (
    select spr.*,
      case when spr.point_rank<=3 then spr.point_rank else 3+
        row_number() over(partition by (spr.point_rank>3)
          order by spr.points desc,spr.created_at,spr.player_name collate "tr-x-icu")
      end as player_rank
    from sezu_point_ranked spr
  ), general_row as (
    select g.league_rank from public.get_super_league_general_ranking() g where g.player_name=v_target
  ), champions_row as (
    select c.league_rank from public.get_champions_league_ranking(p_token,'2026/27') c where c.player_name=v_target
  ), summary as (
    select v_target as name,v_week as current_week,
      wr.player_rank,coalesce(wr.points,0)::bigint as points,
      coalesce(wr.exact_count,0)::bigint as exact_count,coalesce(wr.correct_count,0)::bigint as correct_count,
      (select g.league_rank from general_row g limit 1)::bigint as overall_rank,
      (select sr.player_rank from sezu_ranked sr where sr.player_name=v_target)::bigint as award_rank,
      (select cr.league_rank from champions_row cr limit 1)::bigint as europe_rank,
      (select count(distinct p.player_name) from public.predictions p join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true) where p.week=v_week)::bigint as participants,
      (select count(*) from public.results r join public.fixtures f on f.id=r.fixture_id where f.week=v_week and r.home_score is not null and r.away_score is not null)::bigint as completed,
      (select count(*) from public.fixtures f where f.week=v_week)::bigint as fixture_total
    from (values(1)) seed(x)
    left join week_ranked wr on wr.player_name=v_target
  )
  select s.name,s.current_week,s.player_rank,s.points,s.exact_count,s.correct_count,
    s.overall_rank,s.award_rank,s.europe_rank,
    case when v_week_four_complete then 'champions' else 'sezu' end,
    f.id,f.home_team,f.away_team,f.kickoff,
    case when v_player=v_target or f.kickoff<=now() then p.home_score::smallint else null::smallint end,
    case when v_player=v_target or f.kickoff<=now() then p.away_score::smallint else null::smallint end,
    r.home_score::smallint,r.away_score::smallint,
    case
      when r.fixture_id is null or p.fixture_id is null then 0
      when p.home_score=r.home_score and p.away_score=r.away_score
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
      when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
      else 0 end::bigint,
    case when v_player=v_target or f.kickoff<=now() then coalesce(p.robot_applied,false) else false end,
    s.participants,s.completed,s.fixture_total
  from summary s
  left join public.fixtures f on f.week=s.current_week
  left join public.predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$function$;

create or replace function public.get_champions_league_player_profile_v2(
  p_token text,
  p_player_name text,
  p_season text default '2026/27',
  p_week integer default null
)
returns table(
  player_name text,
  week integer,
  week_rank bigint,
  week_points bigint,
  week_exact bigint,
  week_correct bigint,
  general_rank bigint,
  sezu_rank bigint,
  champions_rank bigint,
  special_kind text,
  fixture_id bigint,
  home_team text,
  away_team text,
  kickoff timestamp with time zone,
  predicted_home smallint,
  predicted_away smallint,
  real_home smallint,
  real_away smallint,
  match_points bigint,
  robot_applied boolean,
  participant_count bigint,
  completed_count bigint,
  fixture_count bigint
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_player text;
  v_target text;
  v_week integer;
  v_fixture_count bigint;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  select p.name into v_target
  from public.players p
  where lower(trim(p.name))=lower(trim(p_player_name)) and coalesce(p.is_active,true)
  limit 1;
  if v_target is null then raise exception 'Oyuncu bulunamadı'; end if;

  if p_week is not null then
    v_week := p_week;
  else
    select max(f.week) into v_week from public.champions_league_fixtures f where f.season=p_season and f.kickoff<=now();
    if v_week is null then select min(f.week) into v_week from public.champions_league_fixtures f where f.season=p_season; end if;
  end if;

  if v_week is null or not exists(select 1 from public.champions_league_fixtures f where f.season=p_season and f.week=v_week) then
    raise exception 'Şampiyonlar Ligi haftası bulunamadı';
  end if;

  select count(*) into v_fixture_count from public.champions_league_fixtures f where f.season=p_season and f.week=v_week;

  return query
  with complete_players as (
    select p.player_name
    from public.champions_league_predictions p
    join public.champions_league_fixtures f on f.id=p.fixture_id
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    where f.season=p_season and f.week=v_week
    group by p.player_name
    having count(distinct p.fixture_id)=v_fixture_count
  ), scored as (
    select cp.player_name,pl.created_at,
      coalesce(sum(public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint as points,
      count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint as exact_count,
      count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint as correct_count
    from complete_players cp
    join public.players pl on pl.name=cp.player_name
    join public.champions_league_predictions p on p.player_name=cp.player_name
    join public.champions_league_fixtures f on f.id=p.fixture_id and f.season=p_season and f.week=v_week
    left join public.champions_league_results r on r.fixture_id=f.id
    group by cp.player_name,pl.created_at
  ), point_ranked as (
    select s.*,dense_rank() over(order by s.points desc) point_rank from scored s
  ), ranked as (
    select p.*,case when p.point_rank<=3 then p.point_rank else 3+row_number() over(partition by (p.point_rank>3) order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-TR-x-icu") end player_rank
    from point_ranked p
  ), champions_general as (
    select c.league_rank from public.get_champions_league_ranking(p_token,p_season) c where c.player_name=v_target limit 1
  ), summary as (
    select v_target as name,v_week as current_week,
      r.player_rank::bigint as player_rank,
      coalesce(r.points,0)::bigint as points,
      coalesce(r.exact_count,0)::bigint as exact_count,
      coalesce(r.correct_count,0)::bigint as correct_count,
      (select cg.league_rank from champions_general cg limit 1)::bigint as europe_rank,
      (select count(*) from complete_players)::bigint as participants,
      (select count(*) from public.champions_league_results cr join public.champions_league_fixtures cf on cf.id=cr.fixture_id where cf.season=p_season and cf.week=v_week)::bigint as completed
    from (values(1)) seed(x)
    left join ranked r on r.player_name=v_target
  )
  select s.name,s.current_week,s.player_rank,s.points,s.exact_count,s.correct_count,
    null::bigint,null::bigint,s.europe_rank,'champions_week'::text,
    f.id,f.home_team,f.away_team,f.kickoff,
    case when v_player=v_target or f.kickoff<=now() then p.home_score::smallint else null::smallint end,
    case when v_player=v_target or f.kickoff<=now() then p.away_score::smallint else null::smallint end,
    r.home_score::smallint,r.away_score::smallint,
    public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)::bigint,
    case when v_player=v_target or f.kickoff<=now() then coalesce(p.robot_applied,false) else false end,
    s.participants,s.completed,v_fixture_count
  from summary s
  join public.champions_league_fixtures f on f.season=p_season and f.week=s.current_week
  left join public.champions_league_predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.champions_league_results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$function$;

grant execute on function public.get_player_public_profile_v2(text,text,integer) to anon, authenticated;
grant execute on function public.get_champions_league_player_profile_v2(text,text,text,integer) to anon, authenticated;
notify pgrst, 'reload schema';
