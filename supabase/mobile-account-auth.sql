-- Additive mobile account bridge. Review/apply separately; does not change legacy APIs.
-- REQUIRE: email confirmations enabled and Auth minimum password length >= 8.
begin;
create schema if not exists mobile_private;
revoke all on schema mobile_private from public, anon, authenticated;

create table if not exists mobile_private.player_accounts (
  auth_user_id uuid primary key references auth.users(id) on delete restrict,
  player_id bigint not null unique references public.players(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table if not exists mobile_private.auth_rate_buckets (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null default now(),
  attempts integer not null default 0,
  expires_at timestamptz not null default (now() + interval '30 minutes')
);
create index if not exists mobile_auth_rate_expiry on mobile_private.auth_rate_buckets(expires_at);
create table if not exists mobile_private.account_deletion_requests (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  player_id bigint not null references public.players(id) on delete restrict,
  reason text check (char_length(reason) <= 1000),
  status text not null default 'requested' check (status in ('requested','cancelled','completed')),
  requested_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index if not exists mobile_one_pending_deletion
  on mobile_private.account_deletion_requests(auth_user_id) where status='requested';
alter table mobile_private.account_deletion_requests
  add column if not exists support_request_id bigint unique references public.support_requests(id) on delete set null;
alter table mobile_private.player_accounts enable row level security;
alter table mobile_private.auth_rate_buckets enable row level security;
alter table mobile_private.account_deletion_requests enable row level security;
revoke all on all tables in schema mobile_private from public, anon, authenticated;
revoke all on all sequences in schema mobile_private from public, anon, authenticated;

create or replace function mobile_private.verified_uid() returns uuid
language plpgsql security definer set search_path='' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (
    select 1 from auth.users where id=v_uid and email_confirmed_at is not null
      and email is not null and coalesce(is_anonymous,false)=false
      and (banned_until is null or banned_until<=now())
  ) then raise exception 'Confirmed account required' using errcode='42501'; end if;
  return v_uid;
end; $$;

-- Only hashed, purpose-separated keys are accepted. Edge computes HMAC-SHA256 with
-- the service key. A single atomic UPSERT per bucket persists denied attempts.
create or replace function mobile_private.take_limit(p_key text,p_limit integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit<1 or p_limit>1000 then
    raise exception 'Invalid rate bucket';
  end if;
  delete from mobile_private.auth_rate_buckets where key_hash in
    (select key_hash from mobile_private.auth_rate_buckets where expires_at<now() limit 200);
  insert into mobile_private.auth_rate_buckets(key_hash,attempts) values(p_key,1)
  on conflict(key_hash) do update set
    attempts=case when mobile_private.auth_rate_buckets.window_start<=now()-interval '15 minutes'
      then 1 else least(mobile_private.auth_rate_buckets.attempts+1,1000000) end,
    window_start=case when mobile_private.auth_rate_buckets.window_start<=now()-interval '15 minutes'
      then now() else mobile_private.auth_rate_buckets.window_start end,
    expires_at=now()+interval '30 minutes'
  returning attempts into v_count;
  return v_count<=p_limit;
end; $$;

create or replace function public.mobile_auth_gate(p_keys text[],p_limits integer[])
returns boolean language plpgsql security definer set search_path='' as $$
declare i integer;
begin
  if p_keys is null or p_limits is null or cardinality(p_keys)<>3 or cardinality(p_limits)<>3 then raise exception 'Invalid buckets'; end if;
  for i in 1..3 loop
    -- Global then IP then identity: denied global/IP buckets must not create an
    -- unbounded stream of arbitrary identity buckets.
    if not mobile_private.take_limit(p_keys[i],p_limits[i]) then return false; end if;
  end loop;
  return true;
end; $$;

create or replace function public.mobile_auth_email_for_name(p_name text)
returns text language sql stable security definer set search_path='' as $$
  select u.email from mobile_private.player_accounts a
  join public.players p on p.id=a.player_id join auth.users u on u.id=a.auth_user_id
  where lower(p.name)=lower(trim(p_name)) and p.is_active=true
    and u.email_confirmed_at is not null
  -- Fail closed for historical names that differ only in case.
    and (select count(*) from public.players x where lower(x.name)=lower(trim(p_name)))=1
  limit 1
$$;

create or replace function public.mobile_link_player(
  p_name text,p_legacy_token text default null,p_pin text default null,p_device_id text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
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
end; $$;

create or replace function public.mobile_create_player(p_name text,p_device_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid := mobile_private.verified_uid(); v_id bigint; v_name text := trim(p_name);
begin
  if v_name is null or char_length(v_name)<3 or char_length(v_name)>30
    or v_name !~ '^[[:alnum:]_. -]+$' or position('@' in v_name)>0
    or char_length(coalesce(p_device_id,''))>200 then raise exception 'Invalid player name'; end if;
  -- Serialize with legacy inserts, which do not use our advisory locks.
  lock table public.players in share row exclusive mode;
  if exists(select 1 from mobile_private.player_accounts where auth_user_id=v_uid) then
    return jsonb_build_object('error','account_already_linked'); end if;
  if exists(select 1 from public.players where lower(name)=lower(v_name)) then
    return jsonb_build_object('error','name_unavailable'); end if;
  begin
    -- Email-only players must never look like an unclaimed legacy PIN account.
    -- No human four-digit PIN exists: hash a server-only 256-bit random secret,
    -- discard it, and keep device_id NULL to block legacy device-reset proof.
    -- Migrated existing players retain their old PIN/device fields unchanged.
    insert into public.players(name,device_id,last_seen,pin_hash,force_pin_once)
      values(v_name,null,now(),extensions.crypt(encode(extensions.gen_random_bytes(32),'hex'),extensions.gen_salt('bf')),false)
      returning id into v_id;
  exception when unique_violation then
    -- A legacy manual import can leave the identity sequence behind. Never
    -- reset a shared sequence here; an administrator must inspect it separately.
    return jsonb_build_object('error','registration_temporarily_unavailable');
  end;
  insert into mobile_private.player_accounts(auth_user_id,player_id) values(v_uid,v_id);
  return jsonb_build_object('player_id',v_id,'player_name',v_name);
end; $$;

create or replace function public.mobile_issue_player_session(p_device_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid := mobile_private.verified_uid(); v_player public.players%rowtype;
  v_token text; v_expiry timestamptz := now()+interval '30 days';
begin
  if char_length(coalesce(p_device_id,''))>200 then raise exception 'Invalid input'; end if;
  if not mobile_private.take_limit(encode(extensions.digest('session:'||v_uid::text,'sha256'),'hex'),30) then
    return jsonb_build_object('error','rate_limited'); end if;
  select p.* into v_player from public.players p join mobile_private.player_accounts a on a.player_id=p.id
    where a.auth_user_id=v_uid and p.is_active=true;
  if not found then return jsonb_build_object('error','player_not_linked'); end if;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  delete from public.friend_league_sessions where token_hash in
    (select token_hash from public.friend_league_sessions where expires_at<=now() limit 200);
  insert into public.friend_league_sessions(token_hash,player_name,expires_at)
    values(extensions.digest(v_token,'sha256'),v_player.name,v_expiry);
  update public.players set last_seen=now() where id=v_player.id;
  return jsonb_build_object('token',v_token,'player_id',v_player.id,'player_name',v_player.name,'expires_at',v_expiry);
end; $$;

create or replace function public.mobile_request_account_deletion(p_reason text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid := mobile_private.verified_uid(); v_player bigint; v_id bigint; v_support bigint; v_message text;
begin
  if char_length(coalesce(p_reason,''))>1000 then raise exception 'Reason too long'; end if;
  select player_id into v_player from mobile_private.player_accounts where auth_user_id=v_uid;
  if v_player is null then return jsonb_build_object('error','player_not_linked'); end if;
  insert into mobile_private.account_deletion_requests(auth_user_id,player_id,reason)
    values(v_uid,v_player,nullif(trim(p_reason),'')) on conflict(auth_user_id) where status='requested'
    do update set reason=excluded.reason returning id,support_request_id into v_id,v_support;
  -- The upsert holds the pending row lock, so concurrent retries cannot create
  -- duplicate support notices. Private queue remains the authoritative workflow.
  v_message:=left('HESAP SİLME TALEBİ #'||v_id::text||
    ' — Doğrulanmış e-posta hesabından gönderildi. Manuel inceleme gerekiyor; kayıtlar otomatik silinmedi. İşlemden önce talebin hâlâ açık olduğunu kontrol edin. Sebep: '||
    coalesce(nullif(trim(p_reason),''),'Belirtilmedi'),500);
  if v_support is null then
    insert into public.support_requests(player_id,category,message)
    values(v_player,'other',v_message) returning id into v_support;
    update mobile_private.account_deletion_requests set support_request_id=v_support where id=v_id;
  else
    update public.support_requests set message=v_message where id=v_support;
  end if;
  return jsonb_build_object('id',v_id,'status','requested');
end; $$;

create or replace function public.mobile_cancel_account_deletion()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid := mobile_private.verified_uid(); v_id bigint; v_support bigint;
begin
  update mobile_private.account_deletion_requests set status='cancelled',cancelled_at=now()
    where auth_user_id=v_uid and status='requested' returning id,support_request_id into v_id,v_support;
  if v_support is not null then
    update public.support_requests set status='resolved',resolved_at=now(),
      message=left(message,430)||' — İPTAL: Oyuncu silme talebini geri çekti; işlem yapmayın.'
    where id=v_support;
  end if;
  return jsonb_build_object('id',v_id,'status',case when v_id is null then 'none' else 'cancelled' end);
end; $$;

create or replace function public.mobile_account_status()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid := mobile_private.verified_uid(); v_result jsonb;
begin
  select jsonb_build_object('linked',true,'player_id',p.id,'player_name',p.name,'deletion_status',coalesce(
    (select d.status from mobile_private.account_deletion_requests d where d.auth_user_id=v_uid order by d.id desc limit 1),'none'),'deletion_request',
    (select jsonb_build_object('id',d.id,'status',d.status,'requested_at',d.requested_at)
     from mobile_private.account_deletion_requests d where d.auth_user_id=v_uid order by d.id desc limit 1))
  into v_result from mobile_private.player_accounts a join public.players p on p.id=a.player_id where a.auth_user_id=v_uid;
  return coalesce(v_result,jsonb_build_object('linked',false,'player_id',null,'player_name',null,'deletion_status','none','deletion_request',null));
end; $$;

revoke all on all functions in schema mobile_private from public, anon, authenticated;
revoke all on function public.mobile_auth_gate(text[],integer[]) from public,anon,authenticated;
revoke all on function public.mobile_auth_email_for_name(text) from public,anon,authenticated;
grant execute on function public.mobile_auth_gate(text[],integer[]) to service_role;
grant execute on function public.mobile_auth_email_for_name(text) to service_role;
revoke all on function public.mobile_link_player(text,text,text,text) from public,anon;
revoke all on function public.mobile_create_player(text,text) from public,anon;
revoke all on function public.mobile_issue_player_session(text) from public,anon;
revoke all on function public.mobile_request_account_deletion(text) from public,anon;
revoke all on function public.mobile_cancel_account_deletion() from public,anon;
revoke all on function public.mobile_account_status() from public,anon;
grant execute on function public.mobile_link_player(text,text,text,text), public.mobile_create_player(text,text),
  public.mobile_issue_player_session(text), public.mobile_request_account_deletion(text),
  public.mobile_cancel_account_deletion(), public.mobile_account_status() to authenticated;
commit;
