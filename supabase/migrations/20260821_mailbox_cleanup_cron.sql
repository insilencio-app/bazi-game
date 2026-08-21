-- Private mailbox cleanup runs inside Postgres, without a public HTTP maintenance endpoint.
-- Execute once in the Supabase SQL Editor after confirming pg_cron is enabled for the project.

create extension if not exists pg_cron;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'mailbox-purge-expired-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'mailbox-purge-expired-daily',
  '0 2 * * *',
  $$select public.mailbox_purge_expired();$$
);
