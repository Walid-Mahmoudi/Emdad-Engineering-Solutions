"use server";

import { createClient } from "@/lib/supabase/server";
import { BellRing, Clock3, History, Mail, Play, ShieldCheck } from "lucide-react";
import { revalidatePath } from "next/cache";
import { runCrmAutomation } from "@/lib/automation";

async function runNow() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("users").select("role,active").eq("user_id", user.id).maybeSingle();
  if (!profile?.active || !["Admin", "Manager"].includes(profile.role)) throw new Error("Access restricted to Admin and Manager.");
  await runCrmAutomation();
  revalidatePath("/automation");
  revalidatePath("/notifications");
}

export default async function AutomationPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return <main className="nexus-page"><h1>Automation</h1><p>Unauthorized</p></main>;
  const {data:profile}=await supabase.from("users").select("role,active").eq("user_id",user.id).maybeSingle();
  if(!profile?.active || !["Admin","Manager"].includes(profile.role)) return <main className="nexus-page"><h1>Automation</h1><p>Access restricted to Admin and Manager.</p></main>;

  const [{data:settings},{data:logs},{data:notifications}]=await Promise.all([
    supabase.from("settings").select("type,value").in("type",["AUTOMATION_ENABLED","EMAIL_NOTIFICATIONS","REMINDER_HOURS_BEFORE","OVERDUE_ESCALATION","AUTOMATION_TIMEZONE","CALENDAR_REMINDERS_ENABLED","CALENDAR_REMINDER_DAY_BEFORE","CALENDAR_REMINDER_HOURS"]).order("type"),
    supabase.from("automation_log").select("run_id,run_at,job,status,created_count,email_count,details").order("run_at",{ascending:false}).limit(20),
    supabase.from("notifications").select("notification_id,kind,title,project_id,due_date,created_at,read_at").order("created_at",{ascending:false}).limit(100)
  ]);

  const cfg=new Map((settings??[]).map(x=>[x.type,x.value]));
  const logRows=logs??[];
  const noticeRows=notifications??[];
  const unread=noticeRows.filter(x=>!x.read_at).length;
  const enabled=cfg.get("AUTOMATION_ENABLED")!=="off";

  return <main className="nexus-page automation-workspace">
    <header className="nexus-page-head">
      <div><div className="eyebrow">ADMINISTRATION</div><h1>Automation</h1><p>Operational view of reminders, notifications and automation runs.</p></div>
      <div className="nexus-head-actions">
        <span className="workspace-chip"><ShieldCheck size={14}/> {enabled?"Enabled":"Disabled"}</span>
        <form action={runNow}><button className="btn" type="submit"><Play size={14}/> Run Now</button></form>
      </div>
    </header>

    <section className="dashboard-stat-grid automation-kpis">
      <div className="nexus-stat-card"><div className="nexus-stat-icon blue"><BellRing size={18}/></div><div><span>Notifications</span><strong>{noticeRows.length}</strong><small>{unread} unread</small></div></div>
      <div className="nexus-stat-card"><div className="nexus-stat-icon purple"><History size={18}/></div><div><span>Automation Runs</span><strong>{logRows.length}</strong><small>Latest 20 runs</small></div></div>
      <div className="nexus-stat-card"><div className="nexus-stat-icon amber"><Clock3 size={18}/></div><div><span>Reminder Window</span><strong>{cfg.get("REMINDER_HOURS_BEFORE")||"24"}h</strong><small>{cfg.get("AUTOMATION_TIMEZONE")||"Africa/Cairo"}</small></div></div>
      <div className="nexus-stat-card"><div className="nexus-stat-icon green"><Mail size={18}/></div><div><span>Email Alerts</span><strong>{cfg.get("EMAIL_NOTIFICATIONS")==="on"?"On":"Off"}</strong><small>Source automation setting</small></div></div>
    </section>

    <section className="automation-grid">
      <div className="nexus-card"><div className="section-head"><div><h2>Automation Configuration</h2><p className="muted">Values carried from the legacy CRM automation layer.</p></div></div>
        <div className="automation-config-list">{(settings??[]).map(x=><div className="automation-config-row" key={x.type}><span>{x.type}</span><strong>{x.value||"—"}</strong></div>)}{!(settings??[]).length&&<div className="nexus-empty-inline">No automation configuration has been stored in Supabase yet.</div>}</div>
      </div>
      <div className="nexus-card"><div className="section-head"><div><h2>Latest Runs</h2><p className="muted">Execution history from AUTOMATION_LOG.</p></div></div>
        <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Run</th><th>Job</th><th>Status</th><th>Created</th><th>Emails</th></tr></thead><tbody>{logRows.map(x=><tr key={x.run_id}><td>{x.run_at}</td><td>{x.job}</td><td>{x.status}</td><td>{x.created_count??0}</td><td>{x.email_count??0}</td></tr>)}{!logRows.length&&<tr><td colSpan={5}><div className="nexus-empty-inline">No automation runs recorded.</div></td></tr>}</tbody></table></div>
      </div>
    </section>

    <section className="nexus-card"><div className="section-head"><div><h2>Recent Notifications</h2><p className="muted">Current notification queue generated by automation.</p></div></div>
      <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Due</th><th>Kind</th><th>Title</th><th>Project</th><th>Status</th></tr></thead><tbody>{noticeRows.slice(0,30).map(x=><tr key={x.notification_id}><td>{x.due_date||"—"}</td><td>{x.kind}</td><td>{x.title}</td><td>{x.project_id||"—"}</td><td>{x.read_at?"Read":"Unread"}</td></tr>)}{!noticeRows.length&&<tr><td colSpan={5}><div className="nexus-empty-inline">No notifications recorded.</div></td></tr>}</tbody></table></div>
    </section>
  </main>
}