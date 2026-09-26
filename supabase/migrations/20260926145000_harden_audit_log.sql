-- Harden audit log: only trusted server-side service-role code may write entries.
drop policy if exists "audit insert" on public.audit_log;
revoke insert on public.audit_log from anon, authenticated;