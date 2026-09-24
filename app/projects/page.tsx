import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function money(v:number|null|undefined){
  return new Intl.NumberFormat("en-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(v||0);
}

export default async function ProjectsPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");

  const {data:profile}=await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
  if(!profile?.active) redirect("/dashboard");

  const {data:projects,error}=await supabase
    .from("projects")
    .select("project_id,project_name,client,estimated_value,current_action,location,next_followup_date")
    .not("current_action","in",'("Closed Won","Closed Lost")')
    .order("updated_at",{ascending:false});

  if(error) throw new Error(error.message);

  return <main className="shell">
    <header className="topbar">
      <div><div className="eyebrow">EMDAD ENGINEERING SOLUTIONS</div><h1>Projects</h1><p className="muted">Active pipeline for {profile.name||profile.email}</p></div>
      <Link className="button secondary" href="/dashboard">Dashboard</Link>
    </header>
    <section className="card">
      <div className="section-head"><div><h2>Active Projects</h2><span className="muted">{projects?.length||0} projects</span></div></div>
      {projects?.length?<div className="projects">{projects.map(p=><Link className="project" key={p.project_id} href={"/projects/"+encodeURIComponent(p.project_id)}>
        <div><strong>{p.project_name||"Untitled Project"}</strong><small>{p.client||"No client"} · {p.location||"No location"}</small></div>
        <div className="project-meta"><span className="badge">{p.current_action||"—"}</span><span>{money(Number(p.estimated_value)||0)}</span><small>Next: {p.next_followup_date||"No next action"}</small></div>
      </Link>)}</div>:<p className="muted">No active projects are available for this user scope.</p>}
    </section>
  </main>;
}
