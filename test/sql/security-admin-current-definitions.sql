-- Snapshot of existing authorization implementations, 2026-11-04.
CREATE OR REPLACE FUNCTION public.get_admin_supported_team_summary(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_selected jsonb;
  v_unselected jsonb;
begin
  if not public.is_support_admin(p_token) then
    raise exception 'Yetkisiz işlem';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('player_name',p.name,'supported_team',p.supported_team) order by p.name collate "tr-x-icu"),'[]'::jsonb)
    into v_selected
  from public.players p
  where coalesce(p.is_active,true)
    and p.supported_team is not null;

  select coalesce(jsonb_agg(jsonb_build_object('player_name',p.name,'supported_team',null) order by p.name collate "tr-x-icu"),'[]'::jsonb)
    into v_unselected
  from public.players p
  where coalesce(p.is_active,true)
    and p.supported_team is null;

  return jsonb_build_object(
    'selected_count', jsonb_array_length(v_selected),
    'unselected_count', jsonb_array_length(v_unselected),
    'selected', v_selected,
    'unselected', v_unselected
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.admin_update_live_score(p_token text, p_fixture_id bigint, p_home_score smallint, p_away_score smallint, p_elapsed smallint, p_finished boolean DEFAULT false, p_competition text DEFAULT 'super_lig'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_player text;
  v_old_h smallint;
  v_old_a smallint;
  v_competition text := coalesce(nullif(p_competition,''),'super_lig');
begin
  v_player := public.friend_session_player(p_token);
  if v_player not in ('Erdal', 'İpek')
     or not exists (select 1 from public.players where name=v_player and is_active=true) then
    raise exception 'Yetkisiz işlem';
  end if;
  if v_competition not in ('super_lig','champions_league','nations_league') then
    raise exception 'Geçersiz lig';
  end if;
  if p_home_score not between 0 and 20 or p_away_score not between 0 and 20
     or p_elapsed not between 0 and 130 then
    raise exception 'Geçersiz skor veya dakika';
  end if;
  if (v_competition='super_lig' and not exists(select 1 from public.fixtures where id=p_fixture_id))
     or (v_competition='champions_league' and not exists(select 1 from public.champions_league_fixtures where id=p_fixture_id))
     or (v_competition='nations_league' and not exists(select 1 from public.nations_league_fixtures where id=p_fixture_id)) then
    raise exception 'Maç bulunamadı';
  end if;

  -- The cache has a fixture-link FK. Reserve a negative provider ID for a
  -- manual-only Nations League fixture; disabled links never enter polling.
  if v_competition='nations_league' then
    insert into public.live_fixture_links(competition,fixture_id,provider_fixture_id,enabled)
    values(v_competition,p_fixture_id,-p_fixture_id,false)
    on conflict(competition,fixture_id) do nothing;
  end if;

  insert into public.live_score_cache(
    competition,fixture_id,status,elapsed,home_score,away_score,fetched_at,terminal_seen_count
  ) values(
    v_competition,p_fixture_id,
    case when p_finished then 'FT' when p_elapsed<=45 then '1H' else '2H' end,
    case when p_finished then null else p_elapsed end,
    p_home_score,p_away_score,now(),case when p_finished then 2 else 0 end
  ) on conflict(competition,fixture_id) do update
  set status=excluded.status,elapsed=excluded.elapsed,home_score=excluded.home_score,
      away_score=excluded.away_score,fetched_at=now(),terminal_seen_count=excluded.terminal_seen_count;

  if p_finished then
    if v_competition='super_lig' then
      select home_score::smallint,away_score::smallint into v_old_h,v_old_a
        from public.results where fixture_id=p_fixture_id;
      insert into public.results(fixture_id,home_score,away_score,status,updated_at)
      values(p_fixture_id,p_home_score,p_away_score,'finished',now())
      on conflict(fixture_id) do update set home_score=excluded.home_score,
        away_score=excluded.away_score,status='finished',updated_at=now();
    elsif v_competition='champions_league' then
      select home_score,away_score into v_old_h,v_old_a
        from public.champions_league_results where fixture_id=p_fixture_id;
      insert into public.champions_league_results(fixture_id,home_score,away_score,updated_at)
      values(p_fixture_id,p_home_score,p_away_score,now())
      on conflict(fixture_id) do update set home_score=excluded.home_score,
        away_score=excluded.away_score,updated_at=now();
    else
      select home_score,away_score into v_old_h,v_old_a
        from public.nations_league_results where fixture_id=p_fixture_id;
      insert into public.nations_league_results(fixture_id,home_score,away_score,updated_at)
      values(p_fixture_id,p_home_score,p_away_score,now())
      on conflict(fixture_id) do update set home_score=excluded.home_score,
        away_score=excluded.away_score,updated_at=now();
    end if;
    insert into public.live_score_result_audit(
      competition,fixture_id,source,old_home_score,old_away_score,new_home_score,new_away_score
    ) values(v_competition,p_fixture_id,'manual_override',v_old_h,v_old_a,p_home_score,p_away_score);
  end if;
  return true;
end
$function$;
CREATE OR REPLACE FUNCTION public.admin_schedule_bizimskor_cup(p_token text, p_at timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.bizimskor_cups%rowtype; deadline timestamptz;
begin
 if not cup_private.owner(p_token) then raise exception 'Yetkisiz işlem';end if;
 select * into c from public.bizimskor_cups where id=1 for update;
 if c.status<>'registration' then raise exception 'Çekilmiş kura değiştirilemez.';end if;
 select min(kickoff) into deadline from public.fixtures where season=c.season and week=c.start_week;
 if p_at is null or p_at<=clock_timestamp() or deadline is null or p_at+interval '64 seconds'>=deadline then raise exception 'Kura saatini ilk maçtan önceki bir zamana ayarla.';end if;
 update public.bizimskor_cups set scheduled_at=p_at where id=c.id;
end $function$;

CREATE OR REPLACE FUNCTION public.get_admin_bizimskor_cup(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not cup_private.owner(p_token) then raise exception 'Yetkisiz işlem';end if;
 return jsonb_build_object('viewer_count',(select count(*) from public.bizimskor_cup_viewers where cup_id=1),
 'viewers',coalesce((select jsonb_agg(jsonb_build_object('name',p.name,'first_watched_at',v.first_watched_at,'last_watched_at',v.last_watched_at) order by v.first_watched_at) from public.bizimskor_cup_viewers v join public.players p on p.id=v.player_id where v.cup_id=1),'[]'::jsonb));
end $function$;

CREATE OR REPLACE FUNCTION public.get_admin_statistics_dashboard_base(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
        when lower(trim(p.name)) in ('mertshen', 'mevlüt', 'hafsa') then false
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