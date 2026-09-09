-- Bizim Skor Ligleri: ilk dönemi otomatik ve tek seferlik açar.
-- Başlangıç: aynı sezon Süper Lig 5. hafta ilk maç saati.
-- Üst sınır: aynı sezon Süper Lig 9. hafta ilk maç saati.

create or replace function public.bootstrap_first_league_period()
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_season text;
  v_start_at timestamptz;
  v_end_at timestamptz;
begin
  if exists(select 1 from public.league_periods) then
    return false;
  end if;

  select f.season,min(f.kickoff)
    into v_season,v_start_at
  from public.fixtures f
  where f.week=5
  group by f.season
  order by min(f.kickoff) desc
  limit 1;

  if v_season is null or v_start_at is null then
    return false;
  end if;

  select min(f.kickoff)
    into v_end_at
  from public.fixtures f
  where f.season=v_season
    and f.week=9;

  if v_end_at is null or v_end_at<=v_start_at then
    return false;
  end if;

  perform public.initialize_first_league_period(v_start_at,v_end_at);
  return true;
end;
$$;

revoke execute on function public.bootstrap_first_league_period() from public,anon,authenticated;
