-- Run as a single transaction; test players and sessions are always rolled back.
begin;
do $$
declare
  v_name text := '__device_test_' || extensions.gen_random_uuid()::text;
  v_device text := extensions.gen_random_uuid()::text;
  v_other_device text := extensions.gen_random_uuid()::text;
  v_pin text := '7264';
  v_token text;
  v_blocked boolean := false;
begin
  perform public.create_player_with_pin(v_name,v_pin,v_device);
  -- Session creation must not depend on the registration device or a previous login.
  v_token := public.create_friend_league_session(v_name,v_pin,v_other_device);
  if public.validate_friend_league_session(v_token) is distinct from v_name then
    raise exception 'New device session is invalid';
  end if;
  if public.verify_player_pin(v_name,v_pin,v_other_device) is distinct from v_name then
    raise exception 'Correct PIN must work on another device';
  end if;
  if not exists(select 1 from public.players where name=v_name and device_id=v_device) then
    raise exception 'Login must preserve registration device for recovery and duplicate registration checks';
  end if;
  if public.verify_player_pin(v_name,'0000',v_other_device) is not null then
    raise exception 'Wrong PIN must fail';
  end if;
  begin
    perform public.create_friend_league_session(v_name,'0000',v_other_device);
  exception when others then v_blocked:=true;
  end;
  if not v_blocked then raise exception 'Wrong PIN must not create a session'; end if;
  v_blocked:=false;
  begin
    perform public.create_player_with_pin(v_name || '_second',v_pin,v_device);
  exception when others then v_blocked:=true;
  end;
  if not v_blocked then raise exception 'Second registration on the same device must be blocked'; end if;
  -- Existing accounts can log in even on a device associated with another account.
  perform public.create_player_with_pin(v_name || '_other',v_pin,v_other_device);
  if public.verify_player_pin(v_name,v_pin,v_other_device) is distinct from v_name then
    raise exception 'Existing account login must be independent of registration restrictions';
  end if;
  v_token:=public.create_friend_league_session(v_name,v_pin,v_other_device);
  if public.validate_friend_league_session(v_token) is distinct from v_name then
    raise exception 'Session failed on an occupied device';
  end if;
  if public.reset_player_pin_from_registered_device(v_name,v_other_device,'5678') then
    raise exception 'Unverified device must not reset PIN';
  end if;
  if not public.reset_player_pin_from_registered_device(v_name,v_device,'5678') then
    raise exception 'Registration device recovery must still work after another-device login';
  end if;
end $$;
rollback;
select 'multi-device login, PIN validation, duplicate registration and recovery passed' as result;
