create or replace function public.nations_match_points(p_fixture_id bigint,p_home smallint,p_away smallint,r_home smallint,r_away smallint)
returns bigint
language sql
immutable
as $function$
  select case
    when r_home is null or r_away is null or p_home is null or p_away is null then 0
    when p_fixture_id in (9006,9014) and p_home=r_home and p_away=r_away then 8
    when p_fixture_id in (9006,9014) and sign(p_home-p_away)=sign(r_home-r_away) then 2
    when p_home=r_home and p_away=r_away then 4
    when sign(p_home-p_away)=sign(r_home-r_away) then 1
    else 0
  end
$function$;

grant execute on function public.nations_match_points(bigint,smallint,smallint,smallint,smallint) to anon,authenticated;
notify pgrst, 'reload schema';
