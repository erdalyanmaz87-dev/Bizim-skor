create or replace function public.get_admin_statistics_dashboard(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_season text;
  v_week integer;
  v_fixture_count integer;
  v_result jsonb;
begin
  if not public.is_support_admin(p_token) then
    raise exception 'Yetkisiz işlem';
  end if;

  select f.season, f.week
    into v_season, v_week
  from public.fixtures f
  where f.kickoff > now()
  order by f.kickoff
  limit 1;

  if v_week is null then
    select f.season, f.week
      into v_season, v_week
    from public.fixtures f
    order by f.kickoff desc
    limit 1;
  end if;

  select count(distinct f.id)::integer
    into v_fixture_count
  from public.fixtures f
  where f.season = v_season
    and f.week = v_week;

  with active_players as (
    select p.name, p.created_at, p.last_seen
    from public.players p
    where coalesce(p.is_active, true)
  ),
  current_fixtures as (
    select f.id
    from public.fixtures f
    where f.season = v_season and f.week = v_week
  ),
  prediction_counts as (
    select pr.player_name, count(distinct pr.fixture_id)::integer as saved_count
    from public.predictions pr
    join current_fixtures cf on cf.id = pr.fixture_id
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
    where e.competition = 'super'
      and e.week = v_week
      and e.event_type in ('yes','later')
    order by lower(e.player_name), e.occurred_at desc, e.id desc
  ),
  reminder_completion as (
    select
      e.player_name,
      min(e.occurred_at) as completed_at
    from public.prediction_reminder_events e
    where e.competition = 'super'
      and e.week = v_week
      and e.event_type = 'completed'
    group by e.player_name
  ),
  rows as (
    select
      ap.name as player_name,
      coalesce(pc.saved_count, 0)::integer as saved_count,
      v_fixture_count as fixture_count,
      (v_fixture_count > 0 and coalesce(pc.saved_count, 0) = v_fixture_count) as completed,
      (np.player_name is not null) as notification_enabled,
      coalesce(tl.launch_count, 0)::integer as today_launch_count,
      tl.first_launch as today_first,
      tl.last_launch as today_last,
      rc.response as reminder_response,
      (rcmp.completed_at is not null and (rc.response_at is null or rcmp.completed_at >= rc.response_at)) as reminder_completed,
      ap.created_at,
      ap.last_seen
    from active_players ap
    left join prediction_counts pc on lower(pc.player_name) = lower(ap.name)
    left join today_launches tl on lower(tl.player_name) = lower(ap.name)
    left join notification_players np on lower(np.player_name) = lower(ap.name)
    left join reminder_choices rc on lower(rc.player_name) = lower(ap.name)
    left join reminder_completion rcmp on lower(rcmp.player_name) = lower(ap.name)
  )
  select jsonb_build_object(
    'season', v_season,
    'week', v_week,
    'summary', jsonb_build_object(
      'total_players', count(*),
      'active_today', count(*) filter (where today_launch_count > 0),
      'new_today', count(*) filter (where (created_at at time zone 'Europe/Istanbul')::date = (now() at time zone 'Europe/Istanbul')::date),
      'completed', count(*) filter (where completed),
      'incomplete', count(*) filter (where not completed),
      'participation', case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where completed) / count(*)) end,
      'notifications_enabled', count(*) filter (where notification_enabled),
      'reminder_yes', count(*) filter (where reminder_response = 'yes'),
      'reminder_later', count(*) filter (where reminder_response = 'later'),
      'reminder_converted', count(*) filter (where reminder_completed)
    ),
    'players', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name), '[]'::jsonb),
    'completed', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where completed), '[]'::jsonb),
    'incomplete', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where not completed), '[]'::jsonb),
    'today', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by today_last desc nulls last, player_name) filter (where today_launch_count > 0), '[]'::jsonb),
    'notifications', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where notification_enabled), '[]'::jsonb),
    'reminder_yes', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where reminder_response = 'yes'), '[]'::jsonb),
    'reminder_later', coalesce(jsonb_agg(to_jsonb(rows) - 'created_at' - 'last_seen' order by player_name) filter (where reminder_response = 'later'), '[]'::jsonb)
  ) into v_result
  from rows;

  return v_result;
end
$$;

revoke all on function public.get_admin_statistics_dashboard(text) from public, authenticated;
grant execute on function public.get_admin_statistics_dashboard(text) to anon;
