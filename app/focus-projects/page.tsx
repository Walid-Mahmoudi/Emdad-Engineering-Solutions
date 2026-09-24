import { createClient } from "@/lib/supabase/server";
import FocusClient from "./FocusClient";
export default async function FocusPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return <main className="nexus-page"><h1>Focus Projects</h1><p>Unauthorized</p></main>;
 const {data}=await supabase.from("projects").select("project_id,project_name,client,estimated_value,current_action,next_followup_date,last_followup_date,updated_at,location,project_type").in("current_action",["Tender – High Probability","In Hand","Negotiation"]).order("updated_at",{ascending:false});
 return <main className="nexus-page"><div className="nexus-header"><div><h1>Focus Projects</h1><p>High-priority opportunities and action health.</p></div></div><FocusClient projects={data??[]}/></main>;
}