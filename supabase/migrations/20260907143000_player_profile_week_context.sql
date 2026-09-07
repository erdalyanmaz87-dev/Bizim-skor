create or replace function public.get_player_public_profile(p_token text,p_player_name text,p_week integer)
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
  else
    return query select * from public.get_player_public_profile(p_token,v_target);
    return;
  end if;

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
    where p.week=p_week
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
  ), current_summary as (
    select cp.general_rank,cp.sezu_rank,cp.champions_rank,cp.special_kind
    from public.get_player_public_profile(p_token,v_target) cp
    limit 1
  ), summary as (
    select v_target as name,p_week as selected_week,
      wr.player_rank,coalesce(wr.points,0)::bigint as points,
      coalesce(wr.exact_count,0)::bigint as exact_count,coalesce(wr.correct_count,0)::bigint as correct_count,
      cs.general_rank,cs.sezu_rank,cs.champions_rank,cs.special_kind
    from current_summary cs
    left join week_ranked wr on wr.player_name=v_target
  )
  select s.name,s.selected_week,s.player_rank,s.points,s.exact_count,s.correct_count,
    s.general_rank,s.sezu_rank,s.champions_rank,s.special_kind,
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
      else 0 end::bigint
  from summary s
  left join public.fixtures f on f.week=s.selected_week
  left join public.predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$$;

revoke all on function public.get_player_public_profile(text,text,integer) from public,authenticated;
grant execute on function public.get_player_public_profile(text,text,integer) to anon;
