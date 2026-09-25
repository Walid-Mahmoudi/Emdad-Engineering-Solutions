"use server";

import { createClient } from "@/lib/supabase/server";

async function admin() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: p } = await s.from("users").select("role").eq("user_id", user.id).maybeSingle();
  if (!p || !["Admin", "Manager"].includes(p.role)) throw new Error("Access denied");
  return { s, user };
}

export async function getBackup() {
  const { s } = await admin();
  const tables = ["projects", "action_history", "follow_ups", "contracts", "collections", "users", "settings", "deleted_projects", "audit_log", "contacts", "attachments", "notifications", "automation_log"];
  const out: any = { exportedAt: new Date().toISOString() };
  for (const t of tables) {
    const { data, error } = await s.from(t).select("*");
    if (error) throw new Error(t + ": " + error.message);
    out[t] = data || [];
  }
  return out;
}

export async function runQualityScan() {
  const { s } = await admin();
  const findings: any[] = [];
  const { data: p, error } = await s.from("projects").select("project_id,project_name,client,current_action,estimated_value,next_followup_date");
  if (error) throw new Error(error.message);
  for (const x of p || []) {
    if (!x.project_name) findings.push({ severity: "Critical", type: "Missing project name", project_id: x.project_id });
    if (x.estimated_value != null && Number(x.estimated_value) < 0) findings.push({ severity: "Critical", type: "Negative estimated value", project_id: x.project_id });
    if (!x.current_action) findings.push({ severity: "Critical", type: "Missing stage", project_id: x.project_id });
    if (!x.client) findings.push({ severity: "Warning", type: "Missing client", project_id: x.project_id });
    if (!["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"].includes(x.current_action || "")) {
      findings.push({ severity: "Critical", type: "Invalid pipeline stage", project_id: x.project_id });
    }
  }
  return { scanned: p?.length || 0, findings };
}

export async function getDeletedProjects() {
  const { s } = await admin();
  const { data, error } = await s.from("deleted_projects").select("project_id,deleted_at").order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (data || []).map(x => x.project_id);
  const { data: projects, error: projectError } = ids.length
    ? await s.from("projects").select("project_id,project_name,client,sales_person,current_action").in("project_id", ids)
    : { data: [], error: null };
  if (projectError) throw new Error(projectError.message);
  const byId = new Map((projects || []).map(x => [x.project_id, x]));
  return (data || []).map(x => ({ ...x, project: byId.get(x.project_id) || null }));
}

export async function restoreDeletedProject(projectId: string) {
  const { s, user } = await admin();
  if (!projectId) throw new Error("Project ID is required");

  const { data: deleted, error: deletedError } = await s.from("deleted_projects")
    .select("project_id,deleted_at").eq("project_id", projectId).maybeSingle();
  if (deletedError) throw new Error(deletedError.message);
  if (!deleted) throw new Error("Deleted project not found");

  const { data: existing, error: existingError } = await s.from("projects")
    .select("project_id").eq("project_id", projectId).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) throw new Error("Project already exists in CRM");

  const { error: deleteError } = await s.from("deleted_projects").delete().eq("project_id", projectId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: auditError } = await s.from("audit_log").insert({
    log_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    user_email: user.email || "system",
    action: "RESTORE_REQUESTED",
    entity_type: "PROJECT",
    entity_id: projectId,
    details: {
      message: "Deleted-project tombstone removed. The next source sync will restore the source record if it still exists and is in scope.",
      project_id: projectId
    }
  });
  if (auditError) throw new Error(auditError.message);

  return { ok: true, projectId };
}
