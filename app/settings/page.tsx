import { createClient } from "@/lib/supabase/server";
import { CalendarClock, Database, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="nexus-page"><h1>Settings</h1><p>Unauthorized</p></main>;

  const { data: profile } = await supabase.from("users").select("role").eq("user_id", user.id).maybeSingle();
  if (!profile || !["Admin", "Manager"].includes(profile.role)) return <main className="nexus-page"><h1>Settings</h1><p>Access restricted to Admin and Manager.</p></main>;

  async function saveSettings(formData: FormData) {
    "use server";
    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) redirect("/login");
    const { data: currentProfile } = await client.from("users").select("role").eq("user_id", currentUser.id).maybeSingle();
    if (!currentProfile || !["Admin", "Manager"].includes(currentProfile.role)) throw new Error("Access restricted to Admin and Manager.");

    const values: Record<string, string> = {
      "CRM Name": String(formData.get("crmName") || "").trim() || "EMDAD NEXUS",
      "Company Name": String(formData.get("companyName") || "").trim() || "EMDAD Engineering Solutions",
      "Currency": String(formData.get("currency") || "EGP").trim(),
      "Default Follow-Up Days": String(formData.get("followUpDays") || "3").trim(),
      "Default Follow-Up Type": String(formData.get("followUpType") || "Call").trim(),
      "Week Starts": String(formData.get("weekStarts") || "Sunday").trim(),
      "AUTOMATION_ENABLED": formData.get("automationEnabled") === "on" ? "on" : "off",
      "EMAIL_NOTIFICATIONS": formData.get("emailNotifications") === "on" ? "on" : "off",
      "REMINDER_HOURS_BEFORE": String(formData.get("reminderHours") || "24"),
      "OVERDUE_ESCALATION": formData.get("overdueEscalation") === "on" ? "on" : "off",
      "AUTOMATION_TIMEZONE": "Africa/Cairo",
      "CALENDAR_REMINDERS_ENABLED": formData.get("calendarReminders") === "on" ? "on" : "off",
      "CALENDAR_REMINDER_DAY_BEFORE": formData.get("calendarDayBefore") === "on" ? "on" : "off",
      "CALENDAR_REMINDER_HOURS": String(formData.get("calendarHours") || "2"),
    };
    if (!["EGP", "USD", "SAR", "EUR"].includes(values["Currency"])) throw new Error("Invalid currency.");
    const days = Number(values["Default Follow-Up Days"]);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("Default Follow-Up Days must be between 1 and 365.");
    if (!["Call", "Visit", "Email", "Meeting", "WhatsApp", "Other"].includes(values["Default Follow-Up Type"])) throw new Error("Invalid default follow-up type.");
    if (!["Sunday", "Monday"].includes(values["Week Starts"])) throw new Error("Invalid week start.");
    if (!["1", "6", "24", "48", "72"].includes(values["REMINDER_HOURS_BEFORE"])) throw new Error("Invalid reminder window.");
    if (!["1", "2"].includes(values["CALENDAR_REMINDER_HOURS"])) throw new Error("Invalid calendar reminder window.");

    for (const [type, value] of Object.entries(values)) {
      const { data: existing, error: lookupError } = await client.from("settings").select("type").eq("type", type).maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (existing) {
        const { error } = await client.from("settings").update({ value }).eq("type", type);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await client.from("settings").insert({ type, value });
        if (error) throw new Error(error.message);
      }
    }
    revalidatePath("/settings");
    revalidatePath("/automation");
    redirect("/settings?saved=1");
  }

  const { data } = await supabase.from("settings").select("type,value").order("type");
  const rows = data ?? [];
  const settings = new Map(rows.map((row) => [row.type, row.value]));
  const pipelineStages = (settings.get("Pipeline Stages") || "Tender,Tender – High Probability,In Hand,Negotiation,Closed Won,Closed Lost")
    .split(",").map((stage: string) => stage.trim()).filter(Boolean);

  return (
    <main className="nexus-page settings-workspace">
      <header className="nexus-page-head">
        <div><div className="eyebrow">ADMINISTRATION</div><h1>Settings</h1><p>EMDAD NEXUS control center and CRM configuration.</p></div>
        <div className="nexus-head-actions"><span className="workspace-chip"><ShieldCheck size={14} /> {profile.role} access</span></div>
      </header>
      <section className="settings-summary-grid">
        <div className="nexus-card settings-summary"><Database size={18} /><div><span>CRM</span><strong>{settings.get("CRM Name") || "EMDAD NEXUS"}</strong><small>{settings.get("Company Name") || "EMDAD Engineering Solutions"}</small></div></div>
        <div className="nexus-card settings-summary"><CalendarClock size={18} /><div><span>Follow Up</span><strong>{settings.get("Default Follow-Up Type") || "Call"}</strong><small>Default after {settings.get("Default Follow-Up Days") || "3"} days</small></div></div>
        <div className="nexus-card settings-summary"><SlidersHorizontal size={18} /><div><span>Pipeline</span><strong>{pipelineStages.length} stages</strong><small>{settings.get("Week Starts") || "Sunday"} week start</small></div></div>
      </section>
      <section className="nexus-card">
        <div className="section-head"><div><h2>Configuration</h2><p className="muted">Core CRM and legacy automation defaults. Calendar authorization remains a separate integration step.</p></div></div>
        <form action={saveSettings} className="settings-form">
          <div className="settings-form-grid">
            <label>CRM Name<input name="crmName" defaultValue={settings.get("CRM Name") || "EMDAD NEXUS"} /></label>
            <label>Company Name<input name="companyName" defaultValue={settings.get("Company Name") || "EMDAD Engineering Solutions"} /></label>
            <label>Currency<select name="currency" defaultValue={settings.get("Currency") || "EGP"}>{["EGP","USD","SAR","EUR"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Default Follow-Up Days<input name="followUpDays" type="number" min={1} max={365} defaultValue={settings.get("Default Follow-Up Days") || "3"} /></label>
            <label>Default Follow-Up Type<select name="followUpType" defaultValue={settings.get("Default Follow-Up Type") || "Call"}>{["Call","Visit","Email","Meeting","WhatsApp","Other"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Week Starts<select name="weekStarts" defaultValue={settings.get("Week Starts") || "Sunday"}><option>Sunday</option><option>Monday</option></select></label>
          </div>
          <div className="settings-form-grid">
            <label><span><Zap size={14}/> Automation Enabled</span><input name="automationEnabled" type="checkbox" defaultChecked={(settings.get("AUTOMATION_ENABLED") || "on") === "on"} /></label>
            <label><span>Email Notifications</span><input name="emailNotifications" type="checkbox" defaultChecked={settings.get("EMAIL_NOTIFICATIONS") === "on"} /></label>
            <label>Reminder Window<select name="reminderHours" defaultValue={settings.get("REMINDER_HOURS_BEFORE") || "24"}>{["1","6","24","48","72"].map((value) => <option key={value}>{value} hours</option>)}</select></label>
            <label><span>Overdue Escalation</span><input name="overdueEscalation" type="checkbox" defaultChecked={(settings.get("OVERDUE_ESCALATION") || "on") === "on"} /></label>
            <label><span>Calendar Events for Calls & Meetings</span><input name="calendarReminders" type="checkbox" defaultChecked={(settings.get("CALENDAR_REMINDERS_ENABLED") || "on") === "on"} /></label>
            <label><span>Day-Before Calendar Reminder</span><input name="calendarDayBefore" type="checkbox" defaultChecked={(settings.get("CALENDAR_REMINDER_DAY_BEFORE") || "on") === "on"} /></label>
            <label>Same-Day Calendar Alert<select name="calendarHours" defaultValue={settings.get("CALENDAR_REMINDER_HOURS") || "2"}><option value="1">1 hour before</option><option value="2">2 hours before</option></select></label>
          </div>
          <div className="settings-form-actions"><button className="btn primary" type="submit">Save Settings</button></div>
        </form>
      </section>
      <section className="nexus-card">
        <div className="section-head"><div><h2>All Configuration Keys</h2><p className="muted">Source-sync and system keys remain visible but are not editable from this screen.</p></div></div>
        <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Setting</th><th>Value</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.type}><td>{row.type}</td><td>{row.value || "—"}</td></tr>)}</tbody>
        </table></div>
      </section>
    </main>
  );
}
