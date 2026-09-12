-- Rule 8 ranking order everywhere:
-- points > season unique invites > exact scores > correct results > earlier registration.
-- Arena week 3/4 normalization uses the same weekly order.

create or replace function public.get_super_league_general_ranking()
returns table(player_name text,total_points integer,exact_scores integer,correct_results integer,league_rank bigint)
language sql stable security definer set search_path to 'public','pg_temp'
as $function$
with scored as (
 select pl.name::text player_name,pl.created_at,
  case when pr.home_score=r.home_score and pr.away_score=r.away_score then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 8 else 4 end
       when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when (pr.week=4 and pr.fixture_id=30) or (pr.week=5 and pr.fixture_id=44) then 2 else 1 end else 0 end::integer points,
  case when pr.home_score=r.home_score and pr.away_score=r.away_score then 1 else 0 end::integer exact_score,
  case when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then 1 else 0 end::integer correct_result
 from public.players pl join public.predictions pr on lower(pr.player_name)=lower(pl.name) join public.results r on r.fixture_id=pr.fixture_id
 where coalesce(pl.is_active,true) and r.home_score is not null and r.away_score is not null
), totals as (
 select player_name,min(created_at) created_at,sum(points)::integer total_points,sum(exact_score)::integer exact_scores,sum(correct_result)::integer correct_results from scored group by player_name
), invites as (
 select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)
), ranked as (
 select t.*,row_number() over(order by t.total_points desc,coalesce(i.invite_count,0) desc,t.exact_scores desc,t.correct_results desc,t.created_at,t.player_name collate "tr-x-icu") league_rank
 from totals t left join invites i on i.inviter_key=lower(t.player_name)
)
select player_name,total_points,exact_scores,correct_results,league_rank from ranked order by league_rank;
$function$;

create or replace function public.get_friend_league_ranking(p_token text,p_league_id uuid)
returns table(league_rank bigint,player_name text,points bigint,exact_count bigint,correct_count bigint,score_start_week integer)
language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_player text;
begin
 v_player:=public.friend_session_player(p_token); if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
 if not exists(select 1 from public.friend_league_members membership where membership.league_id=p_league_id and membership.player_name=v_player) then raise exception 'Bu ligi görme yetkin yok'; end if;
 return query with totals as (
  select membership.player_name,membership.score_start_week,pl.created_at,
   coalesce(sum(case when result.home_score is null or result.away_score is null then 0 else ((case when (prediction.home_score>prediction.away_score and result.home_score>result.away_score) or (prediction.home_score<prediction.away_score and result.home_score<result.away_score) or (prediction.home_score=prediction.away_score and result.home_score=result.away_score) then 1 else 0 end)+(case when prediction.home_score=result.home_score and prediction.away_score=result.away_score then 3 else 0 end))*(case when (prediction.fixture_id=30 and prediction.week=4) or (prediction.fixture_id=44 and prediction.week=5) then 2 else 1 end) end),0)::bigint points,
   coalesce(sum(case when prediction.home_score=result.home_score and prediction.away_score=result.away_score and result.home_score is not null and result.away_score is not null then 1 else 0 end),0)::bigint exact_count,
   coalesce(sum(case when result.home_score is not null and result.away_score is not null and ((prediction.home_score>prediction.away_score and result.home_score>result.away_score) or (prediction.home_score<prediction.away_score and result.home_score<result.away_score) or (prediction.home_score=prediction.away_score and result.home_score=result.away_score)) then 1 else 0 end),0)::bigint correct_count
  from public.friend_league_members membership join public.players pl on pl.name=membership.player_name left join public.predictions prediction on prediction.player_name=membership.player_name and prediction.week>=membership.score_start_week left join public.results result on result.fixture_id=prediction.fixture_id where membership.league_id=p_league_id group by membership.player_name,membership.score_start_week,pl.created_at
 ), invites as (select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)), ranked as (
  select t.*,row_number() over(order by t.points desc,coalesce(i.invite_count,0) desc,t.exact_count desc,t.correct_count desc,t.created_at,t.player_name collate "tr-x-icu") display_rank from totals t left join invites i on i.inviter_key=lower(t.player_name)
 ) select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count,r.score_start_week from ranked r order by r.display_rank;
end $function$;

create or replace function public.get_champions_league_ranking(p_token text,p_season text)
returns table(league_rank bigint,player_name text,points bigint,exact_count bigint,correct_count bigint)
language plpgsql security definer set search_path to ''
as $function$
declare v_player text;
begin
 v_player:=public.friend_session_player(p_token); if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
 return query with scored as (
  select p.player_name,pl.created_at,coalesce(sum(public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint points,
  count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::bigint exact_count,
  count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint correct_count
  from public.champions_league_predictions p join public.champions_league_fixtures f on f.id=p.fixture_id and f.season=p_season left join public.champions_league_results r on r.fixture_id=f.id join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true) group by p.player_name,pl.created_at
 ), invites as (select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)), ranked as (
  select s.*,row_number() over(order by s.points desc,coalesce(i.invite_count,0) desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu") display_rank from scored s left join invites i on i.inviter_key=lower(s.player_name)
 ) select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count from ranked r order by r.display_rank;
end $function$;

create or replace function public.get_nations_league_ranking(p_token text,p_season text default '2026/27'::text)
returns table(league_rank bigint,player_name text,points bigint,exact_count bigint,correct_count bigint)
language plpgsql security definer set search_path to ''
as $function$
declare v_player text;
begin
 v_player:=public.friend_session_player(p_token); if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
 return query with scored as(
   select p.player_name,pl.created_at,coalesce(sum(public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint points,
   count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint exact_count,
   count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint correct_count
   from public.nations_league_predictions p join public.nations_league_fixtures f on f.id=p.fixture_id and f.season=p_season left join public.nations_league_results r on r.fixture_id=f.id join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true) group by p.player_name,pl.created_at
 ), invites as(select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)), ranked as(
   select s.*,row_number() over(order by s.points desc,coalesce(i.invite_count,0) desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu") display_rank from scored s left join invites i on i.inviter_key=lower(s.player_name)
 ) select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count from ranked r order by r.display_rank;
end $function$;

create or replace function public.get_champions_league_weekly_ranking(p_token text,p_season text default '2026/27'::text,p_week integer default 1)
returns table(league_rank bigint,player_name text,points bigint,exact_count bigint,correct_count bigint,participant_count bigint,completed_count bigint,fixture_count bigint)
language plpgsql security definer set search_path to ''
as $function$
declare v_player text; v_fixture_count bigint;
begin
 v_player:=public.friend_session_player(p_token); if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
 select count(*) into v_fixture_count from public.champions_league_fixtures f where f.season=p_season and f.week=p_week;
 if coalesce(v_fixture_count,0)=0 then raise exception 'Şampiyonlar Ligi haftası bulunamadı'; end if;
 return query with complete_players as(
   select p.player_name from public.champions_league_predictions p join public.champions_league_fixtures f on f.id=p.fixture_id join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true) where f.season=p_season and f.week=p_week group by p.player_name having count(distinct p.fixture_id)=v_fixture_count
 ), scored as(
   select cp.player_name,pl.created_at,coalesce(sum(public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint points,
   count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint exact_count,
   count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint correct_count
   from complete_players cp join public.players pl on pl.name=cp.player_name join public.champions_league_predictions p on p.player_name=cp.player_name join public.champions_league_fixtures f on f.id=p.fixture_id and f.season=p_season and f.week=p_week left join public.champions_league_results r on r.fixture_id=f.id group by cp.player_name,pl.created_at
 ), invites as(select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)), ranked as(
   select s.*,row_number() over(order by s.points desc,coalesce(i.invite_count,0) desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu") display_rank from scored s left join invites i on i.inviter_key=lower(s.player_name)
 ), summary as(select (select count(*) from complete_players)::bigint participants,(select count(*) from public.champions_league_results cr join public.champions_league_fixtures cf on cf.id=cr.fixture_id where cf.season=p_season and cf.week=p_week)::bigint completed)
 select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count,s.participants,s.completed,v_fixture_count::bigint from ranked r cross join summary s order by r.display_rank;
end $function$;

create or replace function public.get_nations_league_weekly_ranking(p_token text,p_season text default '2026/27'::text,p_week integer default 1)
returns table(league_rank bigint,player_name text,points bigint,exact_count bigint,correct_count bigint,participant_count bigint,completed_count bigint,fixture_count bigint)
language plpgsql security definer set search_path to ''
as $function$
declare v_player text; v_fixture_count bigint;
begin
 v_player:=public.friend_session_player(p_token); if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
 select count(*) into v_fixture_count from public.nations_league_fixtures f where f.season=p_season and f.week=p_week;
 if coalesce(v_fixture_count,0)=0 then raise exception 'UEFA Uluslar Ligi haftası bulunamadı'; end if;
 return query with complete_players as(
   select p.player_name from public.nations_league_predictions p join public.nations_league_fixtures f on f.id=p.fixture_id join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true) where f.season=p_season and f.week=p_week group by p.player_name having count(distinct p.fixture_id)=v_fixture_count
 ), scored as(
   select cp.player_name,pl.created_at,coalesce(sum(public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint points,
   count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::bigint exact_count,
   count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::bigint correct_count
   from complete_players cp join public.players pl on pl.name=cp.player_name join public.nations_league_predictions p on p.player_name=cp.player_name join public.nations_league_fixtures f on f.id=p.fixture_id and f.season=p_season and f.week=p_week left join public.nations_league_results r on r.fixture_id=f.id group by cp.player_name,pl.created_at
 ), invites as(select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)), ranked as(
   select s.*,row_number() over(order by s.points desc,coalesce(i.invite_count,0) desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu") display_rank from scored s left join invites i on i.inviter_key=lower(s.player_name)
 ), summary as(select (select count(*) from complete_players)::bigint participants,(select count(*) from public.nations_league_results nr join public.nations_league_fixtures nf on nf.id=nr.fixture_id where nf.season=p_season and nf.week=p_week)::bigint completed)
 select r.display_rank,r.player_name,r.points,r.exact_count,r.correct_count,s.participants,s.completed,v_fixture_count::bigint from ranked r cross join summary s order by r.display_rank;
end $function$;

create or replace function public.league_historical_seed_scores(p_before timestamptz)
returns table(player_id bigint,performance_score numeric,valid_round_count integer,exact_score_count integer,raw_points bigint)
language sql stable security definer set search_path to ''
as $function$
with seed_season as(
 select f.season from public.fixtures f where f.week=4 and f.kickoff<p_before group by f.season order by max(f.kickoff) desc limit 1
), target_rounds as(
 select f.season,f.week,count(distinct f.id)::integer fixture_count from public.fixtures f cross join seed_season ss left join public.results r on r.fixture_id=f.id where f.season=ss.season and f.week in(3,4) and f.kickoff<p_before group by f.season,f.week having count(distinct f.id)>0 and count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)=count(distinct f.id)
), complete_players as(
 select tr.season,tr.week,tr.fixture_count,p.player_name from target_rounds tr join public.fixtures f on f.season=tr.season and f.week=tr.week join public.predictions p on p.fixture_id=f.id group by tr.season,tr.week,tr.fixture_count,p.player_name having count(distinct p.fixture_id)=tr.fixture_count
), scored as(
 select pl.id player_id,cp.season,cp.week,pl.name player_name,pl.created_at,
  coalesce(sum(public.league_super_match_points(f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint points,
  count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer exact_count,
  count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer correct_count
 from complete_players cp join public.players pl on lower(pl.name)=lower(cp.player_name) and coalesce(pl.is_active,true) join public.predictions p on lower(p.player_name)=lower(cp.player_name) join public.fixtures f on f.id=p.fixture_id and f.season=cp.season and f.week=cp.week join public.results r on r.fixture_id=f.id group by pl.id,cp.season,cp.week,pl.name,pl.created_at
), invites as(
 select lower(inviter_name) inviter_key,count(distinct lower(invited_name))::bigint invite_count from public.player_invites group by lower(inviter_name)
), ranked as(
 select s.*,row_number() over(partition by s.season,s.week order by s.points desc,coalesce(i.invite_count,0) desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-x-icu")::integer round_rank,
 count(*) over(partition by s.season,s.week)::integer participant_count from scored s left join invites i on i.inviter_key=lower(s.player_name)
), normalized as(
 select r.player_id,r.week,public.league_normalized_performance(r.round_rank,r.participant_count) performance_score,r.exact_count,r.points from ranked r where r.participant_count>=2
), players_in_window as(select distinct player_id from normalized), two_week as(
 select p.player_id,round((coalesce(w3.performance_score,0)+coalesce(w4.performance_score,0))/2.0,2)::numeric(6,2) performance_score,
 ((case when w3.player_id is not null then 1 else 0 end)+(case when w4.player_id is not null then 1 else 0 end))::integer valid_round_count,
 (coalesce(w3.exact_count,0)+coalesce(w4.exact_count,0))::integer exact_score_count,
 (coalesce(w3.points,0)+coalesce(w4.points,0))::bigint raw_points
 from players_in_window p left join normalized w3 on w3.player_id=p.player_id and w3.week=3 left join normalized w4 on w4.player_id=p.player_id and w4.week=4
)
select t.player_id,t.performance_score,t.valid_round_count,t.exact_score_count,t.raw_points from two_week t;
$function$;
