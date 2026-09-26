"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileCheck2 } from "lucide-react";

export default function ContractsClient({contracts,collections}:{contracts:any[];collections:any[]}){
 const [message,setMessage]=useState("");
 return <section className="nexus-card contract-workspace-card">{message&&<div className="form-error">{message}</div>}
  <div className="section-head"><div><h2>Contract portfolio</h2><p className="muted">Track signed value, collected amount and remaining balance per project.</p></div><Link href="/collections" className="nexus-secondary">Open Collections <ChevronRight size={14}/></Link></div>
  <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Project</th><th>Client</th><th>Contract Date</th><th>Contract Value</th><th>Collected</th><th>Remaining</th><th>Status</th></tr></thead>
  <tbody>{contracts.map(c=>{const value=Number(c.contract_value||0);const collected=Math.min(collectedByContract.get(c.contract_id)||0,value);const remaining=Math.max(value-collected,0);const pct=value?Math.round(collected/value*100):0;return <tr key={c.contract_id}>
   <td><Link href={"/projects/"+c.project_id} className="finance-project-link"><FileCheck2 size={14}/><span><strong>{c.projects?.project_name||c.project_id}</strong><small>{c.project_id}</small></span></Link></td>
   <td>{c.projects?.client||"—"}</td><td>{c.contract_date}</td><td className="money-cell">{value.toLocaleString()} EGP</td><td className="money-cell">{collected.toLocaleString()} EGP</td><td className="money-cell">{remaining.toLocaleString()} EGP</td>
   <td><div className="collection-progress"><div><span>{pct}% collected</span><strong>{remaining===0?"Complete":"Open"}</strong></div><i><b style={{width:`${Math.min(pct,100)}%`}}/></i></div></td>
   
  </tr>})}{!contracts.length&&<tr><td colSpan={8}><div className="nexus-empty-inline">No contracts yet.</div></td></tr>}</tbody></table></div>
 </section>;
}