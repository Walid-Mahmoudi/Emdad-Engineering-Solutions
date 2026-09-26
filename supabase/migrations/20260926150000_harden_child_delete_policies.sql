begin;

drop policy if exists "collections scoped" on public.collections;
create policy "collections select" on public.collections for select to authenticated
using (app_private.can_access_project(project_id));
create policy "collections insert" on public.collections for insert to authenticated
with check (app_private.can_access_project(project_id));
create policy "collections update" on public.collections for update to authenticated
using (app_private.can_access_project(project_id))
with check (app_private.can_access_project(project_id));
create policy "collections delete admin" on public.collections for delete to authenticated
using (app_private.app_user_role() = any(array['Admin','Manager']) and app_private.can_access_project(project_id));

drop policy if exists "contacts access" on public.contacts;
create policy "contacts select" on public.contacts for select to authenticated
using (
 app_private.app_user_role() = any(array['Admin','Manager'])
 or exists (select 1 from public.projects p where lower(trim(coalesce(p.client,'')))=lower(trim(coalesce(contacts.company,''))) and app_private.can_access_project(p.project_id))
);
create policy "contacts insert" on public.contacts for insert to authenticated
with check (
 app_private.app_user_role() = any(array['Admin','Manager','Sales'])
 and exists (select 1 from public.projects p where lower(trim(coalesce(p.client,'')))=lower(trim(coalesce(contacts.company,''))) and app_private.can_access_project(p.project_id))
);
create policy "contacts update" on public.contacts for update to authenticated
using (
 app_private.app_user_role() = any(array['Admin','Manager','Sales'])
 and exists (select 1 from public.projects p where lower(trim(coalesce(p.client,'')))=lower(trim(coalesce(contacts.company,''))) and app_private.can_access_project(p.project_id))
)
with check (
 app_private.app_user_role() = any(array['Admin','Manager','Sales'])
 and exists (select 1 from public.projects p where lower(trim(coalesce(p.client,'')))=lower(trim(coalesce(contacts.company,''))) and app_private.can_access_project(p.project_id))
);
create policy "contacts delete admin" on public.contacts for delete to authenticated
using (app_private.app_user_role() = any(array['Admin','Manager']));

drop policy if exists "attachments scoped" on public.attachments;
create policy "attachments select" on public.attachments for select to authenticated
using (app_private.can_access_project(project_id));
create policy "attachments insert" on public.attachments for insert to authenticated
with check (app_private.can_access_project(project_id));
create policy "attachments update" on public.attachments for update to authenticated
using (app_private.can_access_project(project_id))
with check (app_private.can_access_project(project_id));
create policy "attachments delete admin" on public.attachments for delete to authenticated
using (app_private.app_user_role() = any(array['Admin','Manager']) and app_private.can_access_project(project_id));

commit;