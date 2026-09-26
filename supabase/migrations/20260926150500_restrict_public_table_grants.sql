begin;
revoke all on table public.projects, public.contacts, public.follow_ups, public.action_history, public.attachments, public.contracts, public.collections, public.notifications, public.users, public.audit_log from anon;
revoke references, trigger, truncate on table public.projects, public.contacts, public.follow_ups, public.action_history, public.attachments, public.contracts, public.collections, public.notifications, public.users, public.audit_log from authenticated;
revoke insert, update, delete on table public.audit_log from authenticated;
commit;