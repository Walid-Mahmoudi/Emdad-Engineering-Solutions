import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { WalletCards, CircleDollarSign, ReceiptText, FileCheck2 } from "lucide-react";

export default async function CollectionsPage() {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Collections</h1><p>Unauthorized</p></main>;
 const [{data:rows},{data:contracts}]=await Promise.all([
  supabase.from("collections").select("collection_id,project_id,contract_id,collection_date,amount,payment_method,notes,projects(project_name,client)").order("collection_date",{ascending:false}),
  supabase.from("contracts").select("contract_id,project_id,contract_value,projects(project_name,client)").order("contract_date",{ascending:false})
 ]);
 const items=rows??[];
 const total=items.reduce((s,r)=>s+Number(r.amount||0),0);
 const contractValue=(contracts??[]).reduce((s,r)=>s+Number(r.contract_value||0),0);
 const remaining=Math.max(contractValue-total,0);
 return <main className="nexus-page finance-workspace">
  <header className="nexus-page-head"><div><div className="eyebrow">REVENUE & FINANCE</div><h1>Collections</h1><p>Monitor cash collected against signed contract value.</p></div><div className="nexus-head-actions"><Link href="/contracts" className="nexus-secondary"><FileCheck2 size={14}/> Contracts</Link></div></header>
  <section className="dashboard-stat-grid finance-kpis">
   <div className="nexus-stat-card"><div className="nexus-stat-icon green"><WalletCards size={18}/></div><div><span>Collected</span><strong>{total.toLocaleString()} EGP</strong><small>Recorded receipts</small></div></div>
   <div className="nexus-stat-card"><div className="nexus-stat-icon blue"><FileCheck2 size={18}/></div><div><span>Contract Value</span><strong>{contractValue.toLocaleString()} EGP</strong><small>Signed value</small></div></div>
   <div className="nexus-stat-card"><div className="nexus-stat-icon amber"><CircleDollarSign size={18}/></div><div><span>Remaining</span><strong>{remaining.toLocaleString()} EGP</strong><small>Outstanding balance</small></div></div>
   <div className="nexus-stat-card"><div className="nexus-stat-icon purple"><ReceiptText size={18}/></div><div><span>Transactions</span><strong>{items.length}</strong><small>Collection entries</small></div></div>
  </section>
  <section className="nexus-card">
   <div className="section-head"><div><h2>Collection history</h2><p className="muted">Every recorded payment linked back to its project and contract.</p></div></div>
   <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Contract</th><th>Amount</th><th>Method</th><th>Notes</th></tr></thead><tbody>
   {items.map(c=>{const p=Array.isArray(c.projects)?c.projects[0]:c.projects;return <tr key={c.collection_id}><td>{c.collection_date}</td><td><Link href={"/projects/"+c.project_id} className="finance-project-link"><span><strong>{p?.project_name||c.project_id}</strong><small>{c.project_id}</small></span></Link></td><td>{p?.client||"—"}</td><td>{c.contract_id}</td><td className="money-cell">{Number(c.amount||0).toLocaleString()} EGP</td><td>{c.payment_method||"—"}</td><td>{c.notes||"—"}</td></tr>})}
   {!items.length&&<tr><td colSpan={7}><div className="nexus-empty-inline">No collections yet.</div></td></tr>}</tbody></table></div>
  </section>
 </main>;
}