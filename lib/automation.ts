import { createClient } from "@supabase/supabase-js";

function getAutomationClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Automation service credentials are not configured.");
  return createClient(url, key);
}

function setting(map: Map<string,string>, key: string, fallback: string) {
  return map.get(key) ?? fallback;
}

function localToDate(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second = 0] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const displayedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  const offset = displayedAsUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

export async function runCrmAutomation() {
  const supabase = getAutomationClient();
  const started = new Date();
  const { data: settings, error: settingsError } = await supabase.from("settings").select("type,value");
  if (settingsError) throw settingsError;

  const cfg = new Map((settings ?? []).map((row) => [String(row.type), String(row.value ?? "")]));
  if (setting(cfg, "AUTOMATION_ENABLED", "on") === "off") {
    await supabase.from("automation_log").insert({
      run_id: crypto.randomUUID(), run_at: started.toISOString(), job: "Hourly CRM Automation",
      status: "disabled", created_count: 0, email_count: 0, details: { reason: "AUTOMATION_ENABLED=off" }
    });
    return { created: 0, emailCount: 0, status: "disabled" as const };
  }

  const reminderHours = Math.max(1, Number(setting(cfg, "REMINDER_HOURS_BEFORE", "24")) || 24);
  const timeZone = setting(cfg, "AUTOMATION_TIMEZONE", "Africa/Cairo");
  const now = new Date();
  const windowEnd = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

  const [{ data: followUps, error: followUpError }, { data: projects, error: projectError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase.from("follow_ups").select("followup_id,project_id,followup_date,followup_time,followup_type,result,completed_at"),
      supabase.from("projects").select("project_id,project_name,client,sales_person"),
      supabase.from("users").select("email,sales_name,active").eq("active", true)
    ]);

  if (followUpError) throw followUpError;
  if (projectError) throw projectError;
  if (usersError) throw usersError;

  const projectMap = new Map((projects ?? []).map((p) => [String(p.project_id), p]));
  const userMap = new Map((users ?? []).map((u) => [String(u.sales_name ?? "").trim().toLowerCase(), u]));

  const candidates: Array<{followup:any; project:any; email:string; due:Date; overdue:boolean}> = [];
  for (const followUp of followUps ?? []) {
    if (followUp.completed_at) continue;
    const project = projectMap.get(String(followUp.project_id));
    if (!project) continue;
    const salesName = String(project.sales_person ?? "").trim().toLowerCase();
    const user = userMap.get(salesName);
    if (!user?.email) continue;

    const date = String(followUp.followup_date ?? "").slice(0,10);
    if (!date) continue;
    const time = String(followUp.followup_time ?? "00:00:00").slice(0,8);
    const due = localToDate(date, time, timeZone);
    if (Number.isNaN(due.getTime())) continue;

    const overdue = due < now;
    if (overdue || due <= windowEnd) candidates.push({ followup: followUp, project, email: user.email, due, overdue });
  }

  let created = 0;
  for (const item of candidates) {
    const kind = item.overdue ? "overdue_follow_up" : "follow_up_reminder";
    const uniqueKey = `${kind}:${item.followup.followup_id}:${item.due.toISOString().slice(0,13)}`;
    const title = item.overdue ? "Overdue Follow-Up" : "Upcoming Follow-Up";
    const dueLabel = item.due.toLocaleString("en-GB", { timeZone });
    const message = item.overdue
      ? `${item.project.project_name} — follow-up is overdue (scheduled ${dueLabel}).`
      : `${item.project.project_name} — ${item.followup.followup_type} scheduled for ${dueLabel}.`;

    const { error } = await supabase.from("notifications").upsert({
      notification_id: crypto.randomUUID(),
      unique_key: uniqueKey,
      recipient_email: item.email,
      kind,
      project_id: item.project.project_id,
      title,
      message,
      due_date: item.due.toISOString(),
      created_at: now.toISOString()
    }, { onConflict: "unique_key", ignoreDuplicates: true });

    if (error) {
      if (error.code === "23505") continue;
      throw error;
    }
    created++;
  }

  await supabase.from("automation_log").insert({
    run_id: crypto.randomUUID(),
    run_at: now.toISOString(),
    job: "Hourly CRM Automation",
    status: "success",
    created_count: created,
    email_count: 0,
    details: {
      reminderHours,
      candidates: candidates.length,
      overdue: candidates.filter((x) => x.overdue).length,
      emailNotifications: setting(cfg, "EMAIL_NOTIFICATIONS", "off")
    }
  });

  return { created, emailCount: 0, status: "success" as const };
}
