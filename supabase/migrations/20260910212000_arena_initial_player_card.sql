-- Geçici Arena oyuncu kartında 3. ve 4. hafta performanslarını ayrı gösterir.
-- Başlangıç ligi hesabını değiştirmez; yalnız güvenli, salt-okunur detay sağlar.
create or replace function public.get_arena_initial_player_card(
  p_token text,
  p_player_name text
) returns table(
  week3_score numeric,
  week4_score numeric,
  valid_round_count integer,
  rounds_needed integer
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_viewer text;
  v_starts_at timestamptz;
begin
  v_viewer:=public.friend_session_player(p_token);
  if v_viewer is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  if exists(select 1 from public.league_periods) then return; end if;

  select min(f.kickoff) into v_starts_at
  from public.fixtures f
  where f.week=5
    and f.season=(
      select f2.season from public.fixtures f2 where f2.week=5
      group by f2.season order by min(f2.kickoff) desc limit 1
    );
  if v_starts_at is null then return; end if;

  return query
  with seed_season as (
    select f.season from public.fixtures f
    where f.week=4 and f.kickoff<v_starts_at
    group by f.season order by max(f.kickoff) desc limit 1
  ), target_rounds as (
    select f.season,f.week,count(distinct f.id)::integer fixture_count
    from public.fixtures f cross join seed_season ss
    left join public.results r on r.fixture_id=f.id
    where f.season=ss.season and f.week in(3,4) and f.kickoff<v_starts_at
    group by f.season,f.week
    having count(distinct f.id)>0
       and count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)=count(distinct f.id)
  ), complete_players as (
    select tr.season,tr.week,tr.fixture_count,p.player_name
    from target_rounds tr
    join public.fixtures f on f.season=tr.season and f.week=tr.week
    join public.predictions p on p.fixture_id=f.id
    group by tr.season,tr.week,tr.fixture_count,p.player_name
    having count(distinct p.fixture_id)=tr.fixture_count
  ), scored as (
    select pl.id player_id,cp.season,cp.week,pl.name player_name,
      coalesce(sum(public.league_super_match_points(f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score)),0)::bigint points,
      count(*) filter(where p.home_score=r.home_score and p.away_score=r.away_score)::integer exact_count,
      count(*) filter(where sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer correct_count
    from complete_players cp
    join public.players pl on lower(pl.name)=lower(cp.player_name) and coalesce(pl.is_active,true)
    join public.predictions p on lower(p.player_name)=lower(cp.player_name)
    join public.fixtures f on f.id=p.fixture_id and f.season=cp.season and f.week=cp.week
    join public.results r on r.fixture_id=f.id
    group by pl.id,cp.season,cp.week,pl.name
  ), ranked as (
    select s.*,
      rank() over(partition by s.season,s.week order by s.points desc,s.exact_count desc,s.correct_count desc)::integer round_rank,
      count(*) over(partition by s.season,s.week)::integer participant_count
    from scored s
  ), normalized as (
    select r.player_id,r.player_name,r.week,
      public.league_normalized_performance(r.round_rank,r.participant_count)::numeric(6,2) performance_score
    from ranked r where r.participant_count>=2
  ), mine as (
    select n.* from normalized n where lower(n.player_name)=lower(trim(p_player_name))
  )
  select
    coalesce(max(m.performance_score) filter(where m.week=3),0)::numeric,
    coalesce(max(m.performance_score) filter(where m.week=4),0)::numeric,
    count(*)::integer,
    greatest(0,2-count(*))::integer
  from mine m;
end;
$$;

revoke execute on function public.get_arena_initial_player_card(text,text) from public,authenticated;
grant execute on function public.get_arena_initial_player_card(text,text) to anon;
