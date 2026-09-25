import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProjectActions from "../ProjectActions";

export const dynamic="force-dynamic";

function money(v:number|null|undefined){return new Intl.NumberFormat("en-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(v||0);}
function date(v:string|null|undefined){return v?new Date(v).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"—";}

export default async function ProjectDetails({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");

  const {data:profile}=await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
  if(!profile?.active) redirect("/dashboard");

  const {data:project}=await supabase.from("projects").select("*").eq("project_id",decodeURIComponent(id)).maybeSingle();
  if(!project) notFound();

  const [history,followups,contract,collections,contacts,attachments]=await Promise.all([
    supabase.from("action_history").select("*").eq("project_id",project.project_id).order("action_date",{ascending:false}).limit(20),
    supabase.from("follow_ups").select("*").eq("project_id",project.project_id).order("follow_up_date",{ascending:false}).limit(20),
    supabase.from("contracts").select("*").eq("project_id",project.project_id).order("contract_date",{ascending:false}).limit(1),
    supabase.from("collections").select("*").eq("project_id",project.project_id).order("collection_date",{ascending:false}),
    supabase.from("contacts").select("*").eq("company",project.client||"").order("name"),
    supabase.from("attachments").select("*").eq("project_id",project.project_id).order("uploaded_at",{ascending:false})
  ]);

  const contractRow=contract.data?.[0]||null;
  const collected=(collections.data||[]).reduce((n,c)=>n+Number(c.amount||0),0);
  const contractValue=Number(contractRow?.contract_value||0);

  return <main className="shell">
    <header className="topbar">
      <div><Link className="back-link" href="/projects">← Projects</Link><div className="eyebrow">PROJECT 360</div><h1>{project.project_name||"Untitled Project"}</h1><p className="muted">{project.client||"No client"} · {project.location||"No location"}</p></div>
      <span className="badge">{project.current_action||"—"}</span>
    </header>

    <section className="kpi-grid">
      <div className="card kpi"><span>Estimated Value</span><strong>{money(project.estimated_value)}</strong></div>
      <div className="card kpi"><span>Contract Value</span><strong>{money(contractValue)}</strong></div>
      <div className="card kpi"><span>Collected</span><strong>{money(collected)}</strong><small>{contractValue?Math.round(collected/contractValue*100)+"% collected":"—"}</small></div>
      <div className="card kpi"><span>Remaining</span><strong>{money(Math.max(0,contractValue-collected))}</strong></div>
    </section>

    <section className="card">
      <div className="section-head"><h2>Project Information</h2></div>
      <div className="detail-list">
        {[
          ["Project ID",project.project_id],["Client",project.client],["Sales Person",project.sales_person],
          ["Source Case",project.source_case],["Offer Sent",project.offer_sent],["Project Type",project.project_type],
          ["Location",project.location],["Consultant",project.consultant],["Opportunity Date",date(project.opportunity_date)],
          ["Last Follow Up",date(project.last_followup_date)],["Next Follow Up",date(project.next_followup_date)],
          ["Created",date(project.created_at)],["Updated",date(project.updated_at)]
        ].map(([k,v])=><div className="detail-item" key={k}><span>{k}</span><strong>{String(v??"—")}</strong></div>)}
      </div>
      {project.notes&&<div className="notes"><span>Notes</span><p>{project.notes}</p></div>}
      {project.lost_reason&&<div className="notes"><span>Lost Reason</span><p>{project.lost_reason}</p></div>}
    </section>

    <div className="detail-grid">
      <section className="card"><div className="section-head"><h2>Action History</h2><span className="muted">{history.data?.length||0}</span></div>
        {history.data?.length?<div className="timeline">{history.data.map(h=><div className="timeline-item" key={h.action_id}><strong>{h.new_action}</strong><span>{date(h.action_date)}</span><small>{h.previous_action||"Initial stage"}{h.notes?" · "+h.notes:""}</small></div>)}</div>:<p className="muted">No stage history.</p>}
      </section>
      <section className="card"><div className="section-head"><h2>Follow Ups</h2><span className="muted">{followups.data?.length||0}</span></div>
        {followups.data?.length?<div className="compact-list">{followups.data.map(f=><div className="list-row" key={f.follow_up_id}><div><strong>{f.follow_up_type||"Other"}</strong><span>{f.result||"Pending"}{f.notes?" · "+f.notes:""}</span></div><time>{date(f.follow_up_date)}</time></div>)}</div>:<p className="muted">No follow ups yet.</p>}
      </section>
    </div>

    <div className="detail-grid">
      <section className="card"><div className="section-head"><h2>Contracts & Collections</h2></div>
        {contractRow?<><div className="contract-box"><strong>{money(contractValue)}</strong><span>Contract · {date(contractRow.contract_date)}</span></div>{collections.data?.length?<div className="compact-list">{collections.data.map(c=><div className="list-row" key={c.collection_id}><div><strong>{money(c.amount)}</strong><span>{c.payment_method||"—"}{c.notes?" · "+c.notes:""}</span></div><time>{date(c.collection_date)}</time></div>)}</div>:<p className="muted">No collections yet.</p>}</>:<p className="muted">No contract. Collections are unavailable until Closed Won.</p>}
      </section>
      <section className="card"><div className="section-head"><h2>Contacts</h2><span className="muted">{contacts.data?.length||0}</span></div>
        {contacts.data?.length?<div className="compact-list">{contacts.data.map(c=><div className="list-row" key={c.contact_id}><div><strong>{c.name}</strong><span>{c.job_title||c.contact_type||"Contact"} · {c.mobile||c.whatsapp||c.email||"No contact detail"}</span></div></div>)}</div>:<p className="muted">No contacts linked to this client.</p>}
      </section>
    </div>

    <section className="card"><div className="section-head"><h2>Attachments</h2><span className="muted">{attachments.data?.length||0}</span></div>
      {attachments.data?.length?<div className="compact-list">{attachments.data.map(a=><a className="list-row" key={a.attachment_id} href={a.file_url} target="_blank" rel="noreferrer"><div><strong>{a.file_name}</strong><span>{a.mime_type||"File"} · {a.uploaded_by||"—"}</span></div></a>)}</div>:<p className="muted">No attachments.</p>}
    </section>
  </main>;
}
