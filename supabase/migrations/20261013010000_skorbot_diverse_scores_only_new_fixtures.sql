-- New inserted future fixtures only; never revise existing predictions.
CREATE OR REPLACE FUNCTION public.skorbot_future_score_v2(p_competition text, p_season text, p_fixture_id bigint, p_home_team text, p_away_team text, p_kickoff timestamp with time zone)
 RETURNS TABLE(home_score smallint, away_score smallint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_home_for numeric := 1.45;
  v_home_against numeric := 1.25;
  v_away_for numeric := 1.25;
  v_away_against numeric := 1.45;
  v_lambda_home numeric;
  v_lambda_away numeric;
  v_form_gap numeric;
  v_random numeric;
  v_prob numeric;
  v_cumulative numeric;
  v_goals integer;
  v_side text;
begin
  if p_competition not in ('super_lig','champions_league','nations_league')
     or p_kickoff is null or p_fixture_id is null then
    raise exception 'Invalid SkorBot future fixture';
  end if;
  -- Look only at completed matches BEFORE the fixture. At most five recent matches per team.
  -- No external API calls or random changes when the player opens the match.
  with completed as (
    select f.id, f.kickoff, f.home_team, f.away_team, r.home_score, r.away_score
      from public.fixtures f join public.results r on r.fixture_id=f.id
     where p_competition='super_lig' and f.season=p_season and f.kickoff<p_kickoff
       and r.home_score is not null and r.away_score is not null
    union all
    select f.id,f.kickoff,f.home_team,f.away_team,r.home_score,r.away_score
      from public.champions_league_fixtures f join public.champions_league_results r on r.fixture_id=f.id
     where p_competition='champions_league' and f.season=p_season and f.kickoff<p_kickoff
       and r.home_score is not null and r.away_score is not null
    union all
    select f.id,f.kickoff,f.home_team,f.away_team,r.home_score,r.away_score
      from public.nations_league_fixtures f join public.nations_league_results r on r.fixture_id=f.id
     where p_competition='nations_league' and f.season=p_season and f.kickoff<p_kickoff
       and r.home_score is not null and r.away_score is not null
  ), last_home as (
    select * from completed
     where home_team=p_home_team or away_team=p_home_team
     order by kickoff desc,id desc limit 5
  ), last_away as (
    select * from completed
     where home_team=p_away_team or away_team=p_away_team
     order by kickoff desc,id desc limit 5
  )
  select
    coalesce((select avg(case when home_team=p_home_team then h.home_score else h.away_score end) from last_home h),1.45),
    coalesce((select avg(case when home_team=p_home_team then h.away_score else h.home_score end) from last_home h),1.25),
    coalesce((select avg(case when home_team=p_away_team then a.home_score else a.away_score end) from last_away a),1.25),
    coalesce((select avg(case when home_team=p_away_team then a.away_score else a.home_score end) from last_away a),1.45)
  into v_home_for,v_home_against,v_away_for,v_away_against;

  v_form_gap := (v_home_for-v_home_against) - (v_away_for-v_away_against);
  v_lambda_home := least(4.2,greatest(0.5,
       1.48 + 0.30*(v_home_for-1.45) + 0.24*(v_away_against-1.45) + 0.11*v_form_gap));
  v_lambda_away := least(4.0,greatest(0.4,
       1.17 + 0.30*(v_away_for-1.25) + 0.24*(v_home_against-1.25) - 0.11*v_form_gap));

  -- Some matches are naturally more open. Deterministic 12% uplift creates
  -- occasional 4-2, 4-3, 5-1, etc, without forcing high scores in every fixture.
  v_random := (('x'||substr(md5(concat_ws('|',p_competition,p_season,p_fixture_id,p_home_team,p_away_team,'tempo')),1,8))::bit(32)::bigint)::numeric / 4294967296;
  if v_random<0.12 then
    v_lambda_home := least(4.8,v_lambda_home+0.68);
    v_lambda_away := least(4.6,v_lambda_away+0.54);
  end if;

  for v_side in select unnest(array['home','away']) loop
    v_random := (('x'||substr(md5(concat_ws('|',p_competition,p_season,p_fixture_id,p_home_team,p_away_team,v_side)),1,8))::bit(32)::bigint)::numeric / 4294967296;
    v_prob := exp(-(case when v_side='home' then v_lambda_home else v_lambda_away end));
    v_cumulative := v_prob;
    v_goals := 0;
    while v_goals < 6 and v_random > v_cumulative loop
      v_goals := v_goals + 1;
      v_prob := v_prob * (case when v_side='home' then v_lambda_home else v_lambda_away end) / v_goals;
      v_cumulative := v_cumulative + v_prob;
    end loop;
    if v_side='home' then home_score := v_goals::smallint;
    else away_score := v_goals::smallint; end if;
  end loop;
  return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.skorbot_seed_new_fixture_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_competition text;
  v_home smallint;
  v_away smallint;
begin
  -- INSERT only, and only a truly future kickoff: existing fixtures untouched.
  if new.kickoff is null or new.kickoff <= now() then return new; end if;
  v_competition := case tg_table_name
    when 'fixtures' then 'super_lig'
    when 'champions_league_fixtures' then 'champions_league'
    when 'nations_league_fixtures' then 'nations_league'
    else null end;
  if v_competition is null then return new; end if;
  select s.home_score,s.away_score into v_home,v_away
    from public.skorbot_future_score_v2(v_competition,new.season,new.id,
                  new.home_team,new.away_team,new.kickoff) s;
  insert into public.robot_match_predictions
    (competition,fixture_id,season,week,home_score,away_score,source)
  values (v_competition,new.id,new.season,new.week,v_home,v_away,'robot_model_v2')
  on conflict (competition,fixture_id) do nothing;
  return new;
end $function$
;
drop trigger if exists trg_skorbot_seed_future_v2 on public.fixtures;
create trigger trg_skorbot_seed_future_v2 after insert on public.fixtures for each row execute function public.skorbot_seed_new_fixture_v2();
drop trigger if exists trg_skorbot_seed_future_v2 on public.champions_league_fixtures;
create trigger trg_skorbot_seed_future_v2 after insert on public.champions_league_fixtures for each row execute function public.skorbot_seed_new_fixture_v2();
drop trigger if exists trg_skorbot_seed_future_v2 on public.nations_league_fixtures;
create trigger trg_skorbot_seed_future_v2 after insert on public.nations_league_fixtures for each row execute function public.skorbot_seed_new_fixture_v2();
