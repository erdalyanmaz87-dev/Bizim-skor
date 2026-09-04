-- Refresh Football Center exactly once per competition and match day,
-- no earlier than 30 minutes after the final result is recorded.

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
  v_ids bigint[] := '{}';
  v_season text := '2026/27';
  v_complete boolean := false;
  v_last_result_at timestamptz;
  v_key text;
begin
  if p_competition not in ('super_lig','champions_league') then
    raise exception 'Geçersiz organizasyon.';
  end if;
  if p_mode not in ('matchday_complete','manual') then
    raise exception 'Geçersiz yenileme türü.';
  end if;

  if p_competition='super_lig' then
    select
      coalesce(array_agg(f.id order by f.id),'{}'),
      coalesce(max(f.season),'2026/27'),
      count(*)>0 and bool_and(
        r.fixture_id is not null
        and r.home_score is not null
        and r.away_score is not null
        and r.status<>'scheduled'
      ),
      max(r.updated_at)
    into v_ids,v_season,v_complete,v_last_result_at
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where (f.kickoff at time zone 'Europe/Istanbul')::date=v_today;
  else
    select
      coalesce(array_agg(f.id order by f.id),'{}'),
      coalesce(max(f.season),'2026/27'),
      count(*)>0 and bool_and(
        r.fixture_id is not null
        and r.home_score is not null
        and r.away_score is not null
      ),
      max(r.updated_at)
    into v_ids,v_season,v_complete,v_last_result_at
    from public.champions_league_fixtures f
    left join public.champions_league_results r on r.fixture_id=f.id
    where (f.kickoff at time zone 'Europe/Istanbul')::date=v_today;
  end if;

  if p_mode='matchday_complete' then
    v_key:=p_competition||':'||v_season||':matchday:'||v_today::text;
    return query select
      cardinality(v_ids)>0
      and v_complete
      and v_last_result_at is not null
      and p_now>=v_last_result_at+interval '30 minutes'
      and not exists(
        select 1 from public.football_center_sync_runs x
        where x.sync_key=v_key
      ),
      v_key,v_ids,v_season;
    return;
  end if;

  v_key:=p_competition||':'||v_season||':manual:'||to_char(p_now,'YYYYMMDDHH24MISS');
  return query select true,v_key,v_ids,v_season;
end;
$$;

revoke all on function public.football_center_refresh_due(text,text,timestamptz)
  from public,anon,authenticated;
grant execute on function public.football_center_refresh_due(text,text,timestamptz)
  to service_role;

do $$
declare existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname in ('football-center-matchday-complete','football-center-three-hour-refresh')
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'football-center-matchday-complete',
  '*/10 * * * *',
  $cron$
    select net.http_post(
      url:=(
        select decrypted_secret from vault.decrypted_secrets
        where name='live_score_project_url' order by created_at desc limit 1
      )||'/functions/v1/football-center-sync',
      headers:=jsonb_build_object(
        'Content-Type','application/json',
        'x-football-center-secret',(
          select decrypted_secret from vault.decrypted_secrets
          where name='football_center_cron_secret' order by created_at desc limit 1
        )
      ),
      body:=jsonb_build_object('competition',competition,'mode','matchday_complete')
    )
    from (values ('super_lig'),('champions_league')) jobs(competition);
  $cron$
);
