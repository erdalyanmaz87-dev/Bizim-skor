create or replace function public.get_admin_statistics_dashboard(p_token text)
returns jsonb
language sql
security definer
set search_path to ''
as $function$
with b as (
  select public.get_admin_statistics_dashboard_base(p_token) as j
), ordered as (
  select coalesce(
    jsonb_agg(e.elem order by c.completed_at desc nulls last, e.elem->>'player_name'),
    '[]'::jsonb
  ) as items
  from b
  cross join lateral jsonb_array_elements(b.j->'completed') e(elem)
  left join lateral (
    select max(pr.created_at) as completed_at
    from public.predictions pr
    join public.fixtures f on f.id=pr.fixture_id
    where lower(pr.player_name)=lower(e.elem->>'player_name')
      and f.season=b.j->>'season'
      and f.week=(b.j->>'week')::integer
  ) c on true
), bot as (
  select count(*)::integer as n
  from public.players p
  where coalesce(p.is_active,true)
    and lower(p.name)=lower('🤖 SkorBot')
), enriched as (
  select jsonb_set(
    jsonb_set(b.j,'{completed}',ordered.items,true),
    '{summary,total_registered}',
    to_jsonb(coalesce((b.j#>>'{summary,total_registered}')::integer,0)+bot.n),
    true
  ) as j
  from b, ordered, bot
)
select j from enriched;
$function$;
