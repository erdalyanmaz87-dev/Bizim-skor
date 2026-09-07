drop function if exists public.admin_update_live_score(text,bigint,smallint,smallint,boolean);

create or replace function public.admin_update_live_score(
  p_token text,
  p_fixture_id bigint,
  p_home_score smallint,
  p_away_score smallint,
  p_elapsed smallint,
  p_finished boolean default false,
  p_competition text default 'super_lig'
)
returns boolean
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_player text;
  v_old_h smallint;
  v_old_a smallint;
  v_competition text := coalesce(nullif(p_competition,''),'super_lig');
begin
  v_player := public.friend_session_player(p_token);

  if lower(coalesce(v_player, '')) <> 'erdal'
     or not exists (
       select 1
       from public.players
       where lower(name) = 'erdal'
         and is_active = true
     ) then
    raise exception 'Yetkisiz işlem';
  end if;

  if v_competition not in ('super_lig','champions_league') then
    raise exception 'Geçersiz lig';
  end if;

  if p_home_score < 0 or p_away_score < 0 or p_elapsed < 0 or p_elapsed > 130 then
    raise exception 'Geçersiz skor veya dakika';
  end if;

  if v_competition='super_lig' then
    if not exists (select 1 from public.fixtures where id = p_fixture_id) then
      raise exception 'Maç bulunamadı';
    end if;
  else
    if not exists (select 1 from public.champions_league_fixtures where id = p_fixture_id) then
      raise exception 'Maç bulunamadı';
    end if;
  end if;

  insert into public.live_score_cache(
    competition, fixture_id, status, elapsed, home_score, away_score, fetched_at, terminal_seen_count
  )
  values(
    v_competition,
    p_fixture_id,
    case when p_finished then 'FT' else case when p_elapsed <= 45 then '1H' else '2H' end end,
    case when p_finished then null else p_elapsed end,
    p_home_score,
    p_away_score,
    now(),
    case when p_finished then 2 else 0 end
  )
  on conflict(competition, fixture_id) do update
  set status = excluded.status,
      elapsed = excluded.elapsed,
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      fetched_at = now(),
      terminal_seen_count = excluded.terminal_seen_count;

  if p_finished then
    if v_competition='super_lig' then
      select home_score::smallint, away_score::smallint
        into v_old_h, v_old_a
      from public.results
      where fixture_id = p_fixture_id;

      insert into public.results(fixture_id, home_score, away_score, status, updated_at)
      values(p_fixture_id, p_home_score, p_away_score, 'finished', now())
      on conflict(fixture_id) do update
      set home_score = excluded.home_score,
          away_score = excluded.away_score,
          status = 'finished',
          updated_at = now();
    else
      select home_score, away_score
        into v_old_h, v_old_a
      from public.champions_league_results
      where fixture_id = p_fixture_id;

      insert into public.champions_league_results(fixture_id, home_score, away_score, updated_at)
      values(p_fixture_id, p_home_score, p_away_score, now())
      on conflict(fixture_id) do update
      set home_score = excluded.home_score,
          away_score = excluded.away_score,
          updated_at = now();
    end if;

    insert into public.live_score_result_audit(
      competition, fixture_id, source, old_home_score, old_away_score, new_home_score, new_away_score
    )
    values(
      v_competition, p_fixture_id, 'manual_override', v_old_h, v_old_a, p_home_score, p_away_score
    );
  end if;

  return true;
end
$function$;

grant execute on function public.admin_update_live_score(text,bigint,smallint,smallint,smallint,boolean,text) to anon, authenticated;
notify pgrst, 'reload schema';
