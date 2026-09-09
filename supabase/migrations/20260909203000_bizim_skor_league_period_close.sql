-- Bizim Skor Ligleri: 4 haftalık dönemi idempotent biçimde kapatır.
-- Hareketler yalnızca mevcut dönemin kilitli kontenjanları ve lig içi sırası üzerinden yapılır.

create or replace function public.close_league_period(
  p_period_id bigint
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status text;
  v_now timestamptz:=now();
begin
  select status into v_status
  from public.league_periods
  where id=p_period_id
  for update;

  if v_status is null then raise exception 'Lig dönemi bulunamadı'; end if;

  -- İkinci çağrı hiçbir hareket üretmez.
  if v_status='closed' then return false; end if;

  -- Son kez sıralama/status güncelle.
  perform public.refresh_league_memberships(p_period_id);

  insert into public.league_history(
    period_id,player_id,from_league,to_league,reason,final_rank,final_performance_score
  )
  select
    m.period_id,
    m.player_id,
    m.league_code,
    case
      when m.league_code='champions' and m.promotion_status='relegation' then 'elite'
      when m.league_code='elite' and m.promotion_status='promotion' then 'champions'
      when m.league_code='elite' and m.promotion_status='relegation' then 'gold'
      when m.league_code='gold' and m.promotion_status='promotion' then 'elite'
      when m.league_code='gold' and m.promotion_status='relegation' then 'silver'
      when m.league_code='silver' and m.promotion_status='promotion' then 'gold'
      when m.league_code='silver' and m.promotion_status='relegation' then 'bronze'
      when m.league_code='bronze' and m.promotion_status='promotion' then 'silver'
      else m.league_code
    end as to_league,
    case
      when m.promotion_status='promotion' then 'promotion'
      when m.promotion_status='relegation' then 'relegation'
      else 'stay'
    end as reason,
    m.rank_in_league,
    m.performance_score
  from public.league_memberships m
  where m.period_id=p_period_id
    and m.is_eligible
  on conflict(period_id,player_id,from_league,to_league) do nothing;

  update public.league_periods
  set status='closed',closed_at=v_now
  where id=p_period_id;

  return true;
end;
$$;

revoke execute on function public.close_league_period(bigint) from public,anon,authenticated;

-- Geliştirme doğrulaması:
-- select public.close_league_period(<id>); -- true
-- select public.close_league_period(<id>); -- false
-- İkinci çağrıda league_history satır sayısı değişmemeli.
