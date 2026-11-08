-- Give the manual score RPC time to finish the Arena and ranking updates atomically.
set local lock_timeout = '2s';
alter function public.admin_update_live_score(text, bigint, smallint, smallint, smallint, boolean, text)
  set statement_timeout = '15s';
notify pgrst, 'reload schema';
