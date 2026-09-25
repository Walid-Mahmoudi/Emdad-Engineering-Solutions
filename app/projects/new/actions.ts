"use server";

import { createClient } from "@/lib/supabase/server";

const STAGES=["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"] as const;

export async function createProject(input:{
  projectId:string;
  projectName:string;
  client?:string;
  sourceCase?:string;
  offerSent?:string;
  estimatedValue?:number;
  projectType?:string;
  location?:string;
  consultant?:string;
  opportunityDate?:string;
  notes?:string;
  salesPerson?:string;
}){
  const projectId=input.projectId.trim();
  const projectName=input.projectName.trim();
  if(!projectId||!projectName) throw new Error("Project ID and project name are required");
  if(input.estimatedValue!=null && (!Number.isFinite(input.estimatedValue)||input.estimatedValue<0)) throw new Error("Estimated value must be zero or greater");

  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Unauthorized");

  const {data:profile,error:profileError}=await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
  if(profileError) throw new Error(profileError.message);
  if(!profile?.active) throw new Error("User access is inactive");

  const adminLike=profile.role==="Admin"||profile.role==="Manager";
  const salesPerson=(adminLike?input.salesPerson?.trim():profile.sales_name?.trim())||null;

  const {data:existing,error:existingError}=await supabase.from("projects").select("project_id").eq("project_id",projectId).maybeSingle();
  if(existingError) throw new Error(existingError.message);
  if(existing) throw new Error("A project with this Project ID already exists");

  const now=new Date().toISOString();
  const {error}=await supabase.from("projects").insert({
    project_id:projectId,
    project_name:projectName,
    client:input.client?.trim()||null,
    source_case:input.sourceCase?.trim()||null,
    offer_sent:input.offerSent?.trim()||null,
    estimated_value:input.estimatedValue??null,
    current_action:"Tender",
    project_type:input.projectType?.trim()||null,
    location:input.location?.trim()||null,
    consultant:input.consultant?.trim()||null,
    opportunity_date:input.opportunityDate||null,
    notes:input.notes?.trim()||null,
    sales_person:salesPerson,
    created_at:now,
    updated_at:now
  });
  if(error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    log_id:crypto.randomUUID(),
    timestamp:now,
    user_email:user.email||"unknown",
    action:"Project Created",
    entity_type:"Project",
    entity_id:projectId,
    details:{project_id:projectId,project_name:projectName,sales_person:salesPerson,current_action:"Tender",source:"CRM"}
  });

  return projectId;
}