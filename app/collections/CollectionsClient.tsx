"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteCollection } from "./actions";

export default function CollectionsClient({items}:{items:any[]}) {
  const [busy,setBusy]=useState(false); const [confirmOpen,setConfirmOpen]=useState<string|null>(null); const [message,setMessage]=useState("");
  async function remove(id:string){ setBusy(true); setMessage(""); try { await deleteCollection(id); window.location.reload(); } catch(e){ setMessage(e instanceof Error?e.message:String(e)); setBusy(false); } }
  return <div>{message&&<div className="form-error">{message}</div>}{confirmOpen&&<div className="nexus-modal-backdrop" role="dialog" aria-modal="true"><div className="nexus-modal"><div className="nexus-modal-head"><div><div className="eyebrow">COLLECTIONS</div><h3>Delete collection?</h3><p>The project balance will be recalculated after deletion.</p></div><button className="nexus-icon-button" onClick={()=>setConfirmOpen(null)} aria-label="Close">×</button></div><div className="nexus-modal-foot"><button className="nexus-secondary" onClick={()=>setConfirmOpen(null)}>Cancel</button><button className="nexus-primary" disabled={busy} onClick={()=>{const id=confirmOpen;setConfirmOpen(null);void remove(id)}}>Delete Collection</button></div></div></div>}<div className="nexus-table-wrap">
    <table className="nexus-table">
      <thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Contract</th><th>Amount</th><th>Method</th><th>Notes</th><th></th></tr></thead>
      <tbody>
        {items.map(c=>{
          const p=Array.isArray(c.projects)?c.projects[0]:c.projects;
          return <tr key={c.collection_id}>
            <td>{c.collection_date}</td>
            <td><Link href={"/projects/"+c.project_id} className="finance-project-link"><span><strong>{p?.project_name||c.project_id}</strong><small>{c.project_id}</small></span></Link></td>
            <td>{p?.client||"—"}</td><td>{c.contract_id}</td>
            <td className="money-cell">{Number(c.amount||0).toLocaleString()} EGP</td>
            <td>{c.payment_method||"—"}</td><td>{c.notes||"—"}</td>
            <td><button className="icon-button" disabled={busy} title="Delete collection" onClick={()=>setConfirmOpen(c.collection_id)}><Trash2 size={15}/></button></td>
          </tr>;
        })}
        {!items.length&&<tr><td colSpan={8}><div className="nexus-empty-inline">No collections yet.</div></td></tr>}
      </tbody>
    </table>
  </div></div>;
}
