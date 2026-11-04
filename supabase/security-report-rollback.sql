-- Emergency rollback only, after restoring the matching frontend.
-- This restores previous behavior, including the reported risks.
begin;
drop trigger if exists security_display_name on public.players;
CREATE OR REPLACE FUNCTION public.claim_or_set_player_pin(p_name text, p_pin text, p_device_id text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_name text;
  v_device_name text;
begin
  if p_pin !~ '^[0-9]{4}$' then raise exception 'PIN 4 haneli olmalıdır'; end if;
  select name into v_name from public.players where is_active=true and lower(name)=lower(trim(p_name)) limit 1;
  if v_name is null then raise exception 'Oyuncu bulunamadı'; end if;
  if p_device_id is not null then
    select name into v_device_name from public.players where is_active=true and device_id=p_device_id order by id limit 1;
    if v_device_name is not null and lower(v_device_name)<>lower(v_name) then
      raise exception 'Bu cihazda daha önce % hesabıyla giriş yapılmıştır. Aynı cihazdan farklı hesap kullanılamaz.', v_device_name;
    end if;
  end if;
  if exists(select 1 from public.players where name=v_name and pin_hash is not null) then raise exception 'PIN zaten oluşturulmuş'; end if;
  update public.players set pin_hash=crypt(p_pin,gen_salt('bf')), device_id=coalesce(p_device_id,device_id), last_seen=now() where name=v_name;
  return v_name;
end
$function$;
CREATE OR REPLACE FUNCTION public.create_friend_league_session(p_name text, p_pin text, p_device_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_name text;
  v_token text;
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' or coalesce(trim(p_device_id),'')='' then
    raise exception 'Oyuncu doğrulanamadı';
  end if;
  select name into v_name from public.players
   where is_active=true and lower(name)=lower(trim(p_name))
     and pin_hash is not null and pin_hash=crypt(p_pin,pin_hash)
   limit 1;
  if v_name is null then raise exception 'Oyuncu adı veya PIN yanlış'; end if;
  delete from public.friend_league_sessions where expires_at<=now();
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.friend_league_sessions(token_hash,player_name,expires_at)
  values(digest(v_token,'sha256'),v_name,now()+interval '30 days');
  return v_token;
end;
$function$;
CREATE OR REPLACE FUNCTION public.find_player_login_state(p_name text)
 RETURNS TABLE(name text, has_pin boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select p.name,(p.pin_hash is not null) from public.players p
  where p.is_active=true
    and lower(trim(regexp_replace(p.name,'\s+',' ','g')))=lower(trim(regexp_replace(p_name,'\s+',' ','g')))
  limit 1
$function$;
CREATE OR REPLACE FUNCTION public.get_player_login_state(p_name text)
 RETURNS TABLE(canonical_name text, has_pin boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select name, pin_hash is not null
  from public.players
  where is_active=true and lower(name)=lower(trim(p_name))
  limit 1;
$function$;
CREATE OR REPLACE FUNCTION public.list_player_directory()
 RETURNS TABLE(name text, is_active boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select p.name,p.is_active from public.players p order by p.name collate "tr-x-icu"
$function$;
CREATE OR REPLACE FUNCTION public.mobile_link_player(p_name text, p_legacy_token text DEFAULT NULL::text, p_pin text DEFAULT NULL::text, p_device_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := mobile_private.verified_uid(); v_player public.players%rowtype;
  v_current bigint; v_valid boolean := false; v_rate boolean;
begin
  if p_name is null or char_length(p_name)>100 or char_length(coalesce(p_legacy_token,''))>256
     or char_length(coalesce(p_device_id,''))>200 then raise exception 'Invalid input'; end if;
  -- Use stable uid and name hash for limits, and RETURN rather than RAISE for
  -- invalid credentials so denied attempts are committed by the RPC transaction.
  v_rate := mobile_private.take_limit(encode(extensions.digest('link:uid:'||v_uid::text,'sha256'),'hex'),10);
  if not v_rate then return jsonb_build_object('error','rate_limited'); end if;
  if not mobile_private.take_limit(encode(extensions.digest('link:name:'||lower(trim(p_name)),'sha256'),'hex'),10) then v_rate:=false; end if;
  if not v_rate then return jsonb_build_object('error','rate_limited'); end if;
  select player_id into v_current from mobile_private.player_accounts where auth_user_id=v_uid;
  if v_current is not null then
    return jsonb_build_object('error','account_already_linked');
  end if;
  if (select count(*) from public.players where lower(name)=lower(trim(p_name)))<>1 then
    return jsonb_build_object('error','invalid_player_credentials');
  end if;
  select * into v_player from public.players where lower(name)=lower(trim(p_name)) for update;
  if not coalesce(v_player.is_active,false) then return jsonb_build_object('error','invalid_player_credentials'); end if;
  if p_legacy_token is not null then
    select exists(select 1 from public.friend_league_sessions
      where token_hash=extensions.digest(p_legacy_token,'sha256')
        and expires_at>now() and player_name=v_player.name) into v_valid;
  end if;
  if not v_valid and p_pin ~ '^[0-9]{4}$' and v_player.pin_hash is not null then
    v_valid := v_player.pin_hash=extensions.crypt(p_pin,v_player.pin_hash);
  end if;
  if not coalesce(v_valid,false) then return jsonb_build_object('error','invalid_player_credentials'); end if;
  -- Unique constraints prevent two accounts claiming the same stable player id.
  insert into mobile_private.player_accounts(auth_user_id,player_id) values(v_uid,v_player.id)
    on conflict do nothing;
  if not found then return jsonb_build_object('error','account_already_linked'); end if;
  return jsonb_build_object('player_id',v_player.id,'player_name',v_player.name);
end; $function$;

CREATE OR REPLACE FUNCTION public.reset_player_pin_from_registered_device(p_name text, p_device_id text, p_new_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_player public.players%rowtype;
  v_device_hash text;
  v_failed_count integer;
begin
  if p_device_id is null or length(p_device_id)<20 then return false; end if;
  if p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN yalnızca 4 rakamdan oluşmalıdır';
  end if;

  v_device_hash:=encode(digest(p_device_id,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_device_hash,0));

  delete from public.pin_reset_attempts
   where attempted_at<now()-interval '1 day';

  select count(*) into v_failed_count
    from public.pin_reset_attempts
   where device_hash=v_device_hash
     and not succeeded
     and attempted_at>now()-interval '15 minutes';

  if v_failed_count>=5 then
    raise exception 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.';
  end if;

  select p.* into v_player
    from public.players p
   where p.is_active=true
     and lower(trim(regexp_replace(p.name,'\s+',' ','g')))=lower(trim(regexp_replace(p_name,'\s+',' ','g')))
     and p.device_id=p_device_id
   limit 1
   for update;

  if not found then
    insert into public.pin_reset_attempts(device_hash,succeeded)
    values(v_device_hash,false);
    return false;
  end if;

  update public.players
     set pin_hash=crypt(p_new_pin,gen_salt('bf')),
         force_pin_once=false
   where id=v_player.id;

  delete from public.friend_league_sessions
   where player_name=v_player.name;

  insert into public.pin_reset_attempts(device_hash,succeeded)
  values(v_device_hash,true);

  return true;
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_player_profile(p_name text, p_current_pin text, p_new_name text, p_new_pin text DEFAULT NULL::text, p_device_id text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_old_name text;
  v_new_name text := trim(regexp_replace(p_new_name,'\s+',' ','g'));
  v_device_id text;
  v_pin_hash text;
begin
  select name,device_id,pin_hash into v_old_name,v_device_id,v_pin_hash
  from public.players where is_active=true and lower(name)=lower(trim(p_name)) limit 1;
  if v_old_name is null then raise exception 'Oyuncu bulunamadı'; end if;
  if p_device_id is null or v_device_id is distinct from p_device_id then
    raise exception 'Bu işlem yalnızca hesabın kayıtlı olduğu cihazdan yapılabilir';
  end if;
  if v_pin_hash is not null and (p_current_pin is null or v_pin_hash<>crypt(p_current_pin,v_pin_hash)) then
    raise exception 'Mevcut PIN hatalı';
  end if;
  if length(v_new_name)<2 then raise exception 'Oyuncu adı çok kısa'; end if;
  if coalesce(p_new_pin,'')<>'' and p_new_pin !~ '^[0-9]{4}$' then raise exception 'Yeni PIN 4 haneli olmalıdır'; end if;
  if exists(select 1 from public.players where is_active=true and id<>(select id from public.players where name=v_old_name limit 1) and lower(name)=lower(v_new_name)) then
    raise exception 'Bu oyuncu adı zaten kullanılıyor';
  end if;

  if v_new_name<>v_old_name then
    if exists(
      select 1 from public.friend_league_members old_membership
      join public.friend_league_members new_membership
        on new_membership.league_id=old_membership.league_id
       and new_membership.player_name=v_new_name
      where old_membership.player_name=v_old_name
    ) then raise exception 'Yeni ad bu arkadaş liglerinden birinde zaten kullanılıyor'; end if;
    update public.predictions set player_name=v_new_name where player_name=v_old_name;
    update public.chat_messages set player_name=v_new_name where player_name=v_old_name;
    update public.push_subscriptions set player_name=v_new_name where player_name=v_old_name;
    update public.friend_leagues set owner_name=v_new_name where owner_name=v_old_name;
    update public.friend_league_members set player_name=v_new_name where player_name=v_old_name;
    update public.friend_league_sessions set player_name=v_new_name where player_name=v_old_name;
  end if;

  update public.players
  set name=v_new_name,
      pin_hash=case when coalesce(p_new_pin,'')='' then pin_hash else crypt(p_new_pin,gen_salt('bf')) end,
      last_seen=now()
  where name=v_old_name and is_active=true;
  return v_new_name;
end
$function$;
CREATE OR REPLACE FUNCTION public.verify_player_pin(p_name text, p_pin text, p_device_id text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_name text;
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then return null; end if;
  select name into v_name from public.players
   where is_active=true and lower(name)=lower(trim(p_name))
     and pin_hash is not null and pin_hash=crypt(p_pin,pin_hash)
   limit 1;
  if v_name is null then return null; end if;
  update public.players
     set device_id=coalesce(device_id,nullif(trim(p_device_id),'')),last_seen=now()
   where name=v_name;
  return v_name;
end;
$function$;
revoke all on function public.reset_player_pin_with_email(text) from public,anon,authenticated;
grant execute on function public.claim_or_set_player_pin(text,text,text) to anon,authenticated,service_role;
grant execute on function public.create_friend_league_session(text,text,text) to anon,authenticated,service_role;
grant execute on function public.find_player_login_state(text) to anon,authenticated,service_role;
grant execute on function public.get_player_login_state(text) to anon,authenticated,service_role;
grant execute on function public.list_player_directory() to anon,authenticated,service_role;
grant execute on function public.mobile_link_player(text,text,text,text) to authenticated,service_role;
grant execute on function public.reset_player_pin_from_registered_device(text,text,text) to anon,authenticated,service_role;
grant execute on function public.update_player_profile(text,text,text,text,text) to anon,authenticated,service_role;
grant execute on function public.verify_player_pin(text,text,text) to anon,authenticated,service_role;
grant execute on function public.claim_or_set_player_pin(text,text,text),public.get_player_login_state(text) to public;
commit;
