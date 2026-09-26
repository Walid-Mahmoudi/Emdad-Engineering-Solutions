-- Project attachment storage
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'project-attachments',
  'project-attachments',
  false,
  20971520,
  array[
    'application/pdf','image/jpeg','image/png','image/webp','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','text/csv'
  ]
)
on conflict (id) do update set
  name=excluded.name, public=excluded.public, file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

alter table public.attachments add column if not exists storage_path text;

drop policy if exists "project attachments select" on storage.objects;
drop policy if exists "project attachments insert" on storage.objects;
drop policy if exists "project attachments delete" on storage.objects;

create policy "project attachments select"
on storage.objects for select to authenticated
using (bucket_id='project-attachments' and app_private.can_access_project((storage.foldername(name))[1]));

create policy "project attachments insert"
on storage.objects for insert to authenticated
with check (
  bucket_id='project-attachments'
  and app_private.can_access_project((storage.foldername(name))[1])
  and exists (
    select 1 from public.projects p
    where p.project_id=(storage.foldername(name))[1] and p.deleted_at is null
  )
);

create policy "project attachments delete"
on storage.objects for delete to authenticated
using (
  bucket_id='project-attachments'
  and app_private.can_access_project((storage.foldername(name))[1])
  and exists (
    select 1 from public.projects p
    where p.project_id=(storage.foldername(name))[1] and p.deleted_at is null
  )
);
