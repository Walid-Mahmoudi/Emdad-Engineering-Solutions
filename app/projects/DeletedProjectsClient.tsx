"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { restoreProject } from "./actions";

export default function DeletedProjectsClient({projects}:{projects:any[]}){
  const [rows,setRows]=useState(projects);
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState("");

  async function restore(id:string){
    if(!window.confirm("Restore this project to the active CRM?")) return;
    setBusy(id);setMessage("");
    try{
      await restoreProject(id);
      setRows(x=>x.filter(p=>p.project_id!==id));
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
    finally{setBusy(null);}
  }

  return <section className="nexus-card project-table-card">
    <div className="table-toolbar"><div><strong>Deleted projects</strong><span>Admin restore workspace</span></div><div className="table-toolbar-meta">{rows.length} projects</div></div>
    {message&&<p className="form-error" style={{padding:"0 16px"}}>{message}</p>}
    <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>PROJECT</th><th>CLIENT</th><th>SALES PERSON</th><th>DELETED AT</th><th></th></tr></thead><tbody>
      {rows.map(p=><tr key={p.project_id}><td><Link className="project-link" href={"/projects/"+encodeURIComponent(p.project_id)}><span className="project-id">{p.project_id}</span><strong>{p.project_name||"Untitled project"}</strong></Link></td><td>{p.client||"—"}</td><td>{p.sales_person||"Unassigned"}</td><td>{p.deleted_at?new Date(p.deleted_at).toLocaleString("en-EG"):"—"}</td><td><button className="nexus-secondary" disabled={busy===p.project_id} onClick={()=>restore(p.project_id)}><RotateCcw size={14}/>{busy===p.project_id?"Restoring…":"Restore"}</button></td></tr>)}
      {!rows.length&&<tr><td colSpan={5}><div className="nexus-empty-inline">No deleted projects.</div></td></tr>}
    </tbody></table></div>
  </section>;
}
