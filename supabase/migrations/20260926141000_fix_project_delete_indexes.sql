begin;
create index if not exists projects_deleted_by_idx on public.projects(deleted_by);
drop index if exists public.contracts_one_per_project_idx;
commit;
