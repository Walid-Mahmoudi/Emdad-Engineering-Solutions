"use client";
import { useState } from "react";
import { deleteContract } from "./actions";
export default function ContractsClient({contracts}:{contracts:any[]}){
 const [busy,setBusy]=useState(false);
 async function remove(id:string){if(!confirm("Delete this contract? Linked collections will also be deleted."))return;setBusy(true);try{await deleteContract(id);location.reload()}catch(e:any){alert(e.message);setBusy(false)}}
 return <section className="nexus-card"><div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Project</th><th>Client</th><th>Contract Date</th><th>Contract Value</th><th>Action</th></tr></thead><tbody>{contracts.map(c=><tr key={c.contract_id}><td>{c.projects?.project_name||c.project_id}</td><td>{c.projects?.client||"—"}</td><td>{c.contract_date}</td><td>{Number(c.contract_value||0).toLocaleString()} EGP</td><td><button className="nexus-secondary" disabled={busy} onClick={()=>remove(c.contract_id)}>Delete</button></td></tr>)}{!contracts.length&&<tr><td colSpan={5}>No contracts yet.</td></tr>}</tbody></table></div></section>;
}
