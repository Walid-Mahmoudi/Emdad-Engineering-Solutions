-- EMDAD NEXUS: allow Admin users to manage CRM user records.
create policy "users admin manage"
on public.users
for all
using (app_private.app_user_role() = 'Admin')
with check (app_private.app_user_role() = 'Admin');
