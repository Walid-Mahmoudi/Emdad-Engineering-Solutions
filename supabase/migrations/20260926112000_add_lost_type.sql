alter table public.projects
  add column if not exists lost_type text;

alter table public.projects
  drop constraint if exists projects_lost_type_check;

alter table public.projects
  add constraint projects_lost_type_check
  check (lost_type is null or lost_type in ('Can Work with Winner','Project Lost Completely'));
