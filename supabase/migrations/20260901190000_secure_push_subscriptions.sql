drop policy if exists allow_public_push_select on public.push_subscriptions;
drop policy if exists allow_public_push_insert on public.push_subscriptions;
drop policy if exists allow_public_push_update on public.push_subscriptions;
revoke select, insert, update, delete on table public.push_subscriptions from anon, authenticated;
