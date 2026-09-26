-- Keep the public RPC as the only authenticated entry point for stage changes.
-- The internal SECURITY DEFINER implementation is not part of the client API.
revoke execute on function app_private.move_project_stage(text,text,text,date,numeric,text) from authenticated;
