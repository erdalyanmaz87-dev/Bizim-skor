-- Keep late fixtures alive across the Istanbul midnight boundary. The four-hour
-- ceiling is a safety guard; terminal cards remain visible for one hour.
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
    where p_now>=kickoff and p_now<kickoff+interval '4 hours'
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
      date_trunc('minute',p.kickoff+interval '4 hours'-interval '1 minute'),
      interval '1 minute'
    ) minute_mark
    where p.kickoff+interval '4 hours'>p_now
  )
  select active.n,usage.n,greatest(active.last_cache_at,usage.last_api_at),remaining_minutes.n
  from active,usage,remaining_minutes;
$$;

revoke all on function public.get_live_score_adaptive_poll_gate(timestamptz) from public,anon,authenticated;
grant execute on function public.get_live_score_adaptive_poll_gate(timestamptz) to service_role;

create or replace function public.get_today_live_match_cards(p_now timestamptz default now())
returns table(
  competition text,
  fixture_id bigint,
  home_team text,
  away_team text,
  kickoff timestamptz,
  status text,
  elapsed smallint,
  home_score smallint,
  away_score smallint,
  fetched_at timestamptz,
  exact_players text[]
)
language sql
security definer
set search_path=public,pg_temp
as $$
  with all_fixtures as (
    select 'super_lig'::text as competition, f.id as fixture_id, f.home_team, f.away_team, f.kickoff, r.status as result_status, r.home_score as result_home_score, r.away_score as result_away_score, r.updated_at as result_updated_at
    from public.fixtures f left join public.results r on r.fixture_id=f.id
    union all
    select 'champions_league'::text, f.id, f.home_team, f.away_team, f.kickoff, case when r.fixture_id is not null then 'finished'::text end, r.home_score, r.away_score, r.updated_at
    from public.champions_league_fixtures f left join public.champions_league_results r on r.fixture_id=f.id
    union all
    select 'nations_league'::text, f.id, f.home_team, f.away_team, f.kickoff, case when r.fixture_id is not null then 'finished'::text end, r.home_score, r.away_score, r.updated_at
    from public.nations_league_fixtures f left join public.nations_league_results r on r.fixture_id=f.id
  ), cards as (
    select f.*,
      coalesce(case when f.result_status='finished' then 'FT' end,c.status) as card_status,
      case when f.result_status='finished' then null else c.elapsed end as elapsed,
      coalesce(f.result_home_score,c.home_score)::smallint as card_home_score,
      coalesce(f.result_away_score,c.away_score)::smallint as card_away_score,
      coalesce(f.result_updated_at,c.fetched_at) as card_fetched_at
    from all_fixtures f
    left join public.live_score_cache c on c.competition=f.competition and c.fixture_id=f.fixture_id
  ), visible_cards as (
    select c.*
    from cards c
    cross join lateral (
      select date_trunc('day',p_now at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul' as local_day_start
    ) d
    where c.kickoff>=d.local_day_start
      or (
        c.kickoff<d.local_day_start
        and (
          (upper(coalesce(c.card_status,'')) in ('1H','HT','2H','ET','BT','P')
            and p_now>=c.kickoff and p_now<c.kickoff+interval '4 hours')
          or
          (upper(coalesce(c.card_status,'')) in ('FT','AET','PEN')
            and c.card_fetched_at is not null
            and p_now>=c.card_fetched_at and p_now<c.card_fetched_at+interval '1 hour')
        )
      )
  )
  select c.competition, c.fixture_id, c.home_team, c.away_team, c.kickoff,
    c.card_status, c.elapsed, c.card_home_score, c.card_away_score, c.card_fetched_at,
    case when p_now>=c.kickoff and c.card_home_score is not null and c.card_away_score is not null then coalesce((
      select array_agg(x.player_name order by x.player_name collate "tr-TR-x-icu")
      from (
        select p.player_name from public.predictions p join public.players pl on pl.name=p.player_name and pl.is_active=true where c.competition='super_lig' and p.fixture_id=c.fixture_id and p.home_score=c.card_home_score and p.away_score=c.card_away_score
        union all
        select p.player_name from public.champions_league_predictions p join public.players pl on pl.name=p.player_name and pl.is_active=true where c.competition='champions_league' and p.fixture_id=c.fixture_id and p.home_score=c.card_home_score and p.away_score=c.card_away_score
        union all
        select p.player_name from public.nations_league_predictions p join public.players pl on pl.name=p.player_name and pl.is_active=true where c.competition='nations_league' and p.fixture_id=c.fixture_id and p.home_score=c.card_home_score and p.away_score=c.card_away_score
      ) x
    ),array[]::text[]) else array[]::text[] end
  from visible_cards c
  order by c.kickoff,c.competition,c.fixture_id;
$$;

revoke all on function public.get_today_live_match_cards(timestamptz) from public,anon,authenticated;
grant execute on function public.get_today_live_match_cards(timestamptz) to anon,authenticated;
