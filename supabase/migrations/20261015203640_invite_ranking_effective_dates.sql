set local jit=off;
set local lock_timeout='3s';
set local statement_timeout='25s';
-- Atomic migration: abort if any existing ranking changes.
create temp table invite_check_init(x integer) on commit drop;
do $audit$ declare r record;src text;n text;begin
for r in select p.oid,p.proname from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname=any(array['get_champions_league_ranking','get_champions_league_weekly_ranking','get_nations_league_ranking','get_nations_league_weekly_ranking','get_friend_league_ranking','get_player_museum','get_player_public_profile_v2','get_league_initial_preview']) loop
 src:=pg_get_functiondef(r.oid);
 foreach n in array array['get_champions_league_ranking','get_champions_league_weekly_ranking','get_nations_league_ranking','get_nations_league_weekly_ranking','get_friend_league_ranking','get_player_museum','get_player_public_profile_v2','get_league_initial_preview'] loop
 src:=replace(src,'public.'||n||'(','pg_temp.'||n||'(');
 end loop;
 src:=replace(src,'public.friend_session_player(p_token)',quote_literal('Erdal')||'::text');
 if r.proname='get_friend_league_ranking' then
 src:=replace(src,quote_literal('Erdal')||'::text','(select fm.player_name from public.friend_league_members fm where fm.league_id=p_league_id order by fm.player_name limit 1)');
 end if;
 src:=replace(src,'SECURITY DEFINER','SECURITY INVOKER');
 execute src;
end loop;
end $audit$;

create temp table invite_baseline on commit drop as
select 'super_general'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.get_super_league_general_ranking()) a
union all
select 'super_historical'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select w.week,r.* from (select distinct f.week from public.fixtures f join public.results r on r.fixture_id=f.id) w cross join lateral public.current_super_ranking_rows(w.week) r) a
union all
select 'champions_general'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from pg_temp.get_champions_league_ranking(null,'2026/27')) a
union all
select 'champions_weekly'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select w.week,r.* from (select distinct f.week from public.champions_league_fixtures f join public.champions_league_results r on r.fixture_id=f.id) w cross join lateral pg_temp.get_champions_league_weekly_ranking(null,'2026/27',w.week) r) a
union all
select 'nations_general'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from pg_temp.get_nations_league_ranking(null,'2026/27')) a
union all
select 'nations_weekly'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select w.week,r.* from (select distinct f.week from public.nations_league_fixtures f join public.nations_league_results r on r.fixture_id=f.id) w cross join lateral pg_temp.get_nations_league_weekly_ranking(null,'2026/27',w.week) r) a
union all
select 'profiles'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select distinct p.name,w.week,r.week_rank,r.week_points,r.general_rank,r.sezu_rank,r.champions_rank from public.players p cross join (select distinct f.week from public.fixtures f join public.results r on r.fixture_id=f.id) w cross join lateral pg_temp.get_player_public_profile_v2(null,p.name,w.week) r where p.name='Erdal') a
union all
select 'museums'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select p.name,pg_temp.get_player_museum(null,p.name) museum from public.players p where p.name='Erdal') a
union all
select 'friends'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select distinct m.league_id,r.* from (select distinct league_id from public.friend_league_members) m cross join lateral pg_temp.get_friend_league_ranking(null,m.league_id) r) a
union all
select 'movement'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.get_super_league_latest_ranking_movement()) a
union all
select 'arena_rows'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select period_id,player_id,competition,round_key,rank,performance_score,raw_points,exact_score_count from public.league_round_performance) a
union all
select 'arena_memberships'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.league_memberships) a
union all
select 'arena_history'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.league_history) a
union all
select 'cup_matches'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.bizimskor_cup_matches) a;
-- Invitation totals and ranking eligibility are deliberately separate.
-- NULL dates grandfather the existing nine attributions without rewriting history.
create schema if not exists invite_ranking_private;
revoke all on schema invite_ranking_private from public,anon,authenticated;
alter table public.player_invites add column if not exists ranking_effective_at timestamptz;
alter table public.player_invites alter column ranking_effective_at set default clock_timestamp();
create table invite_ranking_private.completed_round_cutoffs(
 competition text not null,season text not null,week integer not null,closed_at timestamptz not null,
 primary key(competition,season,week)
);
alter table invite_ranking_private.completed_round_cutoffs enable row level security;
revoke all on invite_ranking_private.completed_round_cutoffs from public,anon,authenticated;

create function invite_ranking_private.result_events()
returns table(competition text,season text,week integer,fixture_id bigint,updated_at timestamptz,complete boolean)
language sql stable security invoker set search_path='' as $fn$
 select 'super_lig',f.season,f.week,f.id,r.updated_at,
 r.home_score is not null and r.away_score is not null and lower(coalesce(r.status,'')) in('ft','finished','aet','pen')
 from public.fixtures f left join public.results r on r.fixture_id=f.id
 union all select 'champions_league',f.season,f.week,f.id,r.updated_at,
 r.home_score is not null and r.away_score is not null
 from public.champions_league_fixtures f left join public.champions_league_results r on r.fixture_id=f.id
 union all select 'nations_league',f.season,f.week,f.id,r.updated_at,
 r.home_score is not null and r.away_score is not null
 from public.nations_league_fixtures f left join public.nations_league_results r on r.fixture_id=f.id
 $fn$;
insert into invite_ranking_private.completed_round_cutoffs
select competition,season,week,coalesce(max(updated_at),'-infinity'::timestamptz)
from invite_ranking_private.result_events() group by competition,season,week having bool_and(complete);

create function invite_ranking_private.cutoff(p_competition text,p_season text default null,p_week integer default null,p_exclude_fixture bigint default null)
returns timestamptz language sql stable security invoker set search_path='' as $fn$
 select coalesce(
 (select max(c.closed_at) from invite_ranking_private.completed_round_cutoffs c
 where p_week is not null and p_exclude_fixture is null and c.competition=p_competition
 and (p_season is null or c.season=p_season) and c.week=p_week),
 (select max(e.updated_at) from invite_ranking_private.result_events() e
 where (p_competition='all' or e.competition=p_competition)
 and (p_season is null or e.season=p_season) and (p_week is null or e.week=p_week)
 and (p_exclude_fixture is null or e.fixture_id<>p_exclude_fixture)
 and e.updated_at is not null),'-infinity'::timestamptz)
 $fn$;

create function invite_ranking_private.eligible(p_cutoff timestamptz)
returns setof public.player_invites language sql stable security invoker set search_path='' as $fn$
 select i.* from public.player_invites i where i.ranking_effective_at is null or i.ranking_effective_at<=p_cutoff
 $fn$;

create function invite_ranking_private.freeze_completed_round()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare comp text;yr text;wk integer;
begin
 comp:=case tg_table_name when 'results' then 'super_lig' when 'champions_league_results' then 'champions_league' else 'nations_league' end;
 select e.season,e.week into yr,wk from invite_ranking_private.result_events() e
 where e.competition=comp and e.fixture_id=new.fixture_id limit 1;
 insert into invite_ranking_private.completed_round_cutoffs
 select competition,season,week,coalesce(max(updated_at),clock_timestamp())
 from invite_ranking_private.result_events() where competition=comp and season=yr and week=wk
 group by competition,season,week having bool_and(complete) on conflict do nothing;
 return new;
end $fn$;
create trigger invite_cutoff_super after insert or update on public.results for each row execute function invite_ranking_private.freeze_completed_round();
create trigger invite_cutoff_champions after insert or update on public.champions_league_results for each row execute function invite_ranking_private.freeze_completed_round();
create trigger invite_cutoff_nations after insert or update on public.nations_league_results for each row execute function invite_ranking_private.freeze_completed_round();
revoke all on all functions in schema invite_ranking_private from public,anon,authenticated;

do $patch$ declare src text; begin
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='cup_private' and p.proname='week_performance';
if md5(src)<>'188891fcfeb003b5f581e9ecc41ee0e2' then raise exception 'Ranking function changed before deployment: week_performance'; end if;
src:=overlay(src placing $edit$_ranking_private.eligible(p_cutoff)$edit$ from 989 for 1);
src:=overlay(src placing $edit$$edit$ from 969 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='cup_private' and p.proname='week_score';
if md5(src)<>'10f97d917f8750fd1bf576178372fbe7' then raise exception 'Ranking function changed before deployment: week_score'; end if;
src:=overlay(src placing $edit$_ranking_private.eligible(p_cutoff)$edit$ from 747 for 1);
src:=overlay(src placing $edit$$edit$ from 727 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='current_super_ranking_rows';
if md5(src)<>'521a41a8f153db82a8e860a953882201' then raise exception 'Ranking function changed before deployment: current_super_ranking_rows'; end if;
src:=overlay(src placing $edit$weekly_$edit$ from 1674 for 0);
src:=overlay(src placing $edit$ as(
  select lower(inviter_name) k,count(distinct lower(invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,p_week,NULL))$edit$ from 380 for 0);
src:=overlay(src placing $edit$_lig',NULL,NULL,NULL)) group by lower(inviter_name)
), weekly$edit$ from 372 for 0);
src:=overlay(src placing $edit$$edit$ from 367 for 3);
src:=overlay(src placing $edit$utoff('su$edit$ from 365 for 1);
src:=overlay(src placing $edit$nvite_ranking_private.$edit$ from 364 for 0);
src:=overlay(src placing $edit$e($edit$ from 363 for 0);
src:=overlay(src placing $edit$rivate.eligi$edit$ from 360 for 1);
src:=overlay(src placing $edit$invite_ranking_$edit$ from 359 for 0);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_super_league_general_ranking';
if md5(src)<>'ef750567bfc5fefe4cac03455be2562c' then raise exception 'Ranking function changed before deployment: get_super_league_general_ranking'; end if;
src:=overlay(src placing $edit$uper_lig',NULL,NULL,NULL))$edit$ from 1953 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('$edit$ from 1952 for 0);
src:=overlay(src placing $edit$$edit$ from 1932 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_super_league_latest_ranking_movement';
if md5(src)<>'563067cb98d6988198e0bf81c3d5c874' then raise exception 'Ranking function changed before deployment: get_super_league_latest_ranking_movement'; end if;
src:=overlay(src placing $edit$weekly_$edit$ from 3950 for 0);
src:=overlay(src placing $edit$ as (
  select lower(inviter_name) player_key, count(distinct lower(invited_name))::bigint invite_count
  from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',NULL,(select week from latest),(select fixture_id from latest)))$edit$ from 726 for 0);
src:=overlay(src placing $edit$(inviter_name)
), weekly$edit$ from 718 for 0);
src:=overlay(src placing $edit$ low$edit$ from 716 for 0);
src:=overlay(src placing $edit$test)))
  group b$edit$ from 715 for 0);
src:=overlay(src placing $edit$er_lig',NULL,NULL,(select fixture_id from $edit$ from 713 for 0);
src:=overlay(src placing $edit$utoff('su$edit$ from 711 for 1);
src:=overlay(src placing $edit$nvite_ranking_private.$edit$ from 710 for 0);
src:=overlay(src placing $edit$e($edit$ from 709 for 0);
src:=overlay(src placing $edit$rivate.eligi$edit$ from 706 for 1);
src:=overlay(src placing $edit$invite_ranking_$edit$ from 705 for 0);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_champions_league_ranking';
if md5(src)<>'8cb494d61334e16f7f16e27b5e341ce8' then raise exception 'Ranking function changed before deployment: get_champions_league_ranking'; end if;
src:=overlay(src placing $edit$_league',p_season,NULL,NULL))$edit$ from 1321 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('champion$edit$ from 1320 for 0);
src:=overlay(src placing $edit$$edit$ from 1300 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_nations_league_ranking';
if md5(src)<>'f929c9a5c6ca63545b10b0fc9ca2c788' then raise exception 'Ranking function changed before deployment: get_nations_league_ranking'; end if;
src:=overlay(src placing $edit$_league',p_season,NULL,NULL))$edit$ from 1366 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('nation$edit$ from 1365 for 0);
src:=overlay(src placing $edit$$edit$ from 1345 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_champions_league_weekly_ranking';
if md5(src)<>'d7e7c265f15e1df9172c2650cfae88b1' then raise exception 'Ranking function changed before deployment: get_champions_league_weekly_ranking'; end if;
src:=overlay(src placing $edit$_league',p_season,p_week,NULL))$edit$ from 2073 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('champion$edit$ from 2072 for 0);
src:=overlay(src placing $edit$$edit$ from 2052 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_nations_league_weekly_ranking';
if md5(src)<>'aa78f579fc506161bd7d4710c0313092' then raise exception 'Ranking function changed before deployment: get_nations_league_weekly_ranking'; end if;
src:=overlay(src placing $edit$_league',p_season,p_week,NULL))$edit$ from 2109 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('nation$edit$ from 2108 for 0);
src:=overlay(src placing $edit$$edit$ from 2088 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_friend_league_ranking';
if md5(src)<>'d9f449d2b5fb4cf0e461c015c9acde22' then raise exception 'Ranking function changed before deployment: get_friend_league_ranking'; end if;
src:=overlay(src placing $edit$uper_lig',NULL,NULL,NULL))$edit$ from 2647 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('$edit$ from 2646 for 0);
src:=overlay(src placing $edit$$edit$ from 2626 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_player_public_profile_v2';
if md5(src)<>'5e51b8aca2776fb99f31be16a4f72c28' then raise exception 'Ranking function changed before deployment: get_player_public_profile_v2'; end if;
src:=overlay(src placing $edit$uper_lig',NULL,v_week,NULL))$edit$ from 2001 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('$edit$ from 2000 for 0);
src:=overlay(src placing $edit$$edit$ from 1980 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_league_initial_preview';
if md5(src)<>'b4127d6f86f047f0f2a45718e14ddef7' then raise exception 'Ranking function changed before deployment: get_league_initial_preview'; end if;
src:=overlay(src placing $edit$tarts_at)$edit$ from 2414 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(v_$edit$ from 2413 for 0);
src:=overlay(src placing $edit$$edit$ from 2393 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='initialize_first_league_period';
if md5(src)<>'0b1d257857173ed5f24e46d1ef887c54' then raise exception 'Ranking function changed before deployment: initialize_first_league_period'; end if;
src:=overlay(src placing $edit$tarts_at)$edit$ from 2292 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(p_$edit$ from 2291 for 0);
src:=overlay(src placing $edit$$edit$ from 2271 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='league_historical_seed_scores';
if md5(src)<>'74be36f02757dc0a06ff1af05c934f41' then raise exception 'Ranking function changed before deployment: league_historical_seed_scores'; end if;
src:=overlay(src placing $edit$) i on true$edit$ from 2581 for 0);
src:=overlay(src placing $edit$)$edit$ from 2559 for 1);
src:=overlay(src placing $edit$nam$edit$ from 2557 for 1);
src:=overlay(src placing $edit$z where lower(z$edit$ from 2547 for 1);
src:=overlay(src placing $edit$,s.week,NULL))$edit$ from 2546 for 0);
src:=overlay(src placing $edit$from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',s.seas$edit$ from 2544 for 0);
src:=overlay(src placing $edit$nvite_count$edit$ from 2543 for 0);
src:=overlay(src placing $edit$d_name))::bigint$edit$ from 2540 for 1);
src:=overlay(src placing $edit$lateral (select count(distinct lower(z.$edit$ from 2534 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(p_before)$edit$ from 2171 for 1);
src:=overlay(src placing $edit$$edit$ from 2151 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='refresh_arena_live_super_week';
if md5(src)<>'2fb105a6eeddbc7d5f48093a79819f7e' then raise exception 'Ranking function changed before deployment: refresh_arena_live_super_week'; end if;
src:=overlay(src placing $edit$uper_lig',p_season,p_week,NULL))$edit$ from 2301 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('$edit$ from 2300 for 0);
src:=overlay(src placing $edit$$edit$ from 2280 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='refresh_arena_live_cup_week';
if md5(src)<>'91cb15cc6882f46f16cdd0c0cc0cfd7e' then raise exception 'Ranking function changed before deployment: refresh_arena_live_cup_week'; end if;
src:=overlay(src placing $edit$eason,p_week,NULL))$edit$ from 3743 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff(p_competition,p_$edit$ from 3742 for 0);
src:=overlay(src placing $edit$$edit$ from 3722 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='refresh_league_memberships';
if md5(src)<>'708b7fa908821fea24564177dd375cf2' then raise exception 'Ranking function changed before deployment: refresh_league_memberships'; end if;
src:=overlay(src placing $edit$t(v_ends_at,invite_ranking_private.cutoff('all',NULL,NULL,NULL)))$edit$ from 4836 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(lea$edit$ from 4835 for 0);
src:=overlay(src placing $edit$$edit$ from 4815 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='super_arena_ranking_rows_excluding';
if md5(src)<>'60e074e1e4cbf7da23cd9c89f76f129c' then raise exception 'Ranking function changed before deployment: super_arena_ranking_rows_excluding'; end if;
src:=overlay(src placing $edit$weekly_$edit$ from 2366 for 0);
src:=overlay(src placing $edit$ as(select lower(inviter_name) k,count(distinct lower(invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff('super_lig',(select season from target),(select week from target),p_fixture_id))$edit$ from 2090 for 0);
src:=overlay(src placing $edit$(inviter_name)),
weekly$edit$ from 2082 for 0);
src:=overlay(src placing $edit$ow$edit$ from 2078 for 2);
src:=overlay(src placing $edit$_fixture_id)) group by $edit$ from 2077 for 0);
src:=overlay(src placing $edit$utoff('all',NULL,NULL,$edit$ from 2075 for 1);
src:=overlay(src placing $edit$nvite_ranking_private.$edit$ from 2074 for 0);
src:=overlay(src placing $edit$e($edit$ from 2073 for 0);
src:=overlay(src placing $edit$rivate.eligi$edit$ from 2070 for 1);
src:=overlay(src placing $edit$invite_ranking_$edit$ from 2069 for 0);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='super_friend_ranking_rows_excluding';
if md5(src)<>'55ee876f94342356728bba4bbf3e16e2' then raise exception 'Ranking function changed before deployment: super_friend_ranking_rows_excluding'; end if;
src:=overlay(src placing $edit$uper_lig',NULL,NULL,p_fixture_id))$edit$ from 464 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('$edit$ from 463 for 0);
src:=overlay(src placing $edit$$edit$ from 443 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_player_museum';
if md5(src)<>'4b6959881f513a58255c0860f6138f93' then raise exception 'Ranking function changed before deployment: get_player_museum'; end if;
src:=overlay(src placing $edit$) i on true$edit$ from 6406 for 0);
src:=overlay(src placing $edit$)$edit$ from 6384 for 1);
src:=overlay(src placing $edit$nam$edit$ from 6382 for 1);
src:=overlay(src placing $edit$nvit$edit$ from 6374 for 5);
src:=overlay(src placing $edit$z where lower(z.$edit$ from 6373 for 0);
src:=overlay(src placing $edit$s_league',s.season,s.week,NULL))$edit$ from 6372 for 0);
src:=overlay(src placing $edit$from invite_ranking_private.eligible(invite_ranking_private.cutoff('nati$edit$ from 6370 for 0);
src:=overlay(src placing $edit$nvite_count$edit$ from 6369 for 0);
src:=overlay(src placing $edit$d_name))::bigint$edit$ from 6366 for 1);
src:=overlay(src placing $edit$lateral (select count(distinct lower(z.$edit$ from 6360 for 0);
src:=overlay(src placing $edit$) i on true$edit$ from 4523 for 0);
src:=overlay(src placing $edit$)$edit$ from 4501 for 1);
src:=overlay(src placing $edit$nam$edit$ from 4499 for 1);
src:=overlay(src placing $edit$nvit$edit$ from 4491 for 5);
src:=overlay(src placing $edit$z where lower(z.$edit$ from 4490 for 0);
src:=overlay(src placing $edit$s_league',s.season,s.week,NULL))$edit$ from 4489 for 0);
src:=overlay(src placing $edit$from invite_ranking_private.eligible(invite_ranking_private.cutoff('champi$edit$ from 4487 for 0);
src:=overlay(src placing $edit$nvite_count$edit$ from 4486 for 0);
src:=overlay(src placing $edit$d_name))::bigint$edit$ from 4483 for 1);
src:=overlay(src placing $edit$lateral (select count(distinct lower(z.$edit$ from 4477 for 0);
src:=overlay(src placing $edit$) i on true$edit$ from 2610 for 0);
src:=overlay(src placing $edit$re lower(z.inviter_name)$edit$ from 2588 for 1);
src:=overlay(src placing $edit$,NULL)) z wh$edit$ from 2587 for 0);
src:=overlay(src placing $edit$lig',s.season,s.wee$edit$ from 2586 for 0);
src:=overlay(src placing $edit$te.cutoff('sup$edit$ from 2582 for 1);
src:=overlay(src placing $edit$riv$edit$ from 2580 for 1);
src:=overlay(src placing $edit$eligible(invite_ranking_$edit$ from 2579 for 0);
src:=overlay(src placing $edit$nvite_ranking_private$edit$ from 2578 for 0);
src:=overlay(src placing $edit$m$edit$ from 2575 for 1);
src:=overlay(src placing $edit$fr$edit$ from 2574 for 0);
src:=overlay(src placing $edit$nvite_count$edit$ from 2573 for 0);
src:=overlay(src placing $edit$d_name))::bigint$edit$ from 2570 for 1);
src:=overlay(src placing $edit$lateral (select count(distinct lower(z.$edit$ from 2564 for 0);
src:=overlay(src placing $edit$_ranking_private.eligible(invite_ranking_private.cutoff('all',NULL,NULL,NULL))$edit$ from 803 for 1);
src:=overlay(src placing $edit$$edit$ from 783 for 14);
execute src;
select pg_get_functiondef(p.oid) into strict src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='cup_ranking_rows';
if md5(src)<>'8d476e8cca02aac60695715d688302e3' then raise exception 'Ranking function changed before deployment: cup_ranking_rows'; end if;
src:=overlay(src placing $edit$weekly_$edit$ from 6339 for 0);
src:=overlay(src placing $edit$ as(select lower(pi.inviter_name) k,count(distinct lower(pi.invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff(p_competition,p_season,p_week,p_exclude_fixture))$edit$ from 3669 for 0);
src:=overlay(src placing $edit$(pi.inviter_name)), weekly$edit$ from 3661 for 0);
src:=overlay(src placing $edit$ low$edit$ from 3659 for 0);
src:=overlay(src placing $edit$ude_fixture)) pi group b$edit$ from 3657 for 1);
src:=overlay(src placing $edit$_competition,p_season,NULL,p_exc$edit$ from 3656 for 0);
src:=overlay(src placing $edit$utoff($edit$ from 3654 for 1);
src:=overlay(src placing $edit$nvite_ranking_private.$edit$ from 3653 for 0);
src:=overlay(src placing $edit$e($edit$ from 3652 for 0);
src:=overlay(src placing $edit$rivate.eligi$edit$ from 3649 for 1);
src:=overlay(src placing $edit$invite_ranking_$edit$ from 3648 for 0);
src:=overlay(src placing $edit$weekly_$edit$ from 3227 for 0);
src:=overlay(src placing $edit$ as(select lower(pi.inviter_name) k,count(distinct lower(pi.invited_name))::bigint c from invite_ranking_private.eligible(invite_ranking_private.cutoff(p_competition,p_season,p_week,p_exclude_fixture))$edit$ from 535 for 0);
src:=overlay(src placing $edit$(pi.inviter_name)), weekly$edit$ from 527 for 0);
src:=overlay(src placing $edit$ low$edit$ from 525 for 0);
src:=overlay(src placing $edit$ude_fixture)) pi group b$edit$ from 523 for 1);
src:=overlay(src placing $edit$_competition,p_season,NULL,p_exc$edit$ from 522 for 0);
src:=overlay(src placing $edit$utoff($edit$ from 520 for 1);
src:=overlay(src placing $edit$nvite_ranking_private.$edit$ from 519 for 0);
src:=overlay(src placing $edit$e($edit$ from 518 for 0);
src:=overlay(src placing $edit$rivate.eligi$edit$ from 515 for 1);
src:=overlay(src placing $edit$invite_ranking_$edit$ from 514 for 0);
execute src;
end $patch$;

-- User-verified repair: only these two players; keep the true registration date
-- for monthly attribution, while ranking eligibility starts at the repair.
insert into public.player_invites(inviter_name,invited_name,created_at,ranking_effective_at)
select inviter.name,invited.name,invited.created_at,clock_timestamp()
from public.players inviter cross join public.players invited
where inviter.name='Erdal' and invited.name in('Bilal','ismail')
on conflict(invited_name) do nothing;

do $audit$ declare r record;src text;n text;begin
for r in select p.oid,p.proname from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname=any(array['get_champions_league_ranking','get_champions_league_weekly_ranking','get_nations_league_ranking','get_nations_league_weekly_ranking','get_friend_league_ranking','get_player_museum','get_player_public_profile_v2','get_league_initial_preview']) loop
 src:=pg_get_functiondef(r.oid);
 foreach n in array array['get_champions_league_ranking','get_champions_league_weekly_ranking','get_nations_league_ranking','get_nations_league_weekly_ranking','get_friend_league_ranking','get_player_museum','get_player_public_profile_v2','get_league_initial_preview'] loop
 src:=replace(src,'public.'||n||'(','pg_temp.'||n||'(');
 end loop;
 src:=replace(src,'public.friend_session_player(p_token)',quote_literal('Erdal')||'::text');
 if r.proname='get_friend_league_ranking' then
 src:=replace(src,quote_literal('Erdal')||'::text','(select fm.player_name from public.friend_league_members fm where fm.league_id=p_league_id order by fm.player_name limit 1)');
 end if;
 src:=replace(src,'SECURITY DEFINER','SECURITY INVOKER');
 execute src;
end loop;
end $audit$;

create temp table invite_after on commit drop as
select 'super_general'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.get_super_league_general_ranking()) a
union all
select 'super_historical'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select w.week,r.* from (select distinct f.week from public.fixtures f join public.results r on r.fixture_id=f.id) w cross join lateral public.current_super_ranking_rows(w.week) r) a
union all
select 'champions_general'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from pg_temp.get_champions_league_ranking(null,'2026/27')) a
union all
select 'champions_weekly'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select w.week,r.* from (select distinct f.week from public.champions_league_fixtures f join public.champions_league_results r on r.fixture_id=f.id) w cross join lateral pg_temp.get_champions_league_weekly_ranking(null,'2026/27',w.week) r) a
union all
select 'nations_general'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from pg_temp.get_nations_league_ranking(null,'2026/27')) a
union all
select 'nations_weekly'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select w.week,r.* from (select distinct f.week from public.nations_league_fixtures f join public.nations_league_results r on r.fixture_id=f.id) w cross join lateral pg_temp.get_nations_league_weekly_ranking(null,'2026/27',w.week) r) a
union all
select 'profiles'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select distinct p.name,w.week,r.week_rank,r.week_points,r.general_rank,r.sezu_rank,r.champions_rank from public.players p cross join (select distinct f.week from public.fixtures f join public.results r on r.fixture_id=f.id) w cross join lateral pg_temp.get_player_public_profile_v2(null,p.name,w.week) r where p.name='Erdal') a
union all
select 'museums'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select p.name,pg_temp.get_player_museum(null,p.name) museum from public.players p where p.name='Erdal') a
union all
select 'friends'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select distinct m.league_id,r.* from (select distinct league_id from public.friend_league_members) m cross join lateral pg_temp.get_friend_league_ranking(null,m.league_id) r) a
union all
select 'movement'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.get_super_league_latest_ranking_movement()) a
union all
select 'arena_rows'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select period_id,player_id,competition,round_key,rank,performance_score,raw_points,exact_score_count from public.league_round_performance) a
union all
select 'arena_memberships'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.league_memberships) a
union all
select 'arena_history'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.league_history) a
union all
select 'cup_matches'::text key,coalesce(jsonb_agg(to_jsonb(a) order by to_jsonb(a)::text),'[]'::jsonb) value from (select * from public.bizimskor_cup_matches) a;
do $assert$ declare bad text;n integer;begin
 select string_agg(b.key,', ') into bad from invite_baseline b full join invite_after a using(key) where b.value is distinct from a.value;
 if bad is not null then raise exception 'Historical rankings changed: %',bad;end if;
 select count(*) into n from public.player_invites where inviter_name='Erdal' and invited_name in('Bilal','ismail');
 if n<>2 then raise exception 'Expected exactly two verified invite repairs';end if;
 if exists(select 1 from invite_ranking_private.eligible('-infinity') where inviter_name='Erdal' and invited_name in('Bilal','ismail')) then raise exception 'Restored invites leaked into historical rankings';end if;
 if (select count(*) from invite_ranking_private.eligible('infinity') where inviter_name='Erdal' and invited_name in('Bilal','ismail'))<>2 then raise exception 'Restored invites missing from future rankings';end if;
 if has_schema_privilege('anon','invite_ranking_private','USAGE') or has_function_privilege('anon','invite_ranking_private.eligible(timestamptz)','EXECUTE') then raise exception 'Private helper exposed';end if;
end $assert$;
select 'historical_rankings_unchanged' result,count(*) compared_groups from invite_after;
