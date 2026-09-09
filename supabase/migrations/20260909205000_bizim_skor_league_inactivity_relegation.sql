-- Bizim Skor Ligleri: dönem içinde 2 geçerli turu tamamlamayan oyuncu bir alt lige düşer.
-- Bronz Lig oyuncusu Bronz'da kalır.
-- İnaktif düşüşler sabit düşme kotasının içine sayılır; kota aşılırsa alttan aynı sayıda ek yükselme yapılır.
-- Yükselme/düşme seçiminde yalnız uygun oyuncular kendi aralarında ayrıca sıralanır.

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

  v_down_champions:=greatest(v_q_ce,v_inactive_champions);
  v_down_elite:=greatest(v_q_eg,v_inactive_elite);
  v_down_gold:=greatest(v_q_gs,v_inactive_gold);
  v_down_silver:=greatest(v_q_sb,v_inactive_silver);

  v_regular_down_champions:=least(v_eligible_champions,greatest(0,v_down_champions-v_inactive_champions));
  v_regular_down_elite:=least(v_eligible_elite,greatest(0,v_down_elite-v_inactive_elite));
  v_regular_down_gold:=least(v_eligible_gold,greatest(0,v_down_gold-v_inactive_gold));
  v_regular_down_silver:=least(v_eligible_silver,greatest(0,v_down_silver-v_inactive_silver));

  with eligible_ranks as (
    select
      m.id,
      row_number() over(
        partition by m.league_code
        order by m.rank_in_league,m.player_id
      )::integer as eligible_rank
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
      case
        when not m.is_eligible and m.league_code='champions' then 'elite'
        when not m.is_eligible and m.league_code='elite' then 'gold'
        when not m.is_eligible and m.league_code='gold' then 'silver'
        when not m.is_eligible and m.league_code='silver' then 'bronze'
        when not m.is_eligible and m.league_code='bronze' then 'bronze'

        when m.is_eligible and m.league_code='elite' and er.eligible_rank<=v_down_champions then 'champions'
        when m.is_eligible and m.league_code='gold' and er.eligible_rank<=v_down_elite then 'elite'
        when m.is_eligible and m.league_code='silver' and er.eligible_rank<=v_down_gold then 'gold'
        when m.is_eligible and m.league_code='bronze' and er.eligible_rank<=v_down_silver then 'silver'

        when m.is_eligible and m.league_code='champions'
          and er.eligible_rank>v_eligible_champions-v_regular_down_champions then 'elite'
        when m.is_eligible and m.league_code='elite'
          and er.eligible_rank>v_eligible_elite-v_regular_down_elite then 'gold'
        when m.is_eligible and m.league_code='gold'
          and er.eligible_rank>v_eligible_gold-v_regular_down_gold then 'silver'
        when m.is_eligible and m.league_code='silver'
          and er.eligible_rank>v_eligible_silver-v_regular_down_silver then 'bronze'
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

-- Uygun olmayan oyuncular tablo sırasını korur ancak hareket seçiminde eligible_rank'e dahil edilmez.
-- Böylece örneğin Elit'in ilk iki tablolanan oyuncusu pasifse, en iyi iki uygun Elit oyuncu yine yükselir.
