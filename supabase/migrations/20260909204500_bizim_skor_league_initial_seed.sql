-- Bizim Skor Ligleri: yalnızca ilk dönem için başlangıç yerleştirmesi.
-- Mevcut aktif ve en az bir tahmin yapmış oyuncular 5 lige bugünkü genel sıralama üzerinden dağıtılır.
-- Bu sıralama SADECE ilk yerleştirme içindir; sonraki dönemler lig performansı ve yükselme/düşme ile ilerler.

create or replace function public.initialize_first_league_period(
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns bigint
language plpgsql
security definer
set search_path=''
as $$
declare
  v_period_id bigint;
  v_count integer;
  v_capacities jsonb;
  v_slots jsonb;
  v_champions integer;
  v_elite integer;
  v_gold integer;
  v_silver integer;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then
    raise exception 'Lig dönemi tarihleri geçersiz';
  end if;

  if exists(select 1 from public.league_periods) then
    raise exception 'İlk lig dönemi daha önce oluşturulmuş';
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
    and pl.created_at<=p_starts_at;

  if v_count<5 then
    raise exception '5 lig için yeterli başlangıç oyuncusu yok';
  end if;

  v_capacities:=public.league_allocate_capacities(v_count);
  v_slots:=public.league_promotion_slots(v_capacities);
  v_champions:=coalesce((v_capacities->>'champions')::integer,0);
  v_elite:=coalesce((v_capacities->>'elite')::integer,0);
  v_gold:=coalesce((v_capacities->>'gold')::integer,0);
  v_silver:=coalesce((v_capacities->>'silver')::integer,0);

  insert into public.league_periods(
    period_no,starts_at,ends_at,status,active_player_count,locked_capacities,locked_promotion_slots
  ) values (
    1,p_starts_at,p_ends_at,'open',v_count,v_capacities,v_slots
  ) returning id into v_period_id;

  with participants as (
    select distinct lower(p.player_name) as player_key from public.predictions p
    union
    select distinct lower(p.player_name) from public.champions_league_predictions p
    union
    select distinct lower(p.player_name) from public.nations_league_predictions p
  ), general_rank as (
    select lower(g.player_name) as player_key,g.league_rank
    from public.get_super_league_general_ranking() g
  ), ordered as (
    select
      pl.id as player_id,
      row_number() over(
        order by gr.league_rank nulls last,
                 pl.created_at,
                 pl.id
      )::integer as seed_rank
    from public.players pl
    join participants x on x.player_key=lower(pl.name)
    left join general_rank gr on gr.player_key=lower(pl.name)
    where coalesce(pl.is_active,true)
      and pl.created_at<=p_starts_at
  ), seeded as (
    select
      player_id,
      case
        when seed_rank<=v_champions then 'champions'
        when seed_rank<=v_champions+v_elite then 'elite'
        when seed_rank<=v_champions+v_elite+v_gold then 'gold'
        when seed_rank<=v_champions+v_elite+v_gold+v_silver then 'silver'
        else 'bronze'
      end::text as league_code
    from ordered
  )
  insert into public.league_memberships(
    period_id,player_id,league_code,starting_league_code,is_eligible,
    valid_round_count,performance_score,exact_score_count,rank_in_league,promotion_status
  )
  select
    v_period_id,s.player_id,s.league_code,s.league_code,false,
    0,null,0,null,'none'
  from seeded s;

  return v_period_id;
end;
$$;

revoke execute on function public.initialize_first_league_period(timestamptz,timestamptz) from public,anon,authenticated;

-- Beklenen başlangıç örneği (77 gerçek katılımcı):
-- 8 Şampiyonlar / 12 Elit / 15 Altın / 19 Gümüş / 23 Bronz.
-- Oyuncular 2 ayrı yeni tahmin turunu tamamlayana kadar sıralamada görünmez.
