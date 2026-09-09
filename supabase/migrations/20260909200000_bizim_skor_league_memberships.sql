-- Bizim Skor Ligleri: üyelik, uygunluk, lig içi sıralama ve sabit dönem kontenjanları.
-- Yeni oyuncular Bronz'dan başlar. Herkes sıralamada görünür; yükselme/düşme için en az 2 geçerli tur gerekir.
-- Eşitlik: performans > davet > geçerli tur > tam skor > ham puan > oyuncu ID.

create or replace function public.league_movement_plan(
  p_period_id bigint
) returns table(
  promote_elite integer,
  promote_gold integer,
  promote_silver integer,
  promote_bronze integer,
  regular_down_champions integer,
  regular_down_elite integer,
  regular_down_gold integer,
  regular_down_silver integer
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
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
  v_eligible_bronze integer:=0;

  v_regular_down_champions integer:=0;
  v_regular_down_elite integer:=0;
  v_regular_down_gold integer:=0;
  v_regular_down_silver integer:=0;

  v_actual_down_champions integer:=0;
  v_actual_down_elite integer:=0;
  v_actual_down_gold integer:=0;
  v_actual_down_silver integer:=0;

  v_promote_elite integer:=0;
  v_promote_gold integer:=0;
  v_promote_silver integer:=0;
  v_promote_bronze integer:=0;
begin
  select lp.locked_promotion_slots
    into v_slots
  from public.league_periods lp
  where lp.id=p_period_id;

  if v_slots is null then
    raise exception 'Lig dönemi bulunamadı';
  end if;

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
    count(*) filter(where league_code='silver' and is_eligible)::integer,
    count(*) filter(where league_code='bronze' and is_eligible)::integer
  into
    v_inactive_champions,v_inactive_elite,v_inactive_gold,v_inactive_silver,
    v_eligible_champions,v_eligible_elite,v_eligible_gold,v_eligible_silver,v_eligible_bronze
  from public.league_memberships
  where period_id=p_period_id;

  v_regular_down_champions:=least(
    v_eligible_champions,
    greatest(0,greatest(v_q_ce,v_inactive_champions)-v_inactive_champions)
  );
  v_actual_down_champions:=v_inactive_champions+v_regular_down_champions;
  v_promote_elite:=least(v_eligible_elite,v_actual_down_champions);

  v_regular_down_elite:=least(
    greatest(0,v_eligible_elite-v_promote_elite),
    greatest(0,greatest(v_q_eg,v_inactive_elite)-v_inactive_elite)
  );
  v_actual_down_elite:=v_inactive_elite+v_regular_down_elite;
  v_promote_gold:=least(v_eligible_gold,v_actual_down_elite);

  v_regular_down_gold:=least(
    greatest(0,v_eligible_gold-v_promote_gold),
    greatest(0,greatest(v_q_gs,v_inactive_gold)-v_inactive_gold)
  );
  v_actual_down_gold:=v_inactive_gold+v_regular_down_gold;
  v_promote_silver:=least(v_eligible_silver,v_actual_down_gold);

  v_regular_down_silver:=least(
    greatest(0,v_eligible_silver-v_promote_silver),
    greatest(0,greatest(v_q_sb,v_inactive_silver)-v_inactive_silver)
  );
  v_actual_down_silver:=v_inactive_silver+v_regular_down_silver;
  v_promote_bronze:=least(v_eligible_bronze,v_actual_down_silver);

  return query select
    v_promote_elite,
    v_promote_gold,
    v_promote_silver,
    v_promote_bronze,
    v_regular_down_champions,
    v_regular_down_elite,
    v_regular_down_gold,
    v_regular_down_silver;
end;
$$;

create or replace function public.refresh_league_memberships(
  p_period_id bigint
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status text;
  v_starts_at timestamptz;
  v_locked jsonb;
  v_slots jsonb;
  v_baseline_count integer;
  v_changed integer := 0;
begin
  select status,starts_at,locked_capacities,locked_promotion_slots
    into v_status,v_starts_at,v_locked,v_slots
  from public.league_periods
  where id=p_period_id
  for update;

  if v_status is null then raise exception 'Lig dönemi bulunamadı'; end if;
  if v_status<>'open' then raise exception 'Kapalı lig dönemi yenilenemez'; end if;

  with aggregates as (
    select
      rp.player_id,
      count(*)::integer as valid_round_count,
      round(avg(rp.performance_score),2)::numeric(6,2) as performance_score,
      sum(rp.exact_score_count)::integer as exact_score_count,
      sum(rp.raw_points)::bigint as raw_points
    from public.league_round_performance rp
    where rp.period_id=p_period_id
    group by rp.player_id
  ), prior as (
    select distinct on (h.player_id)
      h.player_id,h.to_league
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
    p_period_id,
    a.player_id,
    coalesce(pr.to_league,'bronze'),
    coalesce(pr.to_league,'bronze'),
    a.valid_round_count>=2,
    a.valid_round_count,
    a.performance_score,
    a.exact_score_count,
    a.raw_points,
    now()
  from aggregates a
  left join prior pr on pr.player_id=a.player_id
  on conflict(period_id,player_id) do nothing;

  if exists(select 1 from public.league_round_performance rp where rp.period_id=p_period_id) then
    with aggregates as (
      select
        rp.player_id,
        count(*)::integer as valid_round_count,
        round(avg(rp.performance_score),2)::numeric(6,2) as performance_score,
        sum(rp.exact_score_count)::integer as exact_score_count,
        sum(rp.raw_points)::bigint as raw_points
      from public.league_round_performance rp
      where rp.period_id=p_period_id
      group by rp.player_id
    ), recalculated as (
      select
        m.id,
        coalesce(a.valid_round_count,0)::integer as valid_round_count,
        a.performance_score,
        coalesce(a.exact_score_count,0)::integer as exact_score_count,
        coalesce(a.raw_points,0)::bigint as raw_points
      from public.league_memberships m
      left join aggregates a on a.player_id=m.player_id
      where m.period_id=p_period_id
    )
    update public.league_memberships m
    set is_eligible=(r.valid_round_count>=2),
        valid_round_count=r.valid_round_count,
        performance_score=r.performance_score,
        exact_score_count=r.exact_score_count,
        raw_points=r.raw_points,
        updated_at=now()
    from recalculated r
    where m.id=r.id;

    get diagnostics v_changed=row_count;
  end if;

  if coalesce(v_locked,'{}'::jsonb)='{}'::jsonb then
    with participants as (
      select distinct lower(p.player_name) as player_key from public.predictions p
      union
      select distinct lower(p.player_name) from public.champions_league_predictions p
      union
      select distinct lower(p.player_name) from public.nations_league_predictions p
    )
    select count(*)::integer into v_baseline_count
    from public.players p
    join participants x on x.player_key=lower(p.name)
    where coalesce(p.is_active,true)
      and p.created_at<=v_starts_at;

    v_locked:=public.league_allocate_capacities(v_baseline_count);
    v_slots:=public.league_promotion_slots(v_locked);

    update public.league_periods
    set active_player_count=v_baseline_count,
        locked_capacities=v_locked,
        locked_promotion_slots=v_slots
    where id=p_period_id;
  end if;

  with invites as (
    select lower(i.inviter_name) as player_key,count(distinct lower(i.invited_name))::integer as invite_count
    from public.player_invites i
    group by lower(i.inviter_name)
  ), ordered as (
    select
      m.id,
      m.league_code,
      row_number() over(
        partition by m.league_code
        order by m.performance_score desc nulls last,
                 coalesce(i.invite_count,0) desc,
                 m.valid_round_count desc,
                 m.exact_score_count desc,
                 m.raw_points desc,
                 m.player_id asc
      )::integer as league_rank,
      count(*) over(partition by m.league_code)::integer as league_size
    from public.league_memberships m
    join public.players p on p.id=m.player_id
    left join invites i on i.player_key=lower(p.name)
    where m.period_id=p_period_id
  ), eligible_ordered as (
    select
      o.id,
      row_number() over(
        partition by o.league_code
        order by o.league_rank
      )::integer as eligible_rank,
      count(*) over(partition by o.league_code)::integer as eligible_size
    from ordered o
    join public.league_memberships m on m.id=o.id
    where m.is_eligible
  ), movement_plan as (
    select * from public.league_movement_plan(p_period_id)
  ), statuses as (
    select
      o.id,o.league_rank,o.league_size,
      m.league_code,
      case
        when not m.is_eligible then 'none'
        when m.league_code='champions' and eo.eligible_rank=1 then 'championship'
        when m.league_code='champions'
          and mp.regular_down_champions>0
          and eo.eligible_rank>eo.eligible_size-mp.regular_down_champions then 'relegation'
        when m.league_code='elite'
          and eo.eligible_rank<=mp.promote_elite then 'promotion'
        when m.league_code='elite'
          and mp.regular_down_elite>0
          and eo.eligible_rank>eo.eligible_size-mp.regular_down_elite then 'relegation'
        when m.league_code='gold'
          and eo.eligible_rank<=mp.promote_gold then 'promotion'
        when m.league_code='gold'
          and mp.regular_down_gold>0
          and eo.eligible_rank>eo.eligible_size-mp.regular_down_gold then 'relegation'
        when m.league_code='silver'
          and eo.eligible_rank<=mp.promote_silver then 'promotion'
        when m.league_code='silver'
          and mp.regular_down_silver>0
          and eo.eligible_rank>eo.eligible_size-mp.regular_down_silver then 'relegation'
        when m.league_code='bronze'
          and eo.eligible_rank<=mp.promote_bronze then 'promotion'
        else 'none'
      end as promotion_status
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
$$;

create or replace function public.get_my_league_summary(
  p_token text
) returns table(
  period_id bigint,
  period_no integer,
  starts_at timestamptz,
  ends_at timestamptz,
  player_name text,
  league_code text,
  is_eligible boolean,
  valid_round_count integer,
  rounds_needed integer,
  performance_score numeric,
  rank_in_league integer,
  league_size bigint,
  promotion_status text,
  locked_promotion_slots jsonb
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_player text;
  v_player_id bigint;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;

  select p.id into v_player_id from public.players p where lower(p.name)=lower(v_player) limit 1;

  return query
  with current_period as (
    select lp.* from public.league_periods lp where lp.status='open' order by lp.starts_at desc limit 1
  ), my_membership as (
    select m.* from public.league_memberships m join current_period cp on cp.id=m.period_id where m.player_id=v_player_id
  )
  select
    cp.id,cp.period_no,cp.starts_at,cp.ends_at,v_player,
    coalesce(mm.league_code,'bronze')::text,
    coalesce(mm.is_eligible,false),
    coalesce(mm.valid_round_count,0),
    greatest(0,2-coalesce(mm.valid_round_count,0)),
    mm.performance_score,
    mm.rank_in_league,
    case when mm.league_code is null then 0::bigint else (
      select count(*) from public.league_memberships x
      where x.period_id=cp.id and x.league_code=mm.league_code
    ) end,
    coalesce(mm.promotion_status,'none')::text,
    cp.locked_promotion_slots
  from current_period cp
  left join my_membership mm on true;
end;
$$;

create or replace function public.get_league_table(
  p_token text,
  p_league_code text default null
) returns table(
  league_code text,
  league_rank integer,
  player_name text,
  performance_score numeric,
  valid_round_count integer,
  exact_score_count integer,
  promotion_status text,
  is_me boolean
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_player text;
  v_player_id bigint;
  v_period_id bigint;
  v_target_league text;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  select p.id into v_player_id from public.players p where lower(p.name)=lower(v_player) limit 1;
  select lp.id into v_period_id from public.league_periods lp where lp.status='open' order by lp.starts_at desc limit 1;
  if v_period_id is null then return; end if;

  if p_league_code is not null then
    if p_league_code not in ('champions','elite','gold','silver','bronze') then
      raise exception 'Lig kodu geçersiz';
    end if;
    v_target_league:=p_league_code;
  else
    select m.league_code into v_target_league
    from public.league_memberships m
    where m.period_id=v_period_id and m.player_id=v_player_id;
    v_target_league:=coalesce(v_target_league,'bronze');
  end if;

  return query
  select
    m.league_code,m.rank_in_league,p.name,m.performance_score,m.valid_round_count,
    m.exact_score_count,m.promotion_status,(m.player_id=v_player_id)
  from public.league_memberships m
  join public.players p on p.id=m.player_id
  where m.period_id=v_period_id
    and m.league_code=v_target_league
  order by m.rank_in_league,p.name collate "tr-TR-x-icu";
end;
$$;

revoke execute on function public.league_movement_plan(bigint) from public,anon,authenticated;
revoke execute on function public.refresh_league_memberships(bigint) from public,anon,authenticated;
revoke execute on function public.get_my_league_summary(text) from public,authenticated;
revoke execute on function public.get_league_table(text,text) from public,authenticated;
grant execute on function public.get_my_league_summary(text) to anon;
grant execute on function public.get_league_table(text,text) to anon;

-- İlk açılışta tüm üyeler Süper Lig 3+4 haftalık normalize başlangıç sırasıyla görünür.
-- İlk dönem turu işlendiğinde başlangıç puanı temizlenir ve yeni dönem performansı sıfırdan hesaplanır.
-- Canlı yükselme/düşme göstergesi ile dönem kapanışı aynı hareket planını kullanır.
