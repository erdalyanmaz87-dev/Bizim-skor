CREATE OR REPLACE FUNCTION public.refresh_current_arena_live()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_period_id bigint;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_start_season text;
  v_start_week integer;
  v_expected_end timestamptz;
  rec record;
begin
  select lp.id,lp.starts_at,lp.ends_at
    into v_period_id,v_start_at,v_end_at
  from public.league_periods lp
  where lp.status='open'
  order by lp.starts_at desc
  limit 1;

  if v_period_id is null then
    perform public.bootstrap_first_league_period();
    select lp.id,lp.starts_at,lp.ends_at
      into v_period_id,v_start_at,v_end_at
    from public.league_periods lp
    where lp.status='open'
    order by lp.starts_at desc
    limit 1;
  end if;
  if v_period_id is null then return false; end if;

  select f.season,f.week into v_start_season,v_start_week
  from public.fixtures f
  where f.kickoff>=v_start_at
  order by f.kickoff,f.id
  limit 1;
  if v_start_season is null then return false; end if;

  -- The next Super Lig week is the exclusive boundary of this four-week period.
  -- A fallback calendar date can become stale when fixtures are published later.
  select min(f.kickoff) into v_expected_end
  from public.fixtures f
  where f.season=v_start_season and f.week=v_start_week+4;
  if v_expected_end is not null and v_expected_end>v_end_at then
    update public.league_periods set ends_at=v_expected_end
    where id=v_period_id and status='open';
    v_end_at:=v_expected_end;
  end if;

  for rec in
    select f.season,f.week
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where f.season=v_start_season
      and f.week between v_start_week and v_start_week+3
      and f.kickoff<=now()
    group by f.season,f.week
    having count(distinct r.fixture_id) filter(
      where r.home_score is not null and r.away_score is not null
    )>0
    order by f.week
  loop
    perform public.refresh_arena_live_super_week(v_period_id,rec.season,rec.week);
  end loop;

  for rec in
    select f.season,f.week
    from public.champions_league_fixtures f
    left join public.champions_league_results r on r.fixture_id=f.id
    group by f.season,f.week
    having min(f.kickoff)>=v_start_at
      and max(f.kickoff)<=v_end_at
      and min(f.kickoff)<=now()
      and count(distinct f.id)>0
      and count(distinct r.fixture_id) filter(
        where r.home_score is not null and r.away_score is not null
      )>0
  loop
    perform public.refresh_arena_live_cup_week(
      v_period_id,'champions_league',rec.season,rec.week
    );
  end loop;

  for rec in
    select f.season,f.week
    from public.nations_league_fixtures f
    left join public.nations_league_results r on r.fixture_id=f.id
    group by f.season,f.week
    having min(f.kickoff)>=v_start_at
      and max(f.kickoff)<=v_end_at
      and min(f.kickoff)<=now()
      and count(distinct f.id)>0
      and count(distinct r.fixture_id) filter(
        where r.home_score is not null and r.away_score is not null
      )>0
  loop
    perform public.refresh_arena_live_cup_week(
      v_period_id,'nations_league',rec.season,rec.week
    );
  end loop;

  perform public.refresh_league_memberships(v_period_id);
  return true;
end;
$function$;
