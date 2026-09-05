create table if not exists public.match_statistics_snapshots (
  fixture_id bigint primary key references public.fixtures(id) on delete cascade,
  week integer not null,
  season text not null,
  home_team text not null,
  away_team text not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  fetched_at timestamptz not null default now()
);

alter table public.api_football_daily_usage
  drop constraint if exists api_football_daily_usage_purpose_check;
alter table public.api_football_daily_usage
  add constraint api_football_daily_usage_purpose_check
  check (purpose in ('live_score','football_center','match_statistics'));

create or replace function public.reserve_api_football_requests(
  p_purpose text,
  p_count integer,
  p_date date default (now() at time zone 'Europe/Istanbul')::date
)
returns table(reserved boolean,remaining integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_total integer;
begin
  if p_purpose not in ('live_score','football_center','match_statistics') or p_count not between 1 and 20 then
    raise exception 'Geçersiz API kullanım rezervasyonu.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('api-football:'||p_date::text,0));
  perform 1 from public.api_football_daily_usage where usage_date=p_date for update;
  select coalesce(sum(request_count),0)::integer into v_total
  from public.api_football_daily_usage where usage_date=p_date;
  if v_total+p_count>100 then return query select false,100-v_total; return; end if;
  insert into public.api_football_daily_usage(usage_date,purpose,request_count,last_requested_at)
  values(p_date,p_purpose,p_count,now())
  on conflict(usage_date,purpose) do update
  set request_count=public.api_football_daily_usage.request_count+excluded.request_count,
      last_requested_at=excluded.last_requested_at;
  return query select true,100-v_total-p_count;
end;
$$;

create index if not exists match_statistics_snapshots_week_idx
  on public.match_statistics_snapshots(season,week);

alter table public.match_statistics_snapshots enable row level security;
drop policy if exists "match statistics are readable" on public.match_statistics_snapshots;
create policy "match statistics are readable"
  on public.match_statistics_snapshots for select
  to anon,authenticated
  using (true);

revoke all on public.match_statistics_snapshots from public,anon,authenticated;
grant select on public.match_statistics_snapshots to anon,authenticated;
grant select,insert,update,delete on public.match_statistics_snapshots to service_role;

create table if not exists public.match_statistics_sync_runs (
  id bigint generated always as identity primary key,
  sync_key text not null unique,
  season text not null,
  week integer not null,
  status text not null check (status in ('running','succeeded','partial','failed','deferred_quota')),
  request_budget integer not null check (request_budget between 1 and 10),
  request_count integer not null default 0 check (request_count between 0 and 10),
  saved_fixture_ids bigint[] not null default '{}',
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.match_statistics_sync_runs enable row level security;
revoke all on public.match_statistics_sync_runs from public,anon,authenticated;
grant select,insert,update,delete on public.match_statistics_sync_runs to service_role;

create or replace function public.get_match_statistics(p_fixture_id bigint)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select s.payload || jsonb_build_object(
    'fixture_id',s.fixture_id,
    'week',s.week,
    'home_team',s.home_team,
    'away_team',s.away_team,
    'fetched_at',s.fetched_at
  )
  from public.match_statistics_snapshots s
  where s.fixture_id=p_fixture_id;
$$;

revoke all on function public.get_match_statistics(bigint) from public;
grant execute on function public.get_match_statistics(bigint) to anon,authenticated;

create or replace function public.match_statistics_week_due(p_now timestamptz default now())
returns table(due boolean, sync_key text, fixture_ids bigint[], week integer, season text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_week integer;
  v_season text;
  v_ids bigint[] := '{}';
  v_fixture_count integer := 0;
  v_snapshot_count integer := 0;
  v_sync_key text;
  v_has_match_today boolean := false;
  v_recent_run boolean := false;
begin
  select f.week,coalesce(f.season,'2026/27')
  into v_week,v_season
  from public.fixtures f
  group by f.week,f.season
  having min(f.kickoff)>p_now
  order by min(f.kickoff)
  limit 1;

  if v_week is null then
    return query select false,null::text,'{}'::bigint[],null::integer,null::text;
    return;
  end if;

  select coalesce(array_agg(f.id order by f.kickoff,f.id),'{}'),count(f.id),count(s.fixture_id)
  into v_ids,v_fixture_count,v_snapshot_count
  from public.fixtures f
  left join public.match_statistics_snapshots s on s.fixture_id=f.id
  where f.week=v_week and coalesce(f.season,'2026/27')=v_season;

  select exists(
    select 1 from public.fixtures today_fixture
    where (today_fixture.kickoff at time zone 'Europe/Istanbul')::date=(p_now at time zone 'Europe/Istanbul')::date
  ) into v_has_match_today;

  v_sync_key:='super_lig:'||v_season||':week:'||v_week;
  select exists(
    select 1 from public.match_statistics_sync_runs run
    where run.sync_key=v_sync_key
      and (run.status in ('running','succeeded') or coalesce(run.finished_at,run.started_at)>p_now-interval '24 hours')
  ) into v_recent_run;

  return query select
    v_fixture_count>0
      and v_snapshot_count<v_fixture_count
      and not exists(
        select 1 from public.fixtures matchday
        where (matchday.kickoff at time zone 'Europe/Istanbul')::date=(p_now at time zone 'Europe/Istanbul')::date
      )
      and not v_has_match_today
      and not v_recent_run,
    v_sync_key,
    v_ids,
    v_week,
    v_season;
end;
$$;

revoke all on function public.match_statistics_week_due(timestamptz) from public,anon,authenticated;
grant execute on function public.match_statistics_week_due(timestamptz) to service_role;

do $$
declare existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname='match-statistics-weekly-prepare';
  if existing_job_id is not null then perform cron.unschedule(existing_job_id); end if;
end;
$$;

select cron.schedule(
  'match-statistics-weekly-prepare',
  '20 0 * * *',
  $cron$
    select net.http_post(
      url:=(select decrypted_secret from vault.decrypted_secrets where name='live_score_project_url' order by created_at desc limit 1)||'/functions/v1/match-statistics-sync',
      headers:=jsonb_build_object(
        'Content-Type','application/json',
        'x-football-center-secret',(select decrypted_secret from vault.decrypted_secrets where name='football_center_cron_secret' order by created_at desc limit 1)
      ),
      body:='{"mode":"scheduled"}'::jsonb
    )
    where (select due from public.match_statistics_week_due(now()) limit 1);
  $cron$
);
