-- Additive read APIs: token possession is checked against the existing server session.
create or replace function public.web_player_account_status(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id bigint; v_name text; v_linked boolean;
begin
 if p_token is null or length(p_token)>256 then raise exception 'Oturum geçersiz' using errcode='42501'; end if;
 select p.id into v_id from public.friend_league_sessions s join public.players p on p.name=s.player_name
  where s.token_hash=extensions.digest(p_token,'sha256') and s.expires_at>now() and coalesce(p.is_active,true) limit 1;
 if v_id is null then raise exception 'Oturum geçersiz veya süresi dolmuş' using errcode='42501'; end if;
 select name into v_name from public.players where id=v_id;
 select exists(select 1 from mobile_private.player_accounts a join auth.users u on u.id=a.auth_user_id
  where a.player_id=v_id and u.email_confirmed_at is not null and u.email is not null
  and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now())) into v_linked;
 return jsonb_build_object('player_name',v_name,'linked',v_linked);
end; $$;
revoke all on function public.web_player_account_status(text) from public,anon,authenticated;
grant execute on function public.web_player_account_status(text) to anon,authenticated;

create or replace function public.get_admin_email_upgrade_status(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
 if p_token is null or length(p_token)>256 or not public.is_support_admin(p_token) then
  raise exception 'Yetkisiz işlem' using errcode='42501'; end if;
 select jsonb_build_object('players',coalesce(jsonb_agg(jsonb_build_object(
  'player_name',p.name,'linked',u.id is not null,'linked_at',case when u.id is not null then a.created_at end)
  order by p.name),'[]'::jsonb)) into v_result
 from public.players p left join mobile_private.player_accounts a on a.player_id=p.id
 left join auth.users u on u.id=a.auth_user_id and u.email_confirmed_at is not null and u.email is not null
  and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now())
 where coalesce(p.is_active,true) and lower(p.name)<>'skorbot';
 return v_result;
end; $$;
revoke all on function public.get_admin_email_upgrade_status(text) from public,anon,authenticated;
grant execute on function public.get_admin_email_upgrade_status(text) to anon,authenticated;
