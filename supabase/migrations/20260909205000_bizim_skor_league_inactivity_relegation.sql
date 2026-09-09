-- Bizim Skor Ligleri: dönem içinde 2 geçerli turu tamamlamayan oyuncu bir alt lige düşer.
-- Bronz Lig oyuncusu Bronz'da kalır.
-- İnaktif düşüşler sabit düşme kotasının içine sayılır; kota aşılırsa alttan aynı sayıda ek yükselme yapılır.
-- Böylece her lig sınırındaki giriş/çıkış sayısı dengede tutulur.

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
  v_slots jsonb;

  v_q_ce integer:=0;
  v_q_eg integer:=0;
  v_q_gs integer:=0;
  v_q_sb integer:=0;

  v_inactive_champions integer:=0;
  v_inactive_elite integer:=0;
  v_inactive_gold integer:=0;
  v_inactive_silver integer:=0;

  v_eligible_champions integer:=0;
  v_eligible_elite integer:=0;
  v_eligible_gold integer:=0;
  v_eligible_silver integer:=0;

  v_down_champions integer:=0;
  v_down_elite integer:=0;
  v_down_gold integer:=0;
  v_down_silver integer:=0;

  v_regular_down_champions integer:=0;
  v_regular_down_elite integer:=0;
  v_regular_down_gold integer:=0;
  v_regular_down_silver integer:=0;
begin
  select status,locked_promotion_slots into v_status,v_slots
  from public.league_periods
  where id=p_period_id
  for update;

  if v_status is null then raise exception 'Lig dönemi bulunamadı'; end if;
  if v_status='closed' then return false; end if;

  perform public.refresh_league_memberships(p_period_id);

  select locked_promotion_slots into v_slots
  from public.league_periods
  where id=p_period_id;

  v_q_ce:=coalesce((v_slots->>'champions_elite')::integer,0);
  v_q_eg:=coalesce((v_slots->>'elite_gold')::integer,0);
  v_q_gs:=coalesce((v_slots->>'gold_silver')::integer,0);
  v_q_sb:=coalesce((v_slots->>'silver_bronze')::integer,0);

  select
    count(*) filter(where league_code='champions' and not is_eligible)::integer,
    count(*) filter(where league_code='elite' and not is_eligible)::integer,
    count(*) filter(where league_code='gold' and not is_eligible)::integer,
    count(*) filter(where league_code='silver' and not is_eligible)::integer,
    count(*) filter(where league_code='champions' and is_eligible)::integer,
    count(*) filter(where league_code='elite' and is_eligible)::integer,
    count(*) filter(where league_code='gold' and is_eligible)::integer,
    count(*) filter(where league_code='silver' and is_eligible)::integer
  into
    v_inactive_champions,v_inactive_elite,v_inactive_gold,v_inactive_silver,
    v_eligible_champions,v_eligible_elite,v_eligible_gold,v_eligible_silver
  from public.league_memberships
  where period_id=p_period_id;

  -- Her sınırda aşağı hareket en az sabit kota kadar, gerekirse inaktif sayısı kadar olur.
  v_down_champions:=greatest(v_q_ce,v_inactive_champions);
  v_down_elite:=greatest(v_q_eg,v_inactive_elite);
  v_down_gold:=greatest(v_q_gs,v_inactive_gold);
  v_down_silver:=greatest(v_q_sb,v_inactive_silver);

  -- İnaktifler önce düşme kotasını tüketir; kalan kadar uygun oyuncu normal sıralamadan düşer.
  v_regular_down_champions:=least(v_eligible_champions,greatest(0,v_down_champions-v_inactive_champions));
  v_regular_down_elite:=least(v_eligible_elite,greatest(0,v_down_elite-v_inactive_elite));
  v_regular_down_gold:=least(v_eligible_gold,greatest(0,v_down_gold-v_inactive_gold));
  v_regular_down_silver:=least(v_eligible_silver,greatest(0,v_down_silver-v_inactive_silver));

  insert into public.league_history(
    period_id,player_id,from_league,to_league,reason,final_rank,final_performance_score
  )
  select
    m.period_id,
    m.player_id,
    m.league_code,
    case
      -- 2 tur şartını tamamlamayan oyuncu otomatik bir alt lige düşer.
      when not m.is_eligible and m.league_code='champions' then 'elite'
      when not m.is_eligible and m.league_code='elite' then 'gold'
      when not m.is_eligible and m.league_code='gold' then 'silver'
      when not m.is_eligible and m.league_code='silver' then 'bronze'
      when not m.is_eligible and m.league_code='bronze' then 'bronze'

      -- Alt ligden yükselen oyuncu sayısı, üst ligden gerçek düşen oyuncu sayısına eşittir.
      when m.is_eligible and m.league_code='elite' and m.rank_in_league<=v_down_champions then 'champions'
      when m.is_eligible and m.league_code='gold' and m.rank_in_league<=v_down_elite then 'elite'
      when m.is_eligible and m.league_code='silver' and m.rank_in_league<=v_down_gold then 'gold'
      when m.is_eligible and m.league_code='bronze' and m.rank_in_league<=v_down_silver then 'silver'

      -- İnaktiflerden sonra kalan normal düşme kontenjanları.
      when m.is_eligible and m.league_code='champions'
        and m.rank_in_league>v_eligible_champions-v_regular_down_champions then 'elite'
      when m.is_eligible and m.league_code='elite'
        and m.rank_in_league>v_eligible_elite-v_regular_down_elite then 'gold'
      when m.is_eligible and m.league_code='gold'
        and m.rank_in_league>v_eligible_gold-v_regular_down_gold then 'silver'
      when m.is_eligible and m.league_code='silver'
        and m.rank_in_league>v_eligible_silver-v_regular_down_silver then 'bronze'
      else m.league_code
    end as to_league,
    case
      when not m.is_eligible and m.league_code<>'bronze' then 'relegation'
      when m.is_eligible and (
        (m.league_code='elite' and m.rank_in_league<=v_down_champions) or
        (m.league_code='gold' and m.rank_in_league<=v_down_elite) or
        (m.league_code='silver' and m.rank_in_league<=v_down_gold) or
        (m.league_code='bronze' and m.rank_in_league<=v_down_silver)
      ) then 'promotion'
      when m.is_eligible and (
        (m.league_code='champions' and m.rank_in_league>v_eligible_champions-v_regular_down_champions) or
        (m.league_code='elite' and m.rank_in_league>v_eligible_elite-v_regular_down_elite) or
        (m.league_code='gold' and m.rank_in_league>v_eligible_gold-v_regular_down_gold) or
        (m.league_code='silver' and m.rank_in_league>v_eligible_silver-v_regular_down_silver)
      ) then 'relegation'
      else 'stay'
    end as reason,
    m.rank_in_league,
    m.performance_score
  from public.league_memberships m
  where m.period_id=p_period_id
  on conflict(period_id,player_id,from_league,to_league) do nothing;

  update public.league_periods
  set status='closed',closed_at=v_now
  where id=p_period_id;

  return true;
end;
$$;

revoke execute on function public.close_league_period(bigint) from public,anon,authenticated;

-- Örnek davranış:
-- Sabit Şampiyonlar<->Elit kotası 2 ise ve Şampiyonlar'da 1 oyuncu 2 tur şartını tamamlamadıysa:
--   o 1 oyuncu otomatik düşer + son uygun oyunculardan 1 kişi daha düşer; Elit'ten 2 kişi yükselir.
-- Şampiyonlar'da 3 oyuncu şartı tamamlamadıysa:
--   3'ü de düşer; Elit'ten 3 kişi yükselir. Normal ek düşme yapılmaz.
