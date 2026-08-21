-- Repair migration for projects created after Supabase disabled automatic
-- Data API grants for new public-schema tables.
-- This deliberately grants only service_role. Anonymous and authenticated
-- browser clients remain blocked by both missing grants and RLS.

grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.mailbox_inquiries,
  public.mailbox_answers,
  public.mailbox_admins,
  public.mailbox_audit_events,
  public.mailbox_rate_limits
to service_role;

notify pgrst, 'reload schema';
