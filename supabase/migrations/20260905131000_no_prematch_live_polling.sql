-- Provider requests start at exact kickoff. Unlinked fixtures participate in
-- the gate so the first live response can establish their provider links.
create or replace function public.get_live_score_adaptive_poll_gate(p_now timestamptz default now())
returns table(
  active_fixture_count integer,
  request_count integer,
  last_observation_at timestamptz,
  remaining_window_minutes integer
)
language sql
security definer
set search_path = pg_catalog, public
as $$
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
    where p_now>=kickoff and p_now<kickoff+interval '2 hours'
  ), usage as (
    select coalesce(sum(request_count),0)::integer n,
      max(last_requested_at) filter(where purpose='live_score') last_api_at
    from public.api_football_daily_usage
    where usage_date=(p_now at time zone 'Europe/Istanbul')::date
  ), remaining_minutes as (
    select count(distinct minute_mark)::integer n
    from pending p
    cross join lateral generate_series(
      date_trunc('minute',greatest(p_now,p.kickoff)),
      date_trunc('minute',p.kickoff+interval '2 hours'-interval '1 minute'),
      interval '1 minute'
    ) minute_mark
    where (p.kickoff at time zone 'Europe/Istanbul')::date=(p_now at time zone 'Europe/Istanbul')::date
      and p.kickoff+interval '2 hours'>p_now
  )
  select active.n,usage.n,greatest(active.last_cache_at,usage.last_api_at),remaining_minutes.n
  from active,usage,remaining_minutes;
$$;

revoke all on function public.get_live_score_adaptive_poll_gate(timestamptz) from public,anon,authenticated;
grant execute on function public.get_live_score_adaptive_poll_gate(timestamptz) to service_role;
