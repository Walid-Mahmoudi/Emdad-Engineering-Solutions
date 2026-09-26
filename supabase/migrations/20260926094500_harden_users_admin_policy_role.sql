-- EMDAD NEXUS: user administration is only callable by authenticated Admin users.
drop policy if exists "users admin manage" on public.users;
create policy "users admin manage"
on public.users
as permissive
for all
to authenticated
using (app_private.app_user_role() = 'Admin')
with check (app_private.app_user_role() = 'Admin');
