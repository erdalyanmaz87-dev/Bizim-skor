alter table public.skorbot_animation_plays
 add column if not exists competition text,
 add column if not exists season text,
 add column if not exists week integer,
 add column if not exists fixture_id bigint;
create index if not exists skorbot_animation_plays_week_scope_idx on public.skorbot_animation_plays(competition,season,week);

create or replace function public.record_skorbot_animation_play(p_token text,p_competition text,p_fixture_id bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_player text; v_season text; v_week integer;
begin
 v_player:=public.friend_session_player(p_token);
 if v_player is null then return false; end if;
 select f.season,f.week into v_season,v_week from (
  select 'super'::text competition,id,season,week from public.fixtures
  union all select 'champions',id,season,week from public.champions_league_fixtures
  union all select 'nations',id,season,week from public.nations_league_fixtures
 ) f where f.competition=p_competition and f.id=p_fixture_id;
 if v_week is null then return false; end if;
 insert into public.skorbot_animation_plays(player_name,competition,season,week,fixture_id)
 values(v_player,p_competition,v_season,v_week,p_fixture_id);
 return true;
end $$;
revoke all on function public.record_skorbot_animation_play(text,text,bigint) from public;
grant execute on function public.record_skorbot_animation_play(text,text,bigint) to anon,authenticated;

create or replace function public.get_admin_skorbot_animation_stats(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_context jsonb; v_result jsonb;
begin
 if not public.is_support_admin(p_token) then raise exception 'Yetkisiz işlem'; end if;
 v_context:=public.get_admin_statistics_dashboard_base(p_token);
 with eligible as (
  select player_name,played_at from public.skorbot_animation_plays
  where competition=v_context->>'competition'
   and season=v_context->>'season'
   and week=(v_context->>'week')::integer
 ), grouped as (
  select lower(trim(player_name)) as player_key,min(player_name) as player_name,count(*) as play_count,max(played_at) as last_played
  from eligible group by lower(trim(player_name))
 )
 select jsonb_build_object(
  'competition',v_context->>'competition','competition_label',v_context->>'competition_label',
  'season',v_context->>'season','week',v_context->'week',
  'total_plays',coalesce(sum(play_count),0),'unique_players',count(*),
  'players',coalesce(jsonb_agg(jsonb_build_object('player_name',player_name,'play_count',play_count,'last_played',last_played) order by play_count desc,last_played desc),'[]'::jsonb)
 ) into v_result from grouped;
 return v_result;
end $$;

