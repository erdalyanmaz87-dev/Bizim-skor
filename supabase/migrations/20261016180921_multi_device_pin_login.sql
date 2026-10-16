-- A device restriction belongs to account registration, not PIN-authenticated login.
-- Keep the registered device stable for duplicate registration checks and PIN recovery.
create or replace function public.verify_player_pin(
  p_name text, p_pin text, p_device_id text default null
) returns text
language plpgsql
security definer
set search_path=public,extensions
as $$
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
$$;

create or replace function public.create_friend_league_session(
  p_name text, p_pin text, p_device_id text
) returns text
language plpgsql
security definer
set search_path=public,extensions
as $$
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
$$;

revoke all on function public.verify_player_pin(text,text,text) from public;
revoke all on function public.create_friend_league_session(text,text,text) from public;
grant execute on function public.verify_player_pin(text,text,text) to anon,authenticated;
grant execute on function public.create_friend_league_session(text,text,text) to anon,authenticated;
