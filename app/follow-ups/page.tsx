import { createClient } from "@/lib/supabase/server";
import FollowUpsClient from "./FollowUpsClient";
import { Plus, CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function FollowUpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="nexus-page"><h1>Follow Ups</h1><p>Unauthorized</p></main>;
  const [{ data: projects }, { data: followUps }] = await Promise.all([
    supabase.from("projects").select("project_id,project_name,client,sales_person,current_action,next_followup_date").not("current_action","in","(Closed Won,Closed Lost)").order("next_followup_date",{ascending:true,nullsFirst:false}),
    supabase.from("follow_ups").select("follow_up_id,project_id,follow_up_date,follow_up_time,follow_up_type,result,notes,next_action_date,next_action_type,next_action_status,completed_at,completed_result,completed_notes").order("follow_up_date",{ascending:true}).limit(500)
  ]);
  return <main className="nexus-page followups-workspace"><header className="nexus-page-head"><div><div className="eyebrow">ACTIVITY MANAGEMENT</div><h1>Follow Ups</h1><p>Plan, execute and complete customer activities without losing the next action.</p></div><div className="nexus-head-actions"><span className="workspace-chip"><CalendarClock size={14}/> Activity queue</span></div></header><FollowUpsClient projects={projects ?? []} followUps={followUps ?? []} /></main>;
}
