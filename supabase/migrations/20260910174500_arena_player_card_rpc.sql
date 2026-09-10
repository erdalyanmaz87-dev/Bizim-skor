-- Arena oyuncu kartı için güvenli, salt-okunur detay RPC'si.
-- Mevcut puanlama/sıralama hesaplarını değiştirmez; yalnız açık dönemdeki üye ve tur performanslarını okur.

create or replace function public.get_arena_player_card(
  p_token text,
  p_player_name text
) returns table(
  player_name text,
  league_code text,
  league_rank integer,
  league_size bigint,
  performance_score numeric,
  valid_round_count integer,
  rounds_needed integer,
  is_eligible boolean,
  promotion_status text,
  rounds jsonb
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_viewer text;
  v_period_id bigint;
  v_player_id bigint;
begin
  v_viewer:=public.friend_session_player(p_token);
  if v_viewer is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;

  select lp.id into v_period_id
  from public.league_periods lp
  where lp.status='open'
  order by lp.starts_at desc
  limit 1;

  if v_period_id is null then return; end if;

  select p.id into v_player_id
  from public.players p
  where lower(p.name)=lower(trim(p_player_name))
    and coalesce(p.is_active,true)
  limit 1;

  if v_player_id is null then return; end if;

  return query
  select
    p.name,
    m.league_code,
    m.rank_in_league,
    (select count(*) from public.league_memberships x where x.period_id=m.period_id and x.league_code=m.league_code),
    m.performance_score,
    m.valid_round_count,
    greatest(0,2-coalesce(m.valid_round_count,0)),
    m.is_eligible,
    m.promotion_status,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'competition',rp.competition,
        'round_key',rp.round_key,
        'participant_count',rp.participant_count,
        'rank',rp.rank,
        'performance_score',rp.performance_score,
        'exact_score_count',rp.exact_score_count,
        'raw_points',rp.raw_points
      ) order by rp.updated_at,rp.competition,rp.round_key)
      from public.league_round_performance rp
      where rp.period_id=m.period_id and rp.player_id=m.player_id
    ),'[]'::jsonb)
  from public.league_memberships m
  join public.players p on p.id=m.player_id
  where m.period_id=v_period_id and m.player_id=v_player_id;
end;
$$;

revoke execute on function public.get_arena_player_card(text,text) from public,authenticated;
grant execute on function public.get_arena_player_card(text,text) to anon;
