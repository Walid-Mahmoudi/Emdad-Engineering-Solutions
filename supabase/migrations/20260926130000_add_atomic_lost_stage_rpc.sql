create or replace function public.move_project_stage_with_lost_type(
  p_project_id text,
  p_new_action text,
  p_notes text default null,
  p_contract_date date default null,
  p_contract_value numeric default null,
  p_lost_reason text default null,
  p_lost_type text default null
)
returns boolean
language plpgsql
set search_path = public, pg_catalog, app_private
as $function$
declare
  v_ok boolean;
begin
  if p_new_action = 'Closed Lost' and p_lost_type not in ('Can Work with Winner','Project Lost Completely') then
    raise exception 'Lost type is required for Closed Lost';
  end if;

  v_ok := public.move_project_stage(
    p_project_id := p_project_id,
    p_new_action := p_new_action,
    p_notes := p_notes,
    p_contract_date := p_contract_date,
    p_contract_value := p_contract_value,
    p_lost_reason := p_lost_reason
  );

  if p_new_action = 'Closed Lost' then
    update public.projects
    set lost_type = p_lost_type,
        updated_at = now()
    where project_id = p_project_id;
  end if;

  return v_ok;
end;
$function$;

revoke all on function public.move_project_stage_with_lost_type(text,text,text,date,numeric,text,text) from public;
grant execute on function public.move_project_stage_with_lost_type(text,text,text,date,numeric,text,text) to authenticated;
