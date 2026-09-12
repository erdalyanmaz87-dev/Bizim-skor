-- Arena 1. dönem: 5-8. Süper Lig haftalarını maçlar sonuçlandıkça canlı hesaplar.
-- Başlangıç ligi sabittir; yalnız lig içi sıra ve haftalık/ortalama Arena puanı değişir.

create or replace function public.refresh_arena_live_super_week(
  p_period_id bigint,
  p_season text,
  p_week integer
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_fixture_count integer;
  v_written integer:=0;
begin
  perform 1 from public.league_periods lp
  where lp.id=p_period_id and lp.status='open'
  for update;
  if not found then
    raise exception 'Açık Arena dönemi bulunamadı';
  end if;

  select count(*)::integer into v_fixture_count
  from public.fixtures f
  where f.season=p_season and f.week=p_week;
  if v_fixture_count=0 then return 0; end if;

  -- Aynı haftanın puanı her sonuç değişiminde baştan kurulur.
  delete from public.league_round_performance rp
  where rp.period_id=p_period_id
    and rp.competition='super_lig'
    and rp.round_key=p_season||':'||p_week;

  with complete_players as (
    select p.player_name
    from public.predictions p
    join public.fixtures f on f.id=p.fixture_id
    join public.players pl on lower(pl.name)=lower(p.player_name) and coalesce(pl.is_active,true)
    where f.season=p_season and f.week=p_week
    group by p.player_name
    having count(distinct p.fixture_id)=v_fixture_count
  ), scored as (
    select
      pl.id player_id,
      pl.name player_name,
      pl.created_at,
      coalesce(sum(public.league_super_match_points(
        f.id,f.week,p.home_score,p.away_score,r.home_score,r.away_score
      )),0)::bigint points,
      count(*) filter(where r.fixture_id is not null and p.home_score=r.home_score and p.away_score=r.away_score)::integer exact_count,
      count(*) filter(where r.fixture_id is not null and sign(p.home_score-p.away_score)=sign(r.home_score-r.away_score))::integer correct_count
    from complete_players cp
    join public.players pl on lower(pl.name)=lower(cp.player_name)
    join public.predictions p on lower(p.player_name)=lower(cp.player_name)
    join public.fixtures f on f.id=p.fixture_id and f.season=p_season and f.week=p_week
    left join public.results r on r.fixture_id=f.id and r.home_score is not null and r.away_score is not null
    group by pl.id,pl.name,pl.created_at
  ), invites as (
    select lower(i.inviter_name) player_key,count(distinct lower(i.invited_name))::bigint invite_count
    from public.player_invites i
    group by lower(i.inviter_name)
  ), ranked as (
    select s.*,
      row_number() over(order by s.points desc,coalesce(i.invite_count,0) desc,s.exact_count desc,s.correct_count desc,s.created_at,s.player_name collate "tr-x-icu")::integer round_rank,
      count(*) over()::integer participant_count
    from scored s
    left join invites i on i.player_key=lower(s.player_name)
  )
  insert into public.league_round_performance(
    period_id,player_id,competition,round_key,participant_count,rank,
    performance_score,exact_score_count,raw_points,updated_at
  )
  select p_period_id,r.player_id,'super_lig',p_season||':'||p_week,
    r.participant_count,r.round_rank,
    public.league_normalized_performance(r.round_rank,r.participant_count),
    r.exact_count,r.points,now()
  from ranked r
  where r.participant_count>=2
  on conflict(period_id,player_id,competition,round_key) do update
    set participant_count=excluded.participant_count,
        rank=excluded.rank,
        performance_score=excluded.performance_score,
        exact_score_count=excluded.exact_score_count,
        raw_points=excluded.raw_points,
        updated_at=now();

  get diagnostics v_written=row_count;
  return v_written;
end;
$$;

create or replace function public.refresh_current_arena_live()
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_period_id bigint;
  v_start_at timestamptz;
  v_start_season text;
  v_start_week integer;
  rec record;
begin
  select lp.id,lp.starts_at into v_period_id,v_start_at
  from public.league_periods lp
  where lp.status='open'
  order by lp.starts_at desc
  limit 1;

  if v_period_id is null then
    perform public.bootstrap_first_league_period();
    select lp.id,lp.starts_at into v_period_id,v_start_at
    from public.league_periods lp where lp.status='open'
    order by lp.starts_at desc limit 1;
  end if;
  if v_period_id is null then return false; end if;

  select f.season,f.week into v_start_season,v_start_week
  from public.fixtures f
  where f.kickoff>=v_start_at
  order by f.kickoff,f.id
  limit 1;
  if v_start_season is null then return false; end if;

  -- Yalnız 5-8 dönem haftaları; en az bir sonuç girildiği anda o hafta canlıdır.
  for rec in
    select f.season,f.week
    from public.fixtures f
    left join public.results r on r.fixture_id=f.id
    where f.season=v_start_season
      and f.week between v_start_week and v_start_week+3
      and f.kickoff<=now()
    group by f.season,f.week
    having count(distinct r.fixture_id) filter(where r.home_score is not null and r.away_score is not null)>0
    order by f.week
  loop
    perform public.refresh_arena_live_super_week(v_period_id,rec.season,rec.week);
  end loop;

  -- Bu Arena dönemi yalnız 5-8 Süper Lig hafta puanlarının ortalamasıdır.
  delete from public.league_round_performance rp
  where rp.period_id=v_period_id and rp.competition<>'super_lig';

  perform public.refresh_league_memberships(v_period_id);

  -- İki hafta şartını sağlamayanlar puanı yüksek olsa da dönem sonunda düşme önceliğindedir.
  update public.league_memberships m
  set promotion_status=case when m.league_code='bronze' then 'none' else 'relegation' end,
      updated_at=now()
  where m.period_id=v_period_id and not m.is_eligible;

  return true;
end;
$$;

-- Okuma anında güncelle: maç sonucu işlendiğinde Arena ekranı saatlik cron'u beklemez.
create or replace function public.get_my_league_summary(p_token text)
returns table(period_id bigint,period_no integer,starts_at timestamptz,ends_at timestamptz,player_name text,league_code text,is_eligible boolean,valid_round_count integer,rounds_needed integer,performance_score numeric,rank_in_league integer,league_size bigint,promotion_status text,locked_promotion_slots jsonb)
language plpgsql security definer set search_path=''
as $$
declare v_player text;v_player_id bigint;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  perform public.refresh_current_arena_live();
  select p.id into v_player_id from public.players p where lower(p.name)=lower(v_player) limit 1;
  return query
  with cp as(select lp.* from public.league_periods lp where lp.status='open' order by lp.starts_at desc limit 1),
  mm as(select m.* from public.league_memberships m join cp on cp.id=m.period_id where m.player_id=v_player_id)
  select cp.id,cp.period_no,cp.starts_at,cp.ends_at,v_player,coalesce(mm.league_code,'bronze')::text,
    coalesce(mm.is_eligible,false),coalesce(mm.valid_round_count,0),greatest(0,2-coalesce(mm.valid_round_count,0)),
    mm.performance_score,mm.rank_in_league,
    case when mm.league_code is null then 0::bigint else(select count(*) from public.league_memberships x where x.period_id=cp.id and x.league_code=mm.league_code) end,
    coalesce(mm.promotion_status,'none')::text,cp.locked_promotion_slots
  from cp left join mm on true;
end;
$$;

create or replace function public.get_league_table(p_token text,p_league_code text default null)
returns table(league_code text,league_rank integer,player_name text,performance_score numeric,valid_round_count integer,exact_score_count integer,promotion_status text,is_me boolean)
language plpgsql security definer set search_path=''
as $$
declare v_player text;v_player_id bigint;v_period_id bigint;v_target_league text;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  perform public.refresh_current_arena_live();
  select p.id into v_player_id from public.players p where lower(p.name)=lower(v_player) limit 1;
  select lp.id into v_period_id from public.league_periods lp where lp.status='open' order by lp.starts_at desc limit 1;
  if v_period_id is null then return; end if;
  if p_league_code is not null then
    if p_league_code not in('champions','elite','gold','silver','bronze') then raise exception 'Lig kodu geçersiz'; end if;
    v_target_league:=p_league_code;
  else
    select m.league_code into v_target_league from public.league_memberships m where m.period_id=v_period_id and m.player_id=v_player_id;
    v_target_league:=coalesce(v_target_league,'bronze');
  end if;
  return query select m.league_code,m.rank_in_league,p.name,m.performance_score,m.valid_round_count,m.exact_score_count,m.promotion_status,(m.player_id=v_player_id)
  from public.league_memberships m join public.players p on p.id=m.player_id
  where m.period_id=v_period_id and m.league_code=v_target_league
  order by m.rank_in_league,p.name collate "tr-TR-x-icu";
end;
$$;

create or replace function public.get_arena_player_card(p_token text,p_player_name text)
returns table(player_name text,league_code text,league_rank integer,league_size bigint,performance_score numeric,valid_round_count integer,rounds_needed integer,is_eligible boolean,promotion_status text,rounds jsonb)
language plpgsql security definer set search_path=''
as $$
declare v_viewer text;v_period_id bigint;v_player_id bigint;
begin
  v_viewer:=public.friend_session_player(p_token);
  if v_viewer is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  perform public.refresh_current_arena_live();
  select lp.id into v_period_id from public.league_periods lp where lp.status='open' order by lp.starts_at desc limit 1;
  select p.id into v_player_id from public.players p where lower(p.name)=lower(trim(p_player_name)) and coalesce(p.is_active,true) limit 1;
  if v_period_id is null or v_player_id is null then return; end if;
  return query select p.name,m.league_code,m.rank_in_league,
    (select count(*) from public.league_memberships x where x.period_id=m.period_id and x.league_code=m.league_code),
    m.performance_score,m.valid_round_count,greatest(0,2-coalesce(m.valid_round_count,0)),m.is_eligible,m.promotion_status,
    coalesce((select jsonb_agg(jsonb_build_object('competition',rp.competition,'round_key',rp.round_key,'participant_count',rp.participant_count,'rank',rp.rank,'performance_score',rp.performance_score,'exact_score_count',rp.exact_score_count,'raw_points',rp.raw_points) order by rp.round_key)
      from public.league_round_performance rp where rp.period_id=m.period_id and rp.player_id=m.player_id and rp.competition='super_lig'),'[]'::jsonb)
  from public.league_memberships m join public.players p on p.id=m.player_id
  where m.period_id=v_period_id and m.player_id=v_player_id;
end;
$$;

revoke execute on function public.refresh_arena_live_super_week(bigint,text,integer) from public,anon,authenticated;
revoke execute on function public.refresh_current_arena_live() from public,anon,authenticated;
revoke execute on function public.get_my_league_summary(text) from public,authenticated;
revoke execute on function public.get_league_table(text,text) from public,authenticated;
revoke execute on function public.get_arena_player_card(text,text) from public,authenticated;
grant execute on function public.get_my_league_summary(text) to anon;
grant execute on function public.get_league_table(text,text) to anon;
grant execute on function public.get_arena_player_card(text,text) to anon;

-- Migration uygulanır uygulanmaz 5. hafta canlı dönemini aç ve ilk puanları işle.
select public.refresh_current_arena_live();
