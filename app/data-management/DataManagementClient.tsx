"use client";

import { useEffect, useState } from "react";
import { DatabaseBackup, RefreshCw, ShieldCheck, Trash2, Wrench } from "lucide-react";
import { getBackup, getDeletedProjects, restoreDeletedProject, runQualityScan } from "./actions";

type DeletedRow={project_id:string;deleted_at:string;project?:{project_id:string;project_name:string|null;client:string|null;sales_person:string|null;current_action:string|null}|null};

export default function DataManagementClient(){
  const [busy,setBusy]=useState("");
  const [result,setResult]=useState<any>(null);
  const [deleted,setDeleted]=useState<DeletedRow[]>([]);
  const [selected,setSelected]=useState("");

  async function loadDeleted(){try{setDeleted(await getDeletedProjects())}catch(e:any){setResult({error:e.message})}}
  useEffect(()=>{loadDeleted()},[]);

  async function backup(){setBusy("backup");try{const d=await getBackup();const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="EMDAD-NEXUS-backup.json";a.click();URL.revokeObjectURL(url)}catch(e:any){setResult({error:e.message})}finally{setBusy("")}}
  async function scan(){setBusy("scan");try{setResult(await runQualityScan())}catch(e:any){setResult({error:e.message})}finally{setBusy("")}}
  async function restore(){if(!selected)return;setBusy("restore");try{const r=await restoreDeletedProject(selected);setResult(r);setSelected("");await loadDeleted()}catch(e:any){setResult({error:e.message})}finally{setBusy("")}}

  return <div className="data-management-workspace">
    <section className="data-management-cards">
      <div className="nexus-card"><div className="section-icon-title"><DatabaseBackup size={18}/><div><h2>Backup</h2><p>Export a full JSON snapshot of the CRM tables.</p></div></div><button className="nexus-primary" onClick={backup} disabled={!!busy}>{busy==="backup"?"Preparing…":"Download Full JSON Backup"}</button></div>
      <div className="nexus-card"><div className="section-icon-title"><Wrench size={18}/><div><h2>Data Quality</h2><p>Scan projects for missing or invalid core data.</p></div></div><button className="nexus-secondary" onClick={scan} disabled={!!busy}>{busy==="scan"?"Scanning…":"Run Quality Scan"}</button></div>
    </section>

    <section className="nexus-card">
      <div className="section-head"><div><div className="eyebrow">CONTROLLED RESTORE</div><h2>Deleted Projects</h2><p className="muted">Restore is manual. Removing the tombstone allows the next source sync to restore the source record.</p></div><span className="workspace-chip"><Trash2 size={14}/> {deleted.length} deleted</span></div>
      <div className="restore-toolbar">
        <select value={selected} onChange={e=>setSelected(e.target.value)} disabled={!deleted.length||!!busy}>
          <option value="">Select a deleted project…</option>
          {deleted.map(row=><option key={row.project_id} value={row.project_id}>{row.project?.project_name||row.project_id} · {row.project?.client||"No client"}</option>)}
        </select>
        <button className="nexus-primary" onClick={restore} disabled={!selected||!!busy}><RefreshCw size={14}/>{busy==="restore"?"Restoring…":"Restore Selected"}</button>
      </div>
      <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Project</th><th>Client</th><th>Sales Person</th><th>Deleted</th><th>Stage</th></tr></thead><tbody>
        {deleted.map(row=><tr key={row.project_id}><td><strong>{row.project?.project_name||row.project_id}</strong><small>{row.project_id}</small></td><td>{row.project?.client||"—"}</td><td>{row.project?.sales_person||"—"}</td><td>{row.deleted_at}</td><td>{row.project?.current_action||"Awaiting source restore"}</td></tr>)}
        {!deleted.length&&<tr><td colSpan={5}><div className="nexus-empty-inline"><ShieldCheck size={16}/> No deleted projects awaiting restore.</div></td></tr>}
      </tbody></table></div>
    </section>

    {result&&<section className="nexus-card"><div className="section-head"><div><h2>Operation Result</h2></div></div><pre className="data-result">{JSON.stringify(result,null,2)}</pre></section>}
  </div>
}