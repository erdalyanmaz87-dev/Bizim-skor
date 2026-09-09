-- Bizim Skor Ligleri: resmi tahmin turlarını normalize lig performansına dönüştürür.
-- Mevcut yarışma tablolarını/fonksiyonlarını değiştirmez; yalnız okur ve league_round_performance'a yazar.
-- round_key biçimi: <season>:<week>  ör. 2026/27:4

create or replace function public.league_super_match_points(
  p_fixture_id bigint,
  p_week integer,
  p_home integer,
  p_away integer,
  r_home integer,
  r_away integer
) returns bigint
language sql
immutable
set search_path=''
as $$
  select case
    when r_home is null or r_away is null or p_home is null or p_away is null then 0
    when ((p_week=4 and p_fixture_id=30) or (p_week=5 and p_fixture_id=44))
      and p_home=r_home and p_away=r_away then 8
    when ((p_week=4 and p_fixture_id=30) or (p_week=5 and p_fixture_id=44))
      and sign(p_home-p_away)=sign(r_home-r_away) then 2
    when p_home=r_home and p_away=r_away then 4
    when sign(p_home-p_away)=sign(r_home-r_away) then 1
    else 0
  end;
$$;

create or replace function public.refresh_league_round(
  p_period_id bigint,
  p_competition text,
  p_round_key text
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_period_status text;
  v_season text;
  v_week integer;
  v_fixture_count integer;
  v_written integer := 0;
begin
  select status into v_period_status
  from public.league_periods
  where id=p_period_id
  for update;

  if v_period_status is null then
    raise exception 'Lig dönemi bulunamadı';
  end if;
  if v_period_status <> 'open' then
    raise exception 'Kapalı lig dönemi yenilenemez';
  end if;
  if p_competition not in ('super_lig','champions_league','nations_league') then
    raise exception 'Desteklenmeyen organizasyon';
  end if;

  v_season := split_part(p_round_key,':',1);
  begin
    v_week := split_part(p_round_key,':',2)::integer;
  exception when others then
    raise exception 'Tur anahtarı geçersiz: %',p_round_key;
  end;

  if coalesce(v_season,'')='' or v_week is null or v_week<1 then
    raise exception 'Tur anahtarı geçersiz: %',p_round_key;
  end if;

  if p_competition='super_lig' then
    select count(*) into v_fixture_count
    from public.fixtures f
    where f.season=v_season and f.week=v_week;

    if v_fixture_count=0 then raise exception 'Süper Lig turu bulunamadı'; end if;

    with complete_players as (
      select p.player_name
      from public.predictions p
      join public.fixtures f on f.id=p.fixture_id
      join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
      where f.season=v_season and f.week=v_week
      group by p.player_name
      having count(distinct p.fixture_id)=v_fixture_count
    ), scored as (
      select
        pl.id as player_id,
        cp.player_name,
        pl.created_at,
        coalesce(sum(public.league_super_match_points(
          f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score
        )),0)::bigint as points,
        count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
        count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
      from complete_players cp
      join public.players pl on pl.name=cp.player_name
      join public.predictions p on p.player_name=cp.player_name
      join public.fixtures f on f.id=p.fixture_id and f.season=v_season and f.week=v_week
      left join public.results r on r.fixture_id=f.id
      group by pl.id,cp.player_name,pl.created_at
    ), ranked as (
      select s.*,
        row_number() over(order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu")::integer as display_rank,
        count(*) over()::integer as participant_count
      from scored s
    )
    insert into public.league_round_performance(
      period_id,player_id,competition,round_key,participant_count,rank,performance_score,exact_score_count,raw_points,updated_at
    )
    select p_period_id,r.player_id,p_competition,p_round_key,r.participant_count,r.display_rank,
      public.league_normalized_performance(r.display_rank,r.participant_count),r.exact_count,r.points,now()
    from ranked r
    where r.participant_count>=2
    on conflict(period_id,player_id,competition,round_key) do update
      set participant_count=excluded.participant_count,
          rank=excluded.rank,
          performance_score=excluded.performance_score,
          exact_score_count=excluded.exact_score_count,
          raw_points=excluded.raw_points,
          updated_at=now();

    get diagnostics v_written = row_count;

  elsif p_competition='champions_league' then
    select count(*) into v_fixture_count
    from public.champions_league_fixtures f
    where f.season=v_season and f.week=v_week;

    if v_fixture_count=0 then raise exception 'Şampiyonlar Ligi turu bulunamadı'; end if;

    with complete_players as (
      select p.player_name
      from public.champions_league_predictions p
      join public.champions_league_fixtures f on f.id=p.fixture_id
      join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
      where f.season=v_season and f.week=v_week
      group by p.player_name
      having count(distinct p.fixture_id)=v_fixture_count
    ), scored as (
      select
        pl.id as player_id,
        cp.player_name,
        pl.created_at,
        coalesce(sum(public.champions_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint as points,
        count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
        count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
      from complete_players cp
      join public.players pl on pl.name=cp.player_name
      join public.champions_league_predictions p on p.player_name=cp.player_name
      join public.champions_league_fixtures f on f.id=p.fixture_id and f.season=v_season and f.week=v_week
      left join public.champions_league_results r on r.fixture_id=f.id
      group by pl.id,cp.player_name,pl.created_at
    ), ranked as (
      select s.*,
        row_number() over(order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu")::integer as display_rank,
        count(*) over()::integer as participant_count
      from scored s
    )
    insert into public.league_round_performance(
      period_id,player_id,competition,round_key,participant_count,rank,performance_score,exact_score_count,raw_points,updated_at
    )
    select p_period_id,r.player_id,p_competition,p_round_key,r.participant_count,r.display_rank,
      public.league_normalized_performance(r.display_rank,r.participant_count),r.exact_count,r.points,now()
    from ranked r
    where r.participant_count>=2
    on conflict(period_id,player_id,competition,round_key) do update
      set participant_count=excluded.participant_count,
          rank=excluded.rank,
          performance_score=excluded.performance_score,
          exact_score_count=excluded.exact_score_count,
          raw_points=excluded.raw_points,
          updated_at=now();

    get diagnostics v_written = row_count;

  else
    select count(*) into v_fixture_count
    from public.nations_league_fixtures f
    where f.season=v_season and f.week=v_week;

    if v_fixture_count=0 then raise exception 'Uluslar Ligi turu bulunamadı'; end if;

    with complete_players as (
      select p.player_name
      from public.nations_league_predictions p
      join public.nations_league_fixtures f on f.id=p.fixture_id
      join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
      where f.season=v_season and f.week=v_week
      group by p.player_name
      having count(distinct p.fixture_id)=v_fixture_count
    ), scored as (
      select
        pl.id as player_id,
        cp.player_name,
        pl.created_at,
        coalesce(sum(public.nations_match_points(f.id,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint as points,
        count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::integer as exact_count,
        count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer as correct_count
      from complete_players cp
      join public.players pl on pl.name=cp.player_name
      join public.nations_league_predictions p on p.player_name=cp.player_name
      join public.nations_league_fixtures f on f.id=p.fixture_id and f.season=v_season and f.week=v_week
      left join public.nations_league_results r on r.fixture_id=f.id
      group by pl.id,cp.player_name,pl.created_at
    ), ranked as (
      select s.*,
        row_number() over(order by s.points desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-TR-x-icu")::integer as display_rank,
        count(*) over()::integer as participant_count
      from scored s
    )
    insert into public.league_round_performance(
      period_id,player_id,competition,round_key,participant_count,rank,performance_score,exact_score_count,raw_points,updated_at
    )
    select p_period_id,r.player_id,p_competition,p_round_key,r.participant_count,r.display_rank,
      public.league_normalized_performance(r.display_rank,r.participant_count),r.exact_count,r.points,now()
    from ranked r
    where r.participant_count>=2
    on conflict(period_id,player_id,competition,round_key) do update
      set participant_count=excluded.participant_count,
          rank=excluded.rank,
          performance_score=excluded.performance_score,
          exact_score_count=excluded.exact_score_count,
          raw_points=excluded.raw_points,
          updated_at=now();

    get diagnostics v_written = row_count;
  end if;

  return v_written;
end;
$$;

revoke execute on function public.league_super_match_points(bigint,integer,integer,integer,integer,integer) from public,anon,authenticated;
revoke execute on function public.refresh_league_round(bigint,text,text) from public,anon,authenticated;

-- Doğrulama senaryosu (development):
-- Aynı tur iki kez işlendiğinde mükerrer satır oluşmaz; raw_points dahil tüm performans alanları güncellenir.
