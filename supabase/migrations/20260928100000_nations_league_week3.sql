insert into public.nations_league_fixtures (id,season,week,home_team,away_team,kickoff)
values
  (9017,'2026/27',3,'Almanya','Sırbistan','2026-10-01 18:45:00+00'),
  (9018,'2026/27',3,'Yunanistan','Hollanda','2026-10-01 18:45:00+00'),
  (9019,'2026/27',3,'Danimarka','Portekiz','2026-10-01 18:45:00+00'),
  (9020,'2026/27',3,'Galler','Norveç','2026-10-01 18:45:00+00'),
  (9021,'2026/27',3,'Belçika','Türkiye','2026-10-02 18:45:00+00'),
  (9022,'2026/27',3,'Fransa','İtalya','2026-10-02 18:45:00+00'),
  (9023,'2026/27',3,'Hırvatistan','İngiltere','2026-10-03 16:00:00+00'),
  (9024,'2026/27',3,'İspanya','Çekya','2026-10-03 18:45:00+00')
on conflict (id) do update
set season=excluded.season,
    week=excluded.week,
    home_team=excluded.home_team,
    away_team=excluded.away_team,
    kickoff=excluded.kickoff;

create or replace function public.nations_match_points(p_fixture_id bigint,p_home smallint,p_away smallint,r_home smallint,r_away smallint)
returns bigint
language sql
immutable
set search_path = ''
as $function$
  select case
    when r_home is null or r_away is null or p_home is null or p_away is null then 0
    when p_fixture_id in (9006,9014,9022) and p_home=r_home and p_away=r_away then 8
    when p_fixture_id in (9006,9014,9022) and sign(p_home-p_away)=sign(r_home-r_away) then 2
    when p_home=r_home and p_away=r_away then 4
    when sign(p_home-p_away)=sign(r_home-r_away) then 1
    else 0
  end
$function$;

grant execute on function public.nations_match_points(bigint,smallint,smallint,smallint,smallint) to anon,authenticated;
notify pgrst, 'reload schema';
