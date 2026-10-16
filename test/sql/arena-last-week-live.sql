-- Verify against the current open period, with every recalculation rolled back.
begin;
do $$
declare
  v_period public.league_periods%rowtype;
  v_before_capacities jsonb;
  v_before_slots jsonb;
  v_season text;
  v_start_week integer;
  v_next_kickoff timestamptz;
  v_lock timestamptz;
  v_score numeric;
  rec record;
begin
  select * into strict v_period from public.league_periods where status='open' order by starts_at desc limit 1;
  v_before_capacities:=v_period.locked_capacities;
  v_before_slots:=v_period.locked_promotion_slots;
  select season,week into strict v_season,v_start_week from public.fixtures where kickoff>=v_period.starts_at order by kickoff,id limit 1;
  select min(kickoff) into v_next_kickoff from public.fixtures where season=v_season and week=v_start_week+4;
  select min(kickoff) into v_lock from public.fixtures where season=v_season and week=v_start_week+3;
  perform public.refresh_current_arena_live();
  if (select ends_at from public.league_periods where id=v_period.id) is distinct from v_next_kickoff then
    raise exception 'Arena period ends before the four-week fixture window finishes';
  end if;
  for rec in
    select p.id,p.name from public.players p
    join public.league_round_performance rp on rp.player_id=p.id and rp.period_id=v_period.id
      and rp.competition='super_lig' and rp.round_key=v_season||':'||(v_start_week+3)::text
    where p.created_at<=v_lock and coalesce(p.is_active,true)
  loop
    if not exists(select 1 from public.arena_accessible_rounds(v_period.id,rec.id) where competition='super_lig' and round_key=v_season||':'||(v_start_week+3)::text and has_performance) then
      raise exception 'Last-week live score is excluded for %',rec.name;
    end if;
    select round(avg(performance_score),2) into v_score from public.arena_accessible_rounds(v_period.id,rec.id);
    if not exists(select 1 from public.league_memberships where period_id=v_period.id and player_id=rec.id and performance_score=v_score and valid_round_count>=1) then
      raise exception 'Live round is missing from the Arena membership for %',rec.name;
    end if;
  end loop;
  if (select locked_capacities from public.league_periods where id=v_period.id) is distinct from v_before_capacities
    or (select locked_promotion_slots from public.league_periods where id=v_period.id) is distinct from v_before_slots
    or not exists(select 1 from public.league_periods where id=v_period.id and status='open') then
    raise exception 'Live score refresh must preserve league capacities, slots and open period';
  end if;
end $$;
rollback;
select 'Last-week live scores are included; capacities and period status preserved' as result;
