-- Anonymous private mailbox: server-side API is the only public data path.
-- Never store names, email addresses, contact details, raw access codes, or unencrypted personal-case data here.

create extension if not exists pgcrypto;

do $$
begin
  create type public.mailbox_inquiry_type as enum ('concept', 'personal_case');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.mailbox_inquiry_status as enum ('received', 'reviewing', 'replied', 'declined');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.mailbox_decline_reason as enum ('sensitive_data', 'out_of_scope', 'safety', 'capacity');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.mailbox_inquiries (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique check (public_id ~ '^Q-[A-F0-9]{8}$'),
  access_code_hash text not null unique,
  inquiry_type public.mailbox_inquiry_type not null,
  category text not null check (category in ('course', 'calculation', 'personal_case', 'other')),
  body text not null check (char_length(body) between 8 and 1200),
  personal_case_ciphertext text,
  consent_version text not null,
  status public.mailbox_inquiry_status not null default 'received',
  decline_reason public.mailbox_decline_reason,
  reply_due_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  answered_at timestamptz,
  read_at timestamptz,
  constraint mailbox_personal_case_ciphertext_check check (
    (inquiry_type = 'personal_case' and personal_case_ciphertext is not null)
    or (inquiry_type = 'concept' and personal_case_ciphertext is null)
  )
);

create table if not exists public.mailbox_answers (
  inquiry_id uuid primary key references public.mailbox_inquiries(id) on delete cascade,
  body text not null check (char_length(body) between 20 and 5000),
  answered_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mailbox_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.mailbox_audit_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.mailbox_inquiries(id) on delete cascade,
  actor_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mailbox_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null
);

create index if not exists idx_mailbox_inquiries_status_due
  on public.mailbox_inquiries (status, reply_due_at);
create index if not exists idx_mailbox_inquiries_expiry
  on public.mailbox_inquiries (expires_at);
create index if not exists idx_mailbox_audit_inquiry_created
  on public.mailbox_audit_events (inquiry_id, created_at desc);
create index if not exists idx_mailbox_rate_limits_expiry
  on public.mailbox_rate_limits (expires_at);

create or replace function public.set_mailbox_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_mailbox_inquiries_updated_at on public.mailbox_inquiries;
create trigger trg_mailbox_inquiries_updated_at
before update on public.mailbox_inquiries
for each row execute function public.set_mailbox_updated_at();

drop trigger if exists trg_mailbox_answers_updated_at on public.mailbox_answers;
create trigger trg_mailbox_answers_updated_at
before update on public.mailbox_answers
for each row execute function public.set_mailbox_updated_at();

create or replace function public.is_mailbox_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mailbox_admins where user_id = auth.uid()
  );
$$;

alter table public.mailbox_inquiries enable row level security;
alter table public.mailbox_answers enable row level security;
alter table public.mailbox_admins enable row level security;
alter table public.mailbox_audit_events enable row level security;
alter table public.mailbox_rate_limits enable row level security;

-- The anonymous visitor must use the server-side API. No direct anonymous table access is allowed.
drop policy if exists "mailbox admins manage inquiries" on public.mailbox_inquiries;
create policy "mailbox admins manage inquiries"
on public.mailbox_inquiries
for all to authenticated
using (public.is_mailbox_admin())
with check (public.is_mailbox_admin());

drop policy if exists "mailbox admins manage answers" on public.mailbox_answers;
create policy "mailbox admins manage answers"
on public.mailbox_answers
for all to authenticated
using (public.is_mailbox_admin())
with check (public.is_mailbox_admin());

drop policy if exists "mailbox admins read admin list" on public.mailbox_admins;
create policy "mailbox admins read admin list"
on public.mailbox_admins
for select to authenticated
using (public.is_mailbox_admin());

drop policy if exists "mailbox admins read audit" on public.mailbox_audit_events;
create policy "mailbox admins read audit"
on public.mailbox_audit_events
for select to authenticated
using (public.is_mailbox_admin());

-- Server-side maintenance removes expired private content. Client roles receive no rate-limit access.
create or replace function public.mailbox_purge_expired(now_at timestamptz default now())
returns table (deleted_inquiries bigint, deleted_rate_limits bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.mailbox_inquiries where expires_at <= now_at;
  get diagnostics deleted_inquiries = row_count;

  delete from public.mailbox_rate_limits where expires_at <= now_at;
  get diagnostics deleted_rate_limits = row_count;
  return next;
end;
$$;

revoke all on function public.mailbox_purge_expired(timestamptz) from public;
grant execute on function public.mailbox_purge_expired(timestamptz) to service_role;

-- Supabase projects created after the 2026 Data API exposure change require
-- explicit grants before newly created public tables appear in PostgREST.
-- Data API roles need explicit grants for the API to recognise these tables.
-- Existing RLS policies remain the data-access boundary: anon has no mailbox
-- policies and authenticated users only access rows when they are admins.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.mailbox_inquiries,
  public.mailbox_answers,
  public.mailbox_admins,
  public.mailbox_audit_events,
  public.mailbox_rate_limits
to anon, authenticated, service_role;
