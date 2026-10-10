CREATE OR REPLACE FUNCTION public.open_next_league_period(p_previous_period_id bigint, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_previous_status text;
  v_previous_period_no integer;
  v_period_id bigint;
  v_count integer;
  v_capacities jsonb;
  v_slots jsonb;
  v_previous_capacities jsonb;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then raise exception 'Lig dönemi tarihleri geçersiz'; end if;
  select status,period_no,locked_capacities into v_previous_status,v_previous_period_no,v_previous_capacities from public.league_periods where id=p_previous_period_id for update;
  if v_previous_status is null then raise exception 'Önceki lig dönemi bulunamadı'; end if;
  if v_previous_status<>'closed' then raise exception 'Yeni dönem yalnız kapalı bir dönemden açılabilir'; end if;
  if exists(select 1 from public.league_periods where status='open') then raise exception 'Açık bir lig dönemi zaten var'; end if;
  with participants as (
    select distinct lower(p.player_name) player_key from public.predictions p union
    select distinct lower(p.player_name) from public.champions_league_predictions p union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  )
  select count(*)::integer into v_count from public.players pl join participants x on x.player_key=lower(pl.name)
  where coalesce(pl.is_active,true) and pl.created_at<=p_starts_at;
  if v_count<1 then raise exception 'Yeni dönem için katılımcı bulunamadı'; end if;
  v_capacities:=public.league_allocate_capacities(v_count);
  if coalesce(v_previous_capacities,'{}'::jsonb) ?& array['champions','elite','gold','silver'] then
    v_capacities:=jsonb_build_object(
      'champions',(v_previous_capacities->>'champions')::integer,
      'elite',(v_previous_capacities->>'elite')::integer,
      'gold',(v_previous_capacities->>'gold')::integer,
      'silver',(v_previous_capacities->>'silver')::integer,
      'bronze',greatest(0,v_count
        -(v_previous_capacities->>'champions')::integer
        -(v_previous_capacities->>'elite')::integer
        -(v_previous_capacities->>'gold')::integer
        -(v_previous_capacities->>'silver')::integer)
    );
  end if;
  v_slots:=public.league_promotion_slots(v_capacities);
  insert into public.league_periods(period_no,starts_at,ends_at,status,active_player_count,locked_capacities,locked_promotion_slots)
  values(v_previous_period_no+1,p_starts_at,p_ends_at,'open',v_count,v_capacities,v_slots) returning id into v_period_id;
  with participants as (
    select distinct lower(p.player_name) player_key from public.predictions p union
    select distinct lower(p.player_name) from public.champions_league_predictions p union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  ), previous_result as (
    select distinct on(h.player_id) h.player_id,h.to_league from public.league_history h where h.period_id=p_previous_period_id order by h.player_id,h.id desc
  ), entrants as (
    select pl.id player_id,coalesce(h.to_league,'bronze')::text league_code
    from public.players pl join participants x on x.player_key=lower(pl.name) left join previous_result h on h.player_id=pl.id
    where coalesce(pl.is_active,true) and pl.created_at<=p_starts_at
  )
  insert into public.league_memberships(period_id,player_id,league_code,starting_league_code,is_eligible,valid_round_count,performance_score,exact_score_count,rank_in_league,promotion_status)
  select v_period_id,e.player_id,e.league_code,e.league_code,false,0,null,0,null,'none' from entrants e;
  return v_period_id;
end;
$function$;
