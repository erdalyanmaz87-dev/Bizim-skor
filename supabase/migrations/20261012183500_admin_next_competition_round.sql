create or replace function public.get_admin_statistics_dashboard_base(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_competition text;
  v_competition_label text;
  v_season text;
  v_week integer;
  v_fixture_count integer;
  v_result jsonb;
begin
  if not public.is_support_admin(p_token) then
    raise exception 'Yetkisiz işlem';
  end if;

  select next_fixture.competition, next_fixture.season, next_fixture.week
    into v_competition, v_season, v_week
  from (
    select 'super'::text as competition, f.season, f.week, f.kickoff
    from public.fixtures f
    union all
    select 'champions'::text, f.season, f.week, f.kickoff
    from public.champions_league_fixtures f
    union all
    select 'nations'::text, f.season, f.week, f.kickoff
    from public.nations_league_fixtures f
  ) next_fixture
  where next_fixture.kickoff > now()
  order by next_fixture.kickoff, next_fixture.competition, next_fixture.week
  limit 1;

  if v_week is null then
    select latest_fixture.competition, latest_fixture.season, latest_fixture.week
      into v_competition, v_season, v_week
    from (
      select 'super'::text as competition, f.season, f.week, f.kickoff
      from public.fixtures f
      union all
      select 'champions'::text, f.season, f.week, f.kickoff
      from public.champions_league_fixtures f
      union all
      select 'nations'::text, f.season, f.week, f.kickoff
      from public.nations_league_fixtures f
    ) latest_fixture
    order by latest_fixture.kickoff desc, latest_fixture.competition, latest_fixture.week desc
    limit 1;
  end if;

  v_competition_label := case v_competition
    when 'champions' then 'Şampiyonlar Ligi'
    when 'nations' then 'UEFA Uluslar Ligi'
    else 'Süper Lig'
  end;

  select count(*)::integer
    into v_fixture_count
  from (
    select f.id
    from public.fixtures f
    where v_competition = 'super' and f.season = v_season and f.week = v_week
    union all
    select f.id
    from public.champions_league_fixtures f
    where v_competition = 'champions' and f.season = v_season and f.week = v_week
    union all
    select f.id
    from public.nations_league_fixtures f
    where v_competition = 'nations' and f.season = v_season and f.week = v_week
  ) current_fixtures;

  with launch_activity as (
    select lower(e.player_name) as player_key, max(e.launched_at) as last_launch
    from public.player_launch_events e
    group by lower(e.player_name)
  ),
  eligible_players as (
    select
      p.name,
      p.created_at,
      p.last_seen,
      la.last_launch,
      case
        when p.last_seen is null and la.last_launch is null then null
        else greatest(
          coalesce(p.last_seen, '1970-01-01'::timestamptz),
          coalesce(la.last_launch, '1970-01-01'::timestamptz)
        )
      end as last_activity,
      case
        when lower(trim(p.name)) in ('mertshen', 'mevlüt') then false
        when p.last_seen is null and la.last_launch is null then true
        else greatest(
          coalesce(p.last_seen, '1970-01-01'::timestamptz),
          coalesce(la.last_launch, '1970-01-01'::timestamptz)
        ) < now() - interval '21 days'
      end as inactive_21d
    from public.players p
    left join launch_activity la on la.player_key = lower(p.name)
    where coalesce(p.is_active, true)
      and lower(p.name) <> lower('🤖 SkorBot')
  ),
  prediction_rows as (
    select pr.player_name, pr.fixture_id
    from public.predictions pr
    join public.fixtures f on f.id = pr.fixture_id
    where v_competition = 'super' and f.season = v_season and f.week = v_week
    union all
    select pr.player_name, pr.fixture_id
    from public.champions_league_predictions pr
    join public.champions_league_fixtures f on f.id = pr.fixture_id
    where v_competition = 'champions' and f.season = v_season and f.week = v_week
    union all
    select pr.player_name, pr.fixture_id
    from public.nations_league_predictions pr
    join public.nations_league_fixtures f on f.id = pr.fixture_id
    where v_competition = 'nations' and f.season = v_season and f.week = v_week
  ),
  prediction_counts as (
    select pr.player_name, count(distinct pr.fixture_id)::integer as saved_count
    from prediction_rows pr
    group by pr.player_name
  ),
  today_launches as (
    select
      e.player_name,
      count(*)::integer as launch_count,
      min(e.launched_at) as first_launch,
      max(e.launched_at) as last_launch
    from public.player_launch_events e
    where (e.launched_at at time zone 'Europe/Istanbul')::date = (now() at time zone 'Europe/Istanbul')::date
    group by e.player_name
  ),
  notification_players as (
    select distinct s.player_name
    from public.push_subscriptions s
    where nullif(trim(s.player_name), '') is not null
  ),
  reminder_choices as (
    select distinct on (lower(e.player_name))
      e.player_name,
      e.event_type as response,
      e.occurred_at as response_at
    from public.prediction_reminder_events e
    where e.competition = v_competition
      and e.week = v_week
      and e.event_type in ('yes','later')
    order by lower(e.player_name), e.occurred_at desc, e.id desc
  ),
  reminder_completion as (
    select e.player_name, min(e.occurred_at) as completed_at
    from public.prediction_reminder_events e
    where e.competition = v_competition
      and e.week = v_week
      and e.event_type = 'completed'
    group by e.player_name
  ),
  rows as (
    select
      ep.name as player_name,
      coalesce(pc.saved_count, 0)::integer as saved_count,
      v_fixture_count as fixture_count,
      (v_fixture_count > 0 and coalesce(pc.saved_count, 0) = v_fixture_count) as completed,
      (np.player_name is not null) as notification_enabled,
      coalesce(tl.launch_count, 0)::integer as today_launch_count,
      tl.first_launch as today_first,
      tl.last_launch as today_last,
      rc.response as reminder_response,
      (rcmp.completed_at is not null and (rc.response_at is null or rcmp.completed_at >= rc.response_at)) as reminder_completed,
      ep.created_at,
      ep.last_seen,
      ep.last_activity,
      ep.inactive_21d
    from eligible_players ep
    left join prediction_counts pc on lower(pc.player_name) = lower(ep.name)
    left join today_launches tl on lower(tl.player_name) = lower(ep.name)
    left join notification_players np on lower(np.player_name) = lower(ep.name)
    left join reminder_choices rc on lower(rc.player_name) = lower(ep.name)
    left join reminder_completion rcmp on lower(rcmp.player_name) = lower(ep.name)
  )
  select jsonb_build_object(
    'competition', v_competition,
    'competition_label', v_competition_label,
    'season', v_season,
    'week', v_week,
    'summary', jsonb_build_object(
      'total_registered', count(*),
      'total_players', count(*) filter (where not inactive_21d),
      'inactive_21d', count(*) filter (where inactive_21d),
      'active_today', count(*) filter (where not inactive_21d and today_launch_count > 0),
      'new_today', count(*) filter (where not inactive_21d and (created_at at time zone 'Europe/Istanbul')::date = (now() at time zone 'Europe/Istanbul')::date),
      'completed', count(*) filter (where not inactive_21d and completed),
      'incomplete', count(*) filter (where not inactive_21d and not completed),
      'participation', case
        when count(*) filter (where not inactive_21d) = 0 then 0
        else round(100.0 * count(*) filter (where not inactive_21d and completed) / count(*) filter (where not inactive_21d))
      end,
      'notifications_enabled', count(*) filter (where not inactive_21d and notification_enabled),
      'reminder_yes', count(*) filter (where not inactive_21d and reminder_response = 'yes'),
      'reminder_later', count(*) filter (where not inactive_21d and reminder_response = 'later'),
      'reminder_converted', count(*) filter (where not inactive_21d and reminder_completed)
    ),
    'players', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not inactive_21d), '[]'::jsonb),
    'completed', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not inactive_21d and completed), '[]'::jsonb),
    'incomplete', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not inactive_21d and not completed), '[]'::jsonb),
    'inactive_21d', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by last_activity nulls first, player_name) filter (where inactive_21d), '[]'::jsonb),
    'today', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by today_last desc nulls last, player_name) filter (where not inactive_21d and today_launch_count > 0), '[]'::jsonb),
    'notifications', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not inactive_21d and notification_enabled), '[]'::jsonb),
    'reminder_yes', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not inactive_21d and reminder_response = 'yes'), '[]'::jsonb),
    'reminder_later', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not inactive_21d and reminder_response = 'later'), '[]'::jsonb)
  ) into v_result
  from rows;

  return v_result;
end
$function$;

create or replace function public.get_admin_statistics_dashboard(p_token text)
returns jsonb
language sql
security definer
set search_path to ''
as $function$
with b as (
  select public.get_admin_statistics_dashboard_base(p_token) as j
), completed_ordered as (
  select coalesce(
    jsonb_agg(
      e.elem || jsonb_build_object('completed_at', c.completed_at)
      order by c.completed_at desc nulls last, e.elem->>'player_name'
    ),
    '[]'::jsonb
  ) as items
  from b
  cross join lateral jsonb_array_elements(b.j->'completed') e(elem)
  left join lateral (
    select max(saved.completed_at) as completed_at
    from (
      select pr.created_at as completed_at
      from public.predictions pr
      join public.fixtures f on f.id = pr.fixture_id
      where b.j->>'competition' = 'super'
        and lower(pr.player_name) = lower(e.elem->>'player_name')
        and f.season = b.j->>'season'
        and f.week = (b.j->>'week')::integer
      union all
      select pr.updated_at
      from public.champions_league_predictions pr
      join public.champions_league_fixtures f on f.id = pr.fixture_id
      where b.j->>'competition' = 'champions'
        and lower(pr.player_name) = lower(e.elem->>'player_name')
        and f.season = b.j->>'season'
        and f.week = (b.j->>'week')::integer
      union all
      select pr.updated_at
      from public.nations_league_predictions pr
      join public.nations_league_fixtures f on f.id = pr.fixture_id
      where b.j->>'competition' = 'nations'
        and lower(pr.player_name) = lower(e.elem->>'player_name')
        and f.season = b.j->>'season'
        and f.week = (b.j->>'week')::integer
    ) saved
  ) c on true
), bot as (
  select count(*)::integer as n
  from public.players p
  where coalesce(p.is_active, true)
    and lower(p.name) = lower('🤖 SkorBot')
), enriched as (
  select jsonb_set(
    jsonb_set(b.j, '{completed}', completed_ordered.items, true),
    '{summary,total_registered}',
    to_jsonb(coalesce((b.j#>>'{summary,total_registered}')::integer, 0) + bot.n),
    true
  ) as j
  from b, completed_ordered, bot
)
select j from enriched;
$function$;

revoke all on function public.get_admin_statistics_dashboard(text) from public, authenticated;
grant execute on function public.get_admin_statistics_dashboard(text) to anon;
