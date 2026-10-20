create or replace function public.capture_cup_ranking_movement(p_competition text,p_fixture_id bigint,p_capture boolean default true)
returns boolean language plpgsql security definer set search_path=''
as $function$
declare v_season text;v_week integer;v_rows jsonb;
begin
 if p_competition='champions_league' then
  select f.season,f.week into v_season,v_week from public.champions_league_fixtures f where f.id=p_fixture_id;
 elsif p_competition='nations_league' then
  select f.season,f.week into v_season,v_week from public.nations_league_fixtures f where f.id=p_fixture_id;
 else return false;end if;
 if v_season is null then return false;end if;
 -- One identical projection feeds both movements and the new snapshot.
 select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) into v_rows
 from public.cup_ranking_rows(p_competition,v_season,v_week,null)c;
 if p_capture then
  delete from public.ranking_latest_movements where competition=p_competition;
  insert into public.ranking_latest_movements(competition,scope,context_id,week,fixture_id,player_name,before_rank,after_rank,changed_at)
  select p_competition,c.scope,c.context_id,c.week,p_fixture_id,c.player_name,s.rank,c.rank,now()
  from jsonb_to_recordset(v_rows)c(scope text,context_id text,week integer,player_name text,rank bigint)
  left join public.ranking_current_snapshots s on s.competition=p_competition and s.scope=c.scope and s.context_id=c.context_id and lower(s.player_name)=lower(c.player_name)
  where s.rank is not null;
 end if;
 delete from public.ranking_current_snapshots where competition=p_competition;
 insert into public.ranking_current_snapshots(competition,scope,context_id,week,player_name,rank,updated_at)
 select p_competition,c.scope,c.context_id,c.week,c.player_name,c.rank,now()
 from jsonb_to_recordset(v_rows)c(scope text,context_id text,week integer,player_name text,rank bigint);
 return true;
end
$function$;
