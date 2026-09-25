"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { moveProjectStage } from "./actions";

const STAGES = ["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"] as const;
const LOST_REASONS = ["Lost to Competitor","Client/Contractor Lost Project","Project Cancelled","Budget Issue","Technical Rejection","Price","Project Completed","Other"] as const;
type Stage = typeof STAGES[number];

type Project = {
  project_id: string;
  project_name: string | null;
  client: string | null;
  estimated_value: number | null;
  current_action: Stage | null;
  next_followup_date: string | null;
};

function money(v: number | null) {
  return new Intl.NumberFormat("en-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(Number(v||0));
}

export default function PipelineBoard({ initialProjects }: { initialProjects: Project[] }) {
  const [projects,setProjects] = useState(initialProjects);
  const [dragging,setDragging] = useState<string|null>(null);
  const [pending,startTransition] = useTransition();
  const [error,setError] = useState("");
  const [modal,setModal] = useState<{project:Project;stage:Stage}|null>(null);
  const [form,setForm] = useState({contractDate:"",contractValue:"",lostReason:"",notes:""});

  const grouped = useMemo(() => Object.fromEntries(STAGES.map(stage => [stage, projects.filter(p => p.current_action === stage)])) as Record<Stage,Project[]>,[projects]);

  function requestMove(project:Project, stage:Stage) {
    if (project.current_action === stage || project.current_action === "Closed Won" || project.current_action === "Closed Lost") return;
    setError("");
    if (stage === "Closed Won" || stage === "Closed Lost") {
      setForm({contractDate:"",contractValue:String(project.estimated_value ?? ""),lostReason:"",notes:""});
      setModal({project,stage});
      return;
    }
    submitMove(project,stage,{});
  }

  function submitMove(project:Project, stage:Stage, extra:{contractDate?:string;contractValue?:number;lostReason?:string;notes?:string}) {
    const previous = project.current_action;
    setProjects(prev => prev.map(p => p.project_id === project.project_id ? {...p,current_action:stage} : p));
    startTransition(async () => {
      try {
        await moveProjectStage({projectId:project.project_id,newStage:stage,...extra});
        setModal(null);
      } catch (e) {
        setProjects(prev => prev.map(p => p.project_id === project.project_id ? {...p,current_action:previous} : p));
        setError(e instanceof Error ? e.message : "Stage update failed");
      }
    });
  }

  function confirmModal() {
    if (!modal) return;
    if (modal.stage === "Closed Lost" && !form.lostReason.trim()) { setError("Lost Reason is required."); return; }
    if (modal.stage === "Closed Won" && (!form.contractDate || Number(form.contractValue) <= 0)) { setError("Contract Date and Contract Value are required."); return; }
    submitMove(modal.project,modal.stage,{
      contractDate: form.contractDate || undefined,
      contractValue: form.contractValue ? Number(form.contractValue) : undefined,
      lostReason: form.lostReason || undefined,
      notes: form.notes || undefined
    });
  }

  return <div className="pipeline-wrap">
    {pending && <div className="save-bar">Saving stage change…</div>}
    {error && <div className="pipeline-error">{error}<button onClick={()=>setError("")}>Dismiss</button></div>}
    <div className="pipeline-board">
      {STAGES.map(stage => <section className="pipeline-column" key={stage}
        onDragOver={e=>e.preventDefault()}
        onDrop={()=>{if(dragging){const p=projects.find(x=>x.project_id===dragging);if(p)requestMove(p,stage);setDragging(null)}}}>
        <header><div><strong>{stage}</strong><span>{grouped[stage].length}</span></div></header>
        <div className="pipeline-cards">
          {grouped[stage].map(p=><article className="pipeline-card" key={p.project_id}
            draggable={stage!=="Closed Won"&&stage!=="Closed Lost"}
            onDragStart={()=>setDragging(p.project_id)}>
            <div className="pipeline-id">{p.project_id}</div>
            <Link href={"/projects/"+encodeURIComponent(p.project_id)}><h3>{p.project_name||"Untitled Project"}</h3></Link>
            <p>{p.client||"No client"}</p>
            <strong>{money(p.estimated_value)}</strong>
            <small>Next follow-up: {p.next_followup_date||"—"}</small>
            <select value={p.current_action||stage} disabled={stage==="Closed Won"||stage==="Closed Lost"||pending}
              onChange={e=>requestMove(p,e.target.value as Stage)}>
              {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </article>)}
          {!grouped[stage].length && <div className="empty-column">Drop projects here</div>}
        </div>
      </section>)}
    </div>

    {modal && <div className="modal-backdrop" onMouseDown={()=>setModal(null)}>
      <div className="modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="section-head"><div><div className="eyebrow">STAGE CHANGE</div><h2>{modal.stage}</h2><p className="muted">{modal.project.project_name} · {modal.project.client}</p></div><button className="icon-button" onClick={()=>setModal(null)}>×</button></div>
        {modal.stage==="Closed Won" && <><label>Contract Date<input type="date" value={form.contractDate} onChange={e=>setForm({...form,contractDate:e.target.value})}/></label><label>Contract Value<input type="number" min="0" value={form.contractValue} onChange={e=>setForm({...form,contractValue:e.target.value})}/></label></>}
        {modal.stage==="Closed Lost" && <label>Lost Reason<select value={form.lostReason} onChange={e=>setForm({...form,lostReason:e.target.value})}><option value="">Select a reason…</option>{LOST_REASONS.map(r=><option key={r}>{r}</option>)}</select></label>}
        <label>Notes (optional)<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
        <div className="modal-actions"><button className="button secondary" onClick={()=>setModal(null)}>Back</button><button className="button" onClick={confirmModal}>Save Stage</button></div>
      </div>
    </div>}
  </div>;
}
