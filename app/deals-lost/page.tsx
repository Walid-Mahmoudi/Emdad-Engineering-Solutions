import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowUpRight, TrendingDown } from "lucide-react";

function money(v:number){return Number(v||0).toLocaleString("en-EG")+" EGP";}

export default async function LostDealsPage(){
 const s=await createClient();
 const {data:{user}}=await s.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Lost Deals</h1><p>Unauthorized</p></main>;
 const {data:rows}=await s.from("projects").select("project_id,project_name,client,estimated_value,lost_reason,lost_type,updated_at,sales_person,location").eq("current_action","Closed Lost").order("updated_at",{ascending:false});
 const lost=rows??[];
 const total=lost.reduce((n,r)=>n+Number(r.estimated_value||0),0);
 const classified=lost.filter(r=>r.lost_type);
 const workable=lost.filter(r=>r.lost_type==="Can Work with Winner");
 const complete=lost.filter(r=>r.lost_type==="Project Lost Completely");
 return <main className="nexus-page deals-workspace">
  <header className="nexus-page-head"><div><div className="eyebrow">LOSS INTELLIGENCE</div><h1>Lost Deals</h1><p>Closed Lost opportunities separated from the active pipeline, with loss reason and recovery classification.</p></div><div className="nexus-head-actions"><Link href="/projects" className="nexus-secondary">Back to Projects <ArrowUpRight size={14}/></Link></div></header>
  <section className="dashboard-stat-grid finance-kpis">
   <div className="nexus-stat-card"><div className="nexus-stat-icon red"><TrendingDown size={18}/></div><div><span>Total Lost</span><strong>{lost.length}</strong><small>{money(total)}</small></div></div>
   <div className="nexus-stat-card"><div><span>Can Work with Winner</span><strong>{workable.length}</strong><small>Recovery opportunities</small></div></div>
   <div className="nexus-stat-card"><div><span>Project Lost Completely</span><strong>{complete.length}</strong><small>No recovery path</small></div></div>
   <div className="nexus-stat-card"><div><span>Unclassified</span><strong>{lost.length-classified.length}</strong><small>Older records</small></div></div>
  </section>
  <section className="nexus-card"><div className="section-head"><div><h2>Lost Project Register</h2><p className="muted">Open any project to review its full Project 360 record.</p></div></div>
   <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Project</th><th>Client</th><th>Sales Person</th><th>Loss Type</th><th>Loss Reason</th><th>Estimated Value</th><th>Updated</th></tr></thead>
   <tbody>{lost.map(r=><tr key={r.project_id}><td><Link href={"/projects/"+encodeURIComponent(r.project_id)}><strong>{r.project_name||r.project_id}</strong></Link><div className="muted">{r.project_id}</div></td><td>{r.client||"—"}</td><td>{r.sales_person||"—"}</td><td>{r.lost_type||"Not classified"}</td><td>{r.lost_reason||"—"}</td><td>{money(r.estimated_value)}</td><td>{r.updated_at?new Date(r.updated_at).toLocaleDateString("en-GB"):"—"}</td></tr>)}{!lost.length&&<tr><td colSpan={7}><div className="nexus-empty-inline">No Closed Lost projects yet.</div></td></tr>}</tbody></table></div>
  </section>
 </main>;
}
