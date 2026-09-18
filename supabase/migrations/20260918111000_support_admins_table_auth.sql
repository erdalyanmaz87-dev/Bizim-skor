-- Admin authorization is table-backed so Erdal and İpek share the same permissions.
insert into public.support_admins(player_id)
select p.id from public.players p
where lower(p.name) in (lower('Erdal'),lower('İpek'))
on conflict (player_id) do nothing;

create or replace function public.is_support_admin(p_token text)
returns boolean
language sql
security definer
set search_path to 'public','pg_temp'
as $function$
  select exists(
    select 1
    from public.support_admins sa
    join public.players p on p.id=sa.player_id
    where lower(p.name)=lower(coalesce(public.friend_session_player(p_token),''))
      and coalesce(p.is_active,true)
  )
$function$;
