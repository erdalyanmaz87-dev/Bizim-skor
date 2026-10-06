-- The green SkorBot recommendation buttons read this dedicated table.
insert into public.robot_match_predictions
  (competition,fixture_id,season,week,home_score,away_score,source,generated_at)
values
  ('nations_league',9033,'2026/27',5,1,2,'robot_model_v1',now()),
  ('nations_league',9034,'2026/27',5,1,1,'robot_model_v1',now()),
  ('nations_league',9035,'2026/27',5,0,2,'robot_model_v1',now()),
  ('nations_league',9036,'2026/27',5,2,1,'robot_model_v1',now()),
  ('nations_league',9037,'2026/27',5,2,0,'robot_model_v1',now()),
  ('nations_league',9038,'2026/27',5,1,2,'robot_model_v1',now()),
  ('nations_league',9039,'2026/27',5,2,0,'robot_model_v1',now()),
  ('nations_league',9040,'2026/27',5,2,1,'robot_model_v1',now()),
  ('nations_league',9041,'2026/27',6,1,1,'robot_model_v1',now()),
  ('nations_league',9042,'2026/27',6,2,1,'robot_model_v1',now()),
  ('nations_league',9043,'2026/27',6,2,0,'robot_model_v1',now()),
  ('nations_league',9044,'2026/27',6,2,1,'robot_model_v1',now()),
  ('nations_league',9045,'2026/27',6,2,1,'robot_model_v1',now()),
  ('nations_league',9046,'2026/27',6,1,1,'robot_model_v1',now()),
  ('nations_league',9047,'2026/27',6,1,1,'robot_model_v1',now()),
  ('nations_league',9048,'2026/27',6,0,2,'robot_model_v1',now())
on conflict (competition,fixture_id) do update
set season=excluded.season,
    week=excluded.week,
    home_score=excluded.home_score,
    away_score=excluded.away_score,
    source=excluded.source,
    generated_at=excluded.generated_at;
