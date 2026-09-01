create or replace function public.list_player_ranking_directory(p_token text)
returns table(name text,is_active boolean,registration_order bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.friend_session_player(p_token) is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;
  return query
  select p.name,coalesce(p.is_active,true),
    row_number() over(order by p.created_at,p.name collate "tr-x-icu")::bigint
  from public.players p
  order by p.created_at,p.name collate "tr-x-icu";
end
$$;

revoke all on function public.list_player_ranking_directory(text) from public;
grant execute on function public.list_player_ranking_directory(text) to anon, authenticated;

do $$
declare
  v_definition text;
  v_updated text;
begin
  select pg_get_functiondef('public.get_friend_league_ranking(text,uuid)'::regprocedure) into v_definition;
  v_updated := replace(v_definition,
    'select dense_rank() over(order by totals.points desc),
         totals.player_name, totals.points, totals.exact_count, totals.correct_count, totals.score_start_week
  from totals
  order by totals.points desc, totals.exact_count desc, totals.correct_count desc,
           totals.player_name collate "tr-x-icu";',
    'select case when ranked.point_rank<=3 then ranked.point_rank else 3+ranked.tail_rank end,
         ranked.player_name, ranked.points, ranked.exact_count, ranked.correct_count, ranked.score_start_week
  from (
    select ordered.*,
      row_number() over(partition by (ordered.point_rank>3)
        order by ordered.points desc,ordered.exact_count desc,ordered.correct_count desc,
                 ordered.created_at,ordered.player_name collate "tr-x-icu") as tail_rank
    from (
      select totals.*,pl.created_at,
        dense_rank() over(order by totals.points desc) as point_rank
      from totals
      join public.players pl on pl.name=totals.player_name
    ) ordered
  ) ranked
  order by case when ranked.point_rank<=3 then ranked.point_rank else 3+ranked.tail_rank end;');
  if v_updated = v_definition then raise exception 'friend league ranking definition did not match'; end if;
  execute v_updated;

  select pg_get_functiondef('public.get_champions_league_ranking(text,text)'::regprocedure) into v_definition;
  v_updated := replace(v_definition,
    '), ranked as (
    select s.*,dense_rank() over(order by s.points desc) as league_rank
    from scored s
  )
  select r.league_rank,r.player_name,r.points,r.exact_count,r.correct_count
  from ranked r order by r.league_rank,r.player_name collate "tr-TR-x-icu";',
    '), point_ranked as (
    select s.*,pl.created_at,dense_rank() over(order by s.points desc) as point_rank
    from scored s join public.players pl on pl.name=s.player_name
  ), ranked as (
    select p.*,
      case when p.point_rank<=3 then p.point_rank else 3+
        row_number() over(partition by (p.point_rank>3)
          order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-TR-x-icu")
      end as league_rank
    from point_ranked p
  )
  select r.league_rank,r.player_name,r.points,r.exact_count,r.correct_count
  from ranked r order by r.league_rank,r.player_name collate "tr-TR-x-icu";');
  if v_updated = v_definition then raise exception 'champions league ranking definition did not match'; end if;
  execute v_updated;

  select pg_get_functiondef('public.get_champions_league_history(text,text,integer)'::regprocedure) into v_definition;
  v_updated := replace(v_definition,
    '), ranked as (
    select s.*,
      dense_rank() over(order by s.points desc) as player_rank
    from scored s
  ), summary as (',
    '), point_ranked as (
    select s.*,pl.created_at,dense_rank() over(order by s.points desc) as point_rank
    from scored s join public.players pl on pl.name=s.player_name
  ), ranked as (
    select p.*,
      case when p.point_rank<=3 then p.point_rank else 3+
        row_number() over(partition by (p.point_rank>3)
          order by p.points desc,p.exact_count desc,p.correct_count desc,p.created_at,p.player_name collate "tr-TR-x-icu")
      end as player_rank
    from point_ranked p
  ), summary as (');
  if v_updated = v_definition then raise exception 'champions league history definition did not match'; end if;
  execute v_updated;
end
$$;
