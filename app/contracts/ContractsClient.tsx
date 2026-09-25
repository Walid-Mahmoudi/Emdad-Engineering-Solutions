"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Trash2, FileCheck2 } from "lucide-react";
import { deleteContract } from "./actions";

export default function ContractsClient({contracts,collections}:{contracts:any[];collections:any[]}){
 const [busy,setBusy]=useState(false); const [confirmOpen,setConfirmOpen]=useState<string|null>(null); const [message,setMessage]=useState("");
 const collectedByContract=useMemo(()=>{const m=new Map<string,number>();const collectedStatuses=new Set(["collected","paid","تم التحصيل","محصل","محصلة","تحصيل"]);const cancelledStatuses=new Set(["cancelled","canceled","ملغى","ملغاة"]);for(const c of collections){const status=String(c.status||"").trim().toLowerCase();const date=String(c.collection_date||"").trim();if(!cancelledStatuses.has(status)&&(collectedStatuses.has(status)||date!==""))m.set(c.contract_id,(m.get(c.contract_id)||0)+Number(c.amount||0));}return m},[collections]);
 async function remove(id:string){setBusy(true);setMessage("");try{await deleteContract(id);location.reload()}catch(e:any){setMessage(e.message);setBusy(false)}}
 return <section className="nexus-card contract-workspace-card">{message&&<div className="form-error">{message}</div>}{confirmOpen&&<div className="nexus-modal-backdrop" role="dialog" aria-modal="true"><div className="nexus-modal"><div className="nexus-modal-head"><div><div className="eyebrow">CONTRACTS</div><h3>Delete contract?</h3><p>All linked collections will also be deleted and the remaining balance recalculated.</p></div><button className="nexus-icon-button" onClick={()=>setConfirmOpen(null)} aria-label="Close">×</button></div><div className="nexus-modal-foot"><button className="nexus-secondary" onClick={()=>setConfirmOpen(null)}>Cancel</button><button className="nexus-primary" disabled={busy} onClick={()=>{const id=confirmOpen;setConfirmOpen(null);void remove(id)}}>Delete Contract</button></div></div></div>}
  <div className="section-head"><div><h2>Contract portfolio</h2><p className="muted">Track signed value, collected amount and remaining balance per project.</p></div><Link href="/collections" className="nexus-secondary">Open Collections <ChevronRight size={14}/></Link></div>
  <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Project</th><th>Client</th><th>Contract Date</th><th>Contract Value</th><th>Collected</th><th>Remaining</th><th>Status</th><th></th></tr></thead>
  <tbody>{contracts.map(c=>{const value=Number(c.contract_value||0);const collected=Math.min(collectedByContract.get(c.contract_id)||0,value);const remaining=Math.max(value-collected,0);const pct=value?Math.round(collected/value*100):0;return <tr key={c.contract_id}>
   <td><Link href={"/projects/"+c.project_id} className="finance-project-link"><FileCheck2 size={14}/><span><strong>{c.projects?.project_name||c.project_id}</strong><small>{c.project_id}</small></span></Link></td>
   <td>{c.projects?.client||"—"}</td><td>{c.contract_date}</td><td className="money-cell">{value.toLocaleString()} EGP</td><td className="money-cell">{collected.toLocaleString()} EGP</td><td className="money-cell">{remaining.toLocaleString()} EGP</td>
   <td><div className="collection-progress"><div><span>{pct}% collected</span><strong>{remaining===0?"Complete":"Open"}</strong></div><i><b style={{width:`${Math.min(pct,100)}%`}}/></i></div></td>
   <td><button className="icon-button" disabled={busy} title="Delete contract" onClick={()=>setConfirmOpen(c.contract_id)}><Trash2 size={15}/></button></td>
  </tr>})}{!contracts.length&&<tr><td colSpan={8}><div className="nexus-empty-inline">No contracts yet.</div></td></tr>}</tbody></table></div>
 </section>;
}