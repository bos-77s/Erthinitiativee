create extension if not exists pgcrypto;

create type public.profile_role as enum ('manager', 'coordinator');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.inquiry_status as enum ('new', 'in_progress', 'closed', 'archived');
create type public.site_status as enum ('published', 'maintenance', 'temporarily_closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 1 and 120),
  email text not null unique,
  role public.profile_role not null default 'coordinator',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  description text not null
);

insert into public.permissions (key, description) values
  ('dashboard.view','View the administration overview'),
  ('members.view','View team and member records'),
  ('members.create','Create team records'),
  ('members.update','Update team records'),
  ('members.archive','Archive team records'),
  ('initiatives.view','View initiatives'),
  ('initiatives.create','Create initiatives'),
  ('initiatives.update','Update initiatives'),
  ('initiatives.publish','Publish initiatives'),
  ('initiatives.archive','Archive initiatives'),
  ('partners.view','View partners'),
  ('partners.create','Create partners'),
  ('partners.update','Update partners'),
  ('partners.archive','Archive partners'),
  ('inquiries.view','View private inquiries'),
  ('inquiries.respond','Respond to inquiries'),
  ('inquiries.archive','Archive inquiries'),
  ('content.view','View public content'),
  ('content.update','Update public content'),
  ('media.manage','Manage approved media'),
  ('exports.create','Export explicitly permitted data'),
  ('audit.view','Review audit events');

create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null,
  interest text not null check (interest in ('academic', 'community', 'both')),
  motivation text not null check (char_length(motivation) between 10 and 4000),
  consent_at timestamptz not null,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_permissions (
  user_id uuid not null references public.profiles(id) on delete restrict,
  permission_key text not null references public.permissions(key) on delete restrict,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  role_title text not null,
  bio text,
  is_approved boolean not null default false,
  is_public boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.initiatives (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  summary_ar text not null,
  summary_en text not null,
  track text not null check (track in ('academic', 'community')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null,
  inquiry_type text not null check (inquiry_type in ('general', 'partnership', 'academic', 'community')),
  subject text not null check (char_length(subject) between 3 and 160),
  message text not null check (char_length(message) between 10 and 4000),
  consent_at timestamptz not null,
  status public.inquiry_status not null default 'new',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id boolean primary key default true check (id),
  status public.site_status not null default 'published',
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.exports_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  dataset text not null,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null check (row_count >= 0),
  created_at timestamptz not null default now()
);

create index join_requests_status_created_idx on public.join_requests(status, created_at desc);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc);
create index initiatives_status_track_idx on public.initiatives(status, track);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'manager'
      and not p.is_suspended
  );
$$;

create or replace function public.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_manager() or exists (
    select 1
    from public.user_permissions up
    join public.profiles p on p.id = up.user_id
    where up.user_id = (select auth.uid())
      and up.permission_key = required_permission
      and p.role = 'coordinator'
      and not p.is_suspended
  );
$$;

revoke all on function public.is_manager() from public;
revoke all on function public.has_permission(text) from public;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.join_requests enable row level security;
alter table public.user_permissions enable row level security;
alter table public.team_members enable row level security;
alter table public.initiatives enable row level security;
alter table public.partners enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.exports_log enable row level security;

create policy profiles_self_or_manager_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_manager());
create policy profiles_manager_update on public.profiles for update to authenticated
using (public.is_manager()) with check (public.is_manager());

create policy permissions_authenticated_read on public.permissions for select to authenticated using (true);
create policy permissions_manager_write on public.permissions for all to authenticated
using (public.is_manager()) with check (public.is_manager());

create policy join_requests_manager_all on public.join_requests for all to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy join_requests_public_submit on public.join_requests for insert to anon, authenticated
with check (status = 'pending' and reviewed_by is null and reviewed_at is null and consent_at <= now());
revoke all on public.join_requests from anon, authenticated;
grant insert (name, email, interest, motivation, consent_at) on public.join_requests to anon, authenticated;
grant select, update on public.join_requests to authenticated;

create policy user_permissions_owner_or_manager_read on public.user_permissions for select to authenticated
using (user_id = (select auth.uid()) or public.is_manager());
create policy user_permissions_manager_write on public.user_permissions for all to authenticated
using (public.is_manager()) with check (public.is_manager());

create policy team_public_read on public.team_members for select to anon, authenticated
using (is_approved and is_public and archived_at is null);
create policy team_manager_all on public.team_members for all to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy team_permission_read on public.team_members for select to authenticated
using (public.has_permission('members.view'));
create policy team_permission_write on public.team_members for insert to authenticated
with check (public.has_permission('members.create'));
create policy team_permission_update on public.team_members for update to authenticated
using (public.has_permission('members.update') or public.has_permission('members.archive'))
with check (
  (archived_at is null and public.has_permission('members.update'))
  or (archived_at is not null and public.has_permission('members.archive'))
);

create policy initiatives_public_read on public.initiatives for select to anon, authenticated
using (status = 'published' and archived_at is null);
create policy initiatives_permission_read on public.initiatives for select to authenticated
using (public.has_permission('initiatives.view'));
create policy initiatives_permission_insert on public.initiatives for insert to authenticated
with check (public.has_permission('initiatives.create'));
create policy initiatives_permission_update on public.initiatives for update to authenticated
using (
  public.has_permission('initiatives.update')
  or public.has_permission('initiatives.publish')
  or public.has_permission('initiatives.archive')
)
with check (
  (status = 'published' and public.has_permission('initiatives.publish'))
  or (status = 'archived' and public.has_permission('initiatives.archive'))
  or (status = 'draft' and public.has_permission('initiatives.update'))
);
create policy initiatives_manager_delete on public.initiatives for delete to authenticated
using (public.is_manager());

create policy partners_public_read on public.partners for select to anon, authenticated
using (status = 'published' and archived_at is null);
create policy partners_permission_read on public.partners for select to authenticated
using (public.has_permission('partners.view'));
create policy partners_permission_insert on public.partners for insert to authenticated
with check (public.has_permission('partners.create'));
create policy partners_permission_update on public.partners for update to authenticated
using (public.has_permission('partners.update') or public.has_permission('partners.archive'))
with check (
  (status = 'archived' and public.has_permission('partners.archive'))
  or (status <> 'archived' and public.has_permission('partners.update'))
);
create policy partners_manager_delete on public.partners for delete to authenticated
using (public.is_manager());

create policy inquiries_manager_all on public.inquiries for all to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy inquiries_permission_read on public.inquiries for select to authenticated
using (public.has_permission('inquiries.view'));
create policy inquiries_permission_update on public.inquiries for update to authenticated
using (public.has_permission('inquiries.respond') or public.has_permission('inquiries.archive'))
with check (
  (status = 'archived' and public.has_permission('inquiries.archive'))
  or (status <> 'archived' and public.has_permission('inquiries.respond'))
);
create policy inquiries_public_submit on public.inquiries for insert to anon, authenticated
with check (status = 'new' and archived_at is null);

create policy site_content_public_read on public.site_content for select to anon, authenticated using (true);
create policy site_content_manager_write on public.site_content for all to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_manager_write on public.site_settings for update to authenticated
using (public.is_manager()) with check (public.is_manager());

create policy audit_manager_read on public.audit_logs for select to authenticated using (public.is_manager());
create policy audit_permission_read on public.audit_logs for select to authenticated
using (public.has_permission('audit.view'));
create policy audit_manager_insert on public.audit_logs for insert to authenticated
with check (public.is_manager() and actor_id = (select auth.uid()));

create policy exports_manager_all on public.exports_log for all to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy exports_permission_insert on public.exports_log for insert to authenticated
with check (public.has_permission('exports.create') and actor_id = (select auth.uid()));

-- Public reads are restricted to fields intended for publication. Authentication
-- and manager IDs must never become visible through PostgREST's table selection.
revoke all on public.team_members from anon;
grant select (id, name, role_title, bio) on public.team_members to anon;

revoke all on public.site_content from anon, authenticated;
grant select (key, value) on public.site_content to anon, authenticated;
grant insert (key, value, updated_by, updated_at) on public.site_content to authenticated;
grant update (value, updated_by, updated_at) on public.site_content to authenticated;

revoke all on public.site_settings from anon, authenticated;
grant select (status) on public.site_settings to anon, authenticated;
grant update (status, updated_by, updated_at) on public.site_settings to authenticated;

-- App clients may edit profile metadata, but can never promote another account
-- into the unrestricted manager role through a normal authenticated session.
revoke update on public.profiles from authenticated;
grant update (display_name, email, is_suspended, updated_at) on public.profiles to authenticated;

comment on table public.inquiries is 'Contains private contact details and messages. Establish and enforce a documented retention period before production.';
comment on table public.audit_logs is 'Append-only in the application; avoid credentials, tokens, or message bodies in metadata.';
comment on table public.exports_log is 'Audit trail for private data exports; exported files require controlled storage and expiry.';
