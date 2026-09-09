-- Bizim Skor Ligleri: Ligim arayüzündeki Diğer Ligler sayaçları.
-- Yalnız geçerli oyuncu oturumuna, açık dönemdeki lig oyuncu adetlerini döndürür.

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
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  return query
  select
    m.league_code::text,
    count(*)::bigint as player_count
  from public.league_memberships m
  join public.league_periods lp on lp.id=m.period_id
  where lp.status='open'
  group by m.league_code
  order by case m.league_code
    when 'champions' then 1
    when 'elite' then 2
    when 'gold' then 3
    when 'silver' then 4
    when 'bronze' then 5
    else 6
  end;
end;
$$;

revoke execute on function public.get_league_counts(text) from public,authenticated;
grant execute on function public.get_league_counts(text) to anon;
