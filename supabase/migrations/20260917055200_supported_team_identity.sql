alter table public.players
  add column if not exists supported_team text;

alter table public.players
  drop constraint if exists players_supported_team_check;

alter table public.players
  add constraint players_supported_team_check check (
    supported_team is null or supported_team = any (array[
      'galatasaray','fenerbahce','besiktas','trabzonspor','basaksehir','kasimpasa',
      'alanyaspor','rizespor','gaziantep','konyaspor','samsunspor','eyupspor',
      'goztepe-izmir','genclerbirligi','amed-sk','corum-fk','kocaelispor','erzurumspor'
    ]::text[])
  );

create or replace function public.get_supported_team_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player text;
  v_current text;
  v_players jsonb;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  select p.supported_team into v_current
  from public.players p
  where p.name = v_player and coalesce(p.is_active,true)
  limit 1;

  select coalesce(
    jsonb_agg(jsonb_build_object('name',p.name,'supported_team',p.supported_team) order by p.created_at,p.name),
    '[]'::jsonb
  ) into v_players
  from public.players p
  where coalesce(p.is_active,true);

  return jsonb_build_object('current_team',v_current,'players',v_players);
end;
$$;

create or replace function public.set_supported_team_once(p_token text,p_team_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player text;
  v_saved text;
  v_existing text;
begin
  v_player := public.friend_session_player(p_token);
  if v_player is null then
    raise exception 'Oturum geçersiz veya süresi dolmuş';
  end if;

  if p_team_code is null or not (p_team_code = any (array[
    'galatasaray','fenerbahce','besiktas','trabzonspor','basaksehir','kasimpasa',
    'alanyaspor','rizespor','gaziantep','konyaspor','samsunspor','eyupspor',
    'goztepe-izmir','genclerbirligi','amed-sk','corum-fk','kocaelispor','erzurumspor'
  ]::text[])) then
    raise exception 'Geçersiz takım seçimi';
  end if;

  update public.players p
  set supported_team = p_team_code
  where p.name = v_player
    and coalesce(p.is_active,true)
    and p.supported_team is null
  returning p.supported_team into v_saved;

  if v_saved is not null then
    return v_saved;
  end if;

  select p.supported_team into v_existing
  from public.players p
  where p.name = v_player
  limit 1;

  if v_existing is null then
    raise exception 'Oyuncu bulunamadı';
  end if;

  raise exception 'Takım seçimi daha önce yapılmış ve değiştirilemez';
end;
$$;

revoke all on function public.get_supported_team_context(text) from public;
revoke all on function public.set_supported_team_once(text,text) from public;
grant execute on function public.get_supported_team_context(text) to anon, authenticated;
grant execute on function public.set_supported_team_once(text,text) to anon, authenticated;
