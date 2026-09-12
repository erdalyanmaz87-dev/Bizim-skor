create or replace function public.get_admin_statistics_dashboard(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_season text;
  v_week integer;
  v_count integer;
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

  select count(distinct f.id)
    into v_count
  from public.fixtures f
  where f.season = v_season
    and f.week = v_week;

  with b as (
    select
      p.name,
      p.last_seen,
      p.created_at,
      count(distinct pr.fixture_id) filter (
        where fx.season = v_season and fx.week = v_week
      )::integer as saved
    from public.players p
    left join public.predictions pr
      on lower(pr.player_name) = lower(p.name)
    left join public.fixtures fx
      on fx.id = pr.fixture_id
    where coalesce(p.is_active, true)
    group by p.name, p.last_seen, p.created_at
  ),
  r as (
    select
      player_name,
      bool_or(event_type = 'yes') as yes,
      bool_or(event_type = 'later') as later,
      bool_or(event_type = 'completed') as completed
    from public.prediction_reminder_events
    where competition = 'super'
      and week = v_week
    group by player_name
  ),
  j as (
    select
      b.*,
      coalesce(r.yes, false) as yes,
      coalesce(r.later, false) as later,
      coalesce(r.completed, false) as converted
    from b
    left join r on lower(r.player_name) = lower(b.name)
  )
  select jsonb_build_object(
    'season', v_season,
    'week', v_week,
    'summary', jsonb_build_object(
      'active_today', count(*) filter (
        where (last_seen at time zone 'Europe/Istanbul')::date = (now() at time zone 'Europe/Istanbul')::date
      ),
      'new_today', count(*) filter (
        where (created_at at time zone 'Europe/Istanbul')::date = (now() at time zone 'Europe/Istanbul')::date
      ),
      'completed', count(*) filter (where saved = v_count and v_count > 0),
      'incomplete', count(*) filter (where saved < v_count),
      'participation', case
        when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where saved = v_count and v_count > 0) / count(*))
      end,
      'reminder_yes', count(*) filter (where yes),
      'reminder_later', count(*) filter (where later),
      'reminder_converted', count(*) filter (where converted)
    ),
    'players', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'player_name', name,
          'last_seen_label', to_char(last_seen at time zone 'Europe/Istanbul', 'HH24:MI'),
          'saved_count', saved,
          'fixture_count', v_count
        )
        order by last_seen desc
      ) filter (
        where (last_seen at time zone 'Europe/Istanbul')::date = (now() at time zone 'Europe/Istanbul')::date
          and saved < v_count
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from j;

  return v_result;
end
$$;

revoke all on function public.get_admin_statistics_dashboard(text) from public, authenticated;
grant execute on function public.get_admin_statistics_dashboard(text) to anon;
