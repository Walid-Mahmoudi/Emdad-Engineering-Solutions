-- EMDAD NEXUS: stage transitions require an authenticated CRM session.
revoke execute on function public.move_project_stage(date, numeric, text, text, text, text) from anon;
