drop function if exists public.get_today_live_match_cards(timestamptz);

create function public.get_today_live_match_cards(p_now timestamptz default now())
returns table(
  competition text,
  fixture_id bigint,
  home_team text,
  away_team text,
  kickoff timestamptz,
  status text,
  elapsed smallint,
  home_score smallint,
  away_score smallint,
  fetched_at timestamptz,
  exact_players text[]
)
language sql
security definer
set search_path=public,pg_temp
as $$
  with all_fixtures as (
    select
      'super_lig'::text as competition,
      f.id as fixture_id,
      f.home_team,
      f.away_team,
      f.kickoff,
      r.status as result_status,
      r.home_score as result_home_score,
      r.away_score as result_away_score,
      r.updated_at as result_updated_at
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    union all
    select
      'champions_league'::text,
      f.id,
      f.home_team,
      f.away_team,
      f.kickoff,
      case when r.fixture_id is not null then 'finished'::text end,
      r.home_score,
      r.away_score,
      r.updated_at
    from public.champions_league_fixtures f
    left join public.champions_league_results r on r.fixture_id=f.id
  ), cards as (
    select
      f.*,
      coalesce(case when f.result_status='finished' then 'FT' end,c.status) as card_status,
      case when f.result_status='finished' then null else c.elapsed end as elapsed,
      coalesce(f.result_home_score,c.home_score)::smallint as card_home_score,
      coalesce(f.result_away_score,c.away_score)::smallint as card_away_score,
      coalesce(f.result_updated_at,c.fetched_at) as card_fetched_at
    from all_fixtures f
    left join public.live_score_cache c
      on c.competition=f.competition and c.fixture_id=f.fixture_id
    where (f.kickoff at time zone 'Europe/Istanbul')::date >=
          (p_now at time zone 'Europe/Istanbul')::date
  )
  select
    c.competition,
    c.fixture_id,
    c.home_team,
    c.away_team,
    c.kickoff,
    c.card_status,
    c.elapsed,
    c.card_home_score,
    c.card_away_score,
    c.card_fetched_at,
    case when p_now>=c.kickoff and c.card_home_score is not null and c.card_away_score is not null
      then coalesce((
        select array_agg(x.player_name order by x.player_name collate "tr-TR-x-icu")
        from (
          select p.player_name
          from public.predictions p
          join public.players pl on pl.name=p.player_name and pl.is_active=true
          where c.competition='super_lig' and p.fixture_id=c.fixture_id
            and p.home_score=c.card_home_score and p.away_score=c.card_away_score
          union all
          select p.player_name
          from public.champions_league_predictions p
          join public.players pl on pl.name=p.player_name and pl.is_active=true
          where c.competition='champions_league' and p.fixture_id=c.fixture_id
            and p.home_score=c.card_home_score and p.away_score=c.card_away_score
        ) x
      ),array[]::text[])
      else array[]::text[]
    end
  from cards c
  order by c.kickoff,c.competition,c.fixture_id;
$$;

revoke all on function public.get_today_live_match_cards(timestamptz) from public,anon,authenticated;
grant execute on function public.get_today_live_match_cards(timestamptz) to anon,authenticated;
