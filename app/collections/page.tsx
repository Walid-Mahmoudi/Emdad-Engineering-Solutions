import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { WalletCards, CircleDollarSign, ReceiptText, FileCheck2 } from "lucide-react";
import CollectionsClient from "./CollectionsClient";

const collectedStatuses = new Set(["collected","paid","تم التحصيل","محصل","محصلة","تحصيل"]);
const cancelledStatuses = new Set(["cancelled","canceled","ملغى","ملغاة"]);
function isCollected(row:any){ const status=String(row.status||"").trim().toLowerCase(); const date=String(row.collection_date||"").trim(); return !cancelledStatuses.has(status) && (collectedStatuses.has(status) || date!==""); }

export default async function CollectionsPage() {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Collections</h1><p>Unauthorized</p></main>;
 const [{data:rows},{data:contracts}]=await Promise.all([
  supabase.from("collections").select("collection_id,project_id,contract_id,collection_date,due_date,amount,payment_method,status,quarter,notes,projects(project_name,client)").order("collection_date",{ascending:false}),
  supabase.from("contracts").select("contract_id,project_id,contract_value,projects(project_name,client)").order("contract_date",{ascending:false})
 ]);
 const items=rows??[];
 const total=items.filter(isCollected).reduce((s,r)=>s+Number(r.amount||0),0);
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
  <section className="nexus-card"><div className="section-head"><div><h2>Collection history</h2><p className="muted">Every recorded payment linked back to its project and contract.</p></div></div><CollectionsClient items={items}/></section>
 </main>;
}