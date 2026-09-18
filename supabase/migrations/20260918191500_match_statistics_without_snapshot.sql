create or replace function public.get_match_statistics(p_fixture_id bigint)
returns jsonb
language sql
stable
set search_path to ''
as $function$
with target as (
  select
    coalesce(s.payload,'{}'::jsonb) as payload,
    f.id as fixture_id,
    f.week,
    f.season,
    f.home_team,
    f.away_team,
    f.kickoff,
    coalesce(s.fetched_at,now()) as fetched_at
  from public.fixtures f
  left join public.match_statistics