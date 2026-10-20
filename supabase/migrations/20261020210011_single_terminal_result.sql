-- Finalize the first explicit terminal provider observation.
-- Keep provider status, advisory locking, manual overrides and deduplication.
-- CREATE OR REPLACE preserves the existing service-only function ACLs.
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
  return query select c.terminal_seen_count,c.terminal_signature,(c.terminal_seen_count>=1 and v_terminal) from public.live_score_cache c where c.competition=p_competition and c.fixture_id=p_fixture_id;
end;
$function$;

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
  if not found or c.terminal_seen_count<1 or c.status not in ('FT','AET','PEN') then return false; end if;
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

