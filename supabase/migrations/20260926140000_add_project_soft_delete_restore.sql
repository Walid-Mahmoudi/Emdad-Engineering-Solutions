begin;

alter table public.projects
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id);

create index if not exists projects_deleted_at_idx on public.projects(deleted_at);

drop policy if exists "projects scoped select" on public.projects;
drop policy if exists "projects scoped update" on public.projects;
drop policy if exists "projects scoped insert" on public.projects;
drop policy if exists "projects scoped delete" on public.projects;

create policy "projects scoped select" on public.projects for select to authenticated
using (
  app_private.app_user_role() = any (array['Admin','Manager'])
  or (deleted_at is null and app_private.normalize_sales_name(sales_person) = app_private.normalize_sales_name(app_private.app_sales_name()))
);

create policy "projects scoped insert" on public.projects for insert to authenticated
with check (
  deleted_at is null
  and (app_private.app_user_role() = any (array['Admin','Manager'])
    or app_private.normalize_sales_name(sales_person) = app_private.normalize_sales_name(app_private.app_sales_name()))
);

create policy "projects scoped update" on public.projects for update to authenticated
using (
  app_private.app_user_role() = any (array['Admin','Manager'])
  or (deleted_at is null and app_private.normalize_sales_name(sales_person) = app_private.normalize_sales_name(app_private.app_sales_name()))
)
with check (
  app_private.app_user_role() = any (array['Admin','Manager'])
  or (deleted_at is null and app_private.normalize_sales_name(sales_person) = app_private.normalize_sales_name(app_private.app_sales_name()))
);

revoke delete on table public.projects from anon, authenticated;

create or replace function app_private.can_access_project(p_project_id text)
returns boolean language sql stable
set search_path to 'pg_catalog', 'app_private', 'public'
as $function$
  select exists (
    select 1 from public.projects pr
    where pr.project_id = p_project_id
      and (
        app_private.app_user_role() = any (array['Admin','Manager'])
        or (pr.deleted_at is null and app_private.normalize_sales_name(pr.sales_person) = app_private.normalize_sales_name(app_private.app_sales_name()))
      )
  )
$function$;

commit;