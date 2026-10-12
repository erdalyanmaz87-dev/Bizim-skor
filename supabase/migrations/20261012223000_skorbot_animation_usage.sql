-- SkorBot animation plays, from installation onward. Never infer earlier usage.
create table if not exists public.skorbot_animation_plays (
 id bigint generated always as identity primary key,
 player_name text not null references public.players(name) on update cascade,
 played_at timestamptz not null default now()
);
create index if not exists skorbot_animation_plays_player_idx on public.skorbot_animation_plays(player_name,played_at desc);
alter table public.skorbot_animation_plays enable row level security;
revoke all on public.skorbot_animation_plays from public,anon,authenticated;
grant select,insert on public.skorbot_animation_plays to service_role;

create or replace function public.record_skorbot_animation_play(p_token text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_player text;
begin
 v_player := public.friend_session_player(p_token);
 if v_player is null then return false; end if;
 insert into public.skorbot_animation_plays(player_name) values (v_player);
 return true;
end $$;
revoke all on function public.record_skorbot_animation_play(text) from public,authenticated;
grant execute on function public.record_skorbot_animation_play(text) to anon;

create or replace function public.get_admin_skorbot_animation_stats(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
 if not public.is_support_admin(p_token) then raise exception 'Yetkisiz işlem'; end if;
 select jsonb_build_object(
  'total_plays',count(*),
  'unique_players',count(distinct lower(player_name)),
  'players',coalesce((
    select jsonb_agg(jsonb_build_object('player_name',player_name,'play_count',play_count,'last_played',last_played) order by play_count desc,last_played desc)
    from (select player_name,count(*) as play_count,max(played_at) as last_played from public.skorbot_animation_plays group by player_name) grouped
  ),'[]'::jsonb)
 ) into v_result from public.skorbot_animation_plays;
 return v_result;
end $$;
revoke all on function public.get_admin_skorbot_animation_stats(text) from public,authenticated;
grant execute on function public.get_admin_skorbot_animation_stats(text) to anon;
