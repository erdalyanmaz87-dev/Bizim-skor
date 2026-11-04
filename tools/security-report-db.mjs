// Run with BIZIMSKOR_PGLITE_MODULE pointing to an installed PGlite module.
// A test-only crypto shim exercises SQL authorization/state logic; production
// uses the existing native pgcrypto extension, never this shim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.BIZIMSKOR_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create collation pg_catalog."tr-x-icu" from "C"; -- Test fixture only; no locale ordering assertions.
create schema extensions; create schema auth; create schema mobile_private;
create function extensions.digest(text,text) returns bytea language sql immutable as $$select decode(md5($1),'hex')$$;
create function extensions.gen_salt(text) returns text language sql as $$select 'test-salt'::text$$;
create function extensions.gen_random_bytes(integer) returns bytea language sql as $$select decode(md5(random()::text),'hex')$$;
create function extensions.crypt(text,text) returns text language sql immutable as $$select 'hash:'||md5($1)$$;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,banned_until timestamptz);
create function mobile_private.verified_uid() returns uuid language plpgsql as $$begin if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and not is_anonymous and (banned_until is null or banned_until<=now())) then raise exception 'Confirmed account required'; end if; return auth.uid(); end$$;
create table public.players(id bigint generated always as identity primary key,name text unique not null,is_active boolean not null default true,pin_hash text,device_id text,last_seen timestamptz,force_pin_once boolean default false,created_at timestamptz default now());
create table public.friend_league_sessions(token_hash bytea primary key,player_name text,expires_at timestamptz,created_at timestamptz default now());
create table mobile_private.player_accounts(auth_user_id uuid unique,player_id bigint unique,created_at timestamptz default now());
create table public.support_admins(player_id bigint);
create function public.is_support_admin(text) returns boolean language sql as $$select exists(select 1 from public.friend_league_sessions s join public.players p on p.name=s.player_name join public.support_admins a on a.player_id=p.id where s.token_hash=extensions.digest($1,'sha256') and s.expires_at>now() and p.is_active)$$;
create function public.update_player_profile(p_name text,p_current_pin text,p_new_name text,p_new_pin text default null,p_device_id text default null) returns text language sql as $$select p_name$$;
create function public.mobile_link_player(p_name text,p_legacy_token text default null,p_pin text default null,p_device_id text default null) returns jsonb language sql as $$select jsonb_build_object('player_name',p_name)$$;
create function public.get_player_login_state(p_name text) returns table(canonical_name text,has_pin boolean) language sql as $$select name,pin_hash is not null from public.players where lower(name)=lower(trim(p_name))$$;
create table public.predictions(player_name text,points integer);
insert into public.predictions values('Demo',128);
insert into public.players(name,pin_hash,device_id) values('Demo',extensions.crypt('2468','test'),'registered-device'),('NoPin',null,'registered-device');
`);
const migration=fs.readFileSync(new URL('../supabase/security-report-hardening.sql',import.meta.url),'utf8');
await db.exec(migration);
const scalar=async(sql,params=[])=>Object.values((await db.query(sql,params)).rows[0])[0];
assert.equal(await scalar("select public.claim_or_set_player_pin('NoPin','1111','anything')"),null);
assert.equal(await scalar("select pin_hash from public.players where name='NoPin'"),null);
assert.equal(await scalar("select public.reset_player_pin_from_registered_device('Demo','registered-device','1111')"),false);
assert.equal(await scalar("select public.verify_player_pin('Demo','2468','other-device')"),'Demo');
for(let i=0;i<5;i++)assert.equal(await scalar("select public.verify_player_pin(' demo ','0000',$1)",['changing-'+i]),null);
assert.equal(await scalar("select public.create_friend_league_session('DEMO','2468','new-device')"),null,'session endpoint cannot bypass account lock');
assert.equal(await scalar("select public.update_player_profile('Demo','2468','Renamed',null,'registered-device')"),null,'profile endpoint cannot bypass lock');
assert.equal(await scalar("select attempts from security_private.pin_attempts"),5);
await db.exec("update public.players set name='DemoRenamed' where name='Demo'");
assert.equal(await scalar("select public.verify_player_pin('DemoRenamed','2468','new-device')"),null,'renaming does not clear the account limit');
await db.exec("update public.players set name='Demo' where name='DemoRenamed'");
await db.exec("update security_private.pin_attempts set window_start=now()-interval '16 minutes'");
assert.ok(await scalar("select public.create_friend_league_session('Demo','2468','new-device')"));
assert.deepEqual((await db.query("select * from public.find_player_login_state('Unknown')")).rows,[{name:'Unknown',has_pin:true}]);
assert.deepEqual((await db.query("select * from public.find_player_login_state('NoPin')")).rows,[{name:'NoPin',has_pin:true}]);
assert.equal(await scalar('select count(*) from public.list_player_directory()'),0);
await assert.rejects(db.exec("insert into public.players(name) values('mail@example.com')"),/Oyuncu adı/);
await assert.rejects(db.exec("set role anon; select * from security_private.pin_attempts"),/permission denied/);await db.exec('reset role');
await assert.rejects(db.exec("select public.reset_player_pin_with_email('1357')"),/Confirmed/);
await db.exec("insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-0000-0000-000000000001','demo@example.com',now()); insert into mobile_private.player_accounts(auth_user_id,player_id) select '00000000-0000-0000-0000-000000000001',id from public.players where name='Demo'; set test.uid='00000000-0000-0000-0000-000000000001'");
assert.equal(await scalar("select public.reset_player_pin_with_email('1357')"),true);
assert.equal(await scalar('select count(*) from public.friend_league_sessions'),0);
assert.equal(await scalar("select public.verify_player_pin('Demo','1357','other-device')"),'Demo');
assert.equal(await scalar("select public.verify_player_pin('Demo','2468','other-device')"),null);
for(let i=0;i<4;i++)await scalar("select public.mobile_link_player('Demo',null,'0000','new-device')");
assert.deepEqual(await scalar("select public.mobile_link_player('Demo',null,'1357','new-device')"),{error:'invalid_player_credentials'},'link endpoint shares the PIN lock');
assert.equal(await scalar('select count(*) from public.players'),2,'no player is removed');
assert.equal(await scalar('select sum(points) from public.predictions'),128);
await db.exec(migration); // Applying the release twice must not corrupt wrappers.
await db.exec(`
create schema cup_private;
alter table public.players add column supported_team text;
create table public.bizimskor_cups(id bigint,owner_player_id bigint,status text,season text,start_week integer);
create table public.bizimskor_cup_viewers(cup_id bigint,player_id bigint,first_watched_at timestamptz,last_watched_at timestamptz);
create function public.friend_session_player(p_token text) returns text language sql as $$select player_name from public.friend_league_sessions where token_hash=extensions.digest(p_token,'sha256') and expires_at>now()$$;
create function cup_private.player(p_token text) returns bigint language sql as $$select p.id from public.players p where p.name=public.friend_session_player(p_token) and p.is_active$$;
create function cup_private.owner(p_token text) returns boolean language sql as $$select exists(select 1 from public.bizimskor_cups c where c.owner_player_id=cup_private.player(p_token))$$;
insert into public.players(name,pin_hash) values('Erdal',extensions.crypt('1234','test'));
insert into public.support_admins select id from public.players where name='Erdal';
insert into public.bizimskor_cups select 1,id,'registration','2026/27',11 from public.players where name='Erdal';
insert into public.friend_league_sessions values(extensions.digest('normal','sha256'),'Demo',now()+interval '1 day',now()),(extensions.digest('admin','sha256'),'Erdal',now()+interval '1 day',now()),(extensions.digest('expired-admin','sha256'),'Erdal',now()-interval '1 day',now());
`);
await db.exec(fs.readFileSync(new URL('../test/sql/security-admin-current-definitions.sql',import.meta.url),'utf8'));
for(const token of [null,'garbage','normal','expired-admin']){
 for(const name of ['get_admin_supported_team_summary','get_admin_statistics_dashboard_base','get_admin_bizimskor_cup']){
  await assert.rejects(db.query(`select public.${name}($1)`,[token]),/Yetkisiz/);
 }
 await assert.rejects(db.query('select public.admin_schedule_bizimskor_cup($1,now())',[token]),/Yetkisiz/);
 await assert.rejects(db.query("select public.admin_update_live_score($1,1::bigint,0::smallint,0::smallint,0::smallint,false,'super_lig')",[token]),/Yetkisiz/);
}
assert.equal(await scalar("select public.is_support_admin('admin')"),true);
assert.ok(await scalar("select public.get_admin_supported_team_summary('admin')"));
assert.ok(await scalar("select public.get_admin_bizimskor_cup('admin')"));
assert.equal(await scalar('select sum(points) from public.predictions'),128);
await db.exec(fs.readFileSync(new URL('../supabase/security-report-rollback.sql',import.meta.url),'utf8'));
assert.equal(await scalar("select public.verify_player_pin('Demo','1357','new-device')"),'Demo');
assert.equal(await scalar('select sum(points) from public.predictions'),128);
console.log('Security SQL integration: PASS (claims, resets, shared limiter, directory, permissions, email proof, sessions, admin denial, idempotency, rollback, record preservation)');
await db.close();
