import { createClient } from "@/lib/supabase/server";
import ContractsClient from "./ContractsClient";
export default async function ContractsPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Contracts</h1><p>Unauthorized</p></main>;
 const {data}=await supabase.from("contracts").select("contract_id,project_id,contract_date,contract_value,created_at,projects(project_name,client,current_action)").order("contract_date",{ascending:false});
 return <main className="nexus-page"><div className="nexus-header"><div><h1>Contracts</h1><p>Contract register and linked collections.</p></div></div><ContractsClient contracts={data??[]}/></main>;
}
