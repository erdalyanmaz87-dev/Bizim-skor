-- Synthetic checks on the existing PostgreSQL functions. No emails or pushes.
-- All rows and side effects roll back. Sequence gaps are normal and not reset.
begin;
set local statement_timeout='30s';
set local lock_timeout='5s';
do $$
declare
 uid uuid:=gen_random_uuid(); pid bigint; n text:='security_'||substr(replace(gen_random_uuid()::text,'-',''),1,12);
 tok text:=encode(extensions.gen_random_bytes(32),'hex'); oldtok text; i int; q text;
begin
 insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,is_anonymous)
 values(uid,'authenticated','authenticated',uid::text||'@example.invalid','',now(),now(),now(),false);
 insert into public.players(name,pin_hash,is_active) values(n,extensions.crypt('2468',extensions.gen_salt('bf')),true) returning id into pid;
 insert into mobile_private.player_accounts(auth_user_id,player_id) values(uid,pid);
 if public.claim_or_set_player_pin(n,'1111','synthetic') is not null then raise exception 'claim allowed';end if;
 if public.reset_player_pin_from_registered_device(n,'synthetic','1111') then raise exception 'device reset allowed';end if;
 for i in 1..5 loop
  if public.verify_player_pin(n,'0000','synthetic') is not null then raise exception 'bad PIN accepted';end if;
 end loop;
 if public.create_friend_league_session(upper(n),'2468','different-device') is not null then raise exception 'limiter bypass';end if;
 update security_private.pin_attempts set window_start=now()-interval '16 minutes' where account_key='player:'||pid::text;
 oldtok:=public.create_friend_league_session(n,'2468','synthetic');
 if oldtok is null then raise exception 'valid PIN denied after window';end if;
 -- Synthetic ordinary player token must not grant management rights.
 foreach q in array array[
  'select public.get_admin_bizimskor_cup($1)',
  'select public.get_admin_statistics_dashboard($1)',
  'select public.get_admin_supported_team_summary($1)',
  'select public.admin_schedule_bizimskor_cup($1,now()+interval ''1 day'')',
  'select public.admin_update_live_score($1,-1,0::smallint,0::smallint,0::smallint,false,''super_lig'')'
 ] loop
  begin execute q using oldtok;raise exception 'admin accepted normal player';
  exception when raise_exception then if SQLERRM<>'Yetkisiz işlem' then raise;end if;end;
  begin execute q using ''::text;raise exception 'admin accepted empty token';
  exception when raise_exception then if SQLERRM<>'Yetkisiz işlem' then raise;end if;end;
 end loop;
 -- A synthetic expired session for the real administrator must also be denied.
 insert into public.friend_league_sessions(token_hash,player_name,expires_at)
 select extensions.digest(tok,'sha256'),name,now()-interval '1 minute' from public.players where name='Erdal';
 if public.is_support_admin(tok) then raise exception 'expired admin accepted';end if;
 -- Authenticated-role proof must refer to a verified user linked to this player.
 perform set_config('request.jwt.claim.sub',uid::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
 update auth.users set email_confirmed_at=null where id=uid;
 begin perform public.reset_player_pin_with_email('1357');raise exception 'unverified email accepted';
 exception when insufficient_privilege then null;end;
 update auth.users set email_confirmed_at=now() where id=uid;
 if not public.reset_player_pin_with_email('1357') then raise exception 'verified reset failed';end if;
 if public.friend_session_player(oldtok) is not null then raise exception 'old session survived';end if;
 if public.verify_player_pin(n,'2468','synthetic') is not null then raise exception 'old PIN survived';end if;
 if public.create_friend_league_session(n,'1357','synthetic') is null then raise exception 'new PIN failed';end if;
end $$;
rollback;
select 'PASS: real pgcrypto, shared limiter, verified-email PIN reset, old-session revocation and five admin guards; all synthetic rows rolled back' result;
