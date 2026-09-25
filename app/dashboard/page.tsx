import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CircleDollarSign, FolderKanban, Plus, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
const stages=["Tender","Tender – High Probability","In Hand","Negotiation"];

function money(v:number){return new Intl.NumberFormat("en-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(v||0)}

export default async function Dashboard(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
 if(!profile?.active)return <main className="nexus-page"><section className="nexus-empty"><div className="eyebrow">EMDAD NEXUS</div><h1>Access pending</h1><p>Your account is authenticated, but no active CRM user profile is assigned yet.</p></section></main>;
 const [{data:projects},{data:contracts}]=await Promise.all([
  supabase.from("projects").select("project_id,project_name,client,estimated_value,current_action,next_followup_date,updated_at").order("updated_at",{ascending:false}),
  supabase.from("contracts").select("contract_id,project_id,contract_value")
 ]);
 const rows=projects||[];const active=rows.filter(p=>stages.includes(p.current_action||""));const pipelineValue=active.reduce((n,p)=>n+Number(p.estimated_value||0),0);
 const contractRows=contracts||[];const contractValue=contractRows.reduce((n,c)=>n+Number(c.contract_value||0),0);
 const {data:collectionRows}=contractRows.length?await supabase.from("collections").select("contract_id,amount,status,collection_date").in("contract_id",contractRows.map(c=>c.contract_id)):{data:[]};
 const collectedStatuses=new Set(["collected","paid","تم التحصيل","محصل","محصلة","تحصيل"]);const cancelledStatuses=new Set(["cancelled","canceled","ملغى","ملغاة"]);
 const collected=(collectionRows||[]).filter(c=>{const st=String(c.status||"").trim().toLowerCase();return !cancelledStatuses.has(st)&&(collectedStatuses.has(st)||String(c.collection_date||"").trim()!=="");}).reduce((n,c)=>n+Number(c.amount||0),0);
 const today=new Date().toISOString().slice(0,10);const due=active.filter(p=>p.next_followup_date&&String(p.next_followup_date).slice(0,10)<=today).length;
 return <main className="nexus-page">
   <header className="nexus-page-head">
    <div><div className="eyebrow">SALES WORKSPACE</div><h1>Good to see you, {profile.name?.split(" ")[0]||"Walid"}</h1><p>Here’s what needs your attention today.</p></div>
    <div className="nexus-head-actions"><Link href="/projects" className="nexus-secondary"><FolderKanban size={16}/> View Projects</Link><Link href="/projects/new" className="nexus-primary"><Plus size={16}/> New Project</Link></div>
   </header>
   <section className="dashboard-stat-grid">
    <div className="nexus-stat-card"><div className="nexus-stat-icon blue"><FolderKanban size={18}/></div><div><span>Active Projects</span><strong>{active.length}</strong><small>Across your pipeline</small></div><ArrowUpRight size={16}/></div>
    <div className="nexus-stat-card"><div className="nexus-stat-icon green"><CircleDollarSign size={18}/></div><div><span>Pipeline Value</span><strong>{money(pipelineValue)}</strong><small>Estimated active value</small></div><TrendingUp size={16}/></div>
    <div className="nexus-stat-card"><div className="nexus-stat-icon amber"><CalendarClock size={18}/></div><div><span>Follow Ups Due</span><strong>{due}</strong><small>Today or overdue</small></div><ArrowUpRight size={16}/></div>
    <div className="nexus-stat-card"><div className="nexus-stat-icon purple"><Target size={18}/></div><div><span>Negotiations</span><strong>{active.filter(p=>p.current_action==="Negotiation").length}</strong><small>Late-stage opportunities</small></div><ArrowUpRight size={16}/></div>
    <div className="nexus-stat-card"><div className="nexus-stat-icon green"><CircleDollarSign size={18}/></div><div><span>Contract Value</span><strong>{money(contractValue)}</strong><small>Won / contracted</small></div></div>
    <div className="nexus-stat-card"><div className="nexus-stat-icon blue"><CircleDollarSign size={18}/></div><div><span>Collected</span><strong>{money(collected)}</strong><small>Recorded collections</small></div></div>
    <div className="nexus-stat-card"><div className="nexus-stat-icon amber"><CircleDollarSign size={18}/></div><div><span>Remaining</span><strong>{money(Math.max(contractValue-collected,0))}</strong><small>Outstanding balance</small></div></div>
   </section>
   <div className="dashboard-grid">
    <section className="nexus-panel"><div className="nexus-panel-head"><div><span className="eyebrow">PIPELINE</span><h2>Stage overview</h2></div><Link href="/pipeline">Open pipeline <ArrowUpRight size={14}/></Link></div>
      <div className="stage-list">{stages.map((s,i)=><div className="stage-row" key={s}><div className="stage-name"><span className={"stage-dot s"+i}/><span>{s}</span></div><strong>{active.filter(p=>p.current_action===s).length}</strong><span className="stage-value">{money(active.filter(p=>p.current_action===s).reduce((n,p)=>n+Number(p.estimated_value||0),0))}</span></div>)}</div>
    </section>
    <section className="nexus-panel"><div className="nexus-panel-head"><div><span className="eyebrow">RECENT</span><h2>Latest projects</h2></div><Link href="/projects">View all <ArrowUpRight size={14}/></Link></div>
      <div className="recent-projects">{active.slice(0,6).map(p=><Link href={"/projects/"+encodeURIComponent(p.project_id)} className="recent-project" key={p.project_id}><div className="recent-project-icon"><BriefcaseBusiness size={16}/></div><div><strong>{p.project_name||"Untitled project"}</strong><span>{p.client||"No client"}</span></div><div className="recent-project-meta"><b>{money(Number(p.estimated_value)||0)}</b><small>{p.current_action}</small></div></Link>)}{!active.length&&<div className="nexus-empty-inline">No active projects are available.</div>}</div>
    </section>
   </div>
 </main>;
}
