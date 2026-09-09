-- Bizim Skor Ligleri: kapalı bir dönemin sonucundan yeni dönemi açar.
-- Önceki league_history.to_league yeni dönemin başlangıç ligi olur.
-- Geçmişi olmayan gerçek katılımcılar Bronz Lig'den başlar.

create or replace function public.open_next_league_period(
  p_previous_period_id bigint,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns bigint
language plpgsql
security definer
set search_path=''
as $$
declare
  v_previous_status text;
  v_previous_period_no integer;
  v_period_id bigint;
  v_count integer;
  v_capacities jsonb;
  v_slots jsonb;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then
    raise exception 'Lig dönemi tarihleri geçersiz';
  end if;

  select status,period_no
    into v_previous_status,v_previous_period_no
  from public.league_periods
  where id=p_previous_period_id
  for update;

  if v_previous_status is null then
    raise exception 'Önceki lig dönemi bulunamadı';
  end if;
  if v_previous_status<>'closed' then
    raise exception 'Yeni dönem yalnız kapalı bir dönemden açılabilir';
  end if;
  if exists(select 1 from public.league_periods where status='open') then
    raise exception 'Açık bir lig dönemi zaten var';
  end if;

  with participants as (
    select distinct lower(p.player_name) as player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  )
  select count(*)::integer into v_count
  from public.players pl
  join participants x on x.player_key=lower(pl.name)
  where coalesce(pl.is_active,true)
    and pl.created_at<=p_starts_at;

  if v_count<1 then
    raise exception 'Yeni dönem için katılımcı bulunamadı';
  end if;

  v_capacities:=public.league_allocate_capacities(v_count);
  v_slots:=public.league_promotion_slots(v_capacities);

  insert into public.league_periods(
    period_no,starts_at,ends_at,status,active_player_count,locked_capacities,locked_promotion_slots
  ) values (
    v_previous_period_no+1,p_starts_at,p_ends_at,'open',v_count,v_capacities,v_slots
  ) returning id into v_period_id;

  with participants as (
    select distinct lower(p.player_name) as player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  ), previous_result as (
    select distinct on (h.player_id)
      h.player_id,
      h.to_league
    from public.league_history h
    where h.period_id=p_previous_period_id
    order by h.player_id,h.id desc
  ), entrants as (
    select
      pl.id as player_id,
      coalesce(h.to_league,'bronze')::text as league_code
    from public.players pl
    join participants x on x.player_key=lower(pl.name)
    left join previous_result h on h.player_id=pl.id
    where coalesce(pl.is_active,true)
      and pl.created_at<=p_starts_at
  )
  insert into public.league_memberships(
    period_id,player_id,league_code,starting_league_code,is_eligible,
    valid_round_count,performance_score,exact_score_count,rank_in_league,promotion_status
  )
  select
    v_period_id,
    e.player_id,
    e.league_code,
    e.league_code,
    false,
    0,
    null,
    0,
    null,
    'none'
  from entrants e;

  return v_period_id;
end;
$$;

revoke execute on function public.open_next_league_period(bigint,timestamptz,timestamptz)
from public,anon,authenticated;

-- Beklenen akış:
-- 1) close_league_period(eski_id) çağrılır.
-- 2) open_next_league_period(eski_id,yeni_baslangic,yeni_bitis) çağrılır.
-- 3) Önceki dönem history.to_league yeni dönem starting_league_code olur.
-- 4) Önceki dönem geçmişi olmayan yeni gerçek katılımcı bronze başlar.
-- 5) Yeni dönemde herkes valid_round_count=0 ve is_eligible=false başlar.
