-- Read-only projection for weekly boards. Never writes results or season/Arena points.
create or replace function public.get_live_weekly_ranking(
 p_competition text, p_season text, p_week integer, p_token text default null
) returns jsonb language plpgsql stable security definer set search_path=''
as $function$
declare v_prefix text; v_points text; v_output jsonb;
begin
 v_prefix:=case p_competition when 'super_lig' then '' when 'champions_league' then 'champions_league_' when 'nations_league' then 'nations_league_' end;
 if v_prefix is null or p_week is null or p_week<1 or p_season is null then raise exception 'Geçersiz lig veya hafta'; end if;
 if p_competition<>'super_lig' and public.friend_session_player(p_token) is null then
  raise exception 'Oturum geçersiz veya süresi dolmuş';
 end if;
 v_points:=case p_competition
  when 'super_lig' then 'public.league_super_match_points(f.id,f.week,p.home_score::integer,p.away_score::integer,f.rh::integer,f.ra::integer)'
  when 'champions_league' then 'public.champions_match_points(f.id,p.home_score::smallint,p.away_score::smallint,f.rh::smallint,f.ra::smallint)'
  when 'nations_league' then 'public.nations_match_points(f.id,p.home_score::smallint,p.away_score::smallint,f.rh::smallint,f.ra::smallint)' end;
 execute format($query$
  with fixtures as (
   select f.id,f.week,f.scoring_version,
    case when f.kickoff<=now() then
     case when r.home_score is not null and r.away_score is not null then r.home_score
      when upper(c.status) in ('1H','HT','2H','ET','BT','P','FT','AET','PEN') then c.home_score end end rh,
    case when f.kickoff<=now() then
     case when r.home_score is not null and r.away_score is not null then r.away_score
      when upper(c.status) in ('1H','HT','2H','ET','BT','P','FT','AET','PEN') then c.away_score end end ra,
    (f.kickoff<=now() and (r.home_score is null or r.away_score is null)
     and upper(coalesce(c.status,'')) in ('1H','HT','2H','ET','BT','P')) is_live
   from public.%I f left join public.%I r on r.fixture_id=f.id
   left join public.live_score_cache c on c.competition=$3 and c.fixture_id=f.id
   where f.season=$1 and f.week=$2
  ), scored as (
   select p.player_name,pl.created_at,f.scoring_version,
    %s points,
    (f.rh is not null and f.ra is not null and p.home_score=f.rh and p.away_score=f.ra) exact_hit,
    (f.rh is not null and f.ra is not null and sign(p.home_score-p.away_score)=sign(f.rh-f.ra)) correct_hit,
    case when f.scoring_version=2 then public.prediction_base_points_v2(p.home_score::integer,p.away_score::integer,f.rh::integer,f.ra::integer) else 0 end base
   from fixtures f join public.%I p on p.fixture_id=f.id
   join public.players pl on pl.name=p.player_name and coalesce(pl.is_active,true)
  ), totals as (
   select s.player_name,s.created_at,coalesce(sum(s.points),0)::bigint points,
    count(*) filter(where exact_hit) exact_count,count(*) filter(where correct_hit) correct_count,
    count(*) filter(where base=10) exact_hits,count(*) filter(where base=6) difference_hits,
    count(*) filter(where base=4) total_hits,count(*) filter(where base=2) result_hits
   from scored s group by s.player_name,s.created_at
  ), invites as (
   select lower(e.inviter_name) inviter_key,count(distinct lower(e.invited_name)) invite_count
   from invite_ranking_private.eligible(invite_ranking_private.cutoff($3,$1,$2,null)) e
   group by lower(e.inviter_name)
  ), ranked as (
   select t.*,row_number() over(order by t.points desc,coalesce(i.invite_count,0) desc,
    t.exact_count desc,t.correct_count desc,t.created_at,t.player_name collate "tr-TR-x-icu") league_rank
   from totals t left join invites i on i.inviter_key=lower(t.player_name)
  )
  select jsonb_build_object(
   'live',coalesce((select bool_or(is_live) from fixtures),false),
   'current_week',(select max(w.week) from public.%I w where w.season=$1 and w.kickoff<=now()),
   'has_new_scoring',coalesce((select bool_or(scoring_version=2) from fixtures),false),
   'players',coalesce((select jsonb_agg(to_jsonb(r)-'created_at' order by league_rank) from ranked r),'[]'::jsonb)
  )
 $query$,v_prefix||'fixtures',v_prefix||'results',v_points,v_prefix||'predictions',v_prefix||'fixtures')
 into v_output using p_season,p_week,p_competition;
 return v_output;
end
$function$;
revoke all on function public.get_live_weekly_ranking(text,text,integer,text) from public;
grant execute on function public.get_live_weekly_ranking(text,text,integer,text) to anon,authenticated,service_role;
