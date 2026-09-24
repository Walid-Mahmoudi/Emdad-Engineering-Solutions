import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Dashboard(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:profile}=await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
  if(!profile || !profile.active) return <main className="shell"><section className="card"><div className="eyebrow">EMDAD NEXUS</div><h1>Access pending</h1><p>Your account is authenticated, but no active CRM user profile is assigned yet.</p><p className="muted">{user.email}</p></section></main>;
  const {data:projects}=await supabase.from("projects").select("project_id,project_name,client,estimated_value,current_action,next_followup_date,sales_person").order("updated_at",{ascending:false}).limit(5);
  const owner = profile.sales_name ? profile.role + " · " + profile.sales_name : profile.role;
  return <main className="shell"><header className="topbar"><div><div className="eyebrow">EMDAD ENGINEERING SOLUTIONS</div><h1>EMDAD NEXUS</h1></div><div className="user">{profile.name||profile.email}<small>{owner}</small></div></header><section className="grid"><div className="stat card"><span>Visible Projects</span><strong>{projects?.length??0}</strong></div><div className="card"><span className="eyebrow">SESSION</span><h2>Authenticated</h2><p className="muted">{profile.email}</p></div></section><section className="card"><h2>Recent Projects</h2>{projects?.length?<div className="projects">{projects.map(p=><div className="project" key={p.project_id}><div><strong>{p.project_name}</strong><small>{p.client}</small></div><span>{p.current_action}</span></div>)}</div>:<p className="muted">No projects are available for this user scope.</p>}</section></main>;
}
