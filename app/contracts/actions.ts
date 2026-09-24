"use server";

import { createClient } from "@/lib/supabase/server";

async function authContext(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Unauthorized");
  return {supabase,user};
}
async function audit(supabase:any,user:any,action:string,entityType:string,entityId:string,details:any){
  await supabase.from("audit_log").insert({log_id:crypto.randomUUID(),timestamp:new Date().toISOString(),user:user.email||"unknown",action,entity_type:entityType,entity_id:entityId,details:JSON.stringify(details)});
}
export async function createContract(input:{projectId:string;contractDate:string;contractValue:number}){
  if(!input.contractDate||!Number.isFinite(input.contractValue)||input.contractValue<=0) throw new Error("Contract date and a positive contract value are required");
  const {supabase,user}=await authContext();
  const {data:project,error:pe}=await supabase.from("projects").select("project_id,current_action,estimated_value").eq("project_id",input.projectId).maybeSingle();
  if(pe) throw new Error(pe.message); if(!project) throw new Error("Project not found or not accessible");
  if(project.current_action!=="Closed Won") throw new Error("Contract can only be created for Closed Won projects");
  const {data:existing}=await supabase.from("contracts").select("contract_id").eq("project_id",input.projectId).maybeSingle();
  if(existing) throw new Error("Project already has a contract");
  const id=crypto.randomUUID();
  const {error}=await supabase.from("contracts").insert({contract_id:id,project_id:input.projectId,contract_date:input.contractDate,contract_value:input.contractValue,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  if(error) throw new Error(error.message);
  await audit(supabase,user,"Contract Created","Contract",id,{project_id:input.projectId,contract_value:input.contractValue});
  return id;
}
export async function deleteContract(contractId:string){
  const {supabase,user}=await authContext();
  const {data:contract,error}=await supabase.from("contracts").select("contract_id,project_id").eq("contract_id",contractId).maybeSingle();
  if(error) throw new Error(error.message); if(!contract) throw new Error("Contract not found");
  await supabase.from("collections").delete().eq("contract_id",contractId);
  const {error:de}=await supabase.from("contracts").delete().eq("contract_id",contractId);
  if(de) throw new Error(de.message);
  await audit(supabase,user,"Contract Deleted","Contract",contractId,{project_id:contract.project_id,linked_collections_deleted:true});
  return true;
}
