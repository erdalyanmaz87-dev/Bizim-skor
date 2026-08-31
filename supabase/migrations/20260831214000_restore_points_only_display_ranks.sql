do $$
declare
  v_definition text;
  v_updated text;
begin
  select pg_get_functiondef('public.get_friend_league_ranking(text,uuid)'::regprocedure) into v_definition;
  v_updated := replace(v_definition,
    'rank() over(order by totals.points desc, totals.exact_count desc, totals.correct_count desc)',
    'dense_rank() over(order by totals.points desc)');
  if v_updated = v_definition then raise exception 'friend league ranking definition did not match'; end if;
  execute v_updated;

  select pg_get_functiondef('public.get_champions_league_ranking(text,text)'::regprocedure) into v_definition;
  v_updated := replace(v_definition,
    'rank() over(order by s.points desc,s.exact_count desc,s.correct_count desc)',
    'dense_rank() over(order by s.points desc)');
  if v_updated = v_definition then raise exception 'champions league ranking definition did not match'; end if;
  execute v_updated;

  select pg_get_functiondef('public.get_champions_league_history(text,text,integer)'::regprocedure) into v_definition;
  v_updated := replace(v_definition,
    'rank() over(order by s.points desc,s.exact_count desc,s.correct_count desc)',
    'dense_rank() over(order by s.points desc)');
  if v_updated = v_definition then raise exception 'champions league history definition did not match'; end if;
  execute v_updated;
end
$$;
