"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

async function requireActiveUser(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Unauthorized");
  const {data:profile,error}=await supabase.from("users").select("user_id,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
  if(error) throw new Error(error.message);
  if(!profile?.active) throw new Error("Account is inactive");
  return {supabase,user,profile};
}

export async function softDeleteProject(projectId:string){
  const {supabase,user,profile}=await requireActiveUser();
  if(!["Admin","Manager"].includes(profile.role)) throw new Error("You do not have permission to delete projects.");
  const id=projectId.trim();
  if(!id) throw new Error("Project ID is required.");

  const {data:project,error:projectError}=await supabase.from("projects").select("project_id,project_name,deleted_at").eq("project_id",id).maybeSingle();
  if(projectError) throw new Error(projectError.message);
  if(!project) throw new Error("Project not found.");
  if(project.deleted_at) throw new Error("Project is already deleted.");

  const now=new Date().toISOString();
  const {error}=await supabase.from("projects").update({deleted_at:now,deleted_by:user.id,updated_at:now}).eq("project_id",id);
  if(error) throw new Error(error.message);

  await writeAuditLog({timestamp:now,userEmail:user.email||"unknown",action:"Project Soft Deleted",entityType:"Project",entityId:id,details:{project_id:id,project_name:project.project_name,deleted_by:user.id,source:"CRM"}});

  revalidatePath("/projects");
  revalidatePath("/projects/deleted");
  revalidatePath("/dashboard");
  revalidatePath("/deals-lost");
}

export async function restoreProject(projectId:string){
  const {supabase,user,profile}=await requireActiveUser();
  if(profile.role!=="Admin") throw new Error("Only an Admin can restore deleted projects.");
  const id=projectId.trim();
  if(!id) throw new Error("Project ID is required.");

  const {data:project,error:projectError}=await supabase.from("projects").select("project_id,project_name,deleted_at").eq("project_id",id).maybeSingle();
  if(projectError) throw new Error(projectError.message);
  if(!project) throw new Error("Project not found.");
  if(!project.deleted_at) throw new Error("Project is already active.");

  const now=new Date().toISOString();
  const {error}=await supabase.from("projects").update({deleted_at:null,deleted_by:null,updated_at:now}).eq("project_id",id);
  if(error) throw new Error(error.message);

  await writeAuditLog({timestamp:now,userEmail:user.email||"unknown",action:"Project Restored",entityType:"Project",entityId:id,details:{project_id:id,project_name:project.project_name,restored_by:user.id,source:"CRM"}});

  revalidatePath("/projects");
  revalidatePath("/projects/deleted");
  revalidatePath("/dashboard");
  revalidatePath("/deals-lost");
}
