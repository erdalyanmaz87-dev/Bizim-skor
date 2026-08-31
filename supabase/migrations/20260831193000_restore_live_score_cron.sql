-- Restore the five-minute live-score poller. Secrets stay in Supabase Vault;
-- the Edge Function validates the presented token with a service-role-only RPC.

select vault.create_secret(
  gen_random_uuid()::text,
  'live_score_cron_secret',
  'Shared token used only by the live-score pg_cron job'
);

select vault.create_secret(
  'https://paevhzaixlozrrggnzni.supabase.co',
  'live_score_project_url',
  'Supabase project URL used by the live-score pg_cron job'
);

create or replace function public.authorize_live_score_cron(p_secret text)
returns boolean
language sql
security definer
set search_path = pg_catalog, public, vault
as $$
  select coalesce(
    p_secret = (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'live_score_cron_secret'
      order by created_at desc
      limit 1
    ),
    false
  );
$$;

revoke all on function public.authorize_live_score_cron(text) from public, anon, authenticated;
grant execute on function public.authorize_live_score_cron(text) to service_role;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'live-score-sync-every-five-minutes';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'live-score-sync-every-five-minutes',
  '*/5 * * * *',
  $cron$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'live_score_project_url'
        order by created_at desc
        limit 1
      ) || '/functions/v1/live-score-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'live_score_cron_secret'
          order by created_at desc
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $cron$
);
