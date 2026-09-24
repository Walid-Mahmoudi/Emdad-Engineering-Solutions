import { createClient } from "@/lib/supabase/server";
export default async function CollectionsPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Collections</h1><p>Unauthorized</p></main>;
 const {data}=await supabase.from("collections").select("collection_id,project_id,contract_id,collection_date,amount,payment_method,notes,projects(project_name,client)").order("collection_date",{ascending:false});
 const total=(data||[]).reduce((s,r)=>s+Number(r.amount||0),0);
 return <main className="nexus-page"><div className="nexus-header"><div><h1>Collections</h1><p>Recorded customer collections.</p></div></div><div className="pipeline-kpis"><div className="pipeline-kpi"><span>Collected</span><strong>{total.toLocaleString()} EGP</strong></div><div className="pipeline-kpi"><span>Transactions</span><strong>{data?.length||0}</strong></div></div><section className="nexus-card"><div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Amount</th><th>Method</th></tr></thead><tbody>{(data||[]).map(c=><tr key={c.collection_id}><td>{c.collection_date}</td><td>{c.projects?.project_name||c.project_id}</td><td>{c.projects?.client||"—"}</td><td>{Number(c.amount||0).toLocaleString()} EGP</td><td>{c.payment_method||"—"}</td></tr>)}{!data?.length&&<tr><td colSpan={5}>No collections yet.</td></tr>}</tbody></table></div></section></main>;
}
