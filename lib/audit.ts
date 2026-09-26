import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Supabase service role configuration is missing.");
}

const adminClient = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function writeAuditLog(input: {
  timestamp?: string;
  userEmail: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}) {
  const { error } = await adminClient.from("audit_log").insert({
    log_id: crypto.randomUUID(),
    timestamp: input.timestamp || new Date().toISOString(),
    user_email: input.userEmail || "unknown",
    action: input.action,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    details: input.details || null,
  });
  if (error) throw new Error(error.message);
}
