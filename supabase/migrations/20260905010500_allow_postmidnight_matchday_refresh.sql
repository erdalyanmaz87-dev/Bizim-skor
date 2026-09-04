-- Keep the 30-minute post-match refresh valid when the wait crosses midnight,
-- without reopening old match days or retrying an attempted day.

create or replace function public.football_center_refresh_due(
  p_competition text,
  p_mode text,
  p_now timestamptz default now()
)
returns table(due boolean, sync_key text, fixture_ids bigint[], season text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_today date := (p_now at time zone 'Europe/Istanbul')::date;
  v_match_day date;
  v_ids bigint[] := '{}';
  v_season text := '2026/27';
  v_last_result_at timestamptz;
  v_key text;
begin
  if p_competition not in ('super_lig','champions_league') then
    raise exception 'Geçersiz organizasyon.';
  end if;
  if p_mode not in ('matchday_complete','manual') then
    raise exception 'Geçersiz yenileme türü.';
  end if;

  if p_mode='matchday_complete' then
    if p_competition='super_lig' then
      with day_state as (
        select
          (f.kickoff at time zone 'Europe/Istanbul')::date match_day,
          array_agg(f.id order by f.id) fixture_ids,
          coalesce(max(f.season),'2026/27') season,
          bool_and(
            r.fixture_id is not null
            and r.home_score is not null
            and r.away_score is not null
            and r.status<>'scheduled'
          ) completed,
          max(r.updated_at) last_result_at
        from public.fixtures f
        left join public.results r on r.fixture_id=f.id
        where (f.kickoff at time zone 'Europe/Istanbul')::date between v_today-1 and v_today
        group by 1
      )
      select d.match_day,d.fixture_ids,d.season,d.last_result_at
      into v_match_day,v_ids,v_season,v_last_result_at
      from day_state d
      where d.completed
        and d.last_result_at is not null
        and p_now>=d.last_result_at+interval '30 minutes'
        and p_now<d.last_result_at+interval '6 hours'
        and not exists(
          select 1 from public.football_center_sync_runs x
          where x.sync_key='super_lig:'||d.season||':matchday:'||d.match_day::text
        )
      order by d.match_day desc
      limit 1;
    else
      with day_state as (
        select
          (f.kickoff at time zone 'Europe/Istanbul')::date match_day,
          array_agg(f.id order by f.id) fixture_ids,
          coalesce(max(f.season),'2026/27') season,
          bool_and(
            r.fixture_id is not null
            and r.home_score is not null
            and r.away_score is not null
          ) completed,
          max(r.updated_at) last_result_at
        from public.champions_league_fixtures f
        left join public.champions_league_results r on r.fixture_id=f.id
        where (f.kickoff at time zone 'Europe/Istanbul')::date between v_today-1 and v_today
        group by 1
      )
      select d.match_day,d.fixture_ids,d.season,d.last_result_at
      into v_match_day,v_ids,v_season,v_last_result_at
      from day_state d
      where d.completed
        and d.last_result_at is not null
        and p_now>=d.last_result_at+interval '30 minutes'
        and p_now<d.last_result_at+interval '6 hours'
        and not exists(
          select 1 from public.football_center_sync_runs x
          where x.sync_key='champions_league:'||d.season||':matchday:'||d.match_day::text
        )
      order by d.match_day desc
      limit 1;
    end if;

    v_key:=p_competition||':'||coalesce(v_season,'2026/27')||':matchday:'||coalesce(v_match_day,v_today)::text;
    return query select v_match_day is not null,v_key,coalesce(v_ids,'{}'),coalesce(v_season,'2026/27');
    return;
  end if;

  if p_competition='super_lig' then
    select coalesce(array_agg(f.id order by f.id),'{}'),coalesce(max(f.season),'2026/27')
    into v_ids,v_season
    from public.fixtures f
    where (f.kickoff at time zone 'Europe/Istanbul')::date=v_today;
  else
    select coalesce(array_agg(f.id order by f.id),'{}'),coalesce(max(f.season),'2026/27')
    into v_ids,v_season
    from public.champions_league_fixtures f
    where (f.kickoff at time zone 'Europe/Istanbul')::date=v_today;
  end if;
  v_key:=p_competition||':'||v_season||':manual:'||to_char(p_now,'YYYYMMDDHH24MISS');
  return query select true,v_key,v_ids,v_season;
end;
$$;

revoke all on function public.football_center_refresh_due(text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.football_center_refresh_due(text,text,timestamptz)
  to service_role;
