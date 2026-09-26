import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeletedProjectsClient from "../DeletedProjectsClient";

export const dynamic="force-dynamic";

export default async function DeletedProjectsPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");

  const {data:profile}=await supabase.from("users").select("role,active").eq("user_id",user.id).maybeSingle();
  if(!profile?.active) redirect("/dashboard");
  if(profile.role!=="Admin") redirect("/projects");

  const {data:projects,error}=await supabase.from("projects").select("project_id,project_name,client,sales_person,current_action,estimated_value,deleted_at,deleted_by").not("deleted_at","is",null).order("deleted_at",{ascending:false});
  if(error) throw new Error(error.message);

  return <main className="nexus-page">
    <header className="nexus-page-head">
      <div><div className="eyebrow">DATA RECOVERY</div><h1>Deleted Projects</h1><p>Review deleted projects and restore them manually. Nothing is restored automatically.</p></div>
      <div className="nexus-head-actions"><Link className="nexus-secondary" href="/projects">Back to Projects</Link></div>
    </header>
    <DeletedProjectsClient projects={projects??[]}/>
  </main>;
}
