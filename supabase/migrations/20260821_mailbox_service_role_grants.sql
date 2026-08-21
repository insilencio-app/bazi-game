-- Repair migration for projects created after Supabase disabled automatic
-- Data API grants for new public-schema tables. RLS policies still prohibit
-- anonymous access and restrict authenticated access to mailbox admins.

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.mailbox_inquiries,
  public.mailbox_answers,
  public.mailbox_admins,
  public.mailbox_audit_events,
  public.mailbox_rate_limits
to anon, authenticated, service_role;

notify pgrst, 'reload schema';
