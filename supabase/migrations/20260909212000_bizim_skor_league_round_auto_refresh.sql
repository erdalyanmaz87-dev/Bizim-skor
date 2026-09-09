-- Bizim Skor Ligleri: açık dönem içindeki tamamlanmış yarışma turlarını otomatik keşfeder ve işler.
-- Mevcut yarışma puanlama fonksiyonlarına dokunmaz; yalnız refresh_league_round üzerinden okur/yazar.

create or replace function public.refresh_league_period_rounds(
  p_period_id bigint
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status text;
  v_starts_at timestamptz;
  v_total integer := 0;
  v_written integer := 0;
  rec record;
begin
  select lp.status,lp.starts_at
    into v_status,v_starts_at
  from public.league_periods lp
  where lp.id=p_period_id
  for update;

  if v_status is null then
    raise exception 'Lig dönemi bulunamadı';
  end if;
  if v_status<>'open' then
    raise exception 'Kapalı lig dönemi yenilenemez';
  end if;

  -- Süper Lig: tur bütünü dönem başladıktan sonra başlamış ve tüm sonuçları mevcut olmalı.
  for rec in
    select f.season,f.week
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    group by f.season,f.week
    having min(f.kickoff)>=v_starts_at
       and count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
    order by min(f.kickoff),f.season,f.week
  loop
    v_written:=public.refresh_league_round(
      p_period_id,
      'super_lig',
      rec.season || ':' || rec.week
    );
    v_total:=v_total+coalesce(v_written,0);
  end loop;

  -- UEFA Şampiyonlar Ligi.
  for rec in
    select f.season,f.week
    from public.champions_league_fixtures f
    left join public.champions_league_results r on r.fixture_id=f.id
    group by f.season,f.week
    having min(f.kickoff)>=v_starts_at
       and count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
    order by min(f.kickoff),f.season,f.week
  loop
    v_written:=public.refresh_league_round(
      p_period_id,
      'champions_league',
      rec.season || ':' || rec.week
    );
    v_total:=v_total+coalesce(v_written,0);
  end loop;

  -- Uluslar Ligi.
  for rec in
    select f.season,f.week
    from public.nations_league_fixtures f
    left join public.nations_league_results r on r.fixture_id=f.id
    group by f.season,f.week
    having min(f.kickoff)>=v_starts_at
       and count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
    order by min(f.kickoff),f.season,f.week
  loop
    v_written:=public.refresh_league_round(
      p_period_id,
      'nations_league',
      rec.season || ':' || rec.week
    );
    v_total:=v_total+coalesce(v_written,0);
  end loop;

  perform public.refresh_league_memberships(p_period_id);
  return v_total;
end;
$$;

revoke execute on function public.refresh_league_period_rounds(bigint) from public,anon,authenticated;

-- Bu fonksiyon maintain_league_periods() tarafından saatlik çağrılır.
-- Aynı tur tekrar keşfedilirse refresh_league_round UPSERT kullandığı için mükerrer satır oluşmaz.
