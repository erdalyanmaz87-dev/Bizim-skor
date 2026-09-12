-- 8. maddeyi tüm ana sıralamalarda yeniden tek kaynak haline getirir.
-- Kural: ilk üç derece içinde aynı puan aynı sırayı paylaşır.
-- İlk üç dereceden sonra oyuncular 4,5,6... diye tek tek sıralanır;
-- eşit puanda tam skor > doğru sonuç > daha eski kayıt zamanı önceliklidir.
-- Davet sayısı oyun içi sıralama eşitlik kriteri değildir.

create or replace function public.get_super_league_general_ranking()
returns table(
  player_name text,
  total_points integer,
  exact_scores integer,
  correct_results integer,
  league_rank bigint
)
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
with scored as (
  select
    pl.name::text as player_name,
    pl.created_at,
    case
      when pr.home_score=r.home_score and pr.away_score=r.away_score then
        case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 8 else 4 end
      when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then
        case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 2 else 1 end
      else 0
    end::integer as points,
    case when pr.home_score=r.home_score and pr.away_score=r.away_score then 1 else 0 end::integer as exact_score,
    case when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then 1 else 0 end::integer as correct_result
  from public.players pl
  join public.predictions pr on lower(pr.player_name)=lower(pl.name)
  join public.results r on r.fixture_id=pr.fixture_id
  where pl.is_active=true
    and r.home_score is not null
    and r.away_score is not null
), totals as (
  select
    player_name,
    min(created_at) as created_at,
    sum(points)::integer as total_points,
    sum(exact_score)::integer as exact_scores,
    sum(correct_result)::integer as correct_results
  from scored
  group by player_name
), point_ranked as (
  select
    t.*,
    dense_rank() over(order by t.total_points desc) as point_rank
  from totals t
), ranked as (
  select
    p.*,
    case
      when p.point_rank<=3 then p.point_rank
      else 3+row_number() over(
        partition by (p.point_rank>3)
        order by p.total_points desc,p.exact_scores desc,p.correct_results desc,p.created_at,p.player_name collate "tr-x-icu"
      )
    end::bigint as display_rank
  from point_ranked p
)
select
  r.player_name,r.total_points,r.exact_scores,r.correct_results,r.display_rank as league_rank
from ranked r
order by r.display_rank,r.player_name collate "tr-x-icu";
$function$;

create or replace function public.get_friend_league_ranking(p_token text,p_league_id uuid)
returns table(
  league_rank bigint,
  player_name text,
  points bigint,
  exact_count bigint,
  correct_count bigint,
  score_start_week integer
)
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_player text;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  if not exists(
    select 1 from public.friend_league_members membership
    where membership.league_id=p_league_id and membership.player_name=v_player
  ) then raise exception 'Bu ligi görme yetkin yok'; end if;

  return query
  with totals as (
    select
      membership.player_name,
      membership.score_start_week,
      pl.created_at,
      coalesce(sum(
        case when result.home_score is null or result.away_score is null then 0 else
          ((case when
            (prediction.home_score>prediction.away_score and result.home_score>result.away_score) or
            (prediction.home_score<prediction.away_score and result.home_score<result.away_score) or
            (prediction.home_score=prediction.away_score and result.home_score=result.away_score)
          then 1 else 0 end)
          +(case when prediction.home_score=result.home_score and prediction.away_score=result.away_score then 3 else 0 end))
          *(case when (prediction.fixture_id=30 and prediction.week=4) or (prediction.fixture_id=44 and prediction.week=5) then 2 else 1 end)
        end
      ),0)::bigint as points,
      coalesce(sum(case when prediction.home_score=result.home_score and prediction.away_score=result.away_score and result.home_score is not null and result.away_score is not null then 1 else 0 end),0)::bigint as exact_count,
      coalesce(sum(case when result.home_score is not null and result.away_score is not null and (
        (prediction.home_score>prediction.away_score and result.home_score>result.away_score) or
        (prediction.home_score<prediction.away_score and result.home_score<result.away_score) or
        (prediction.home_score=prediction.away_score and result.home_score=result.away_score)
      ) then 1 else 0 end),0)::bigint as correct_count
    from public.friend_league_members membership
    join public.players pl on pl.name=membership.player_name
    left join public.predictions prediction on prediction.player_name=membership.player_name and prediction.week>=membership.score_start_week
    left join public.results result on result.fixture_id=prediction.fixture_id
    where membership.league_id=p_league_id
    group by membership.player_name,membership.score_start_week,pl.created_at
  ), point_ranked as (
    select t.*,dense_rank() over(order by t.points desc) as point_rank
    from totals t
  ), ranked as (
    select
      p.*,
      case
        when p.point_rank<=3 then p.point_rank
        else 3+row_number() over(
          partition by (p.point_rank>3)
          order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-x-icu"
        )
      end::bigint as display_rank
    from point_ranked p
  )
  select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count,r.score_start_week
  from ranked r
  order by r.display_rank,r.player_name collate "tr-x-icu";
end
$function$;

create or replace function public.get_champions_league_ranking(p_token text,p_season text)
returns table(
  league_rank bigint,
  player_name text,
  points bigint,
  exact_count bigint,
  correct_count bigint
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_player text;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;

  return query
  with scored as (
    select
      p.player_name,
      pl.created_at,
      coalesce(sum(public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint as points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::bigint as exact_count,
      count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint as correct_count
    from public.champions_league_predictions p
    join public.champions_league_fixtures f on f.id=p.fixture_id and f.season=p_season
    left join public.champions_league_results r on r.fixture_id=f.id
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    group by p.player_name,pl.created_at
  ), point_ranked as (
    select s.*,dense_rank() over(order by s.points desc) as point_rank
    from scored s
  ), ranked as (
    select
      p.*,
      case
        when p.point_rank<=3 then p.point_rank
        else 3+row_number() over(
          partition by (p.point_rank>3)
          order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-TR-x-icu"
        )
      end::bigint as display_rank
    from point_ranked p
  )
  select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count
  from ranked r
  order by r.display_rank,r.player_name collate "tr-TR-x-icu";
end
$function$;

create or replace function public.get_nations_league_ranking(p_token text,p_season text default '2026/27'::text)
returns table(
  league_rank bigint,
  player_name text,
  points bigint,
  exact_count bigint,
  correct_count bigint
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_player text;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;

  return query
  with scored as (
    select
      p.player_name,
      pl.created_at,
      coalesce(sum(public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint as points,
      count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint as exact_count,
      count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint as correct_count
    from public.nations_league_predictions p
    join public.nations_league_fixtures f on f.id=p.fixture_id and f.season=p_season
    left join public.nations_league_results r on r.fixture_id=f.id
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    group by p.player_name,pl.created_at
  ), point_ranked as (
    select s.*,dense_rank() over(order by s.points desc) as point_rank
    from scored s
  ), ranked as (
    select
      p.*,
      case
        when p.point_rank<=3 then p.point_rank
        else 3+row_number() over(
          partition by (p.point_rank>3)
          order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-TR-x-icu"
        )
      end::bigint as display_rank
    from point_ranked p
  )
  select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count
  from ranked r
  order by r.display_rank,r.player_name collate "tr-TR-x-icu";
end
$function$;

create or replace function public.league_historical_seed_scores(p_before timestamptz)
returns table(
  player_id bigint,
  performance_score numeric,
  valid_round_count integer,
  exact_score_count integer,
  raw_points bigint
)
language sql
stable
security definer
set search_path to ''
as $function$
  with seed_season as (
    select f.season
    from public.fixtures f
    where f.week=4 and f.kickoff<p_before
    group by f.season
    order by max(f.kickoff) desc
    limit 1
  ), target_rounds as (
    select f.season,f.week,count(distinct f.id)::integer as fixture_count
    from public.fixtures f
    cross join seed_season ss
    left join public.results r on r.fixture_id=f.id
    where f.season=ss.season
      and f.week in (3,4)
      and f.kickoff<p_before
    group by f.season,f.week
    having count(distinct f.id)>0
       and count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)=count(distinct f.id)
  ), complete_players as (
    select tr.season,tr.week,tr.fixture_count,p.player_name
    from target_rounds tr
    join public.fixtures f on f.season=tr.season and f.week=tr.week
    join public.predictions p on p.fixture_id=f.id
    group by tr.season,tr.week,tr.fixture_count,p.player_name
    having count(distinct p.fixture_id)=tr.fixture_count
  ), scored as (
    select
      pl.id as player_id,
      cp.season,
      cp.week,
      pl.name as player_name,
      pl.created_at,
      coalesce(sum(public.league_super_match_points(
        f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score
      )),0)::bigint as points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
      count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
    from complete_players cp
    join public.players pl on lower(pl.name)=lower(cp.player_name) and coalesce(pl.is_active,true)
    join public.predictions p on lower(p.player_name)=lower(cp.player_name)
    join public.fixtures f on f.id=p.fixture_id and f.season=cp.season and f.week=cp.week
    join public.results r on r.fixture_id=f.id
    group by pl.id,cp.season,cp.week,pl.name,pl.created_at
  ), point_ranked as (
    select
      s.*,
      dense_rank() over(
        partition by s.season,s.week
        order by s.points desc
      )::integer as point_rank,
      count(*) over(partition by s.season,s.week)::integer as participant_count
    from scored s
  ), ranked as (
    select
      p.*,
      case
        when p.point_rank<=3 then p.point_rank
        else 3+row_number() over(
          partition by p.season,p.week,(p.point_rank>3)
          order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-x-icu"
        )
      end::integer as round_rank
    from point_ranked p
  ), normalized as (
    select
      r.player_id,
      r.week,
      public.league_normalized_performance(r.round_rank,r.participant_count) as performance_score,
      r.exact_count,
      r.points
    from ranked r
    where r.participant_count>=2
  ), players_in_window as (
    select distinct player_id from normalized
  ), two_week as (
    select
      p.player_id,
      round((coalesce(w3.performance_score,0)+coalesce(w4.performance_score,0))/2.0,2)::numeric(6,2) as performance_score,
      ((case when w3.player_id is not null then 1 else 0 end)
       +(case when w4.player_id is not null then 1 else 0 end))::integer as valid_round_count,
      (coalesce(w3.exact_count,0)+coalesce(w4.exact_count,0))::integer as exact_score_count,
      (coalesce(w3.points,0)+coalesce(w4.points,0))::bigint as raw_points
    from players_in_window p
    left join normalized w3 on w3.player_id=p.player_id and w3.week=3
    left join normalized w4 on w4.player_id=p.player_id and w4.week=4
  )
  select t.player_id,t.performance_score,t.valid_round_count,t.exact_score_count,t.raw_points
  from two_week t;
$function$;
