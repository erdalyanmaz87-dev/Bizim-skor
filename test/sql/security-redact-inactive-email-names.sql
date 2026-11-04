-- Only inactive accounts whose display names are email addresses are renamed.
-- Stable player ids, all prediction contents and counts are preserved.
begin;
set local statement_timeout='30s';set local lock_timeout='5s';
do $$
declare r record;c record;new_name text;before_counts jsonb;after_counts jsonb;before_predictions text;after_predictions text;
begin
 select jsonb_build_array((select count(*) from public.players),(select count(*) from public.predictions),(select count(*) from public.champions_league_predictions),(select count(*) from public.nations_league_predictions)) into before_counts;
 select md5(coalesce(jsonb_agg(v order by v::text)::text,'')) into before_predictions from (
  select to_jsonb(t)-'player_name' v from public.predictions t union all select to_jsonb(t)-'player_name' from public.champions_league_predictions t union all select to_jsonb(t)-'player_name' from public.nations_league_predictions t
 ) q;
 for r in select id,name from public.players where not is_active and id in (548,549) and position('@' in name)>0 for update loop
  new_name:='Pasif Oyuncu '||r.id::text;
  if exists(select 1 from public.players where name=new_name) then raise exception 'Display-name collision';end if;
  update public.players set name=new_name where id=r.id;
  -- Explicitly bounded references verified before this change; no JSON mutation.
  update public.predictions set player_name=new_name where player_name=r.name;
  update public.friend_league_sessions set player_name=new_name where player_name=r.name;
  update public.prediction_reminder_events set player_name=new_name where player_name=r.name;
  update public.ranking_current_snapshots set player_name=new_name where player_name=r.name;
  update public.ranking_latest_movements set player_name=new_name where player_name=r.name;
  -- player_launch_events and skorbot_preview_claims have ON UPDATE CASCADE.

 end loop;
 select jsonb_build_array((select count(*) from public.players),(select count(*) from public.predictions),(select count(*) from public.champions_league_predictions),(select count(*) from public.nations_league_predictions)) into after_counts;
 select md5(coalesce(jsonb_agg(v order by v::text)::text,'')) into after_predictions from (
  select to_jsonb(t)-'player_name' v from public.predictions t union all select to_jsonb(t)-'player_name' from public.champions_league_predictions t union all select to_jsonb(t)-'player_name' from public.nations_league_predictions t
 ) q;
 if before_counts is distinct from after_counts or before_predictions is distinct from after_predictions then raise exception 'Record preservation check failed; rolling back';end if;
end $$;
commit;
select jsonb_build_object('email_display_names_remaining',(select count(*) from public.players where position('@' in name)>0),'players',(select count(*) from public.players),'predictions',(select count(*) from public.predictions)+(select count(*) from public.champions_league_predictions)+(select count(*) from public.nations_league_predictions)) result;
