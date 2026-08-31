insert into public.fixtures(id,season,week,home_team,away_team,kickoff) values
(28,'2026/27',4,'Başakşehir','Galatasaray','2026-09-04 17:00:00+00'),
(29,'2026/27',4,'Erzurumspor FK','Konyaspor','2026-09-05 14:00:00+00'),
(30,'2026/27',4,'Fenerbahçe','Beşiktaş','2026-09-05 17:00:00+00'),
(31,'2026/27',4,'Kasımpaşa','Amed SK','2026-09-06 14:00:00+00'),
(32,'2026/27',4,'Çorum FK','Eyüpspor','2026-09-06 14:00:00+00'),
(33,'2026/27',4,'Trabzonspor','Gençlerbirliği','2026-09-06 17:00:00+00'),
(34,'2026/27',4,'Kocaelispor','Samsunspor','2026-09-06 17:00:00+00'),
(35,'2026/27',4,'Ç. Rizespor','Alanyaspor','2026-09-07 17:00:00+00'),
(36,'2026/27',4,'Göztepe','Gaziantep FK','2026-09-07 17:00:00+00')
on conflict (id) do update set
  season=excluded.season,
  week=excluded.week,
  home_team=excluded.home_team,
  away_team=excluded.away_team,
  kickoff=excluded.kickoff;

create or replace function public.save_super_league_week_predictions(
  p_token text,
  p_week integer,
  p_predictions jsonb
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_player text;
  v_lock_time timestamptz;
  v_fixture_count integer;
  v_valid_count integer;
begin
  select s.player_name into v_player
  from public.friend_league_sessions s
  where s.token_hash=extensions.digest(p_token,'sha256')
    and s.expires_at>now()
  limit 1;

  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;
  if jsonb_typeof(p_predictions)<>'array' then
    raise exception 'Tahmin listesi geçersiz';
  end if;

  select min(kickoff),count(*) into v_lock_time,v_fixture_count
  from public.fixtures
  where season='2026/27' and week=p_week;

  if v_fixture_count=0 then
    raise exception 'Fikstür bulunamadı';
  end if;
  if now()>=v_lock_time then
    raise exception 'Bu haftanın tahmin süresi doldu';
  end if;
  if jsonb_array_length(p_predictions)<>v_fixture_count then
    raise exception 'Tüm maçları doldurun';
  end if;

  with submitted as (
    select x.fixture_id,x.home_score,x.away_score
    from jsonb_to_recordset(p_predictions)
      as x(fixture_id bigint,home_score integer,away_score integer)
  )
  select count(distinct fixture_id) into v_valid_count
  from submitted s
  join public.fixtures f on f.id=s.fixture_id
  where f.season='2026/27'
    and f.week=p_week
    and s.home_score between 0 and 20
    and s.away_score between 0 and 20;

  if v_valid_count<>v_fixture_count then
    raise exception 'Tahminler eksik veya geçersiz';
  end if;

  insert into public.predictions(player_name,fixture_id,week,home_score,away_score)
  select v_player,x.fixture_id,p_week,x.home_score,x.away_score
  from jsonb_to_recordset(p_predictions)
    as x(fixture_id bigint,home_score integer,away_score integer)
  on conflict (player_name,fixture_id) do update
  set week=excluded.week,
      home_score=excluded.home_score,
      away_score=excluded.away_score;

  return true;
end;
$$;

revoke insert,update,delete on public.predictions from public,anon,authenticated;
revoke execute on function public.save_super_league_week_predictions(text,integer,jsonb) from public,authenticated;
grant execute on function public.save_super_league_week_predictions(text,integer,jsonb) to anon;
