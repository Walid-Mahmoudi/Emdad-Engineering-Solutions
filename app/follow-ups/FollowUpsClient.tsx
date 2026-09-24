"use client";
import { useMemo, useState } from "react";
import { addFollowUp, completeFollowUp } from "./actions";
const TYPES=["Call","Visit","Email","Meeting","WhatsApp","Other"];
export default function FollowUpsClient({projects,followUps}:{projects:any[];followUps:any[]}) {
  const [projectId,setProjectId]=useState(""); const [date,setDate]=useState(""); const [time,setTime]=useState(""); const [type,setType]=useState("Call"); const [notes,setNotes]=useState(""); const [nextDate,setNextDate]=useState(""); const [nextType,setNextType]=useState("Call"); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const today=new Date().toISOString().slice(0,10);
  const rows=useMemo(()=>followUps.filter(f=>!f.completed_at).map(f=>({...f,project:projects.find(p=>p.project_id===f.project_id)})),[followUps,projects]);
  const overdue=rows.filter(f=>f.follow_up_date && f.follow_up_date<today).length; const todayCount=rows.filter(f=>f.follow_up_date===today).length;
  async function save(){if(!projectId||!date){setMessage("Project and date are required.");return}setBusy(true);setMessage("");try{await addFollowUp({projectId,date,time,type,notes,nextActionDate:nextDate,nextActionType:nextDate?nextType:undefined});setMessage("Follow-up saved.");window.location.reload()}catch(e:any){setMessage(e.message||"Save failed.");setBusy(false)}}
  async function complete(id:string){const result=window.prompt("Follow-up result / outcome:");if(!result)return;const notes=window.prompt("Notes (optional):")||"";setBusy(true);try{await completeFollowUp({followUpId:id,result,notes});window.location.reload()}catch(e:any){setMessage(e.message||"Completion failed.");setBusy(false)}}
  return <div><div className="pipeline-kpis"><div className="pipeline-kpi"><span>Today</span><strong>{todayCount}</strong></div><div className="pipeline-kpi"><span>Overdue</span><strong>{overdue}</strong></div><div className="pipeline-kpi"><span>Open</span><strong>{rows.length}</strong></div></div>
  <section className="nexus-card" style={{marginBottom:16}}><h2>Add Follow Up</h2><div className="nexus-form-grid">
  <label>Project<select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p.project_id} value={p.project_id}>{p.project_name} — {p.client}</option>)}</select></label>
  <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label>
  <label>Type<select value={type} onChange={e=>setType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
  <label>Next Action Date<input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}/></label>
  <label>Next Action Type<select value={nextType} onChange={e=>setNextType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
  <label className="full">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}/></label></div><div style={{display:"flex",gap:10,alignItems:"center"}}><button className="nexus-primary" onClick={save} disabled={busy}>Save Follow Up</button>{message&&<span>{message}</span>}</div></section>
  <section className="nexus-card"><h2>Open Follow Ups</h2><div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Type</th><th>Next Action</th><th></th></tr></thead><tbody>{rows.map(f=><tr key={f.follow_up_id}><td>{f.follow_up_date}{f.follow_up_time?" "+f.follow_up_time:""}</td><td>{f.project?.project_name||f.project_id}</td><td>{f.project?.client||"—"}</td><td>{f.follow_up_type}</td><td>{f.next_action_date||"—"}</td><td><button className="nexus-secondary" onClick={()=>complete(f.follow_up_id)} disabled={busy}>Complete</button></td></tr>)}{rows.length===0&&<tr><td colSpan={6}>No open follow-ups.</td></tr>}</tbody></table></div></section></div>;
}
