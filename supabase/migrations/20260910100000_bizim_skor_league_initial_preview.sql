-- Bizim Skor Arena: ilk gerçek dönem açılmadan önce 3. ve 4. hafta seed dağılımını salt-okunur gösterir.
-- Bu RPC initialize_first_league_period ile aynı katılımcı, kapasite ve eşitlik sırasını kullanır; veri yazmaz.

create or replace function public.get_league_initial_preview(
  p_token text
) returns table(
  player_name text,
  league_code text,
  league_rank integer,
  performance_score numeric,
  exact_score_count integer,
  raw_points bigint,
  is_me boolean
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_player text;
  v_starts_at timestamptz;
  v_count integer;
  v_capacities jsonb;
  v_champions integer;
  v_elite integer;
  v_gold integer;
  v_silver integer;
begin
  v_player:=public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  -- Gerçek dönem zaten açıldıysa önizleme kullanılmaz.
  if exists(select 1 from public.league_periods) then
    return;
  end if;

  select min(f.kickoff)
    into v_starts_at
  from public.fixtures f
  where f.week=5
    and f.season=(
      select f2.season
      from public.fixtures f2
      where f2.week=5
      group by f2.season
      order by min(f2.kickoff) desc
      limit 1
    );

  if v_starts_at is null then
    return;
  end if;

  with participants as (
    select distinct lower(p.player_name) as player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  )
  select count(*)::integer into v_count
  from public.players pl
  join participants x on x.player_key=lower(pl.name)
  where coalesce(pl.is_active,true)
    and pl.created_at<=v_starts_at;

  if v_count<5 then
    return;
  end if;

  v_capacities:=public.league_allocate_capacities(v_count);
  v_champions:=coalesce((v_capacities->>'champions')::integer,0);
  v_elite:=coalesce((v_capacities->>'elite')::integer,0);
  v_gold:=coalesce((v_capacities->>'gold')::integer,0);
  v_silver:=coalesce((v_capacities->>'silver')::integer,0);

  return query
  with participants as (
    select distinct lower(p.player_name) as player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  ), historical as (
    select * from public.league_historical_seed_scores(v_starts_at)
  ), invites as (
    select lower(i.inviter_name) as player_key,count(distinct lower(i.invited_name))::integer as invite_count
    from public.player_invites i
    group by lower(i.inviter_name)
  ), scored as (
    select
      pl.id as player_id,
      pl.name as player_name,
      coalesce(h.performance_score,0)::numeric(6,2) as performance_score,
      coalesce(i.invite_count,0)::integer as invite_count,
      coalesce(h.valid_round_count,0)::integer as valid_round_count,
      coalesce(h.exact_score_count,0)::integer as exact_score_count,
      coalesce(h.raw_points,0)::bigint as raw_points
    from public.players pl
    join participants x on x.player_key=lower(pl.name)
    left join historical h on h.player_id=pl.id
    left join invites i on i.player_key=lower(pl.name)
    where coalesce(pl.is_active,true)
      and pl.created_at<=v_starts_at
  ), ordered as (
    select
      s.*,
      row_number() over(
        order by s.performance_score desc,
                 s.invite_count desc,
                 s.valid_round_count desc,
                 s.exact_score_count desc,
                 s.raw_points desc,
                 s.player_id
      )::integer as seed_rank
    from scored s
  ), seeded as (
    select
      o.*,
      case
        when o.seed_rank<=v_champions then 'champions'
        when o.seed_rank<=v_champions+v_elite then 'elite'
        when o.seed_rank<=v_champions+v_elite+v_gold then 'gold'
        when o.seed_rank<=v_champions+v_elite+v_gold+v_silver then 'silver'
        else 'bronze'
      end::text as league_code
    from ordered o
  ), ranked as (
    select
      s.*,
      row_number() over(partition by s.league_code order by s.seed_rank)::integer as league_rank
    from seeded s
  )
  select
    r.player_name::text,
    r.league_code::text,
    r.league_rank,
    r.performance_score::numeric,
    r.exact_score_count,
    r.raw_points,
    (lower(r.player_name)=lower(v_player))::boolean as is_me
  from ranked r
  order by r.seed_rank;
end;
$$;

revoke execute on function public.get_league_initial_preview(text) from public,authenticated;
grant execute on function public.get_league_initial_preview(text) to anon;
