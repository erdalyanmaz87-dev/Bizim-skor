-- İpek'e yönetici istatistikleri ve destek paneli erişimi ver.
-- Erdal mevcut yönetici olarak kalır. Yetki, aktif oyuncu kaydı + oturum tokenı üzerinden doğrulanır.

insert into public.support_admins(player_id)
select p.id
from public.players p
where p.name in ('Erdal', 'İpek')
  and coalesce(p.is_active, true)
on conflict(player_id) do nothing;

create or replace function public.is_support_admin(p_token text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.support_admins a
    join public.players p on p.id = a.player_id
    where p.name = public.friend_session_player(p_token)
      and coalesce(p.is_active, true)
  )
$$;

revoke all on function public.is_support_admin(text) from public, anon, authenticated;
grant execute on function public.is_support_admin(text) to anon, authenticated;
