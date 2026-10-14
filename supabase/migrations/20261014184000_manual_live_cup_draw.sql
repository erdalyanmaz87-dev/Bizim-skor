-- The owner starts and reveals the draw. Time and spectators never advance it.
alter table public.bizimskor_cups add column if not exists manual_draw boolean not null default true;
alter table public.bizimskor_cups add column if not exists revealed_pairs integer not null default 0 check(revealed_pairs between 0 and 32);
alter table public.bizimskor_cup_entries add column if not exists seed_rank integer;
alter table public.bizimskor_cup_entries add column if not exists seed_score numeric;

create or replace function cup_private.start_manual_draw(p_cup bigint)
returns void language plpgsql security definer set search_path='' as $function$
declare c public.bizimskor_cups%rowtype; n integer; seeded integer; e record; slots integer[]; right_bays integer[]; right_slots integer[]; rr integer; pos integer;
begin
 select * into c from public.bizimskor_cups where id=p_cup for update;
 if c.status<>'registration' then return;end if;
 select count(*) into n from public.bizimskor_cup_entries where cup_id=c.id;
 if n<32 or n>64 then raise exception 'BAY–BAY eşleşmesi olmadan kura için en az 32 katılımcı gerekir.';end if;
 if exists(select 1 from public.fixtures where season=c.season and week=c.start_week and kickoff<=clock_timestamp()) then raise exception 'İlk tur başladı; kura başlatılamaz.';end if;
 if not exists(select 1 from public.fixtures where season=c.season and week=c.start_week) then raise exception 'İlk tur fikstürü henüz hazır değil.';end if;
 seeded:=(n+1)/2;
 -- Only played rounds in the last two completed Super Lig weeks enter the average.
 with weeks as (
  select f.week from public.fixtures f left join public.results r on r.fixture_id=f.id
  where f.season=c.season and f.week<c.start_week group by f.week
  having bool_and(r.home_score is not null and r.away_score is not null and lower(coalesce(r.status,'')) in('ft','finished','aet','pen'))
  order by f.week desc limit 2
 ), performance as (
  select distinct on(r.player_id,r.round_key) r.* from public.league_round_performance r
  where r.competition='super_lig' and r.round_key in(select c.season||':'||week::text from weeks)
  order by r.player_id,r.round_key,r.updated_at desc,r.id desc
 ), scores as (
  select en.player_id,coalesce(avg(r.performance_score),0) score,pl.created_at
  from public.bizimskor_cup_entries en join public.players pl on pl.id=en.player_id
  left join performance r on r.player_id=en.player_id
  where en.cup_id=c.id group by en.player_id,pl.created_at
 ), ranked as (select *,row_number() over(order by score desc,created_at,player_id) rank from scores)
 update public.bizimskor_cup_entries en set seed_rank=r.rank,seed_score=r.score from ranked r where en.cup_id=c.id and en.player_id=r.player_id;
 select array_agg(i order by random()) into slots from generate_series(1,32) i;
 for e in select player_id,row_number() over(order by random()) idx from public.bizimskor_cup_entries where cup_id=c.id and seed_rank<=seeded loop
  update public.bizimskor_cup_entries set draw_slot=slots[e.idx]*2-1 where cup_id=c.id and player_id=e.player_id;
 end loop;
 -- Put the other pool's BAY slots only opposite an actual seeded player.
 select array_agg(position) into right_bays from (
  select ((draw_slot+1)/2) position from public.bizimskor_cup_entries where cup_id=c.id and seed_rank<=seeded order by random() limit (32-(n-seeded))
 ) candidates;
 select array_agg(i order by random()) into right_slots from generate_series(1,32) i where not(i=any(coalesce(right_bays,'{}'::integer[])));
 for e in select player_id,row_number() over(order by random()) idx from public.bizimskor_cup_entries where cup_id=c.id and seed_rank>seeded loop
  update public.bizimskor_cup_entries set draw_slot=right_slots[e.idx]*2 where cup_id=c.id and player_id=e.player_id;
 end loop;
 for rr in 1..6 loop
  for pos in 1..(32/(2^(rr-1))::integer) loop
   insert into public.bizimskor_cup_matches(cup_id,round,position) values(c.id,rr,pos);
  end loop;
 end loop;
 insert into public.bizimskor_cup_matches(cup_id,round,position,bronze) values(c.id,6,1,true);
 update public.bizimskor_cup_matches x set
  player_a=(select player_id from public.bizimskor_cup_entries where cup_id=c.id and draw_slot=x.position*2-1),
  player_b=(select player_id from public.bizimskor_cup_entries where cup_id=c.id and draw_slot=x.position*2)
 where x.cup_id=c.id and x.round=1;
 if exists(select 1 from public.bizimskor_cup_matches where cup_id=c.id and round=1 and player_a is null and player_b is null) then raise exception 'Geçersiz BAY eşleşmesi';end if;
 update public.bizimskor_cup_matches set winner_id=coalesce(player_a,player_b),tie_reason='BAY' where cup_id=c.id and round=1 and ((player_a is null)<>(player_b is null));
 update public.bizimskor_cups set status='drawing',drawn_at=clock_timestamp(),revealed_pairs=0,manual_draw=true,dirty=true where id=c.id;
end $function$;
revoke all on function cup_private.start_manual_draw(bigint) from public,anon,authenticated;

create or replace function public.admin_start_bizimskor_cup(p_token text)
returns integer language plpgsql security definer set search_path='' as $function$
begin
 if not cup_private.owner(p_token) then raise exception 'Yetkisiz işlem';end if;
 perform cup_private.start_manual_draw(1);
 return (select revealed_pairs from public.bizimskor_cups where id=1);
end $function$;

create or replace function public.admin_reveal_bizimskor_cup(p_token text,p_expected integer)
returns integer language plpgsql security definer set search_path='' as $function$
declare c public.bizimskor_cups%rowtype;
begin
 if not cup_private.owner(p_token) then raise exception 'Yetkisiz işlem';end if;
 select * into c from public.bizimskor_cups where id=1 for update;
 if c.status='registration' then raise exception 'Önce kurayı başlat.';end if;
 -- A stale or duplicate click cannot skip an unseen pair.
 if c.status<>'drawing' or p_expected is null or p_expected<>c.revealed_pairs then return c.revealed_pairs;end if;
 update public.bizimskor_cups set revealed_pairs=least(32,c.revealed_pairs+1),status=case when c.revealed_pairs+1=32 then 'running' else 'drawing' end,dirty=true where id=c.id;
 if c.revealed_pairs+1=32 then perform cup_private.tick();end if;
 return c.revealed_pairs+1;
end $function$;
revoke all on function public.admin_start_bizimskor_cup(text) from public;
revoke all on function public.admin_reveal_bizimskor_cup(text,integer) from public;
grant execute on function public.admin_start_bizimskor_cup(text),public.admin_reveal_bizimskor_cup(text,integer) to anon,authenticated;
CREATE OR REPLACE FUNCTION cup_private.tick()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.bizimskor_cups%rowtype; e record; m record; a record; b record; n integer; rr integer; complete boolean; win bigint; lose bigint; reason text;
begin
 select * into c from public.bizimskor_cups where id=1 for update;
 if not found then return; end if;
 if c.status not in('running','finished') or not c.dirty then return; end if;
 -- Rebuild deterministically after score corrections; no irreversible manual advancement.
 update public.bizimskor_cup_matches set points_a=null,points_b=null,winner_id=null,loser_id=null,tie_reason=null,
   player_a=case when round=1 then player_a else null end,player_b=case when round=1 then player_b else null end where cup_id=c.id;
 for rr in 1..6 loop
  if rr>1 then
   update public.bizimskor_cup_matches x set
    player_a=(select winner_id from public.bizimskor_cup_matches where cup_id=c.id and round=rr-1 and position=x.position*2-1 and not bronze),
    player_b=(select winner_id from public.bizimskor_cup_matches where cup_id=c.id and round=rr-1 and position=x.position*2 and not bronze)
   where x.cup_id=c.id and x.round=rr and not x.bronze;
  end if;
  if rr=6 then
   update public.bizimskor_cup_matches set
    player_a=(select loser_id from public.bizimskor_cup_matches where cup_id=c.id and round=5 and position=1 and not bronze),
    player_b=(select loser_id from public.bizimskor_cup_matches where cup_id=c.id and round=5 and position=2 and not bronze)
   where cup_id=c.id and bronze;
  end if;
  select count(*)>0 and bool_and(r.home_score is not null and r.away_score is not null and lower(coalesce(r.status,'')) in('ft','finished','aet','pen'))
  into complete from public.fixtures f left join public.results r on r.fixture_id=f.id where f.season=c.season and f.week=c.start_week+rr-1;
  if rr=1 then
   update public.bizimskor_cup_matches set winner_id=coalesce(player_a,player_b),tie_reason='BAY'
   where cup_id=c.id and round=1 and ((player_a is null)<>(player_b is null));
   update public.bizimskor_cup_matches x set
    player_a=(select winner_id from public.bizimskor_cup_matches where cup_id=c.id and round=1 and position=x.position*2-1 and not bronze),
    player_b=(select winner_id from public.bizimskor_cup_matches where cup_id=c.id and round=1 and position=x.position*2 and not bronze)
   where x.cup_id=c.id and x.round=2;
  end if;
  if not coalesce(complete,false) then
   update public.bizimskor_cups set status='running',dirty=false where id=c.id;return;
  end if;
  insert into public.bizimskor_cup_rounds(cup_id,round) values(c.id,rr) on conflict do nothing;
  for m in select * from public.bizimskor_cup_matches where cup_id=c.id and round=rr loop
   if rr=1 and ((m.player_a is null)<>(m.player_b is null)) then continue;end if;
   if m.player_a is null or m.player_b is null then raise exception 'Kupa eşleşmesi eksik'; end if;
   select * into a from cup_private.week_score(m.player_a,c.season,c.start_week+rr-1,(select completed_at from public.bizimskor_cup_rounds where cup_id=c.id and round=rr));
   select * into b from cup_private.week_score(m.player_b,c.season,c.start_week+rr-1,(select completed_at from public.bizimskor_cup_rounds where cup_id=c.id and round=rr));
   if a.points<>b.points then reason:='Haftalık puan';
   elsif a.invites<>b.invites then reason:='Arkadaş davet sayısı';
   elsif a.exact<>b.exact then reason:='Tam skor sayısı';
   elsif a.correct<>b.correct then reason:='Doğru sonuç sayısı';
   elsif a.joined<>b.joined then reason:='Oyuna kayıt zamanı';else reason:='Oyuncu kayıt sırası';end if;
   if (a.points,a.invites,a.exact,a.correct,-extract(epoch from a.joined),-a.player_id)>(b.points,b.invites,b.exact,b.correct,-extract(epoch from b.joined),-b.player_id) then win:=m.player_a;lose:=m.player_b;else win:=m.player_b;lose:=m.player_a;end if;
   update public.bizimskor_cup_matches set points_a=a.points,points_b=b.points,winner_id=win,loser_id=lose,tie_reason=reason
    where cup_id=c.id and round=rr and position=m.position and bronze=m.bronze;
  end loop;
 end loop;
 update public.bizimskor_cups set status='finished',dirty=false where id=c.id;
end $function$;
CREATE OR REPLACE FUNCTION public.get_bizimskor_cup(p_token text DEFAULT NULL::text, p_watch boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.bizimskor_cups%rowtype; me bigint; revealed integer;
begin
 perform cup_private.tick();select * into c from public.bizimskor_cups where id=1;
 if not found then return null; end if;
 me:=cup_private.player(p_token);
 revealed:=c.revealed_pairs;
 if p_watch and me is not null and c.status='drawing'
  and exists(select 1 from public.bizimskor_cup_entries where cup_id=c.id and player_id=me) then
  insert into public.bizimskor_cup_viewers(cup_id,player_id) values(c.id,me) on conflict(cup_id,player_id) do update set last_watched_at=clock_timestamp();
 end if;
 return jsonb_build_object('manual_draw',c.manual_draw,'title',c.title,'status',c.status,'start_week',c.start_week,'scheduled_at',c.scheduled_at,'drawn_at',c.drawn_at,'server_now',clock_timestamp(),'revealed_pairs',revealed,
 'is_owner',cup_private.owner(p_token),'authenticated',me is not null,
 'my_number',(select entry_no from public.bizimskor_cup_entries where cup_id=c.id and player_id=me),
 'count',(select count(*) from public.bizimskor_cup_entries where cup_id=c.id),
 'entries',coalesce((select jsonb_agg(jsonb_build_object('number',e.entry_no,'name',p.name) order by e.entry_no) from public.bizimskor_cup_entries e join public.players p on p.id=e.player_id where e.cup_id=c.id),'[]'::jsonb),
 'matches',coalesce((select jsonb_agg(jsonb_build_object('round',m.round,'position',m.position,'bronze',m.bronze,'name_a',case when m.round=1 then coalesce(pa.name,'BAY') else pa.name end,'name_b',case when m.round=1 then coalesce(pb.name,'BAY') else pb.name end,'points_a',m.points_a,'points_b',m.points_b,'winner',pw.name,'tie_reason',m.tie_reason) order by m.round,m.bronze,m.position)
 from public.bizimskor_cup_matches m left join public.players pa on pa.id=m.player_a left join public.players pb on pb.id=m.player_b left join public.players pw on pw.id=m.winner_id
 where m.cup_id=c.id and (m.round=1 and m.position<=revealed or m.round>1 and revealed=32)),'[]'::jsonb));
end $function$;
