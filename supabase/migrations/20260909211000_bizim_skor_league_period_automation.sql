-- Bizim Skor Ligleri: süresi dolan açık dönemi kapatır ve yeni 28 günlük dönemi otomatik açar.
-- Mevcut oyun cron işlerinden bağımsız, ayrı bir pg_cron işi kullanır.

create or replace function public.maintain_league_periods()
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_period_id bigint;
  v_ends_at timestamptz;
begin
  select id,ends_at
    into v_period_id,v_ends_at
  from public.league_periods
  where status='open'
    and ends_at<=now()
  order by ends_at
  limit 1
  for update;

  -- Süresi dolmuş açık dönem yoksa hiçbir şey yapma.
  if v_period_id is null then
    return false;
  end if;

  perform public.close_league_period(v_period_id);

  -- Yeni dönem önceki dönemin tam bittiği anda başlar ve 28 gün sürer.
  perform public.open_next_league_period(
    v_period_id,
    v_ends_at,
    v_ends_at + interval '28 days'
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

-- Davranış:
-- ends_at gelmeden çağrı -> false
-- ends_at geldikten sonraki ilk saatlik çalışmada -> mevcut dönem kapanır, yenisi açılır
-- yeni dönem starts_at = eski ends_at
-- yeni dönem ends_at = eski ends_at + 28 gün
