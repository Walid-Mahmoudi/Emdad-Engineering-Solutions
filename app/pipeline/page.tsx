import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import PipelineBoard from "./PipelineBoard";
export const dynamic="force-dynamic";
export default async function PipelinePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("users").select("name,role,active").eq("user_id",user.id).maybeSingle();if(!profile?.active)redirect("/dashboard");
 const {data:projects,error}=await supabase.from("projects").select("project_id,project_name,client,estimated_value,current_action,next_followup_date").in("current_action",["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"]).order("updated_at",{ascending:false});if(error)throw new Error(error.message);
 const rows=projects||[];const active=rows.filter(x=>!["Closed Won","Closed Lost"].includes(x.current_action||""));const value=active.reduce((n,x)=>n+Number(x.estimated_value||0),0);const won=rows.filter(x=>x.current_action==="Closed Won").length;
 return <main className="nexus-page">
  <header className="nexus-page-head"><div><div className="eyebrow">DEAL MANAGEMENT</div><h1>Sales Pipeline</h1><p>Manage opportunities from qualification through close.</p></div><div className="nexus-head-actions"><Link href="/projects" className="nexus-secondary"><SlidersHorizontal size={15}/> Projects</Link><Link href="/projects/new" className="nexus-primary"><Plus size={15}/> Create deal</Link></div></header>
  <section className="dashboard-stat-grid pipeline-summary"><div className="nexus-stat-card"><div className="nexus-stat-icon blue"><ArrowUpRight size={18}/></div><div><span>Open deals</span><strong>{active.length}</strong><small>Across four active stages</small></div></div><div className="nexus-stat-card"><div className="nexus-stat-icon green"><ArrowUpRight size={18}/></div><div><span>Pipeline value</span><strong>{value.toLocaleString()} EGP</strong><small>Estimated opportunity value</small></div></div><div className="nexus-stat-card"><div className="nexus-stat-icon purple"><ArrowUpRight size={18}/></div><div><span>Closed won</span><strong>{won}</strong><small>Won deals in CRM</small></div></div></section>
  <PipelineBoard initialProjects={rows as any}/>
 </main>;
}