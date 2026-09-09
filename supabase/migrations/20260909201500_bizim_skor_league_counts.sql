-- Bizim Skor Ligleri: yalnız görüntüleme için lig bazlı aktif oyuncu sayıları.

create or replace function public.get_league_counts(
  p_token text
) returns table(
  league_code text,
  player_count bigint
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_player text;
  v_period_id bigint;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;

  select lp.id into v_period_id
  from public.league_periods lp
  where lp.status='open'
  order by lp.starts_at desc
  limit 1;

  if v_period_id is null then return; end if;

  return query
  with codes(code,ord) as (
    values
      ('champions'::text,1),
      ('elite'::text,2),
      ('gold'::text,3),
      ('silver'::text,4),
      ('bronze'::text,5)
  )
  select c.code,
         count(m.player_id)::bigint
  from codes c
  left join public.league_memberships m
    on m.period_id=v_period_id
   and m.league_code=c.code
   and m.is_eligible
  group by c.code,c.ord
  order by c.ord;
end;
$$;

revoke execute on function public.get_league_counts(text) from public,authenticated;
grant execute on function public.get_league_counts(text) to anon;
