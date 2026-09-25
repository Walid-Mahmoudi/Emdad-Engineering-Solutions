import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectsClient from "./ProjectsClient";
export const dynamic="force-dynamic";
export default async function ProjectsPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();if(!profile?.active)redirect("/dashboard");
 const {data:projects,error}=await supabase.from("projects").select("project_id,project_name,client,estimated_value,current_action,location,next_followup_date,last_followup_date,updated_at,project_type,consultant").not("current_action","in",'("Closed Won","Closed Lost")').order("updated_at",{ascending:false});if(error)throw new Error(error.message);
 return <main className="nexus-page"><header className="nexus-page-head"><div><div className="eyebrow">SALES WORKSPACE</div><h1>Projects</h1><p>Manage active opportunities, follow-ups and commercial value from one workspace.</p></div><div className="nexus-head-actions"><span className="workspace-chip">{(projects||[]).length} active projects</span></div></header><ProjectsClient projects={projects??[]}/></main>;
}