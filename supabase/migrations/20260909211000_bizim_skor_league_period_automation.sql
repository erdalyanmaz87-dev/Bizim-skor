-- Bizim Skor Ligleri: dönem devri takvime değil 4 tamamlanmış ardışık Süper Lig haftasına bağlıdır.
-- Şampiyonlar Ligi ve Uluslar Ligi turları performansa dahil edilir ancak dönem sayacını ilerletmez.
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
  v_start_season text;
  v_start_week integer;
  v_completed_super_weeks integer:=0;
  v_next_week integer;
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

  -- Önce açık dönem içindeki tamamlanmış Süper Lig / CL / Uluslar Ligi turlarını işle.
  perform public.refresh_league_period_rounds(v_period_id);

  -- Dönemin başladığı Süper Lig sezon ve haftasını sabitle.
  -- İlk dönem örneği: starts_at 5. hafta ilk maçına denk gelir ve start_week=5 olur.
  select f.season,f.week
    into v_start_season,v_start_week
  from public.fixtures f
  where min(f.kickoff) over(partition by f.season,f.week)>=v_starts_at
  order by min(f.kickoff) over(partition by f.season,f.week),f.season,f.week
  limit 1;

  if v_start_season is null or v_start_week is null then
    return false;
  end if;

  -- Yalnız başlangıç haftası ve onu izleyen 3 ardışık hafta hedeflenir.
  -- Ertelenmiş eski haftalar veya daha ileride tamamlanan başka haftalar sayılamaz.
  with target_weeks as (
    select
      f.week,
      count(distinct f.id) as fixture_count,
      count(distinct r.fixture_id) as result_count
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where f.season=v_start_season
      and f.week between v_start_week and v_start_week+3
    group by f.week
  )
  select count(*)::integer
    into v_completed_super_weeks
  from target_weeks
  where fixture_count>0
    and result_count=fixture_count;

  -- Dört haftanın da fikstürü yüklenmiş ve tüm sonuçları tamamlanmış olmalı.
  if not exists(
    select 1
    from public.fixtures f
    where f.season=v_start_season
      and f.week between v_start_week and v_start_week+3
    group by f.season
    having count(distinct f.week)=4
  ) then
    return false;
  end if;

  if v_completed_super_weeks<4 then
    return false;
  end if;

  perform public.close_league_period(v_period_id);

  v_next_week:=v_start_week+4;

  -- Yeni dönem tam olarak bir sonraki Süper Lig haftasının ilk maçında başlar.
  select min(f.kickoff)
    into v_next_start
  from public.fixtures f
  where f.season=v_start_season
    and f.week=v_next_week;

  if v_next_start is null then
    -- Sonraki hafta henüz sisteme yüklenmediyse mevcut dönemi kapalı bırakıp
    -- yanlış bir başlangıç tarihi üretmeyiz. Yeni dönem sonraki bakım çağrısında açılabilir.
    return true;
  end if;

  select max(f.kickoff)
    into v_next_end
  from public.fixtures f
  where f.season=v_start_season
    and f.week between v_next_week and v_next_week+3;

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

-- İlk dönem: Süper Lig 5-6-7-8. haftalar.
-- Bu pencere içinde tamamlanan CL/Uluslar Ligi turları performansa dahil edilir.
-- 8. hafta tamamen bitince dönem kapanır; sonraki dönem yalnız 9. hafta fikstürü yüklüyse açılır.
