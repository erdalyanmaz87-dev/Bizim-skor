-- Arena fair-access scoring
-- Registration-before-lock controls denominator eligibility.
-- Accessible missed rounds count as zero; inaccessible historical rounds are excluded.

create or replace function public.arena_accessible_rounds(p_period_id bigint, p_player_id bigint)
returns table(
  competition text,
  round_key text,
  lock_time timestamptz,
  has_performance boolean,
  performance_score numeric,
  exact_score_count integer,
  raw_points bigint
)
language sql
stable
security definer
set search_path to ''
as $function$
with period as (
  select lp.id, lp.starts_at, lp.ends_at
  from public.league_periods lp
  where lp.id=p_period_id
), player as (
  select p.id, p.created_at
  from public.players p
  where p.id=p_player_id and coalesce(p.is_active,true)
), super_rounds as (
  select
    'super_lig'::text competition,
    f.season||':'||f.week::text round_key,
    min(f.kickoff)::timestamptz lock_time
  from public.fixtures f
  cross join period pe
  left join public.results r on r.fixture_id=f.id
  group by f.season,f.week,pe.starts_at,pe.ends_at
  having min(f.kickoff)>=pe.starts_at
     and min(f.kickoff)<pe.ends_at
     and min(f.kickoff)<=now()
     and count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)>0
), champions_rounds as (
  select
    'champions_league'::text competition,
    f.season||':'||f.week::text round_key,
    min(f.kickoff)::timestamptz lock_time
  from public.champions_league_fixtures f
  cross join period pe
  left join public.champions_league_results r on r.fixture_id=f.id
  group by f.season,f.week,pe.starts_at,pe.ends_at
  having min(f.kickoff)>=pe.starts_at
     and max(f.kickoff)<=pe.ends_at
     and count(distinct f.id)>0
     and count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)=count(distinct f.id)
), nations_rounds as (
  select
    'nations_league'::text competition,
    f.season||':'||f.week::text round_key,
    min(f.kickoff)::timestamptz lock_time
  from public.nations_league_fixtures f
  cross join period pe
  left join public.nations_league_results r on r.fixture_id=f.id
  group by f.season,f.week,pe.starts_at,pe.ends_at
  having min(f.kickoff)>=pe.starts_at
     and max(f.kickoff)<=pe.ends_at
     and count(distinct f.id)>0
     and count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)=count(distinct f.id)
), rounds as (
  select * from super_rounds
  union all
  select * from champions_rounds
  union all
  select * from nations_rounds
), accessible as (
  select r.*
  from rounds r
  cross join player p
  where p.created_at <= r.lock_time
)
select
  a.competition,
  a.round_key,
  a.lock_time,
  (rp.player_id is not null)::boolean has_performance,
  coalesce(rp.performance_score,0)::numeric performance_score,
  coalesce(rp.exact_score_count,0)::integer exact_score_count,
  coalesce(rp.raw_points,0)::bigint raw_points
from accessible a
left join public.league_round_performance rp
  on rp.period_id=p_period_id
 and rp.player_id=p_player_id
 and rp.competition=a.competition
 and rp.round_key=a.round_key
order by a.lock_time,a.competition,a.round_key;
$function$;

comment on function public.arena_accessible_rounds(bigint,bigint) is
'Lists Arena rounds accessible to a player: rounds locked before registration are excluded; accessible missed rounds return zero performance.';

create or replace function public.arena_forced_relegation(p_period_id bigint, p_player_id bigint)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select false;
$function$;

comment on function public.arena_forced_relegation(bigint,bigint) is
'Legacy special-week forced relegation is disabled. Eligibility is determined by completed accessible Super Lig rounds.';

create or replace function public.refresh_league_memberships(p_period_id bigint)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_locked jsonb;
  v_slots jsonb;
  v_baseline_count integer;
  v_changed integer:=0;
begin
  select status,starts_at,ends_at,locked_capacities,locked_promotion_slots
    into v_status,v_starts_at,v_ends_at,v_locked,v_slots
  from public.league_periods
  where id=p_period_id
  for update;

  if v_status is null then raise exception 'Lig dönemi bulunamadı'; end if;
  if v_status<>'open' then raise exception 'Kapalı lig dönemi yenilenemez'; end if;

  -- Preserve existing Arena members and admit active mid-season entrants once they participate.
  with participant_keys as (
    select distinct lower(p.player_name) player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  ), players_for_period as (
    select m.player_id
    from public.league_memberships m
    where m.period_id=p_period_id
    union
    select pl.id
    from public.players pl
    join participant_keys k on k.player_key=lower(pl.name)
    where coalesce(pl.is_active,true)
      and pl.created_at<v_ends_at
  ), aggregates as (
    select
      pp.player_id,
      count(*) filter(where ar.competition='super_lig' and ar.has_performance)::integer valid_round_count,
      case when count(ar.round_key)>0
        then round(avg(coalesce(ar.performance_score,0)),2)::numeric(6,2)
        else null::numeric(6,2)
      end performance_score,
      coalesce(sum(ar.exact_score_count),0)::integer exact_score_count,
      coalesce(sum(ar.raw_points),0)::bigint raw_points
    from players_for_period pp
    left join lateral public.arena_accessible_rounds(p_period_id,pp.player_id) ar on true
    group by pp.player_id
  ), prior as (
    select distinct on(h.player_id) h.player_id,h.to_league
    from public.league_history h
    join public.league_periods hp on hp.id=h.period_id
    where hp.status='closed'
    order by h.player_id,hp.ends_at desc,h.id desc
  )
  insert into public.league_memberships(
    period_id,player_id,league_code,starting_league_code,is_eligible,
    valid_round_count,performance_score,exact_score_count,raw_points,updated_at
  )
  select
    p_period_id,a.player_id,coalesce(pr.to_league,'bronze'),coalesce(pr.to_league,'bronze'),
    a.valid_round_count>=2,a.valid_round_count,a.performance_score,
    a.exact_score_count,a.raw_points,now()
  from aggregates a
  left join prior pr on pr.player_id=a.player_id
  on conflict(period_id,player_id) do nothing;

  with players_for_period as (
    select m.player_id
    from public.league_memberships m
    where m.period_id=p_period_id
  ), aggregates as (
    select
      pp.player_id,
      count(*) filter(where ar.competition='super_lig' and ar.has_performance)::integer valid_round_count,
      case when count(ar.round_key)>0
        then round(avg(coalesce(ar.performance_score,0)),2)::numeric(6,2)
        else null::numeric(6,2)
      end performance_score,
      coalesce(sum(ar.exact_score_count),0)::integer exact_score_count,
      coalesce(sum(ar.raw_points),0)::bigint raw_points
    from players_for_period pp
    left join lateral public.arena_accessible_rounds(p_period_id,pp.player_id) ar on true
    group by pp.player_id
  )
  update public.league_memberships m
  set
    is_eligible=(a.valid_round_count>=2),
    valid_round_count=a.valid_round_count,
    performance_score=a.performance_score,
    exact_score_count=a.exact_score_count,
    raw_points=a.raw_points,
    updated_at=now()
  from aggregates a
  where m.period_id=p_period_id and m.player_id=a.player_id;
  get diagnostics v_changed=row_count;

  if coalesce(v_locked,'{}'::jsonb)='{}'::jsonb then
    with participants as (
      select distinct lower(p.player_name) player_key from public.predictions p
      union
      select distinct lower(p.player_name) from public.champions_league_predictions p
      union
      select distinct lower(p.player_name) from public.nations_league_predictions p
    )
    select count(*)::integer into v_baseline_count
    from public.players p
    join participants x on x.player_key=lower(p.name)
    where coalesce(p.is_active,true) and p.created_at<=v_starts_at;

    v_locked:=public.league_allocate_capacities(v_baseline_count);
    v_slots:=public.league_promotion_slots(v_locked);
    update public.league_periods
      set active_player_count=v_baseline_count,
          locked_capacities=v_locked,
          locked_promotion_slots=v_slots
    where id=p_period_id;
  end if;

  with invites as (
    select lower(i.inviter_name) player_key,count(distinct lower(i.invited_name))::integer invite_count
    from public.player_invites i
    group by lower(i.inviter_name)
  ), ordered as (
    select m.id,m.player_id,m.league_code,
      public.arena_forced_relegation(p_period_id,m.player_id) forced,
      row_number() over(partition by m.league_code order by
        public.arena_forced_relegation(p_period_id,m.player_id) asc,
        m.performance_score desc nulls last,
        coalesce(i.invite_count,0) desc,
        m.valid_round_count desc,
        m.exact_score_count desc,
        m.raw_points desc,
        m.player_id asc
      )::integer league_rank,
      count(*) over(partition by m.league_code)::integer league_size
    from public.league_memberships m
    join public.players p on p.id=m.player_id
    left join invites i on i.player_key=lower(p.name)
    where m.period_id=p_period_id
  ), eligible_ordered as (
    select o.id,
      row_number() over(partition by o.league_code order by o.league_rank)::integer eligible_rank,
      count(*) over(partition by o.league_code)::integer eligible_size
    from ordered o
    join public.league_memberships m on m.id=o.id
    where m.is_eligible and not o.forced
  ), movement_plan as (
    select * from public.league_movement_plan(p_period_id)
  ), statuses as (
    select o.id,o.league_rank,o.league_size,m.league_code,
      case
        when o.forced then 'forced_relegation'
        when not m.is_eligible then 'none'
        when m.league_code='champions' and eo.eligible_rank=1 then 'championship'
        when m.league_code='champions' and mp.regular_down_champions>0 and eo.eligible_rank>eo.eligible_size-mp.regular_down_champions then 'relegation'
        when m.league_code='elite' and eo.eligible_rank<=mp.promote_elite then 'promotion'
        when m.league_code='elite' and mp.regular_down_elite>0 and eo.eligible_rank>eo.eligible_size-mp.regular_down_elite then 'relegation'
        when m.league_code='gold' and eo.eligible_rank<=mp.promote_gold then 'promotion'
        when m.league_code='gold' and mp.regular_down_gold>0 and eo.eligible_rank>eo.eligible_size-mp.regular_down_gold then 'relegation'
        when m.league_code='silver' and eo.eligible_rank<=mp.promote_silver then 'promotion'
        when m.league_code='silver' and mp.regular_down_silver>0 and eo.eligible_rank>eo.eligible_size-mp.regular_down_silver then 'relegation'
        when m.league_code='bronze' and eo.eligible_rank<=mp.promote_bronze then 'promotion'
        else 'none'
      end promotion_status
    from ordered o
    join public.league_memberships m on m.id=o.id
    left join eligible_ordered eo on eo.id=o.id
    cross join movement_plan mp
  )
  update public.league_memberships m
  set rank_in_league=s.league_rank,
      promotion_status=s.promotion_status,
      updated_at=now()
  from statuses s
  where m.id=s.id;

  return v_changed;
end;
$function$;

-- Recalculate the open season immediately with the fair-access rules.
select public.refresh_current_arena_live();
