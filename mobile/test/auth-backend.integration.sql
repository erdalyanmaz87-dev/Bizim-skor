-- Run AS DATABASE OWNER after installing supabase/mobile-account-auth.sql.
-- No mail/Auth HTTP calls. All synthetic users/players/mappings/notices roll back.
-- PostgreSQL nextval is nontransactional: normal sequence gaps may remain.
-- Never run while manually editing identity sequences. No sequence is reset here.
begin;
set local statement_timeout='30s';
set local lock_timeout='5s';
do $$
declare
  v_nonce text := substr(replace(gen_random_uuid()::text,'-',''),1,12);
  v_u0 uuid := gen_random_uuid(); v_u1 uuid := gen_random_uuid();
  v_u2 uuid := gen_random_uuid(); v_u3 uuid := gen_random_uuid(); v_u4 uuid := gen_random_uuid();
  v_uid uuid; v_created bigint; v_legacy bigint; v_pin bigint; v_notice bigint;
  v_name text; v_token text := encode(extensions.gen_random_bytes(32),'hex');
  v_pin_name text; v_reply jsonb; v_again jsonb; v_request bigint; v_count integer;
  v_new_pin_hash text; v_device text;
  v_sequence regclass; v_sequence_last bigint; v_max bigint; i integer;
begin
  -- Inspect only: do not silently repair a shared sequence. A behind sequence
  -- requires a separately reviewed operational fix before creation can be tested.
  v_sequence:=pg_get_serial_sequence('public.players','id')::regclass;
  if v_sequence is null then raise exception 'players.id has no identity sequence'; end if;
  v_sequence_last:=pg_sequence_last_value(v_sequence);
  select max(id) into v_max from public.players;
  if v_max is not null and (v_sequence_last is null or v_sequence_last<v_max) then
    raise exception 'players sequence last % is behind max %. No reset performed.',v_sequence_last,v_max;
  end if;

  foreach v_uid in array array[v_u0,v_u1,v_u2,v_u3,v_u4] loop
    insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
    values(v_uid,'authenticated','authenticated','mobile-test-'||v_uid::text||'@invalid.example','',
      case when v_uid=v_u0 then null else now() end,now(),now());
  end loop;
  v_name:='legacy_'||v_nonce; v_pin_name:='pin_'||v_nonce;
  insert into public.players(name,pin_hash,device_id) values(v_name,extensions.crypt('1234',extensions.gen_salt('bf')),'original-device') returning id into v_legacy;
  insert into public.players(name,pin_hash) values(v_pin_name,extensions.crypt('9876',extensions.gen_salt('bf'))) returning id into v_pin;
  insert into public.friend_league_sessions(token_hash,player_name,expires_at)
    values(extensions.digest(v_token,'sha256'),v_name,now()+interval '1 day');

  -- Verified account required, even with an authenticated-role JWT claim.
  perform set_config('request.jwt.claim.sub',v_u0::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_u0,'role','authenticated')::text,true);
  begin
    perform public.mobile_create_player('new_'||v_nonce,null);
    raise exception 'Unconfirmed user unexpectedly created player';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub',v_u1::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_u1,'role','authenticated')::text,true);
  v_device:='synthetic-mobile-device-'||v_nonce;
  v_reply:=public.mobile_create_player('new_'||v_nonce,v_device);
  if v_reply ? 'error' or v_reply->>'player_name' is distinct from 'new_'||v_nonce then raise exception 'Create failed: %',v_reply; end if;
  v_created:=(v_reply->>'player_id')::bigint;
  select pin_hash into v_new_pin_hash from public.players where id=v_created;
  if v_new_pin_hash is null or v_new_pin_hash !~ '^\$2[aby]\$'
    or (select device_id from public.players where id=v_created) is not null then
    raise exception 'Email-only player exposed legacy unset-PIN/device recovery'; end if;
  if public.verify_player_pin('new_'||v_nonce,'1234',v_device) is not null then
    raise exception 'Known PIN authenticated email-only player'; end if;
  -- Legacy claim may reject by exception or return NULL; neither may change the
  -- stored random hash/device, and device recovery must not succeed.
  begin
    perform public.claim_or_set_player_pin('new_'||v_nonce,'1234',v_device);
  exception when raise_exception then null; end;
  if public.reset_player_pin_from_registered_device('new_'||v_nonce,v_device,'1234') then
    raise exception 'Device reset claimed email-only player'; end if;
  if (select pin_hash from public.players where id=v_created) is distinct from v_new_pin_hash
    or (select device_id from public.players where id=v_created) is not null
    or public.verify_player_pin('new_'||v_nonce,'1234',v_device) is not null then
    raise exception 'Legacy claim/reset changed email-only credentials'; end if;
  v_again:=public.mobile_create_player('another_'||v_nonce,null);
  if v_again->>'error' is distinct from 'account_already_linked' then raise exception 'Second create unexpectedly allowed: %',v_again; end if;
  v_reply:=public.mobile_issue_player_session(null);
  if public.friend_session_player(v_reply->>'token') is distinct from 'new_'||v_nonce then raise exception 'Legacy bridge did not validate'; end if;
  if (v_reply->>'expires_at')::timestamptz<now()+interval '29 days' then raise exception 'Bridge expiry too short'; end if;
  -- Revoking confirmation/banning immediately blocks further bridge issuance.
  update auth.users set email_confirmed_at=null where id=v_u1;
  begin
    perform public.mobile_issue_player_session(null);
    raise exception 'Unconfirmed identity still issued session';
  exception when insufficient_privilege then null; end;
  update auth.users set email_confirmed_at=now(),banned_until=now()+interval '1 day' where id=v_u1;
  begin
    perform public.mobile_issue_player_session(null);
    raise exception 'Banned identity still issued session';
  exception when insufficient_privilege then null; end;
  update auth.users set banned_until=null where id=v_u1;

  -- Idempotent queue + one actionable existing support inbox notice.
  v_reply:=public.mobile_request_account_deletion('synthetic rollback test');
  v_request:=(v_reply->>'id')::bigint;
  v_again:=public.mobile_request_account_deletion('synthetic retry');
  if v_again->>'id' is distinct from v_reply->>'id' then raise exception 'Deletion was not idempotent'; end if;
  select support_request_id into v_notice from mobile_private.account_deletion_requests where id=v_request;
  if v_notice is null or not exists(select 1 from public.support_requests where id=v_notice and player_id=v_created and status='new') then
    raise exception 'Deletion support notice missing'; end if;
  select count(*) into v_count from public.support_requests where player_id=v_created;
  if v_count is distinct from 1 then raise exception 'Duplicate support notices: %',v_count; end if;
  if not exists(select 1 from public.players where id=v_created and is_active=true) then raise exception 'Deletion request mutated live player'; end if;
  v_reply:=public.mobile_cancel_account_deletion();
  if v_reply->>'status' is distinct from 'cancelled' or not exists(select 1 from public.support_requests where id=v_notice and status='resolved' and message like '%İPTAL%') then
    raise exception 'Cancellation did not close notice'; end if;
  if public.mobile_account_status()->>'deletion_status' is distinct from 'cancelled' then raise exception 'Cancellation status missing'; end if;
  if public.mobile_cancel_account_deletion()->>'status' is distinct from 'none' then raise exception 'Second cancellation should be none'; end if;

  -- Existing token proves ownership without trusting metadata or device id.
  perform set_config('request.jwt.claim.sub',v_u2::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_u2,'role','authenticated')::text,true);
  v_reply:=public.mobile_create_player(upper(v_name),null);
  if v_reply->>'error' is distinct from 'name_unavailable' then raise exception 'Existing name was not protected'; end if;
  v_reply:=public.mobile_link_player(v_name,'invalid-token',null,'original-device');
  if v_reply->>'error' is distinct from 'invalid_player_credentials' then raise exception 'Device alone claimed player'; end if;
  v_reply:=public.mobile_link_player(v_name,v_token,'0000','different-device');
  if (v_reply->>'player_id')::bigint is distinct from v_legacy then raise exception 'Token ownership proof failed: %',v_reply; end if;
  if (select device_id from public.players where id=v_legacy) is distinct from 'original-device' then raise exception 'Existing device was overwritten'; end if;
  update public.players set name='renamed_'||v_nonce where id=v_legacy;
  v_reply:=public.mobile_issue_player_session(null);
  if v_reply->>'player_name' is distinct from 'renamed_'||v_nonce or public.friend_session_player(v_reply->>'token') is distinct from 'renamed_'||v_nonce then
    raise exception 'Stable mapping did not follow player rename'; end if;

  -- Another uid cannot claim already-linked player even with correct PIN.
  perform set_config('request.jwt.claim.sub',v_u3::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_u3,'role','authenticated')::text,true);
  v_reply:=public.mobile_link_player('renamed_'||v_nonce,null,'1234',null);
  if v_reply->>'error' is distinct from 'account_already_linked' then raise exception 'Player reassigned: %',v_reply; end if;

  -- Failed PIN attempts persist their counters; successful PIN after window expiry.
  perform set_config('request.jwt.claim.sub',v_u4::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_u4,'role','authenticated')::text,true);
  for i in 1..10 loop
    v_reply:=public.mobile_link_player(v_pin_name,null,'0000',null);
    if v_reply->>'error' is distinct from 'invalid_player_credentials' then raise exception 'PIN failure %: %',i,v_reply; end if;
  end loop;
  v_reply:=public.mobile_link_player(v_pin_name,null,'9876',null);
  if v_reply->>'error' is distinct from 'rate_limited' then raise exception 'PIN proof bypassed throttle'; end if;
  update mobile_private.auth_rate_buckets set window_start=now()-interval '16 minutes'
    where key_hash in (encode(extensions.digest('link:uid:'||v_u4::text,'sha256'),'hex'),
      encode(extensions.digest('link:name:'||lower(v_pin_name),'sha256'),'hex'));
  v_reply:=public.mobile_link_player(v_pin_name,null,'9876',null);
  if (v_reply->>'player_id')::bigint is distinct from v_pin then raise exception 'PIN proof after expiry failed: %',v_reply; end if;

  -- API grant boundaries: anon cannot mutate identities; users cannot read map
  -- or resolve another player's email; privileged gateway is service-only.
  if has_function_privilege('anon','public.mobile_create_player(text,text)','EXECUTE')
    or has_function_privilege('anon','public.mobile_issue_player_session(text)','EXECUTE')
    or has_function_privilege('authenticated','public.mobile_auth_email_for_name(text)','EXECUTE')
    or has_function_privilege('authenticated','public.mobile_auth_gate(text[],integer[])','EXECUTE')
    or has_table_privilege('authenticated','mobile_private.player_accounts','SELECT') then
    raise exception 'Privilege revocation boundary failed'; end if;
  if not has_function_privilege('service_role','public.mobile_auth_gate(text[],integer[])','EXECUTE') then raise exception 'Gateway service grant missing'; end if;
  raise notice 'PASS: create, verification/revocation, bridge, name protection, token/PIN ownership, rename, throttle, deletion/support idempotency, cancellation, grants. Rolling back all synthetic records.';
end;
$$;
rollback;
