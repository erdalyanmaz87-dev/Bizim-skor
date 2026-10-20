create temporary table old_match_points on commit drop as with scored as (select 'super_lig' as competition,p.fixture_id,p.player_name,public.league_super_match_points(f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score) as points from public.predictions p join public.fixtures f on f.id=p.fixture_id join public.results r on r.fixture_id=f.id union all select 'champions_league',p.fixture_id,p.player_name,public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score) from public.champions_league_predictions p join public.champions_league_fixtures f on f.id=p.fixture_id join public.champions_league_results r on r.fixture_id=f.id union all select 'nations_league',p.fixture_id,p.player_name,public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score) from public.nations_league_predictions p join public.nations_league_fixtures f on f.id=p.fixture_id join public.nations_league_results r on r.fixture_id=f.id) select * from scored;
create temporary table old_general_ranking on commit drop as select * from public.get_super_league_general_ranking();
create temporary table old_arena_rounds on commit drop as select * from public.league_round_performance;

alter table public.fixtures add column scoring_version smallint not null default 1 check(scoring_version in (1,2));
update public.fixtures set scoring_version=2 where kickoff>='2026-10-20 00:00:00+03'::timestamptz;
alter table public.fixtures alter column scoring_version set default 2;

alter table public.champions_league_fixtures add column scoring_version smallint not null default 1 check(scoring_version in (1,2));
update public.champions_league_fixtures set scoring_version=2 where kickoff>='2026-10-20 00:00:00+03'::timestamptz;
alter table public.champions_league_fixtures alter column scoring_version set default 2;

alter table public.nations_league_fixtures add column scoring_version smallint not null default 1 check(scoring_version in (1,2));
update public.nations_league_fixtures set scoring_version=2 where kickoff>='2026-10-20 00:00:00+03'::timestamptz;
alter table public.nations_league_fixtures alter column scoring_version set default 2;


create function public.assign_fixture_scoring_version() returns trigger language plpgsql set search_path='' as $$
begin
 new.scoring_version:=case when new.kickoff>='2026-10-20 00:00:00+03'::timestamptz then 2 else 1 end;
 return new;
end;$$;
revoke all on function public.assign_fixture_scoring_version() from public,anon,authenticated;


create trigger fixture_scoring_version_before_insert before insert on public.fixtures for each row execute function public.assign_fixture_scoring_version();

create trigger fixture_scoring_version_before_insert before insert on public.champions_league_fixtures for each row execute function public.assign_fixture_scoring_version();

create trigger fixture_scoring_version_before_insert before insert on public.nations_league_fixtures for each row execute function public.assign_fixture_scoring_version();


create function public.is_new_scoring_fixture(p_competition text,p_fixture_id bigint) returns boolean language sql stable set search_path='' as $$
 select coalesce(case p_competition
 when 'super_lig' then (select f.scoring_version=2 from public.fixtures f where f.id=p_fixture_id)
 when 'champions_league' then (select f.scoring_version=2 from public.champions_league_fixtures f where f.id=p_fixture_id)
 when 'nations_league' then (select f.scoring_version=2 from public.nations_league_fixtures f where f.id=p_fixture_id) end,false);
$$;
create function public.prediction_base_points_v2(ph integer,pa integer,rh integer,ra integer) returns bigint language sql immutable set search_path='' as $$
 select case when ph is null or pa is null or rh is null or ra is null then 0
 when ph=rh and pa=ra then 10
 when sign(ph-pa)<>sign(rh-ra) then 0
 when ph-pa=rh-ra then 6
 when ph+pa=rh+ra then 4
 else 2 end::bigint;
$$;
create function public.get_scoring_fixture_versions() returns table(competition text,fixture_id bigint,scoring_version smallint)
language sql stable security definer set search_path='' as $$
 select 'super_lig'::text,f.id,f.scoring_version from public.fixtures f
 union all select 'champions_league',f.id,f.scoring_version from public.champions_league_fixtures f
 union all select 'nations_league',f.id,f.scoring_version from public.nations_league_fixtures f;
$$;
grant execute on function public.get_scoring_fixture_versions() to anon,authenticated,service_role;


CREATE OR REPLACE FUNCTION public.get_player_public_profile(p_token text, p_player_name text)
 RETURNS TABLE(player_name text, week integer, week_rank bigint, week_points bigint, week_exact bigint, week_correct bigint, general_rank bigint, sezu_rank bigint, champions_rank bigint, special_kind text, fixture_id bigint, home_team text, away_team text, kickoff timestamp with time zone, predicted_home smallint, predicted_away smallint, real_home smallint, real_away smallint, match_points bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      coalesce(sum(case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
        else 0 end) end),0)::bigint as points,
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
      coalesce(sum(case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when p.week=4 and p.fixture_id=30 then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when p.week=4 and p.fixture_id=30 then 2 else 1 end
        else 0 end) end),0)::bigint as points
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
    case when v_player=v_target or f.kickoff<=now() then p.home_score::smallint else null::smallint end,
    case when v_player=v_target or f.kickoff<=now() then p.away_score::smallint else null::smallint end,
    r.home_score::smallint,r.away_score::smallint,
    case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null or p.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
      when r.fixture_id is null or p.fixture_id is null then 0
      when p.home_score=r.home_score and p.away_score=r.away_score
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
      when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
      else 0 end) end::bigint
  from summary s
  left join public.fixtures f on f.week=s.current_week
  left join public.predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$function$;

CREATE OR REPLACE FUNCTION public.get_friend_league_ranking(p_token text, p_league_id uuid)
 RETURNS TABLE(league_rank bigint, player_name text, points bigint, exact_count bigint, correct_count bigint, score_start_week integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_player text;
begin
 v_player:=public.friend_session_player(p_token); if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
 if not exists(select 1 from public.friend_league_members membership where membership.league_id=p_league_id and membership.player_name=v_player) then raise exception 'Bu ligi görme yetkin yok'; end if;
 return query with totals as (
  select membership.player_name,membership.score_start_week,pl.created_at,
   coalesce(sum(case when public.is_new_scoring_fixture('super_lig',prediction.fixture_id) then case when result.home_score is null or result.away_score is null then 0 else public.league_super_match_points(prediction.fixture_id,prediction.week,prediction.home_score,prediction.away_score,result.home_score,result.away_score) end else (case when result.home_score is null or result.away_score is null then 0 else ((case when (prediction.home_score>prediction.away_score and result.home_score>result.away_score) or (prediction.home_score<prediction.away_score and result.home_score<result.away_score) or (prediction.home_score=prediction.away_score and result.home_score=result.away_score) then 1 else 0 end)+(case when prediction.home_score=result.home_score and prediction.away_score=result.away_score then 3 else 0 end))*(case when (prediction.fixture_id=30 and prediction.week=4) or (prediction.fixture_id=44 and prediction.week=5) then 2 else 1 end) end) end),0)::bigint points,
   coalesce(sum(case when prediction.home_score=result.home_score and prediction.away_score=result.away_score and result.home_score is not null and result.away_score is not null then 1 else 0 end),0)::bigint exact_count,
   coalesce(sum(case when result.home_score is not null and result.away_score is not null and ((prediction.home_score>prediction.away_score and result.home_score>result.away_score) or (prediction.home_score<prediction.away_score and result.home_score<result.away_score) or (prediction.home_score=prediction.away_score and result.home_score=result.away_score)) then 1 else 0 end),0)::bigint correct_count
  from public.friend_league_members membership join public.players pl on pl.name=membership.player_name left join public.predictions prediction on prediction.player_name=membership.player_name and prediction.week>=membership.score_start_week left join public.results result on result.fixture_id=prediction.fixture_id where membership.league_id=p_league_id group by membership.player_name,membership.score_start_week,pl.created_at
 ), invites as (select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,NULL,NULL)) group by lower(inviter_name)), ranked as (
  select t.*,row_number() over(order by t.points desc,coalesce(i.invite_count,0) desc,t.exact_count desc,t.correct_count desc,t.created_at,t.player_name collate "tr-x-icu") display_rank from totals t left join invites i on i.inviter_key=lower(t.player_name)
 ) select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count,r.score_start_week from ranked r order by r.display_rank;
end $function$;

CREATE OR REPLACE FUNCTION public.champions_match_points(p_fixture_id bigint, p_home smallint, p_away smallint, r_home smallint, r_away smallint)
 RETURNS bigint
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select case when public.is_new_scoring_fixture('champions_league',p_fixture_id) then public.prediction_base_points_v2(p_home::integer,p_away::integer,r_home::integer,r_away::integer)*(case when exists(select 1 from public.opportunity_matches o where o.competition='champions_league' and o.fixture_id=p_fixture_id) then 2 else 1 end) else (case
  when r_home is null or r_away is null or p_home is null or p_away is null then 0
  when exists(select 1 from public.opportunity_matches o where o.competition='champions_league' and o.fixture_id=p_fixture_id)
    and p_home=r_home and p_away=r_away then 8
  when exists(select 1 from public.opportunity_matches o where o.competition='champions_league' and o.fixture_id=p_fixture_id)
    and sign(p_home-p_away)=sign(r_home-r_away) then 2
  when p_home=r_home and p_away=r_away then 4
  when sign(p_home-p_away)=sign(r_home-r_away) then 1 else 0 end) end
$function$;

CREATE OR REPLACE FUNCTION public.get_super_league_general_ranking()
 RETURNS TABLE(player_name text, total_points integer, exact_scores integer, correct_results integer, league_rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
with scored as (
 select pl.name::text player_name,pl.created_at,
  case when public.is_new_scoring_fixture('super_lig',pr.fixture_id) then public.league_super_match_points(pr.fixture_id,pr.week,pr.home_score,pr.away_score,r.home_score,r.away_score) else (case when pr.home_score=r.home_score and pr.away_score=r.away_score then case when exists(select 1 from public.opportunity_matches opportunity join public.fixtures opportunity_fixture on opportunity_fixture.id=opportunity.fixture_id where opportunity.competition='super_lig' and opportunity.fixture_id=pr.fixture_id and opportunity_fixture.week=pr.week) then 8 else 4 end
       when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when exists(select 1 from public.opportunity_matches opportunity join public.fixtures opportunity_fixture on opportunity_fixture.id=opportunity.fixture_id where opportunity.competition='super_lig' and opportunity.fixture_id=pr.fixture_id and opportunity_fixture.week=pr.week) then 2 else 1 end else 0 end) end::integer points,
  case when pr.home_score=r.home_score and pr.away_score=r.away_score then 1 else 0 end::integer exact_score,
  case when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then 1 else 0 end::integer correct_result
 from public.players pl join public.predictions pr on lower(pr.player_name)=lower(pl.name) join public.results r on r.fixture_id=pr.fixture_id
 where coalesce(pl.is_active,true) and r.home_score is not null and r.away_score is not null
), totals as (
 select player_name,min(created_at) created_at,sum(points)::integer total_points,sum(exact_score)::integer exact_scores,sum(correct_result)::integer correct_results from scored group by player_name
), invites as (
 select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,NULL,NULL)) group by lower(inviter_name)
), ranked as (
 select t.*,row_number() over(order by t.total_points desc,coalesce(i.invite_count,0) desc,t.exact_scores desc,t.correct_results desc,t.created_at,t.player_name collate "tr-x-icu") league_rank
 from totals t left join invites i on i.inviter_key=lower(t.player_name)
)
select player_name,total_points,exact_scores,correct_results,league_rank from ranked order by league_rank;
$function$;

CREATE OR REPLACE FUNCTION public.get_player_public_profile(p_token text, p_player_name text, p_week integer)
 RETURNS TABLE(player_name text, week integer, week_rank bigint, week_points bigint, week_exact bigint, week_correct bigint, general_rank bigint, sezu_rank bigint, champions_rank bigint, special_kind text, fixture_id bigint, home_team text, away_team text, kickoff timestamp with time zone, predicted_home smallint, predicted_away smallint, real_home smallint, real_away smallint, match_points bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      coalesce(sum(case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
        else 0 end) end),0)::bigint as points,
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
    case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null or p.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
      when r.fixture_id is null or p.fixture_id is null then 0
      when p.home_score=r.home_score and p.away_score=r.away_score
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 8 else 4 end
      when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
        then case when (p.week=4 and p.fixture_id=30) or (p.week=5 and p.fixture_id=44) then 2 else 1 end
      else 0 end) end::bigint
  from summary s
  left join public.fixtures f on f.week=s.selected_week
  left join public.predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$function$;

CREATE OR REPLACE FUNCTION public.get_player_public_profile_v2(p_token text, p_player_name text, p_week integer DEFAULT NULL::integer)
 RETURNS TABLE(player_name text, week integer, week_rank bigint, week_points bigint, week_exact bigint, week_correct bigint, general_rank bigint, sezu_rank bigint, champions_rank bigint, special_kind text, fixture_id bigint, home_team text, away_team text, kickoff timestamp with time zone, predicted_home smallint, predicted_away smallint, real_home smallint, real_away smallint, match_points bigint, robot_applied boolean, participant_count bigint, completed_count bigint, fixture_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  with invite_counts as (
    select i.inviter_name as player_name,count(*)::bigint as invite_count
    from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,v_week,NULL)) i
    group by i.inviter_name
  ), week_totals as (
    select p.player_name,
      coalesce(sum(case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when exists(select 1 from public.opportunity_matches opportunity join public.fixtures opportunity_fixture on opportunity_fixture.id=opportunity.fixture_id where opportunity.competition='super_lig' and opportunity.fixture_id=p.fixture_id and opportunity_fixture.week=p.week) then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when exists(select 1 from public.opportunity_matches opportunity join public.fixtures opportunity_fixture on opportunity_fixture.id=opportunity.fixture_id where opportunity.competition='super_lig' and opportunity.fixture_id=p.fixture_id and opportunity_fixture.week=p.week) then 2 else 1 end
        else 0 end) end),0)::bigint as points,
      count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint as exact_count,
      count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint as correct_count
    from public.predictions p
    join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
    left join public.results r on r.fixture_id=p.fixture_id
    where p.week=v_week
    group by p.player_name
  ), week_ranked as (
    select wt.*,pl.created_at,coalesce(ic.invite_count,0)::bigint as invite_count,
      row_number() over(
        order by wt.points desc,
                 coalesce(ic.invite_count,0) desc,
                 wt.exact_count desc,
                 wt.correct_count desc,
                 pl.created_at,
                 wt.player_name collate "tr-x-icu"
      )::bigint as player_rank
    from week_totals wt
    join public.players pl on pl.name=wt.player_name
    left join invite_counts ic on ic.player_name=wt.player_name
  ), sezu_totals as (
    select p.player_name,
      coalesce(sum(case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
        when r.fixture_id is null then 0
        when p.home_score=r.home_score and p.away_score=r.away_score
          then case when p.week=4 and p.fixture_id=30 then 8 else 4 end
        when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
          then case when p.week=4 and p.fixture_id=30 then 2 else 1 end
        else 0 end) end),0)::bigint as points
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
    case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null or p.fixture_id is null then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case
      when r.fixture_id is null or p.fixture_id is null then 0
      when p.home_score=r.home_score and p.away_score=r.away_score
        then case when exists(select 1 from public.opportunity_matches opportunity join public.fixtures opportunity_fixture on opportunity_fixture.id=opportunity.fixture_id where opportunity.competition='super_lig' and opportunity.fixture_id=p.fixture_id and opportunity_fixture.week=p.week) then 8 else 4 end
      when sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score)
        then case when exists(select 1 from public.opportunity_matches opportunity join public.fixtures opportunity_fixture on opportunity_fixture.id=opportunity.fixture_id where opportunity.competition='super_lig' and opportunity.fixture_id=p.fixture_id and opportunity_fixture.week=p.week) then 2 else 1 end
      else 0 end) end::bigint,
    case when v_player=v_target or f.kickoff<=now() then coalesce(p.robot_applied,false) else false end,
    s.participants,s.completed,s.fixture_total
  from summary s
  left join public.fixtures f on f.week=s.current_week
  left join public.predictions p on p.fixture_id=f.id and p.player_name=s.name
  left join public.results r on r.fixture_id=f.id
  order by f.kickoff,f.id;
end
$function$;

CREATE OR REPLACE FUNCTION public.nations_match_points(p_fixture_id bigint, p_home smallint, p_away smallint, r_home smallint, r_away smallint)
 RETURNS bigint
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select case when public.is_new_scoring_fixture('nations_league',p_fixture_id) then public.prediction_base_points_v2(p_home::integer,p_away::integer,r_home::integer,r_away::integer)*(case when exists(select 1 from public.opportunity_matches o where o.competition='nations_league' and o.fixture_id=p_fixture_id) then 2 else 1 end) else (case
  when r_home is null or r_away is null or p_home is null or p_away is null then 0
  when exists(select 1 from public.opportunity_matches o where o.competition='nations_league' and o.fixture_id=p_fixture_id)
    and p_home=r_home and p_away=r_away then 8
  when exists(select 1 from public.opportunity_matches o where o.competition='nations_league' and o.fixture_id=p_fixture_id)
    and sign(p_home-p_away)=sign(r_home-r_away) then 2
  when p_home=r_home and p_away=r_away then 4
  when sign(p_home-p_away)=sign(r_home-r_away) then 1 else 0 end) end
$function$;

CREATE OR REPLACE FUNCTION public.league_super_match_points(p_fixture_id bigint, p_week integer, p_home integer, p_away integer, r_home integer, r_away integer)
 RETURNS bigint
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select case when public.is_new_scoring_fixture('super_lig',p_fixture_id) then public.prediction_base_points_v2(p_home::integer,p_away::integer,r_home::integer,r_away::integer)*(case when exists(select 1 from public.opportunity_matches o join public.fixtures f on f.id=o.fixture_id where o.competition='super_lig' and o.fixture_id=p_fixture_id and f.week=p_week) then 2 else 1 end) else (case
  when r_home is null or r_away is null or p_home is null or p_away is null then 0
  when exists(select 1 from public.opportunity_matches o join public.fixtures f on f.id=o.fixture_id where o.competition='super_lig' and o.fixture_id=p_fixture_id and f.week=p_week)
    and p_home=r_home and p_away=r_away then 8
  when exists(select 1 from public.opportunity_matches o join public.fixtures f on f.id=o.fixture_id where o.competition='super_lig' and o.fixture_id=p_fixture_id and f.week=p_week)
    and sign(p_home-p_away)=sign(r_home-r_away) then 2
  when p_home=r_home and p_away=r_away then 4
  when sign(p_home-p_away)=sign(r_home-r_away) then 1 else 0 end) end
$function$;

CREATE OR REPLACE FUNCTION public.super_friend_ranking_rows_excluding(p_fixture_id bigint)
 RETURNS TABLE(scope text, context_id text, week integer, player_name text, rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
with target as(select f.week from public.fixtures f where f.id=p_fixture_id),
invites as(select lower(inviter_name) k,count(distinct lower(invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,NULL,p_fixture_id)) group by lower(inviter_name)),
totals as(
 select m.league_id,m.player_name,m.score_start_week,pl.created_at,
  coalesce(sum(case when public.is_new_scoring_fixture('super_lig',p.fixture_id) then case when r.fixture_id is null or r.fixture_id=p_fixture_id then 0 else public.league_super_match_points(p.fixture_id,p.week,p.home_score,p.away_score,r.home_score,r.away_score) end else (case when r.fixture_id is null or r.fixture_id=p_fixture_id then 0 else ((case when (p.home_score>p.away_score and r.home_score>r.away_score) or (p.home_score<p.away_score and r.home_score<r.away_score) or (p.home_score=p.away_score and r.home_score=r.away_score) then 1 else 0 end)+(case when p.home_score=r.home_score and p.away_score=r.away_score then 3 else 0 end))*(case when (p.fixture_id=30 and p.week=4) or (p.fixture_id=44 and p.week=5) then 2 else 1 end) end) end),0)::bigint pts,
  coalesce(sum(case when r.fixture_id<>p_fixture_id and p.home_score=r.home_score and p.away_score=r.away_score and r.home_score is not null and r.away_score is not null then 1 else 0 end),0)::bigint ex,
  coalesce(sum(case when r.fixture_id<>p_fixture_id and r.home_score is not null and r.away_score is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score) then 1 else 0 end),0)::bigint cr
 from public.friend_league_members m join public.players pl on pl.name=m.player_name left join public.predictions p on p.player_name=m.player_name and p.week>=m.score_start_week left join public.results r on r.fixture_id=p.fixture_id
 group by m.league_id,m.player_name,m.score_start_week,pl.created_at
), ranked as(
 select t.league_id,t.player_name,row_number() over(partition by t.league_id order by t.pts desc,coalesce(i.c,0) desc,t.ex desc,t.cr desc,t.created_at,t.player_name collate "tr-x-icu")::bigint rank from totals t left join invites i on i.k=lower(t.player_name)
)
select 'friend','friend:'||r.league_id::text,t.week,r.player_name,r.rank from ranked r cross join target t;
$function$;

CREATE OR REPLACE FUNCTION public.current_super_ranking_rows(p_week integer)
 RETURNS TABLE(scope text, context_id text, week integer, player_name text, rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
with invites as(
  select lower(inviter_name) k,count(distinct lower(invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,NULL,NULL)) group by lower(inviter_name)
), weekly_invites as(
  select lower(inviter_name) k,count(distinct lower(invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,p_week,NULL)) group by lower(inviter_name)
), weekly_totals as(
  select pl.name::text player_name,min(pl.created_at) created_at,
    coalesce(sum(case when public.is_new_scoring_fixture('super_lig',pr.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(pr.fixture_id,pr.week,pr.home_score,pr.away_score,r.home_score,r.away_score) end else (case when r.fixture_id is null then 0 when pr.home_score=r.home_score and pr.away_score=r.away_score then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 8 else 4 end when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 2 else 1 end else 0 end) end),0)::bigint pts,
    count(*) filter(where r.fixture_id is not null and pr.home_score=r.home_score and pr.away_score=r.away_score)::bigint ex,
    count(*) filter(where r.fixture_id is not null and sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score))::bigint cr
  from public.players pl join public.predictions pr on lower(pr.player_name)=lower(pl.name)
  left join public.results r on r.fixture_id=pr.fixture_id and r.home_score is not null and r.away_score is not null
  where coalesce(pl.is_active,true) and pr.week=p_week group by pl.name
), weekly_ranked as(
  select w.player_name,row_number() over(order by w.pts desc,coalesce(i.c,0) desc,w.ex desc,w.cr desc,w.created_at,w.player_name collate "tr-x-icu")::bigint rank
  from weekly_totals w left join weekly_invites i on i.k=lower(w.player_name)
), friend_totals as(
  select m.league_id,m.player_name,m.score_start_week,min(pl.created_at) created_at,
    coalesce(sum(case when public.is_new_scoring_fixture('super_lig',pr.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(pr.fixture_id,pr.week,pr.home_score,pr.away_score,r.home_score,r.away_score) end else (case when r.fixture_id is null then 0 when pr.home_score=r.home_score and pr.away_score=r.away_score then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 8 else 4 end when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 2 else 1 end else 0 end) end),0)::bigint pts,
    count(*) filter(where r.fixture_id is not null and pr.home_score=r.home_score and pr.away_score=r.away_score)::bigint ex,
    count(*) filter(where r.fixture_id is not null and sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score))::bigint cr
  from public.friend_league_members m join public.players pl on lower(pl.name)=lower(m.player_name)
  left join public.predictions pr on lower(pr.player_name)=lower(m.player_name) and pr.week>=m.score_start_week
  left join public.results r on r.fixture_id=pr.fixture_id and r.home_score is not null and r.away_score is not null
  group by m.league_id,m.player_name,m.score_start_week
), friend_ranked as(
  select f.league_id,f.player_name,row_number() over(partition by f.league_id order by f.pts desc,coalesce(i.c,0) desc,f.ex desc,f.cr desc,f.created_at,f.player_name collate "tr-x-icu")::bigint rank
  from friend_totals f left join invites i on i.k=lower(f.player_name)
), period as(select id from public.league_periods where status='open' order by starts_at desc limit 1)
select 'general'::text,'super:general'::text,p_week,g.player_name,g.league_rank from public.get_super_league_general_ranking() g
union all select 'weekly','super:weekly:'||p_week,p_week,w.player_name,w.rank from weekly_ranked w
union all select 'friend','friend:'||f.league_id::text,p_week,f.player_name,f.rank from friend_ranked f
union all select 'arena','arena:'||m.period_id||':'||m.league_code,p_week,pl.name::text,m.rank_in_league::bigint from public.league_memberships m join public.players pl on pl.id=m.player_id join period p on p.id=m.period_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_super_league_latest_ranking_movement()
 RETURNS TABLE(movement_scope text, week integer, fixture_id bigint, result_updated_at timestamp with time zone, player_name text, before_rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
with latest as (
  select r.fixture_id, r.updated_at, f.week
  from public.results r
  join public.fixtures f on f.id=r.fixture_id
  where r.home_score is not null and r.away_score is not null
  order by r.updated_at desc nulls last, r.fixture_id desc
  limit 1
), invites as (
  select lower(inviter_name) player_key, count(distinct lower(invited_name))::bigint invite_count
  from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,NULL,(select fixture_id from latest)))
  group by lower(inviter_name)
), weekly_invites as (
  select lower(inviter_name) player_key, count(distinct lower(invited_name))::bigint invite_count
  from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,(select week from latest),(select fixture_id from latest)))
  group by lower(inviter_name)
), general_before_scored as (
  select pl.name::text player_name, pl.created_at,
    case when public.is_new_scoring_fixture('super_lig',pr.fixture_id) then public.league_super_match_points(pr.fixture_id,pr.week,pr.home_score,pr.away_score,r.home_score,r.away_score) else (case
      when pr.home_score=r.home_score and pr.away_score=r.away_score then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 8 else 4 end
      when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 2 else 1 end
      else 0
    end) end::integer points,
    case when pr.home_score=r.home_score and pr.away_score=r.away_score then 1 else 0 end::integer exact_score,
    case when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then 1 else 0 end::integer correct_result
  from public.players pl
  join public.predictions pr on lower(pr.player_name)=lower(pl.name)
  join public.results r on r.fixture_id=pr.fixture_id
  cross join latest l
  where coalesce(pl.is_active,true)
    and r.home_score is not null and r.away_score is not null
    and r.fixture_id<>l.fixture_id
), general_before_totals as (
  select player_name,min(created_at) created_at,sum(points)::integer points,sum(exact_score)::integer exact_count,sum(correct_result)::integer correct_count
  from general_before_scored group by player_name
), general_before as (
  select t.player_name,row_number() over(order by t.points desc,coalesce(i.invite_count,0) desc,t.exact_count desc,t.correct_count desc,t.created_at,t.player_name collate "tr-x-icu")::bigint rank
  from general_before_totals t left join invites i on i.player_key=lower(t.player_name)
), week_players as (
  select distinct pl.name::text player_name, pl.created_at
  from public.players pl
  join public.predictions pr on lower(pr.player_name)=lower(pl.name)
  cross join latest l
  where coalesce(pl.is_active,true) and pr.week=l.week
), week_before_totals as (
  select wp.player_name,wp.created_at,
    coalesce(sum(case when public.is_new_scoring_fixture('super_lig',pr.fixture_id) then case when r.fixture_id is null then 0 else public.league_super_match_points(pr.fixture_id,pr.week,pr.home_score,pr.away_score,r.home_score,r.away_score) end else (case
      when r.fixture_id is null then 0
      when pr.home_score=r.home_score and pr.away_score=r.away_score then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 8 else 4 end
      when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 2 else 1 end
      else 0 end) end),0)::integer points,
    count(*) filter(where r.fixture_id is not null and pr.home_score=r.home_score and pr.away_score=r.away_score)::integer exact_count,
    count(*) filter(where r.fixture_id is not null and sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score))::integer correct_count
  from week_players wp
  join public.predictions pr on lower(pr.player_name)=lower(wp.player_name)
  cross join latest l
  left join public.results r on r.fixture_id=pr.fixture_id and r.fixture_id<>l.fixture_id and r.home_score is not null and r.away_score is not null
  where pr.week=l.week
  group by wp.player_name,wp.created_at
), week_before as (
  select t.player_name,row_number() over(order by t.points desc,coalesce(i.invite_count,0) desc,t.exact_count desc,t.correct_count desc,t.created_at,t.player_name collate "tr-x-icu")::bigint rank
  from week_before_totals t left join weekly_invites i on i.player_key=lower(t.player_name)
)
select 'general'::text as movement_scope,l.week,l.fixture_id,l.updated_at,a.player_name,a.rank
from latest l cross join general_before a
union all
select 'weekly'::text as movement_scope,l.week,l.fixture_id,l.updated_at,a.player_name,a.rank
from latest l cross join week_before a;
$function$;

do $check$
begin
 if exists((select * from old_match_points except (with scored as (select 'super_lig' as competition,p.fixture_id,p.player_name,public.league_super_match_points(f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score) as points from public.predictions p join public.fixtures f on f.id=p.fixture_id join public.results r on r.fixture_id=f.id union all select 'champions_league',p.fixture_id,p.player_name,public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score) from public.champions_league_predictions p join public.champions_league_fixtures f on f.id=p.fixture_id join public.champions_league_results r on r.fixture_id=f.id union all select 'nations_league',p.fixture_id,p.player_name,public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score) from public.nations_league_predictions p join public.nations_league_fixtures f on f.id=p.fixture_id join public.nations_league_results r on r.fixture_id=f.id) select * from scored)) union all ((with scored as (select 'super_lig' as competition,p.fixture_id,p.player_name,public.league_super_match_points(f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score) as points from public.predictions p join public.fixtures f on f.id=p.fixture_id join public.results r on r.fixture_id=f.id union all select 'champions_league',p.fixture_id,p.player_name,public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score) from public.champions_league_predictions p join public.champions_league_fixtures f on f.id=p.fixture_id join public.champions_league_results r on r.fixture_id=f.id union all select 'nations_league',p.fixture_id,p.player_name,public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score) from public.nations_league_predictions p join public.nations_league_fixtures f on f.id=p.fixture_id join public.nations_league_results r on r.fixture_id=f.id) select * from scored) except select * from old_match_points)) then raise exception 'Historical prediction points changed; aborting'; end if;
 if exists((select * from old_general_ranking except select * from public.get_super_league_general_ranking()) union all (select * from public.get_super_league_general_ranking() except select * from old_general_ranking)) then raise exception 'Historical general ranking changed; aborting'; end if;
 if exists((select * from old_arena_rounds except select * from public.league_round_performance) union all (select * from public.league_round_performance except select * from old_arena_rounds)) then raise exception 'Arena historical performance changed; aborting'; end if;
 if public.prediction_base_points_v2(2,1,2,1)<>10 or public.prediction_base_points_v2(3,2,2,1)<>6 or public.prediction_base_points_v2(3,0,2,1)<>4 or public.prediction_base_points_v2(4,0,2,1)<>2 or public.prediction_base_points_v2(1,2,2,1)<>0 or public.prediction_base_points_v2(2,2,1,1)<>6 then raise exception 'New scoring rule mismatch'; end if;
end;$check$;
