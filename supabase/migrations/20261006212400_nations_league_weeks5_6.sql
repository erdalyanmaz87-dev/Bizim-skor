insert into public.nations_league_fixtures (id,season,week,home_team,away_team,kickoff)
values
  (9033,'2026/27',5,'Türkiye','Belçika','2026-11-12 17:00:00+00'),
  (9034,'2026/27',5,'İtalya','Fransa','2026-11-12 19:45:00+00'),
  (9035,'2026/27',5,'Çekya','İspanya','2026-11-12 19:45:00+00'),
  (9036,'2026/27',5,'İngiltere','Hırvatistan','2026-11-12 19:45:00+00'),
  (9037,'2026/27',5,'Hollanda','Yunanistan','2026-11-13 19:45:00+00'),
  (9038,'2026/27',5,'Sırbistan','Almanya','2026-11-13 19:45:00+00'),
  (9039,'2026/27',5,'Norveç','Galler','2026-11-14 17:00:00+00'),
  (9040,'2026/27',5,'Portekiz','Danimarka','2026-11-14 19:45:00+00'),
  (9041,'2026/27',6,'Belçika','İtalya','2026-11-15 19:45:00+00'),
  (9042,'2026/27',6,'Fransa','Türkiye','2026-11-15 19:45:00+00'),
  (9043,'2026/27',6,'Hırvatistan','Çekya','2026-11-15 19:45:00+00'),
  (9044,'2026/27',6,'İspanya','İngiltere','2026-11-15 19:45:00+00'),
  (9045,'2026/27',6,'Almanya','Hollanda','2026-11-16 19:45:00+00'),
  (9046,'2026/27',6,'Yunanistan','Sırbistan','2026-11-16 19:45:00+00'),
  (9047,'2026/27',6,'Danimarka','Norveç','2026-11-17 19:45:00+00'),
  (9048,'2026/27',6,'Galler','Portekiz','2026-11-17 19:45:00+00')
on conflict (id) do update
set season=excluded.season,
    week=excluded.week,
    home_team=excluded.home_team,
    away_team=excluded.away_team,
    kickoff=excluded.kickoff;

update public.opportunity_matches
set show_in_menu=false
where competition='nations_league'
  and fixture_id in (9022,9030);

insert into public.opportunity_matches (competition,fixture_id,show_in_menu)
values
  ('nations_league',9034,true),
  ('nations_league',9044,true)
on conflict (competition,fixture_id) do update
set show_in_menu=excluded.show_in_menu;

insert into public.nations_league_predictions
  (player_name,fixture_id,home_score,away_score,robot_applied)
values
  ('🤖 SkorBot',9033,1,2,true),
  ('🤖 SkorBot',9034,1,1,true),
  ('🤖 SkorBot',9035,0,2,true),
  ('🤖 SkorBot',9036,2,1,true),
  ('🤖 SkorBot',9037,2,0,true),
  ('🤖 SkorBot',9038,1,2,true),
  ('🤖 SkorBot',9039,2,0,true),
  ('🤖 SkorBot',9040,2,1,true),
  ('🤖 SkorBot',9041,1,1,true),
  ('🤖 SkorBot',9042,2,1,true),
  ('🤖 SkorBot',9043,2,0,true),
  ('🤖 SkorBot',9044,2,1,true),
  ('🤖 SkorBot',9045,2,1,true),
  ('🤖 SkorBot',9046,1,1,true),
  ('🤖 SkorBot',9047,1,1,true),
  ('🤖 SkorBot',9048,0,2,true)
on conflict (player_name,fixture_id) do update
set home_score=excluded.home_score,
    away_score=excluded.away_score,
    robot_applied=excluded.robot_applied,
    updated_at=now();

notify pgrst, 'reload schema';
