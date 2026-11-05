create table public.native_push_devices (
 device_id uuid primary key,
 secret_hash text not null check(secret_hash ~ '^[a-f0-9]{64}$'),
 revision bigint not null check(revision>0),
 enabled boolean not null,
 player_id bigint references public.players(id) on delete cascade,
 session_hash bytea,
 fcm_token text check(fcm_token is null or length(fcm_token) between 40 and 4096),
 updated_at timestamptz not null default now()
);
create unique index native_push_active_token on public.native_push_devices(fcm_token) where enabled;
create index native_push_player on public.native_push_devices(player_id);
alter table public.native_push_devices enable row level security;
revoke all on public.native_push_devices from public,anon,authenticated;
grant select,insert,update,delete on public.native_push_devices to service_role;

create function public.set_native_push_device(p_device uuid,p_secret_hash text,p_revision bigint,p_enabled boolean,p_token text,p_fcm_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_player bigint; v_session bytea; v_changed integer;
begin
 if p_secret_hash !~ '^[a-f0-9]{64}$' or p_revision<1 or p_revision>9007199254740991 then raise exception 'invalid_device'; end if;
 if exists(select 1 from public.native_push_devices where device_id=p_device and secret_hash<>p_secret_hash) then raise exception 'device_unauthorized'; end if;
 if p_enabled then
  if p_fcm_token !~ '^[A-Za-z0-9_:-]+$' or length(p_fcm_token) not between 40 and 4096 or p_fcm_token is null then raise exception 'invalid_fcm_token'; end if;
  select p.id into v_player from public.players p where p.name=public.friend_session_player(p_token) and p.is_active is not false
   and not exists(select 1 from mobile_private.player_accounts a join auth.users u on u.id=a.auth_user_id where a.player_id=p.id and u.banned_until>now());
  if v_player is null then raise exception 'session_unauthorized'; end if;
  v_session:=extensions.digest(p_token,'sha256');
 end if;
 insert into public.native_push_devices as d(device_id,secret_hash,revision,enabled,player_id,session_hash,fcm_token)
 values(p_device,p_secret_hash,p_revision,p_enabled,v_player,v_session,case when p_enabled then p_fcm_token else null end)
 on conflict(device_id) do update set revision=excluded.revision,enabled=excluded.enabled,player_id=excluded.player_id,session_hash=excluded.session_hash,fcm_token=excluded.fcm_token,updated_at=now()
 where d.secret_hash=excluded.secret_hash and d.revision<excluded.revision;
 get diagnostics v_changed=row_count;
 return jsonb_build_object('ok',true,'applied',v_changed=1);
end $$;
revoke all on function public.set_native_push_device(uuid,text,bigint,boolean,text,text) from public,anon,authenticated;
grant execute on function public.set_native_push_device(uuid,text,bigint,boolean,text,text) to service_role;

create function public.list_native_push_targets()
returns table(device_id uuid,player_name text,fcm_token text,revision bigint)
language sql security definer set search_path='' as $$
 select d.device_id,p.name,d.fcm_token,d.revision from public.native_push_devices d
 join public.players p on p.id=d.player_id
 where d.enabled and p.is_active is not false
 and exists(select 1 from public.friend_league_sessions s where s.token_hash=d.session_hash and s.player_name=p.name and s.expires_at>now())
 and not exists(select 1 from mobile_private.player_accounts a join auth.users u on u.id=a.auth_user_id where a.player_id=p.id and u.banned_until>now())
$$;
revoke all on function public.list_native_push_targets() from public,anon,authenticated;
grant execute on function public.list_native_push_targets() to service_role;
