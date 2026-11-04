-- PREVIEW ONLY: do not execute against production before release approval.
-- Additive hardening. No player, prediction, score, league or cup is deleted.
begin;
create schema if not exists security_private;
revoke all on schema security_private from public, anon, authenticated;
create table if not exists security_private.pin_attempts (
 account_key text primary key,
 window_start timestamptz not null default now(),
 attempts integer not null default 0 check (attempts>=0)
);
alter table security_private.pin_attempts enable row level security;
revoke all on security_private.pin_attempts from public,anon,authenticated;

-- All PIN-checking entrypoints share this account bucket. Device changes and
-- calls to session/profile/link endpoints cannot reset or bypass the bucket.
-- Failures RETURN, rather than RAISE, to commit the failure counter.
create or replace function security_private.verify_pin(p_name text,p_pin text)
returns text language plpgsql security definer set search_path='' as $$
declare k text; normalized text; v_id bigint; v_name text; v_hash text; v_attempts integer;
begin
 if p_name is null or length(p_name)>100 then return null; end if;
 normalized:=lower(trim(p_name));
 if (select count(*) from public.players where lower(name)=normalized and is_active)=1 then
  select id into v_id from public.players where lower(name)=normalized and is_active;
 end if;
 -- Existing accounts use a stable id, so renaming cannot reset a bucket or
 -- change the serialization key while recovery is in progress.
 k:=case when v_id is null then 'name:'||normalized else 'player:'||v_id::text end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pin:'||k,0));
 insert into security_private.pin_attempts(account_key) values(k) on conflict do nothing;
 update security_private.pin_attempts set attempts=0,window_start=now()
  where account_key=k and window_start<=now()-interval '15 minutes';
 select attempts into v_attempts from security_private.pin_attempts where account_key=k;
 if v_attempts>=5 then return null; end if;
 if p_pin ~ '^[0-9]{4}$' and v_id is not null then
  select name,pin_hash into v_name,v_hash from public.players
   where id=v_id and lower(name)=normalized and is_active for update;
  if v_hash is not null and v_hash=extensions.crypt(p_pin,v_hash) then
   delete from security_private.pin_attempts where account_key=k;
   return v_name;
  end if;
 end if;
 update security_private.pin_attempts set attempts=attempts+1 where account_key=k;
 return null;
end $$;
revoke all on function security_private.verify_pin(text,text) from public,anon,authenticated;

create or replace function public.verify_player_pin(p_name text,p_pin text,p_device_id text default null)
returns text language plpgsql security definer set search_path='' as $$
declare n text;
begin
 n:=security_private.verify_pin(p_name,p_pin);
 if n is null then return null; end if;
 update public.players set device_id=coalesce(device_id,nullif(trim(p_device_id),'')),last_seen=now() where name=n;
 return n;
end $$;

create or replace function public.create_friend_league_session(p_name text,p_pin text,p_device_id text)
returns text language plpgsql security definer set search_path='' as $$
declare n text; t text;
begin
 if coalesce(trim(p_device_id),'')='' or length(p_device_id)>200 then return null; end if;
 n:=security_private.verify_pin(p_name,p_pin);
 if n is null then return null; end if;
 t:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.friend_league_sessions(token_hash,player_name,expires_at)
 values(extensions.digest(t,'sha256'),n,now()+interval '30 days');
 update public.players set device_id=coalesce(device_id,p_device_id),last_seen=now(),force_pin_once=false where name=n;
 return t;
end $$;

-- Keep signatures for installed clients, but remove the unauthenticated writes.
create or replace function public.claim_or_set_player_pin(p_name text,p_pin text,p_device_id text default null)
returns text language sql security definer set search_path='' as $$select null::text$$;
create or replace function public.reset_player_pin_from_registered_device(p_name text,p_device_id text,p_new_pin text)
returns boolean language sql security definer set search_path='' as $$select false$$;

-- Uniform preflight response: neither existence nor PIN state is disclosed.
create or replace function public.find_player_login_state(p_name text)
returns table(name text,has_pin boolean) language sql security definer set search_path='' as $$
 select left(trim(p_name),100),true where p_name is not null and length(trim(p_name)) between 1 and 100
$$;
create or replace function public.get_player_login_state(p_name text)
returns table(canonical_name text,has_pin boolean) language sql security definer set search_path='' as $$
 select * from public.find_player_login_state(p_name)
$$;

-- Anonymous callers receive no directory. Verified email accounts can read
-- display names only. Existing game-token directory remains available.
create or replace function public.list_player_directory()
returns table(name text,is_active boolean) language sql security definer set search_path='' as $$
 select p.name,p.is_active from public.players p
 where p.name not like '%@%' and exists(
  select 1 from mobile_private.player_accounts a join auth.users u on u.id=a.auth_user_id
  join public.players owner on owner.id=a.player_id
  where u.id=auth.uid() and u.email_confirmed_at is not null and u.email is not null
    and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now()) and owner.is_active)
 order by p.name
$$;

-- The old profile and linking implementations retain all game-specific updates;
-- the public wrappers enforce the shared PIN policy before reaching them.
do $$begin
 if to_regprocedure('security_private.update_player_profile_legacy(text,text,text,text,text)') is null then
  alter function public.update_player_profile(text,text,text,text,text) set schema security_private;
  alter function security_private.update_player_profile(text,text,text,text,text) rename to update_player_profile_legacy;
 end if;
 if to_regprocedure('security_private.mobile_link_player_legacy(text,text,text,text)') is null then
  alter function public.mobile_link_player(text,text,text,text) set schema security_private;
  alter function security_private.mobile_link_player(text,text,text,text) rename to mobile_link_player_legacy;
 end if;
end $$;
revoke all on function security_private.update_player_profile_legacy(text,text,text,text,text) from public,anon,authenticated;
revoke all on function security_private.mobile_link_player_legacy(text,text,text,text) from public,anon,authenticated;

create or replace function public.update_player_profile(p_name text,p_current_pin text,p_new_name text,p_new_pin text default null,p_device_id text default null)
returns text language plpgsql security definer set search_path='' as $$
declare n text;
begin
 if p_new_name is null or length(trim(p_new_name)) not between 2 and 100 or position('@' in p_new_name)>0 then
  raise exception 'Oyuncu adı 2–100 karakter olmalı ve e-posta adresi içermemelidir';
 end if;
 n:=security_private.verify_pin(p_name,p_current_pin);
 if n is null then return null; end if;
 return security_private.update_player_profile_legacy(n,p_current_pin,p_new_name,p_new_pin,p_device_id);
end $$;

create or replace function public.mobile_link_player(p_name text,p_legacy_token text default null,p_pin text default null,p_device_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid; token_valid boolean;
begin
 uid:=mobile_private.verified_uid();
 select exists(select 1 from public.friend_league_sessions s join public.players p on p.name=s.player_name
  where s.token_hash=extensions.digest(p_legacy_token,'sha256') and s.expires_at>now()
    and lower(s.player_name)=lower(trim(p_name)) and p.is_active) into token_valid;
 if not token_valid and security_private.verify_pin(p_name,p_pin) is null then
  return jsonb_build_object('error','invalid_player_credentials');
 end if;
 return security_private.mobile_link_player_legacy(p_name,p_legacy_token,p_pin,p_device_id);
end $$;

create or replace function public.reset_player_pin_with_email(p_new_pin text)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid; pid bigint; n text;
begin
 uid:=mobile_private.verified_uid();
 if p_new_pin is null or p_new_pin !~ '^[0-9]{4}$' then raise exception 'PIN 4 haneli olmalıdır'; end if;
 select p.id,p.name into pid,n from mobile_private.player_accounts a join public.players p on p.id=a.player_id
  where a.auth_user_id=uid and p.is_active;
 if pid is null then return false; end if;
 -- Match the PIN issuer's advisory -> player row lock order. An old-PIN
 -- session must either commit before this revocation or fail after it.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pin:player:'||pid::text,0));
 select name into n from public.players where id=pid and is_active for update;
 if not found then return false; end if;
 update public.players set pin_hash=extensions.crypt(p_new_pin,extensions.gen_salt('bf')),force_pin_once=false where id=pid;
 delete from public.friend_league_sessions where player_name=n;
 delete from security_private.pin_attempts where account_key='player:'||pid::text;
 return true;
end $$;
revoke all on function public.reset_player_pin_with_email(text) from public,anon,authenticated;
grant execute on function public.reset_player_pin_with_email(text) to authenticated;

create or replace function security_private.validate_display_name()
returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and new.name is not distinct from old.name then return new; end if;
 if new.name is null or length(trim(new.name)) not between 2 and 100 or position('@' in new.name)>0 then
  raise exception 'Oyuncu adı 2–100 karakter olmalı ve e-posta adresi içermemelidir';
 end if;
 return new;
end $$;
drop trigger if exists security_display_name on public.players;
create trigger security_display_name before insert or update of name on public.players
 for each row execute function security_private.validate_display_name();
revoke all on function security_private.validate_display_name() from public,anon,authenticated;

revoke all on function public.verify_player_pin(text,text,text),public.create_friend_league_session(text,text,text),
 public.claim_or_set_player_pin(text,text,text),public.reset_player_pin_from_registered_device(text,text,text),
 public.find_player_login_state(text),public.get_player_login_state(text),public.list_player_directory(),
 public.update_player_profile(text,text,text,text,text),public.mobile_link_player(text,text,text,text) from public,anon,authenticated;
grant execute on function public.verify_player_pin(text,text,text),public.create_friend_league_session(text,text,text),
 public.claim_or_set_player_pin(text,text,text),public.reset_player_pin_from_registered_device(text,text,text),
 public.find_player_login_state(text),public.get_player_login_state(text),public.list_player_directory(),
 public.update_player_profile(text,text,text,text,text) to anon,authenticated;
grant execute on function public.mobile_link_player(text,text,text,text) to authenticated;
grant execute on function public.verify_player_pin(text,text,text),public.create_friend_league_session(text,text,text),
 public.claim_or_set_player_pin(text,text,text),public.reset_player_pin_from_registered_device(text,text,text),
 public.find_player_login_state(text),public.get_player_login_state(text),public.list_player_directory(),
 public.update_player_profile(text,text,text,text,text),public.mobile_link_player(text,text,text,text),
 public.reset_player_pin_with_email(text) to service_role;
commit;
