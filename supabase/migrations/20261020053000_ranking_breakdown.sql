-- Read-only category counts. Historical points, ranks and tiebreakers are untouched.
create or replace function public.get_scoring_breakdown(
 p_competition text, p_season text default '2026/27', p_week integer default null,
 p_friend_league_id uuid default null, p_token text default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_prefix text; v_player text; v_new boolean; v_rows jsonb;
begin
 v_prefix := case p_competition when 'super_lig' then '' when 'champions_league' then 'champions_league_' when 'nations_league' then 'nations_league_' else null end;
 if v_prefix is null then raise exception 'Geçersiz turnuva'; end if;
 if p_friend_league_id is not null then
  if p_competition <> 'super_lig' then raise exception 'Geçersiz arkadaş ligi turnuvası'; end if;
  v_player := public.friend_session_player(p_token);
  if v_player is null or not exists(select 1 from public.friend_league_members m where m.league_id=p_friend_league_id and m.player_name=v_player) then
   raise exception 'Bu ligi görme yetkin yok';
  end if;
 end if;
 execute format('select exists(select 1 from public.%I f where f.season=$1 and ($2 is null or f.week=$2) and f.scoring_version=2)',v_prefix||'fixtures') into v_new using p_season,p_week;
 execute format($query$
  with scored as (
   select p.player_name,public.prediction_base_points_v2(p.home_score::integer,p.away_score::integer,r.home_score::integer,r.away_score::integer) base
   from public.%I f join public.%I p on p.fixture_id=f.id join public.%I r on r.fixture_id=f.id
   where f.season=$1 and ($2 is null or f.week=$2) and f.scoring_version=2
    and f.kickoff<=now() and r.home_score is not null and r.away_score is not null
    and ($3 is null or exists(select 1 from public.friend_league_members m where m.league_id=$3 and m.player_name=p.player_name and f.week>=m.score_start_week))
  ), counts as (
   select player_name,count(*) filter(where base=10) exact_hits,count(*) filter(where base=6) difference_hits,
    count(*) filter(where base=4) total_hits,count(*) filter(where base=2) result_hits
   from scored group by player_name
  ) select coalesce(jsonb_agg(to_jsonb(c) order by player_name),'[]'::jsonb) from counts c
 $query$,v_prefix||'fixtures',v_prefix||'predictions',v_prefix||'results') into v_rows using p_season,p_week,p_friend_league_id;
 return jsonb_build_object('has_new_scoring',v_new,'players',v_rows);
end $$;
revoke all on function public.get_scoring_breakdown(text,text,integer,uuid,text) from public;
grant execute on function public.get_scoring_breakdown(text,text,integer,uuid,text) to anon,authenticated;
comment on function public.get_scoring_breakdown(text,text,integer,uuid,text) is 'Public scored-match category aggregates only; private friend leagues require a valid member session. Does not expose future predictions or alter scores.';
