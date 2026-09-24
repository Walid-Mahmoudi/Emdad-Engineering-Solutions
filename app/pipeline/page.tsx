import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PipelineBoard from "./PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("name,email,role,active,sales_name").eq("user_id",user.id).maybeSingle();
  if (!profile?.active) redirect("/dashboard");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("project_id,project_name,client,estimated_value,current_action,next_followup_date")
    .in("current_action",["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"])
    .order("updated_at",{ascending:false});

  if (error) throw new Error(error.message);

  return <main className="shell">
    <header className="topbar">
      <div><Link className="back-link" href="/dashboard">← Dashboard</Link><div className="eyebrow">EMDAD NEXUS</div><h1>Sales Pipeline</h1><p className="muted">Six-stage pipeline with backend-enforced stage rules.</p></div>
      <Link className="button secondary" href="/projects">Projects</Link>
    </header>
    <PipelineBoard initialProjects={(projects||[]) as any} />
  </main>;
}
