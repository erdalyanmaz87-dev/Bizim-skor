drop function if exists public.get_champions_league_available_weeks(text,text);

create or replace function public.get_champions_league_available_weeks(
  p_token text,
  p_season text default '2026/27'
)
returns table(
  week integer
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_player text;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  return query
  select distinct f.week
  from public.champions_league_fixtures f
  where f.season=p_season
  order by f.week;
end
$function$;

grant execute on function public.get_champions_league_available_weeks(text,text) to anon, authenticated;
notify pgrst, 'reload schema';
