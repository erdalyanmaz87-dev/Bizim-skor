-- Bizim Skor Ligleri: üyelik, uygunluk, lig içi sıralama ve sabit dönem kontenjanları.
-- Yeni oyuncular Bronz'dan başlar. Herkes sıralamada görünür; yükselme/düşme için en az 2 geçerli tur gerekir.

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

  -- Tur performansı bulunan yeni oyuncular için üyelik satırı oluştur.
  -- Önceki dönem geçmişi varsa oradaki son lig korunur; yeni oyuncu Bronz'dan başlar.
  with aggregates as (
    select
      rp.player_id,
      count(*)::integer as valid_round_count,
      round(avg(rp.performance_score),2)::numeric(6,2) as performance_score,
      sum(rp.exact_score_count)::integer as exact_score_count
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
    valid_round_count,performance_score,exact_score_count,updated_at
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
    now()
  from aggregates a
  left join prior pr on pr.player_id=a.player_id
  on conflict(period_id,player_id) do nothing;

  -- İlk gerçek dönem turu geldiği anda tarihsel başlangıç puanı taşınmaz.
  -- Tüm üyelerin puanı yalnız bu dönemde oynadıkları turlardan yeniden kurulur.
  if exists(select 1 from public.league_round_performance rp where rp.period_id=p_period_id) then
    with aggregates as (
      select
        rp.player_id,
        count(*)::integer as valid_round_count,
        round(avg(rp.performance_score),2)::numeric(6,2) as performance_score,
        sum(rp.exact_score_count)::integer as exact_score_count
      from public.league_round_performance rp
      where rp.period_id=p_period_id
      group by rp.player_id
    ), recalculated as (
      select
        m.id,
        coalesce(a.valid_round_count,0)::integer as valid_round_count,
        a.performance_score,
        coalesce(a.exact_score_count,0)::integer as exact_score_count
      from public.league_memberships m
      left join aggregates a on a.player_id=m.player_id
      where m.period_id=p_period_id
    )
    update public.league_memberships m
    set is_eligible=(r.valid_round_count>=2),
        valid_round_count=r.valid_round_count,
        performance_score=r.performance_score,
        exact_score_count=r.exact_score_count,
        updated_at=now()
    from recalculated r
    where m.id=r.id;

    get diagnostics v_changed=row_count;
  end if;

  -- Kontenjanlar dönem başında gerçekten oyuna katılmış aktif oyuncu tabanına göre kilitlenir.
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

  -- Her oyuncu lig tablosunda görünür. Uygun olmayan oyuncu sıralanır fakat hareket bölgesine girmez.
  with ordered as (
    select
      m.id,
      row_number() over(
        partition by m.league_code
        order by m.performance_score desc nulls last,
                 m.valid_round_count desc,
                 m.exact_score_count desc,
                 m.player_id asc
      )::integer as league_rank,
      count(*) over(partition by m.league_code)::integer as league_size
    from public.league_memberships m
    where m.period_id=p_period_id
  ), statuses as (
    select
      o.id,o.league_rank,o.league_size,
      m.league_code,
      case
        when not m.is_eligible then 'none'
        when m.league_code='champions' and o.league_rank=1 then 'championship'
        when m.league_code='champions'
          and o.league_rank > o.league_size-coalesce((v_slots->>'champions_elite')::integer,0) then 'relegation'
        when m.league_code='elite'
          and o.league_rank <= coalesce((v_slots->>'champions_elite')::integer,0) then 'promotion'
        when m.league_code='elite'
          and o.league_rank > o.league_size-coalesce((v_slots->>'elite_gold')::integer,0) then 'relegation'
        when m.league_code='gold'
          and o.league_rank <= coalesce((v_slots->>'elite_gold')::integer,0) then 'promotion'
        when m.league_code='gold'
          and o.league_rank > o.league_size-coalesce((v_slots->>'gold_silver')::integer,0) then 'relegation'
        when m.league_code='silver'
          and o.league_rank <= coalesce((v_slots->>'gold_silver')::integer,0) then 'promotion'
        when m.league_code='silver'
          and o.league_rank > o.league_size-coalesce((v_slots->>'silver_bronze')::integer,0) then 'relegation'
        when m.league_code='bronze'
          and o.league_rank <= coalesce((v_slots->>'silver_bronze')::integer,0) then 'promotion'
        else 'none'
      end as promotion_status
    from ordered o
    join public.league_memberships m on m.id=o.id
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

revoke execute on function public.refresh_league_memberships(bigint) from public,anon,authenticated;
revoke execute on function public.get_my_league_summary(text) from public,authenticated;
revoke execute on function public.get_league_table(text,text) from public,authenticated;
grant execute on function public.get_my_league_summary(text) to anon;
grant execute on function public.get_league_table(text,text) to anon;

-- İlk açılışta tüm üyeler tarihsel normalize başlangıç sırasıyla görünür.
-- İlk dönem turu işlendiğinde tarihsel puan temizlenir ve yeni dönem performansı sıfırdan hesaplanır.
-- 2 geçerli tur şartı yalnız yükselme/düşme uygunluğunu etkiler; tablo görünürlüğünü etkilemez.
