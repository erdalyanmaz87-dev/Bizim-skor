-- Bizim Skor Ligleri: dönem içinde 2 geçerli turu tamamlamayan oyuncu bir alt lige düşer.
-- Bronz Lig oyuncusu Bronz'da kalır.
-- Canlı durum ve dönem kapanışı aynı league_movement_plan() hesabını kullanır.

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

  v_promote_elite integer:=0;
  v_promote_gold integer:=0;
  v_promote_silver integer:=0;
  v_promote_bronze integer:=0;

  v_regular_down_champions integer:=0;
  v_regular_down_elite integer:=0;
  v_regular_down_gold integer:=0;
  v_regular_down_silver integer:=0;
begin
  select status into v_status
  from public.league_periods
  where id=p_period_id
  for update;

  if v_status is null then raise exception 'Lig dönemi bulunamadı'; end if;
  if v_status='closed' then return false; end if;

  perform public.refresh_league_memberships(p_period_id);

  select
    mp.promote_elite,
    mp.promote_gold,
    mp.promote_silver,
    mp.promote_bronze,
    mp.regular_down_champions,
    mp.regular_down_elite,
    mp.regular_down_gold,
    mp.regular_down_silver
  into
    v_promote_elite,
    v_promote_gold,
    v_promote_silver,
    v_promote_bronze,
    v_regular_down_champions,
    v_regular_down_elite,
    v_regular_down_gold,
    v_regular_down_silver
  from public.league_movement_plan(p_period_id) mp;

  with eligible_ranks as (
    select
      m.id,
      row_number() over(
        partition by m.league_code
        order by m.rank_in_league,m.player_id
      )::integer as eligible_rank,
      count(*) over(partition by m.league_code)::integer as eligible_size
    from public.league_memberships m
    where m.period_id=p_period_id
      and m.is_eligible
  ), decisions as (
    select
      m.period_id,
      m.player_id,
      m.league_code as from_league,
      m.rank_in_league,
      m.performance_score,
      m.is_eligible,
      er.eligible_rank,
      er.eligible_size,
      case
        when not m.is_eligible and m.league_code='champions' then 'elite'
        when not m.is_eligible and m.league_code='elite' then 'gold'
        when not m.is_eligible and m.league_code='gold' then 'silver'
        when not m.is_eligible and m.league_code='silver' then 'bronze'
        when not m.is_eligible and m.league_code='bronze' then 'bronze'

        when m.is_eligible and m.league_code='elite' and er.eligible_rank<=v_promote_elite then 'champions'
        when m.is_eligible and m.league_code='gold' and er.eligible_rank<=v_promote_gold then 'elite'
        when m.is_eligible and m.league_code='silver' and er.eligible_rank<=v_promote_silver then 'gold'
        when m.is_eligible and m.league_code='bronze' and er.eligible_rank<=v_promote_bronze then 'silver'

        when m.is_eligible and m.league_code='champions'
          and v_regular_down_champions>0
          and er.eligible_rank>er.eligible_size-v_regular_down_champions then 'elite'
        when m.is_eligible and m.league_code='elite'
          and v_regular_down_elite>0
          and er.eligible_rank>er.eligible_size-v_regular_down_elite then 'gold'
        when m.is_eligible and m.league_code='gold'
          and v_regular_down_gold>0
          and er.eligible_rank>er.eligible_size-v_regular_down_gold then 'silver'
        when m.is_eligible and m.league_code='silver'
          and v_regular_down_silver>0
          and er.eligible_rank>er.eligible_size-v_regular_down_silver then 'bronze'
        else m.league_code
      end as to_league
    from public.league_memberships m
    left join eligible_ranks er on er.id=m.id
    where m.period_id=p_period_id
  )
  insert into public.league_history(
    period_id,player_id,from_league,to_league,reason,final_rank,final_performance_score
  )
  select
    d.period_id,
    d.player_id,
    d.from_league,
    d.to_league,
    case
      when d.to_league=d.from_league then 'stay'
      when d.from_league='champions' and d.to_league='elite' then 'relegation'
      when d.from_league='elite' and d.to_league='gold' then 'relegation'
      when d.from_league='gold' and d.to_league='silver' then 'relegation'
      when d.from_league='silver' and d.to_league='bronze' then 'relegation'
      else 'promotion'
    end,
    d.rank_in_league,
    d.performance_score
  from decisions d
  on conflict(period_id,player_id,from_league,to_league) do nothing;

  update public.league_periods
  set status='closed',closed_at=v_now
  where id=p_period_id;

  return true;
end;
$$;

revoke execute on function public.close_league_period(bigint) from public,anon,authenticated;

-- Uygun olmayan oyuncu bir alt lige düşer; Bronz'da kalır.
-- Uygun oyuncuların canlı hareket statüsü ile gerçek dönem sonu kararı aynı helper planına bağlıdır.
