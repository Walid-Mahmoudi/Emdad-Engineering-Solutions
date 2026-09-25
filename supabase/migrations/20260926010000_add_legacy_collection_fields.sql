alter table public.collections
  add column if not exists due_date date,
  add column if not exists status text,
  add column if not exists quarter text;
