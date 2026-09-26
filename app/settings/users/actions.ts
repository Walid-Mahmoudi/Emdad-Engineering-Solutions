"use server";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("users").select("user_id,role,active").eq("user_id", user.id).maybeSingle();
  if (!profile?.active || profile.role !== "Admin") throw new Error("Admin permission is required.");
  return { supabase, user };
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function saveUser(input: {
  userId?: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Sales";
  active: boolean;
  salesName?: string;
}) {
  const { supabase, user } = await requireAdmin();
  const userId = String(input.userId || "").trim();
  const name = String(input.name || "").trim();
  const email = normalizeEmail(input.email);
  const salesName = String(input.salesName || "").trim();

  if (!name) throw new Error("User name is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("A valid email is required.");
  if (!["Admin", "Manager", "Sales"].includes(input.role)) throw new Error("Invalid role.");
  if (input.role === "Sales" && !salesName) throw new Error("Sales Name is required for Sales users.");

  const { data: duplicateEmail, error: emailError } = await supabase
    .from("users").select("user_id").ilike("email", email).neq("user_id", userId || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (emailError) throw new Error(emailError.message);
  if (duplicateEmail) throw new Error("This email is already registered.");

  if (input.role === "Sales") {
    const { data: duplicateSales, error: salesError } = await supabase
      .from("users").select("user_id").eq("sales_name", salesName).eq("active", true)
      .neq("user_id", userId || "00000000-0000-0000-0000-000000000000").maybeSingle();
    if (salesError) throw new Error(salesError.message);
    if (duplicateSales) throw new Error("This Sales Name is already assigned to another active user.");
  }

  if (userId) {
    if (userId === user.id && !input.active) throw new Error("You cannot deactivate your own EMDAD NEXUS access.");
    const { error: authError } = await supabase.functions.invoke("admin-user-management", {
      body: { action: input.active ? "enable" : "disable", userId }
    });
    if (authError) throw new Error(authError.message);
    const { data: existing, error: existingError } = await supabase.from("users").select("user_id").eq("user_id", userId).maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) throw new Error("User not found.");

    const { error } = await supabase.from("users").update({
      name, email, role: input.role, active: input.active,
      sales_name: input.role === "Sales" ? salesName : null,
      updated_at: new Date().toISOString()
    }).eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { data: authResult, error: authError } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "create", name, email }
    });
    if (authError) throw new Error(authError.message);
    const createdUserId = String(authResult?.userId || "").trim();
    if (!createdUserId) throw new Error("Auth user was not created.");
    const now = new Date().toISOString();
    const { error } = await supabase.from("users").insert({
      user_id: createdUserId, name, email, role: input.role, active: input.active,
      sales_name: input.role === "Sales" ? salesName : null, created_at: now, updated_at: now
    });
    if (error) {
      await supabase.functions.invoke("admin-user-management", { body: { action: "disable", userId: createdUserId } });
      throw new Error(error.message);
    }
  }

  await supabase.from("audit_log").insert({
    log_id: crypto.randomUUID(), timestamp: new Date().toISOString(),
    user_email: user.email || "unknown",
    action: userId ? "UPDATE_USER" : "CREATE_USER",
    entity_type: "User", entity_id: userId || email,
    details: { name, email, role: input.role, active: input.active, sales_name: salesName }
  });

  return { ok: true };
}

export async function disableUser(userId: string) {
  const { supabase, user } = await requireAdmin();
  const id = String(userId || "").trim();
  if (!id) throw new Error("User ID is required.");
  if (id === user.id) throw new Error("You cannot remove your own EMDAD NEXUS access.");

  const { data: target, error: targetError } = await supabase.from("users").select("user_id,name,email,role,sales_name").eq("user_id", id).maybeSingle();
  if (targetError) throw new Error(targetError.message);
  if (!target) throw new Error("User not found.");

  const { error } = await supabase.from("users").update({ active: false, updated_at: new Date().toISOString() }).eq("user_id", id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    log_id: crypto.randomUUID(), timestamp: new Date().toISOString(),
    user_email: user.email || "unknown", action: "DISABLE_USER", entity_type: "User", entity_id: id,
    details: { name: target.name, email: target.email, role: target.role, sales_name: target.sales_name || "" }
  });
  return { ok: true };
}
