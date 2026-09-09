-- Bizim Skor Ligleri: yalnızca ilk dönem için normalize geçmiş performansla başlangıç yerleştirmesi.
-- Tamamlanmış Süper Lig, Şampiyonlar Ligi ve Uluslar Ligi turları ayrı ayrı 0-100 normalize edilir.
-- Oyuncunun başlangıç puanı katıldığı tamamlanmış turların ortalamasıdır; katılmadığı tur 0 sayılmaz.
-- Hiç tamamlanmış turu olmayan gerçek katılımcı 0.00 ile başlar.
-- Eşitlik: performans > davet > geçerli tur > tam skor > ham puan > oyuncu ID.
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
  with completed_super_rounds as (
    select f.season,f.week,count(distinct f.id)::integer as fixture_count
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where f.kickoff<p_before
    group by f.season,f.week
    having count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
  ), super_players as (
    select csr.season,csr.week,csr.fixture_count,p.player_name
    from completed_super_rounds csr
    join public.fixtures f on f.season=csr.season and f.week=csr.week
    join public.predictions p on p.fixture_id=f.id
    group by csr.season,csr.week,csr.fixture_count,p.player_name
    having count(distinct p.fixture_id)=csr.fixture_count
  ), super_scored as (
    select
      pl.id as player_id,
      sp.season,
      sp.week,
      pl.created_at,
      pl.name as player_name,
      coalesce(sum(public.league_super_match_points(
        f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score
      )),0)::bigint as points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
      count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
    from super_players sp
    join public.players pl on lower(pl.name)=lower(sp.player_name) and coalesce(pl.is_active,true)
    join public.predictions p on lower(p.player_name)=lower(sp.player_name)
    join public.fixtures f on f.id=p.fixture_id and f.season=sp.season and f.week=sp.week
    join public.results r on r.fixture_id=f.id
    group by pl.id,sp.season,sp.week,pl.created_at,pl.name
  ), super_ranked as (
    select
      s.*,
      row_number() over(
        partition by s.season,s.week
        order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu"
      )::integer as round_rank,
      count(*) over(partition by s.season,s.week)::integer as participant_count
    from super_scored s
  ),
  completed_champions_rounds as (
    select f.season,f.week,count(distinct f.id)::integer as fixture_count
    from public.champions_league_fixtures f
    left join public.champions_league_results r on r.fixture_id=f.id
    where f.kickoff<p_before
    group by f.season,f.week
    having count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
  ), champions_players as (
    select ccr.season,ccr.week,ccr.fixture_count,p.player_name
    from completed_champions_rounds ccr
    join public.champions_league_fixtures f on f.season=ccr.season and f.week=ccr.week
    join public.champions_league_predictions p on p.fixture_id=f.id
    group by ccr.season,ccr.week,ccr.fixture_count,p.player_name
    having count(distinct p.fixture_id)=ccr.fixture_count
  ), champions_scored as (
    select
      pl.id as player_id,
      cp.season,
      cp.week,
      pl.created_at,
      pl.name as player_name,
      coalesce(sum(public.champions_match_points(
        f.id,p.home_score,p.away_score,r.home_score,r.away_score
      )),0)::bigint as points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
      count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
    from champions_players cp
    join public.players pl on lower(pl.name)=lower(cp.player_name) and coalesce(pl.is_active,true)
    join public.champions_league_predictions p on lower(p.player_name)=lower(cp.player_name)
    join public.champions_league_fixtures f on f.id=p.fixture_id and f.season=cp.season and f.week=cp.week
    join public.champions_league_results r on r.fixture_id=f.id
    group by pl.id,cp.season,cp.week,pl.created_at,pl.name
  ), champions_ranked as (
    select
      s.*,
      row_number() over(
        partition by s.season,s.week
        order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu"
      )::integer as round_rank,
      count(*) over(partition by s.season,s.week)::integer as participant_count
    from champions_scored s
  ),
  completed_nations_rounds as (
    select f.season,f.week,count(distinct f.id)::integer as fixture_count
    from public.nations_league_fixtures f
    left join public.nations_league_results r on r.fixture_id=f.id
    where f.kickoff<p_before
    group by f.season,f.week
    having count(distinct f.id)>0
       and count(distinct r.fixture_id)=count(distinct f.id)
  ), nations_players as (
    select cnr.season,cnr.week,cnr.fixture_count,p.player_name
    from completed_nations_rounds cnr
    join public.nations_league_fixtures f on f.season=cnr.season and f.week=cnr.week
    join public.nations_league_predictions p on p.fixture_id=f.id
    group by cnr.season,cnr.week,cnr.fixture_count,p.player_name
    having count(distinct p.fixture_id)=cnr.fixture_count
  ), nations_scored as (
    select
      pl.id as player_id,
      np.season,
      np.week,
      pl.created_at,
      pl.name as player_name,
      coalesce(sum(public.nations_match_points(
        f.id,p.home_score,p.away_score,r.home_score,r.away_score
      )),0)::bigint as points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
      count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
    from nations_players np
    join public.players pl on lower(pl.name)=lower(np.player_name) and coalesce(pl.is_active,true)
    join public.nations_league_predictions p on lower(p.player_name)=lower(np.player_name)
    join public.nations_league_fixtures f on f.id=p.fixture_id and f.season=np.season and f.week=np.week
    join public.nations_league_results r on r.fixture_id=f.id
    group by pl.id,np.season,np.week,pl.created_at,pl.name
  ), nations_ranked as (
    select
      s.*,
      row_number() over(
        partition by s.season,s.week
        order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu"
      )::integer as round_rank,
      count(*) over(partition by s.season,s.week)::integer as participant_count
    from nations_scored s
  ), rounds as (
    select player_id,
           public.league_normalized_performance(round_rank,participant_count) as performance_score,
           exact_count,
           points
    from super_ranked where participant_count>=2
    union all
    select player_id,
           public.league_normalized_performance(round_rank,participant_count),
           exact_count,
           points
    from champions_ranked where participant_count>=2
    union all
    select player_id,
           public.league_normalized_performance(round_rank,participant_count),
           exact_count,
           points
    from nations_ranked where participant_count>=2
  ), aggregated as (
    select
      r.player_id,
      round(avg(r.performance_score),2)::numeric(6,2) as performance_score,
      count(*)::integer as valid_round_count,
      sum(r.exact_count)::integer as exact_score_count,
      sum(r.points)::bigint as raw_points
    from rounds r
    group by r.player_id
  )
  select a.player_id,a.performance_score,a.valid_round_count,a.exact_score_count,a.raw_points
  from aggregated a;
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
-- İlk görünür sıra geçmiş normalize performansla oluşur; eşit performansta daha fazla davet eden öne geçer.
-- 5. hafta dönem performansı geldiğinde geçmiş seed puanı taşınmaz; dönem sıralaması yeni turlarla yeniden hesaplanır.
