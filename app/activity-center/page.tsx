import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Activity, Clock3, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

export default async function ActivityPage(){
 const s=await createClient(); const {data:{user}}=await s.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Activity Center</h1><p>Unauthorized</p></main>;
 const today=new Date().toISOString().slice(0,10);
 const [{data:followUps},{data:history}]=await Promise.all([
  s.from("follow_ups").select("followup_id,project_id,followup_date,followup_time,followup_type,result,next_action_date,next_action_type,completed_at,completed_result,projects(project_name,client)").order("followup_date",{ascending:false}).limit(200),
  s.from("action_history").select("action_id,project_id,previous_action,new_action,action_date,notes,projects(project_name,client)").order("action_date",{ascending:false}).limit(100)
 ]);
 const fu=followUps||[],open=fu.filter(x=>!x.completed_at),overdue=open.filter(x=>x.followup_date&&x.followup_date<today),completed=fu.filter(x=>x.completed_at);
 return <main className="nexus-page activity-workspace">
  <header className="nexus-page-head"><div><div className="eyebrow">CRM ACTIVITY CENTER</div><h1>Activity Center</h1><p>Operational view of open, overdue and completed customer activities.</p></div><div className="nexus-head-actions"><Link href="/follow-ups" className="nexus-secondary">Open Follow Ups <ArrowUpRight size={14}/></Link></div></header>
  <section className="activity-summary"><div><Activity size={16}/><span>Open</span><strong>{open.length}</strong></div><div><AlertCircle size={16}/><span>Overdue</span><strong>{overdue.length}</strong></div><div><CheckCircle2 size={16}/><span>Completed</span><strong>{completed.length}</strong></div><div><Clock3 size={16}/><span>Stage changes</span><strong>{(history||[]).length}</strong></div></section>
  <section className="nexus-card"><div className="section-head"><div><h2>Customer activity</h2><p className="muted">Follow-ups are shown with their current completion state.</p></div></div>
   <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Type</th><th>Result</th><th>Next Action</th><th>Status</th></tr></thead>
    <tbody>{fu.map(x=>{const p=Array.isArray(x.projects)?x.projects[0]:x.projects;const isOverdue=!x.completed_at&&x.followup_date&&x.followup_date<today;return <tr key={x.followup_id}><td>{x.followup_date||"—"}{x.followup_time?" "+x.followup_time:""}</td><td><Link href={"/projects/"+x.project_id}>{p?.project_name||x.project_id}</Link></td><td>{p?.client||"—"}</td><td>{x.followup_type||"—"}</td><td>{x.completed_result||x.result||"—"}</td><td>{x.next_action_date?x.next_action_date+" / "+(x.next_action_type||""):"—"}</td><td>{x.completed_at?"Completed":isOverdue?"Overdue":"Open"}</td></tr>})}{!fu.length&&<tr><td colSpan={7}>No activity yet.</td></tr>}</tbody>
   </table></div>
  </section>
  <section className="nexus-card"><div className="section-head"><div><h2>Recent stage changes</h2><p className="muted">Pipeline movement, separate from the administrative Audit Log.</p></div></div>
   <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Time</th><th>Project</th><th>Previous</th><th>New</th><th>Notes</th></tr></thead><tbody>{(history||[]).map(x=>{const p=Array.isArray(x.projects)?x.projects[0]:x.projects;return <tr key={x.action_id}><td>{x.action_date}</td><td>{p?.project_name||x.project_id}</td><td>{x.previous_action||"—"}</td><td>{x.new_action}</td><td>{x.notes||"—"}</td></tr>})}{!history?.length&&<tr><td colSpan={5}>No stage changes yet.</td></tr>}</tbody></table></div>
  </section>
 </main>
}