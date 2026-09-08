create or replace function public.get_my_daily_match_predictions(p_token text)
returns table(
  competition text,
  fixture_id bigint,
  week integer,
  home_score smallint,
  away_score smallint
)
language sql
security definer
set search_path to 'public','extensions'
as $function$
  with me as (
    select public.friend_session_player(p_token) as player_name
  )
  select 'super_lig'::text as competition, p.fixture_id::bigint, p.week::integer, p.home_score::smallint, p.away_score::smallint
  from public.predictions p, me
  where p.player_name = me.player_name

  union all

  select 'champions_league'::text as competition, p.fixture_id::bigint, f.week::integer, p.home_score::smallint, p.away_score::smallint
  from public.champions_league_predictions p
  join public.champions_league_fixtures f on f.id = p.fixture_id
  cross join me
  where p.player_name = me.player_name

  union all

  select 'nations_league'::text as competition, p.fixture_id::bigint, f.week::integer, p.home_score::smallint, p.away_score::smallint
  from public.nations_league_predictions p
  join public.nations_league_fixtures f on f.id = p.fixture_id
  cross join me
  where p.player_name = me.player_name;
$function$;

grant execute on function public.get_my_daily_match_predictions(text) to anon, authenticated;
notify pgrst, 'reload schema';
