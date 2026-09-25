import { createClient } from "@/lib/supabase/server";
import ContractsClient from "./ContractsClient";
import { FileCheck2, CircleDollarSign, WalletCards } from "lucide-react";

export default async function ContractsPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Contracts</h1><p>Unauthorized</p></main>;
 const {data}=await supabase.from("contracts").select("contract_id,project_id,contract_date,contract_value,created_at,projects(project_name,client,current_action)").order("contract_date",{ascending:false});
 const rows=data??[];
 const total=rows.reduce((s,r)=>s+Number(r.contract_value||0),0);
 const projectIds=rows.map(r=>r.project_id);
 const {data:collections}=projectIds.length?await supabase.from("collections").select("contract_id,amount").in("contract_id",rows.map(r=>r.contract_id)): {data:[]};
 const collected=(collections??[]).reduce((s,r)=>s+Number(r.amount||0),0);
 return <main className="nexus-page finance-workspace">
  <header className="nexus-page-head"><div><div className="eyebrow">REVENUE & FINANCE</div><h1>Contracts</h1><p>Contract register with collection progress and outstanding balances.</p></div><div className="nexus-head-actions"><span className="workspace-chip"><FileCheck2 size={14}/> {rows.length} contracts</span></div></header>
  <section className="dashboard-stat-grid finance-kpis">
   <div className="nexus-stat-card"><div className="nexus-stat-icon blue"><FileCheck2 size={18}/></div><div><span>Contracts</span><strong>{rows.length}</strong><small>Closed won projects</small></div></div>
   <div className="nexus-stat-card"><div className="nexus-stat-icon purple"><CircleDollarSign size={18}/></div><div><span>Contract Value</span><strong>{total.toLocaleString()} EGP</strong><small>Total signed value</small></div></div>
   <div className="nexus-stat-card"><div className="nexus-stat-icon green"><WalletCards size={18}/></div><div><span>Collected</span><strong>{collected.toLocaleString()} EGP</strong><small>Recorded collections</small></div></div>
   <div className="nexus-stat-card"><div className="nexus-stat-icon amber"><CircleDollarSign size={18}/></div><div><span>Remaining</span><strong>{Math.max(total-collected,0).toLocaleString()} EGP</strong><small>Outstanding balance</small></div></div>
  </section>
  <ContractsClient contracts={rows} collections={collections??[]}/>
 </main>;
}