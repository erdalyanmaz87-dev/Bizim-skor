alter table public.live_fixture_links add column if not exists provider text not null default 'api_football' check(provider in ('api_football','soccersapi'));
alter table public.live_fixture_links drop constraint live_fixture_links_provider_fixture_id_key;
alter table public.live_fixture_links add constraint live_fixture_links_provider_id_unique unique(provider,provider_fixture_id);
alter table public.live_score_result_audit drop constraint live_score_result_audit_source_check;
alter table public.live_score_result_audit add constraint live_score_result_audit_source_check check(source in ('api_football','soccersapi','manual_override'));
create table public.soccersapi_daily_usage(
 usage_date date primary key,
 request_count integer not null default 0,
 remaining integer not null default 94,
 last_requested_at timestamptz
);
alter table public.soccersapi_daily_usage enable row level security;
revoke all on public.soccersapi_daily_usage from public,anon,authenticated;
grant select,insert,update on public.soccersapi_daily_usage to service_role;
create function public.reserve_soccersapi_request(p_date date default (now() at time zone 'Europe/Istanbul')::date)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_remaining integer; declare v_count integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('soccersapi:'||p_date::text,0));
 insert into public.soccersapi_daily_usage(usage_date) values(p_date) on conflict do nothing;
 select remaining,request_count into v_remaining,v_count from public.soccersapi_daily_usage where usage_date=p_date for update;
 if v_remaining<=6 or v_count>=90 then return false; end if;
 update public.soccersapi_daily_usage set request_count=request_count+1,remaining=remaining-1,last_requested_at=now() where usage_date=p_date;
 return true;
end;
$$;
revoke all on function public.reserve_soccersapi_request(date) from public,anon,authenticated;
grant execute on function public.reserve_soccersapi_request(date) to service_role;
CREATE OR REPLACE FUNCTION public.record_provider_observation(p_competition text, p_fixture_id bigint, p_status text, p_elapsed smallint, p_home_score smallint, p_away_score smallint, p_fetched_at timestamp with time zone DEFAULT now())
 RETURNS TABLE(terminal_seen_count smallint, terminal_signature text, should_finalize boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_terminal boolean:=p_status in ('FT','AET','PEN');
declare v_signature text:=case when p_status in ('FT','AET','PEN') then p_status||':'||p_home_score||':'||p_away_score end;
begin
  if p_competition not in ('super_lig','champions_league','nations_league') or p_home_score not between 0 and 20 or p_away_score not between 0 and 20 then
    raise exception 'invalid live observation';
  end if;
  insert into public.live_score_cache(competition,fixture_id,status,elapsed,home_score,away_score,fetched_at,terminal_seen_count,terminal_signature)
  values(p_competition,p_fixture_id,p_status,p_elapsed,p_home_score,p_away_score,p_fetched_at,case when v_terminal then 1 else 0 end,v_signature)
  on conflict(competition,fixture_id) do update set
    status=excluded.status,elapsed=excluded.elapsed,home_score=excluded.home_score,away_score=excluded.away_score,fetched_at=excluded.fetched_at,
    terminal_seen_count=case when v_terminal and public.live_score_cache.terminal_signature=v_signature then public.live_score_cache.terminal_seen_count+1 when v_terminal then 1 else 0 end,
    terminal_signature=v_signature;
  return query select c.terminal_seen_count,c.terminal_signature,(c.terminal_seen_count>=2 and v_terminal) from public.live_score_cache c where c.competition=p_competition and c.fixture_id=p_fixture_id;
end;
$function$

CREATE OR REPLACE FUNCTION public.finalize_live_score_result(p_competition text, p_fixture_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare c public.live_score_cache%rowtype;
declare old_h smallint; declare old_a smallint;
declare v_source text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_competition||':'||p_fixture_id,0));
  select * into c from public.live_score_cache where competition=p_competition and fixture_id=p_fixture_id for update;
  if not found or c.terminal_seen_count<2 or c.status not in ('FT','AET','PEN') then return false; end if;
  if exists(select 1 from public.live_score_result_audit a where a.competition=p_competition and a.fixture_id=p_fixture_id and a.source='manual_override') then return false; end if;
  select provider into v_source from public.live_fixture_links where competition=p_competition and fixture_id=p_fixture_id;
  v_source:=coalesce(v_source,'api_football');
  if exists(select 1 from public.live_score_result_audit a where a.competition=p_competition and a.fixture_id=p_fixture_id and a.source=v_source and a.new_home_score=c.home_score and a.new_away_score=c.away_score) then return false; end if;
  if p_competition='super_lig' then
    select home_score,away_score into old_h,old_a from public.results where fixture_id=p_fixture_id;
    insert into public.results(fixture_id,home_score,away_score,status,updated_at) values(p_fixture_id,c.home_score,c.away_score,'finished',now())
    on conflict(fixture_id) do update set home_score=excluded.home_score,away_score=excluded.away_score,status='finished',updated_at=now();
  elsif p_competition='champions_league' then
    select home_score,away_score into old_h,old_a from public.champions_league_results where fixture_id=p_fixture_id;
    insert into public.champions_league_results(fixture_id,home_score,away_score,updated_at) values(p_fixture_id,c.home_score,c.away_score,now())
    on conflict(fixture_id) do update set home_score=excluded.home_score,away_score=excluded.away_score,updated_at=now();
  elsif p_competition='nations_league' then
    select home_score,away_score into old_h,old_a from public.nations_league_results where fixture_id=p_fixture_id;
    insert into public.nations_league_results(fixture_id,home_score,away_score,updated_at) values(p_fixture_id,c.home_score,c.away_score,now())
    on conflict(fixture_id) do update set home_score=excluded.home_score,away_score=excluded.away_score,updated_at=now();
  else return false;
  end if;
  insert into public.live_score_result_audit(competition,fixture_id,source,old_home_score,old_away_score,new_home_score,new_away_score)
  values(p_competition,p_fixture_id,v_source,old_h,old_a,c.home_score,c.away_score);
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_soccersapi_poll_gate(p_now timestamp with time zone DEFAULT now())
 RETURNS TABLE(active_fixture_count integer, request_count integer, last_observation_at timestamp with time zone, remaining_window_minutes integer)
 LANGUAGE sql
 SECURITY INVOKER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  with all_fixtures as (
    select 'super_lig'::text competition, f.id fixture_id, f.kickoff,
      exists(
        select 1 from public.results r
        where r.fixture_id=f.id and r.home_score is not null and r.away_score is not null and r.status<>'scheduled'
      ) result_finalized
    from public.fixtures f
    union all
    select 'champions_league'::text, f.id, f.kickoff,
      exists(
        select 1 from public.champions_league_results r
        where r.fixture_id=f.id and r.home_score is not null and r.away_score is not null
      )
    from public.champions_league_fixtures f
    union all
    select 'nations_league'::text,f.id,f.kickoff,
      exists(select 1 from public.nations_league_results r where r.fixture_id=f.id and r.home_score is not null and r.away_score is not null)
    from public.nations_league_fixtures f
  ), pending as (
    select af.competition,af.fixture_id,af.kickoff,c.fetched_at,c.status,c.terminal_seen_count
    from all_fixtures af
    left join public.live_score_cache c
      on c.competition=af.competition and c.fixture_id=af.fixture_id
    where not af.result_finalized
      and (coalesce(c.status,'') not in ('FT','AET','PEN') or coalesce(c.terminal_seen_count,0)<2)
  ), active as (
    select count(*)::integer n,max(fetched_at) last_cache_at
    from pending
    where p_now>=kickoff and p_now<kickoff+interval '4 hours'
  ), usage as (
    select coalesce(sum(request_count),0)::integer n,
      max(last_requested_at) last_api_at
    from public.soccersapi_daily_usage
    where usage_date=(p_now at time zone 'Europe/Istanbul')::date
  ), remaining_minutes as (
    select count(distinct minute_mark)::integer n
    from pending p
    cross join lateral generate_series(
      date_trunc('minute',greatest(p_now,p.kickoff)),
      date_trunc('minute',p.kickoff+interval '4 hours'-interval '1 minute'),
      interval '1 minute'
    ) minute_mark
    where p_now>=p.kickoff and p.kickoff+interval '4 hours'>p_now
  )
  select active.n,usage.n,greatest(active.last_cache_at,usage.last_api_at),remaining_minutes.n
  from active,usage,remaining_minutes;
$function$

revoke all on function public.get_soccersapi_poll_gate(timestamptz) from public,anon,authenticated;
grant execute on function public.get_soccersapi_poll_gate(timestamptz) to service_role;
