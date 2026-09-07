create or replace function public.get_player_public_profile(p_token text,p_player_name text)
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
  kickoff timestamptz,
  predicted_home smallint,
  predicted_away smallint,
  real_home smallint,
  real_away smallint,
  match_points bigint
)
language plpgsql
security definer
set search_path=''
as $$
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

  select max(f.week) into v_week from public.fixtures f where f.kickoff<=now();
  if v_week is null then select min(f.week) into v_week from public.fixtures f; end if;
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
      (select cr.league_rank from champions_row cr limit 1)::bigint as europe_rank
    from (values(1)) seed(x)
    left join week_ranked wr on wr.player_name=v_target
  )
  select s.name,s.current_week,s.player_rank,s.points,s.exact_count,s.correct_count,
    s.overall_rank,s.award_rank,s.europe_rank,
    case when v_week_four_complete then 'champions' else 'sezu' end,
    f.id,f.home_team,f.away_team,f.kickoff,
    case when v_player=v_target or f.kickoff<=now() then p.home_score else null end,
    case when v_player=v_target or f.kickoff<=now() then p.away_score else null end,
    r.home_score,r.away_score,
    case
      when r.fixture_id is null or p.fixture_id is null then 0
      when p.home_score=r.home_score and p.away_score=r.away_score
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
      when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
      else 0 end::bigint
  from summary s
  left join public.fixtures f on f.week=s.current_week
  left join public.predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$$;

revoke all on function public.get_player_public_profile(text,text) from public,authenticated;
grant execute on function public.get_player_public_profile(text,text) to anon;
