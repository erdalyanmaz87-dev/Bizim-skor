-- Arena oyuncu kartında oynanmış tüm organizasyon haftalarını kronolojik gösterir.
-- Kupa haftaları Arena ortalamasına dahildir; geçerli tur sayısı üyelik tablosunda
-- yalnız Süper Lig haftalarından hesaplanmaya devam eder.

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
volatile
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

  perform public.refresh_current_arena_live();

  select lp.id into v_period_id
  from public.league_periods lp
  where lp.status='open'
  order by lp.starts_at desc
  limit 1;

  select p.id into v_player_id
  from public.players p
  where lower(p.name)=lower(trim(p_player_name))
    and coalesce(p.is_active,true)
  limit 1;

  if v_period_id is null or v_player_id is null then return; end if;

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
        'competition',ar.competition,
        'round_key',ar.round_key,
        'lock_time',ar.lock_time,
        'participant_count',coalesce(rp.participant_count,(
          select max(rp2.participant_count)
          from public.league_round_performance rp2
          where rp2.period_id=m.period_id
            and rp2.competition=ar.competition
            and rp2.round_key=ar.round_key
        )),
        'rank',rp.rank,
        'performance_score',ar.performance_score,
        'exact_score_count',ar.exact_score_count,
        'raw_points',ar.raw_points
      ) order by ar.lock_time,ar.competition,ar.round_key)
      from public.arena_accessible_rounds(m.period_id,m.player_id) ar
      left join public.league_round_performance rp
        on rp.period_id=m.period_id
       and rp.player_id=m.player_id
       and rp.competition=ar.competition
       and rp.round_key=ar.round_key
    ),'[]'::jsonb)
  from public.league_memberships m
  join public.players p on p.id=m.player_id
  where m.period_id=v_period_id and m.player_id=v_player_id;
end;
$$;

revoke execute on function public.get_arena_player_card(text,text) from public,authenticated;
grant execute on function public.get_arena_player_card(text,text) to anon;
