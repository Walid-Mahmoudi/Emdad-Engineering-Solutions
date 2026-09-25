"use server";

import { createClient } from "@/lib/supabase/server";

export async function addCollection(input: {
  contractId: string;
  projectId: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}) {
  if (!input.date || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Collection date and a positive amount are required");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("contract_id,project_id,contract_value")
    .eq("contract_id", input.contractId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (contractError) throw new Error(contractError.message);
  if (!contract) throw new Error("Contract not found or not accessible");

  const { data: rows, error: rowsError } = await supabase
    .from("collections")
    .select("amount")
    .eq("contract_id", input.contractId);

  if (rowsError) throw new Error(rowsError.message);

  const collected = (rows || []).reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );
  const remaining = Number(contract.contract_value || 0) - collected;

  if (input.amount > remaining) {
    throw new Error("Collection amount exceeds remaining balance");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await supabase.from("collections").insert({
    collection_id: id,
    contract_id: input.contractId,
    project_id: input.projectId,
    collection_date: input.date,
    amount: input.amount,
    payment_method: input.paymentMethod || null,
    notes: input.notes || null,
    created_at: now,
  });

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    log_id: crypto.randomUUID(),
    timestamp: now,
    user_email: user.email || "unknown",
    action: "Collection Created",
    entity_type: "Collection",
    entity_id: id,
    details: {
      project_id: input.projectId,
      contract_id: input.contractId,
      amount: input.amount,
    },
  });

  return id;
}

export async function deleteCollection(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("collection_id,project_id,amount")
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!collection) throw new Error("Collection not found");

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("collection_id", collectionId);

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    log_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    user_email: user.email || "unknown",
    action: "Collection Deleted",
    entity_type: "Collection",
    entity_id: collectionId,
    details: { project_id: collection.project_id, amount: collection.amount },
  });

  return true;
}
