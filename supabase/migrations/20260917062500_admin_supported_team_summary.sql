create or replace function public.get_admin_supported_team_summary(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_selected jsonb;
  v_unselected jsonb;
begin
  if not public.is_support_admin(p_token) then
    raise exception 'Yetkisiz işlem';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('player_name',p.name,'supported_team',p.supported_team)
      order by p.name collate "tr-x-icu"
    ),
    '[]'::jsonb
  )
  into v_selected
  from public.players p
  where coalesce(p.is_active,true)
    and p.supported_team is not null;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('player_name',p.name,'supported_team',null)
      order by p.name collate "tr-x-icu"
    ),
    '[]'::jsonb
  )
  into v_unselected
  from public.players p
  where coalesce(p.is_active,true)
    and p.supported_team is null;

  return jsonb_build_object(
    'selected_count', jsonb_array_length(v_selected),
    'unselected_count', jsonb_array_length(v_unselected),
    'selected', v_selected,
    'unselected', v_unselected
  );
end;
$$;

revoke all on function public.get_admin_supported_team_summary(text) from public;
grant execute on function public.get_admin_supported_team_summary(text) to anon, authenticated;
