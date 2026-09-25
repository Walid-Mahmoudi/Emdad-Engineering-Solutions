"use server";

import { createClient } from "@/lib/supabase/server";

const TYPES=["Call","Visit","Email","Meeting","WhatsApp","Other"] as const;

async function audit(supabase:any,userEmail:string,action:string,entityId:string,details:string) {
  await supabase.from("audit_log").insert({
    log_id:crypto.randomUUID(), timestamp:new Date().toISOString(), user_email:userEmail,
    action, entity_type:"Follow Up", entity_id:entityId, details:JSON.parse(details)
  });
}

export async function addFollowUp(input:{
  projectId:string; date:string; time?:string; type:string; result?:string; notes?:string;
  nextActionDate?:string; nextActionType?:string;
}) {
  if(!TYPES.includes(input.type as typeof TYPES[number])) throw new Error("Invalid follow-up type");
  if(input.nextActionDate && input.nextActionType && !TYPES.includes(input.nextActionType as typeof TYPES[number])) throw new Error("Invalid next action type");
  if(!input.date) throw new Error("Follow-up date is required");

  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Unauthorized");

  const {data:project,error:projectError}=await supabase.from("projects")
    .select("project_id,project_name,client,sales_person")
    .eq("project_id",input.projectId).maybeSingle();
  if(projectError) throw new Error(projectError.message);
  if(!project) throw new Error("Project not found or not accessible");

  const now=new Date().toISOString();
  const followUpId=crypto.randomUUID();
  const {error}=await supabase.from("follow_ups").insert({
    followup_id:followUpId, project_id:input.projectId, followup_date:input.date,
    followup_time:input.time||null, followup_type:input.type, result:input.result||null,
    next_action_date:input.nextActionDate||null, next_action_type:input.nextActionType||null,
    next_action_status:input.nextActionDate?"Pending":null, notes:input.notes||null, created_at:now
  });
  if(error) throw new Error(error.message);

  const {error:updateError}=await supabase.from("projects").update({
    last_followup_date:input.date, next_followup_date:input.nextActionDate||null, updated_at:now
  }).eq("project_id",input.projectId);
  if(updateError) throw new Error(updateError.message);

  await audit(supabase,user.email||"unknown","Follow Up Created",followUpId,
    JSON.stringify({project_id:input.projectId,followup_type:input.type,followup_date:input.date}));
  return {followUpId,calendarEventId:null,calendarStatus:"pending-integration"};
}

export async function completeFollowUp(input:{
  followUpId:string; type:string; result?:string; notes?:string; nextActionDate?:string; nextActionType?:string;
}) {
  if(!TYPES.includes(input.type as typeof TYPES[number])) throw new Error("Invalid follow-up type");
  if(!input.result && !input.notes) throw new Error("Result or Notes is required");
  if(input.nextActionDate && input.nextActionType && !TYPES.includes(input.nextActionType as typeof TYPES[number])) throw new Error("Invalid next action type");

  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Unauthorized");

  const {data:followUp,error}=await supabase.from("follow_ups").select("*")
    .eq("followup_id",input.followUpId).maybeSingle();
  if(error) throw new Error(error.message);
  if(!followUp) throw new Error("Follow-up not found or not accessible");

  const completedAt=new Date().toISOString();
  const {error:updateError}=await supabase.from("follow_ups").update({
    followup_type:input.type, result:input.result||followUp.result||null, completed_at:completedAt,
    completed_result:input.result||followUp.result||null, completed_notes:input.notes||null,
    next_action_date:input.nextActionDate||null, next_action_type:input.nextActionType||null,
    next_action_status:input.nextActionDate?"Pending":"Completed", notes:input.notes||followUp.notes||null
  }).eq("followup_id",input.followUpId);
  if(updateError) throw new Error(updateError.message);

  let nextFollowUpId:string|null=null;
  if(input.nextActionDate){
    nextFollowUpId=crypto.randomUUID();
    const {error:nextError}=await supabase.from("follow_ups").insert({
      followup_id:nextFollowUpId, project_id:followUp.project_id,
      followup_date:input.nextActionDate, followup_type:input.nextActionType||"Other",
      next_action_status:"Pending", created_at:completedAt
    });
    if(nextError) throw new Error(nextError.message);
  }

  const {error:projectError}=await supabase.from("projects").update({
    last_followup_date:followUp.followup_date, next_followup_date:input.nextActionDate||null,
    updated_at:completedAt
  }).eq("project_id",followUp.project_id);
  if(projectError) throw new Error(projectError.message);

  await audit(supabase,user.email||"unknown","Follow Up Completed",input.followUpId,
    JSON.stringify({project_id:followUp.project_id,result:input.result||followUp.result||null,next_action_date:input.nextActionDate||null}));
  return {nextFollowUpId,calendarStatus:"pending-integration"};
}
