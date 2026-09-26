begin;

drop policy if exists "users self or admin select" on public.users;
create policy "users self or admin select" on public.users
for select to authenticated
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or (select app_private.app_user_role()) = any(array['Admin','Manager'])
);

drop policy if exists "notifications recipient" on public.notifications;
create policy "notifications recipient" on public.notifications
for all to authenticated
using (
  lower(recipient_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or (select app_private.app_user_role()) = any(array['Admin','Manager'])
)
with check (
  lower(recipient_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or (select app_private.app_user_role()) = any(array['Admin','Manager'])
);

commit;