import { createClient } from "@/lib/supabase/server";
import ReportsClient from "./ReportsClient";
export default async function ReportsPage({searchParams}:{searchParams:Promise<{type?:string;from?:string;to?:string;period?:string}>}){
 const params=await searchParams;
 const s=await createClient();
 const {data:{user}}=await s.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Reports</h1><p>Unauthorized</p></main>;
 const [{data:projects},{data:followups},{data:contracts},{data:collections},{data:history}]=await Promise.all([
  s.from("projects").select("project_id,project_name,client,current_action,project_type,location,estimated_value,opportunity_date,next_followup_date,created_at,updated_at"),
  s.from("follow_ups").select("followup_id,project_id,followup_date,followup_type,result,next_action_date,notes"),
  s.from("contracts").select("contract_id,project_id,contract_date,contract_value"),
  s.from("collections").select("collection_id,contract_id,project_id,collection_date,due_date,amount,payment_method,status,quarter,notes"),
  s.from("action_history").select("project_id,new_action,action_date")
 ]);
 return <main className="nexus-page reports-workspace"><header className="nexus-page-head"><div><div className="eyebrow">REPORTING CENTER</div><h1>Reports</h1><p>Operational reports from the current EMDAD NEXUS dataset.</p></div><div className="nexus-head-actions"><span className="workspace-chip">{projects?.length||0} projects · {contracts?.length||0} contracts</span></div></header><ReportsClient projects={projects||[]} followups={followups||[]} contracts={contracts||[]} collections={collections||[]} history={history||[]} initialType={params.type} initialFrom={params.from} initialTo={params.to} initialPeriod={params.period}/></main>;
}