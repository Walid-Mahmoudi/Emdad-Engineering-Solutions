begin;

-- Action history is an immutable audit-style timeline: users may read/create entries,
-- but must not edit or delete history directly.
drop policy if exists "project children delete" on public.action_history;
drop policy if exists "project children update" on public.action_history;

-- Follow-ups can be created/updated by users who can access the project,
-- but deletion is restricted to Admin/Manager.
drop policy if exists "followups scoped" on public.follow_ups;
create policy "followups select" on public.follow_ups for select to authenticated
using (app_private.can_access_project(project_id));
create policy "followups insert" on public.follow_ups for insert to authenticated
with check (app_private.can_access_project(project_id));
create policy "followups update" on public.follow_ups for update to authenticated
using (app_private.can_access_project(project_id))
with check (app_private.can_access_project(project_id));
create policy "followups delete admin" on public.follow_ups for delete to authenticated
using (app_private.app_user_role() = any(array['Admin','Manager']) and app_private.can_access_project(project_id));

-- Contracts are financially material records: deletion is restricted to Admin/Manager.
drop policy if exists "contracts scoped" on public.contracts;
create policy "contracts select" on public.contracts for select to authenticated
using (app_private.can_access_project(project_id));
create policy "contracts insert" on public.contracts for insert to authenticated
with check (app_private.can_access_project(project_id));
create policy "contracts update" on public.contracts for update to authenticated
using (app_private.can_access_project(project_id))
with check (app_private.can_access_project(project_id));
create policy "contracts delete admin" on public.contracts for delete to authenticated
using (app_private.app_user_role() = any(array['Admin','Manager']) and app_private.can_access_project(project_id));

commit;