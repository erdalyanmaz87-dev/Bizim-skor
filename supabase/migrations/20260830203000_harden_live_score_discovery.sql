revoke all on function public.record_live_score_discovery(text,bigint,text,bigint)
  from public, anon, authenticated;

grant execute on function public.record_live_score_discovery(text,bigint,text,bigint)
  to service_role;
