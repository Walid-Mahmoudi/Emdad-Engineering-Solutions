"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { softDeleteProject } from "./actions";

export default function ProjectDangerZone({projectId,role}:{projectId:string;role:string}){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  if(!["Admin","Manager"].includes(role)) return null;
  async function handleDelete(){
    if(!window.confirm("Delete this project? It will be moved to Deleted Projects and can be restored by an Admin.")) return;
    setBusy(true);setMessage("");
    try{ await softDeleteProject(projectId); window.location.href="/projects"; }
    catch(e){ setMessage(e instanceof Error?e.message:String(e)); setBusy(false); }
  }
  return <section className="card" style={{borderColor:"#fecaca"}}>
    <div className="section-head"><div><h2>Project Management</h2><p className="muted">Deletion is reversible. The project and its history remain in the database.</p></div></div>
    <button className="nexus-secondary" disabled={busy} onClick={handleDelete}><Trash2 size={14}/>{busy?"Moving…":"Move to Deleted Projects"}</button>
    {message&&<p className="form-error">{message}</p>}
  </section>;
}
