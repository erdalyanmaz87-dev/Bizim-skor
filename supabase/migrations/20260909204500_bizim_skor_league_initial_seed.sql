-- Bizim Skor Ligleri: yalnızca ilk dönem için başlangıç yerleştirmesi.
-- Kesin başlangıç kuralı: Süper Lig 3. ve 4. haftalar ayrı ayrı 0-100 normalize edilir.
-- Oyuncu haftalardan birini eksik bıraktıysa o hafta 0 kabul edilir ve iki haftanın puanı 2'ye bölünür.
-- Eşitlik: performans > davet > oynanan tur > tam skor > ham puan > oyuncu ID.
-- Bu puan SADECE ilk görünür başlangıç sırası içindir; 5. haftadan itibaren dönem performansı sıfırdan oluşur.

create or replace function public.league_historical_seed_scores(
  p_before timestamptz
) returns table(
  player_id bigint,
  performance_score numeric,
  valid_round_count integer,
  exact_score_count integer,
  raw_points bigint
)
language sql
stable
security definer
set search_path=''
as $$
  with target_rounds as (
    select f.season,f.week,count(distinct f.id)::integer as fixture_count
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where f.week in (3,4)
      and f.kickoff<p_before
    group by f.season,f.week
    having count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
  ), complete_players as (
    select tr.season,tr.week,tr.fixture_count,p.player_name
    from target_rounds tr
    join public.fixtures f on f.season=tr.season and f.week=tr.week
    join public.predictions p on p.fixture_id=f.id
    group by tr.season,tr.week,tr.fixture_count,p.player_name
    having count(distinct p.fixture_id)=tr.fixture_count
  ), scored as (
    select
      pl.id as player_id,
      cp.season,
      cp.week,
      pl.created_at,
      pl.name as player_name,
      coalesce(sum(public.league_super_match_points(
        f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score
      )),0)::bigint as points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
      count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
    from complete_players cp
    join public.players pl on lower(pl.name)=lower(cp.player_name) and coalesce(pl.is_active,true)
    join public.predictions p on lower(p.player_name)=lower(cp.player_name)
    join public.fixtures f on f.id=p.fixture_id and f.season=cp.season and f.week=cp.week
    join public.results r on r.fixture_id=f.id
    group by pl.id,cp.season,cp.week,pl.created_at,pl.name
  ), ranked as (
    select
      s.*,
      row_number() over(
        partition by s.season,s.week
        order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu"
      )::integer as round_rank,
      count(*) over(partition by s.season,s.week)::integer as participant_count
    from scored s
  ), normalized as (
    select
      r.player_id,
      r.week,
      public.league_normalized_performance(r.round_rank,r.participant_count) as performance_score,
      r.exact_count,
      r.points
    from ranked r
    where r.participant_count>=2
  ), players_in_window as (
    select distinct player_id from normalized
  ), two_week as (
    select
      p.player_id,
      round((coalesce(w3.performance_score,0)+coalesce(w4.performance_score,0))/2.0,2)::numeric(6,2) as performance_score,
      ((case when w3.player_id is not null then 1 else 0 end)
       +(case when w4.player_id is not null then 1 else 0 end))::integer as valid_round_count,
      (coalesce(w3.exact_count,0)+coalesce(w4.exact_count,0))::integer as exact_score_count,
      (coalesce(w3.points,0)+coalesce(w4.points,0))::bigint as raw_points
    from players_in_window p
    left join normalized w3 on w3.player_id=p.player_id and w3.week=3
    left join normalized w4 on w4.player_id=p.player_id and w4.week=4
  )
  select t.player_id,t.performance_score,t.valid_round_count,t.exact_score_count,t.raw_points
  from two_week t;
$$;

create or replace function public.initialize_first_league_period(
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns bigint
language plpgsql
security definer
set search_path=''
as $$
declare
  v_period_id bigint;
  v_count integer;
  v_capacities jsonb;
  v_slots jsonb;
  v_champions integer;
  v_elite integer;
  v_gold integer;
  v_silver integer;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then
    raise exception 'Lig dönemi tarihleri geçersiz';
  end if;

  if exists(select 1 from public.league_periods) then
    raise exception 'İlk lig dönemi daha önce oluşturulmuş';
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

  if v_count<5 then
    raise exception '5 lig için yeterli başlangıç oyuncusu yok';
  end if;

  v_capacities:=public.league_allocate_capacities(v_count);
  v_slots:=public.league_promotion_slots(v_capacities);
  v_champions:=coalesce((v_capacities->>'champions')::integer,0);
  v_elite:=coalesce((v_capacities->>'elite')::integer,0);
  v_gold:=coalesce((v_capacities->>'gold')::integer,0);
  v_silver:=coalesce((v_capacities->>'silver')::integer,0);

  insert into public.league_periods(
    period_no,starts_at,ends_at,status,active_player_count,locked_capacities,locked_promotion_slots
  ) values (
    1,p_starts_at,p_ends_at,'open',v_count,v_capacities,v_slots
  ) returning id into v_period_id;

  with participants as (
    select distinct lower(p.player_name) as player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  ), historical as (
    select * from public.league_historical_seed_scores(p_starts_at)
  ), invites as (
    select lower(i.inviter_name) as player_key,count(*)::integer as invite_count
    from public.player_invites i
    group by lower(i.inviter_name)
  ), scored as (
    select
      pl.id as player_id,
      coalesce(h.performance_score,0)::numeric(6,2) as performance_score,
      coalesce(i.invite_count,0)::integer as invite_count,
      coalesce(h.valid_round_count,0)::integer as valid_round_count,
      coalesce(h.exact_score_count,0)::integer as exact_score_count,
      coalesce(h.raw_points,0)::bigint as raw_points
    from public.players pl
    join participants x on x.player_key=lower(pl.name)
    left join historical h on h.player_id=pl.id
    left join invites i on i.player_key=lower(pl.name)
    where coalesce(pl.is_active,true)
      and pl.created_at<=p_starts_at
  ), ordered as (
    select
      s.*,
      row_number() over(
        order by s.performance_score desc,
                 s.invite_count desc,
                 s.valid_round_count desc,
                 s.exact_score_count desc,
                 s.raw_points desc,
                 s.player_id
      )::integer as seed_rank
    from scored s
  ), seeded as (
    select
      o.*,
      case
        when o.seed_rank<=v_champions then 'champions'
        when o.seed_rank<=v_champions+v_elite then 'elite'
        when o.seed_rank<=v_champions+v_elite+v_gold then 'gold'
        when o.seed_rank<=v_champions+v_elite+v_gold+v_silver then 'silver'
        else 'bronze'
      end::text as league_code,
      row_number() over(
        partition by case
          when o.seed_rank<=v_champions then 'champions'
          when o.seed_rank<=v_champions+v_elite then 'elite'
          when o.seed_rank<=v_champions+v_elite+v_gold then 'gold'
          when o.seed_rank<=v_champions+v_elite+v_gold+v_silver then 'silver'
          else 'bronze'
        end
        order by o.seed_rank
      )::integer as league_rank
    from ordered o
  )
  insert into public.league_memberships(
    period_id,player_id,league_code,starting_league_code,is_eligible,
    valid_round_count,performance_score,exact_score_count,raw_points,rank_in_league,promotion_status
  )
  select
    v_period_id,s.player_id,s.league_code,s.league_code,false,
    0,s.performance_score,s.exact_score_count,s.raw_points,s.league_rank,'none'
  from seeded s;

  return v_period_id;
end;
$$;

revoke execute on function public.league_historical_seed_scores(timestamptz) from public,anon,authenticated;
revoke execute on function public.initialize_first_league_period(timestamptz,timestamptz) from public,anon,authenticated;

-- 77 katılımcı için kapasite örneği: 8 Şampiyonlar / 12 Elit / 15 Altın / 19 Gümüş / 23 Bronz.
-- İlk görünür sıra Süper Lig 3+4 iki haftalık normalize performansla oluşur.
-- Eksik hafta 0 kabul edilir. Eşit performansta daha fazla davet eden öne geçer.
-- 5. hafta dönem performansı geldiğinde geçmiş seed puanı taşınmaz; dönem sıralaması yeni turlarla yeniden hesaplanır.
