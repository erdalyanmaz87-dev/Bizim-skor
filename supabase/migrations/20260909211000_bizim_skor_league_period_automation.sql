-- Bizim Skor Ligleri: dönem devri takvime değil 4 tamamlanmış Süper Lig haftasına bağlıdır.
-- Şampiyonlar Ligi ve Uluslar Ligi turları performansa dahil olabilir ancak dönem sayacını ilerletmez.
-- Mevcut oyun cron işlerinden bağımsız, ayrı bir pg_cron işi kullanır.

create or replace function public.maintain_league_periods()
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_period_id bigint;
  v_starts_at timestamptz;
  v_completed_super_weeks integer:=0;
  v_last_completed_week integer;
  v_season text;
  v_next_start timestamptz;
  v_next_end timestamptz;
begin
  select id,starts_at
    into v_period_id,v_starts_at
  from public.league_periods
  where status='open'
  order by starts_at desc
  limit 1
  for update;

  if v_period_id is null then
    return false;
  end if;

  -- Dönem başlangıcından itibaren tamamlanan Süper Lig haftalarını say.
  -- Bir hafta ancak o haftadaki tüm fikstürlerin sonucu mevcutsa tamamlanmış sayılır.
  with super_weeks as (
    select
      f.season,
      f.week,
      min(f.kickoff) as first_kickoff,
      max(f.kickoff) as last_kickoff,
      count(distinct f.id) as fixture_count,
      count(distinct r.fixture_id) as result_count
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where f.kickoff>=v_starts_at
    group by f.season,f.week
  ), completed as (
    select season,week,first_kickoff,last_kickoff
    from super_weeks
    where fixture_count>0
      and result_count=fixture_count
    order by first_kickoff
    limit 4
  )
  select
    count(*)::integer,
    max(week),
    max(season) filter(where week=(select max(c2.week) from completed c2))
  into v_completed_super_weeks,v_last_completed_week,v_season
  from completed;

  if v_completed_super_weeks<4 then
    return false;
  end if;

  perform public.close_league_period(v_period_id);

  -- Yeni dönem, sonraki Süper Lig haftasının ilk maçında başlar.
  select min(f.kickoff)
    into v_next_start
  from public.fixtures f
  where f.season=v_season
    and f.week>v_last_completed_week;

  if v_next_start is null then
    v_next_start:=now();
  end if;

  -- ends_at yalnız bilgi/arayüz alanıdır; gerçek kapanış koşulu 4 tamamlanmış Süper Lig haftasıdır.
  select max(f.kickoff)
    into v_next_end
  from public.fixtures f
  where f.season=v_season
    and f.week between v_last_completed_week+1 and v_last_completed_week+4;

  if v_next_end is null or v_next_end<=v_next_start then
    v_next_end:=v_next_start + interval '35 days';
  else
    v_next_end:=v_next_end + interval '2 days';
  end if;

  perform public.open_next_league_period(
    v_period_id,
    v_next_start,
    v_next_end
  );

  return true;
end;
$$;

revoke execute on function public.maintain_league_periods() from public,anon,authenticated;

-- Aynı isimli eski işi güvenli biçimde kaldırıp yeniden kur.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname='bizim-skor-league-period-maintenance';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

select cron.schedule(
  'bizim-skor-league-period-maintenance',
  '0 * * * *',
  $cron$
    select public.maintain_league_periods();
  $cron$
);

-- Örnek ilk dönem: Süper Lig 5-6-7-8. haftalar.
-- Bu pencere içinde oynanan CL/Uluslar Ligi turları lig performansına dahil edilir.
-- 8. hafta tüm sonuçları tamamlanınca dönem kapanır; sonraki dönem 9. haftanın ilk maçında başlar.
