-- Cup points follow the current Super Lig weekly ranking (0-100).
-- Results remain provisional until every fixture in the week is finalized.
alter table public.bizimskor_cup_matches alter column points_a type numeric(6,2),alter column points_b type numeric(6,2);

create or replace function cup_private.week_performance(p_season text,p_week integer,p_cutoff timestamptz)
returns table(player_id bigint,points numeric,raw_points integer,weekly_rank bigint)
language sql stable security definer set search_path='' as $function$
with totals as (
 select pl.id player_id,pl.name,pl.created_at,
  coalesce(sum(case when r.fixture_id is null then 0
   when pr.home_score=r.home_score and pr.away_score=r.away_score then case when o.fixture_id is not null then 8 else 4 end
   when sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score) then case when o.fixture_id is not null then 2 else 1 end else 0 end),0)::integer raw_points,
  count(*) filter(where r.fixture_id is not null and pr.home_score=r.home_score and pr.away_score=r.away_score) exact,
  count(*) filter(where r.fixture_id is not null and sign(pr.home_score-pr.away_score)=sign(r.home_score-r.away_score)) correct,
  (select count(*) from public.player_invites i where i.inviter_name=pl.name and i.created_at<=p_cutoff) invites
 from public.players pl join public.predictions pr on pr.player_name=pl.name
 join public.fixtures f on f.id=pr.fixture_id and f.week=pr.week and f.season=p_season and f.week=p_week
 left join public.results r on r.fixture_id=f.id and r.home_score is not null and r.away_score is not null and lower(r.status) in('ft','finished','aet','pen')
 left join public.opportunity_matches o on o.fixture_id=f.id and o.competition='super_lig'
 where coalesce(pl.is_active,true) and pr.home_score is not null and pr.away_score is not null
 group by pl.id,pl.name,pl.created_at
), ranked as (
 select t.*,row_number() over(order by raw_points desc,invites desc,exact desc,correct desc,created_at,name collate "tr-x-icu") weekly_rank,count(*) over() participants from totals t
), started as (
 select exists(select 1 from public.fixtures f join public.results r on r.fixture_id=f.id where f.season=p_season and f.week=p_week and r.home_score is not null and r.away_score is not null and lower(r.status) in('ft','finished','aet','pen')) has_result
)
select player_id,case when not started.has_result then 0 when participants=1 then 100 else coalesce(public.league_normalized_performance(weekly_rank::integer,participants::integer),0) end::numeric,raw_points,weekly_rank from ranked cross join started;
$function$;
revoke all on function cup_private.week_performance(text,integer,timestamptz) from public,anon,authenticated;

create or replace function cup_private.ranking_dirty()
returns trigger language plpgsql security definer set search_path='' as $function$
begin update public.bizimskor_cups set dirty=true where status in('running','finished');return null;end $function$;
revoke all on function cup_private.ranking_dirty() from public,anon,authenticated;
create trigger bizimskor_cup_invite_dirty after insert or update or delete on public.player_invites for each statement execute function cup_private.ranking_dirty();
create trigger bizimskor_cup_player_dirty after update of is_active on public.players for each statement execute function cup_private.ranking_dirty();
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
  if coalesce(complete,false) then
   insert into public.bizimskor_cup_rounds(cup_id,round) values(c.id,rr) on conflict do nothing;
  end if;
  with perf as materialized (
   select * from cup_private.week_performance(c.season,c.start_week+rr-1,
    coalesce((select completed_at from public.bizimskor_cup_rounds where cup_id=c.id and round=rr),clock_timestamp()))
  )
  update public.bizimskor_cup_matches x set
   points_a=case when x.player_a is null then null else coalesce((select p.points from perf p where p.player_id=x.player_a),0) end,
   points_b=case when x.player_b is null then null else coalesce((select p.points from perf p where p.player_id=x.player_b),0) end
  where x.cup_id=c.id and x.round=rr;
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
  for m in select * from public.bizimskor_cup_matches where cup_id=c.id and round=rr loop
   if rr=1 and ((m.player_a is null)<>(m.player_b is null)) then continue;end if;
   if m.player_a is null or m.player_b is null then raise exception 'Kupa eşleşmesi eksik'; end if;
   select * into a from cup_private.week_score(m.player_a,c.season,c.start_week+rr-1,(select completed_at from public.bizimskor_cup_rounds where cup_id=c.id and round=rr));
   select * into b from cup_private.week_score(m.player_b,c.season,c.start_week+rr-1,(select completed_at from public.bizimskor_cup_rounds where cup_id=c.id and round=rr));
   if m.points_a<>m.points_b then reason:='Haftalık puan';
   elsif a.invites<>b.invites then reason:='Arkadaş davet sayısı';
   elsif a.exact<>b.exact then reason:='Tam skor sayısı';
   elsif a.correct<>b.correct then reason:='Doğru sonuç sayısı';
   elsif a.joined<>b.joined then reason:='Oyuna kayıt zamanı';else reason:='Oyuncu kayıt sırası';end if;
   if (m.points_a,a.invites,a.exact,a.correct,-extract(epoch from a.joined),-a.player_id)>(m.points_b,b.invites,b.exact,b.correct,-extract(epoch from b.joined),-b.player_id) then win:=m.player_a;lose:=m.player_b;else win:=m.player_b;lose:=m.player_a;end if;
   update public.bizimskor_cup_matches set winner_id=win,loser_id=lose,tie_reason=reason
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
 return jsonb_build_object('scoring_mode','weekly_performance','manual_draw',c.manual_draw,'title',c.title,'status',c.status,'start_week',c.start_week,'scheduled_at',c.scheduled_at,'drawn_at',c.drawn_at,'server_now',clock_timestamp(),'revealed_pairs',revealed,
 'is_owner',cup_private.owner(p_token),'authenticated',me is not null,
 'my_number',(select entry_no from public.bizimskor_cup_entries where cup_id=c.id and player_id=me),
 'count',(select count(*) from public.bizimskor_cup_entries where cup_id=c.id),
 'round_states',coalesce((select jsonb_agg(jsonb_build_object('round',rs.round,'completed',rs.completed,'total',rs.total,'complete',rs.total>0 and rs.completed=rs.total) order by rs.round) from (
  select rr round,count(f.id) total,count(r.fixture_id) filter(where r.home_score is not null and r.away_score is not null and lower(coalesce(r.status,'')) in('ft','finished','aet','pen')) completed
  from generate_series(1,6) rr left join public.fixtures f on f.season=c.season and f.week=c.start_week+rr-1 left join public.results r on r.fixture_id=f.id group by rr
 ) rs),'[]'::jsonb),
 'entries',coalesce((select jsonb_agg(jsonb_build_object('number',e.entry_no,'name',p.name) order by e.entry_no) from public.bizimskor_cup_entries e join public.players p on p.id=e.player_id where e.cup_id=c.id),'[]'::jsonb),
 'matches',coalesce((select jsonb_agg(jsonb_build_object('round',m.round,'position',m.position,'bronze',m.bronze,'name_a',case when m.round=1 then coalesce(pa.name,'BAY') else pa.name end,'name_b',case when m.round=1 then coalesce(pb.name,'BAY') else pb.name end,'points_a',m.points_a,'points_b',m.points_b,'winner',pw.name,'tie_reason',m.tie_reason) order by m.round,m.bronze,m.position)
 from public.bizimskor_cup_matches m left join public.players pa on pa.id=m.player_a left join public.players pb on pb.id=m.player_b left join public.players pw on pw.id=m.winner_id
 where m.cup_id=c.id and (m.round=1 and m.position<=revealed or m.round>1 and revealed=32)),'[]'::jsonb));
end $function$;

update public.bizimskor_cups set dirty=true where status in('running','finished');
