"use server";

import { createClient } from "@/lib/supabase/server";

const STAGES = ["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"] as const;
type Stage = typeof STAGES[number];

export async function moveProjectStage(input: {
  projectId: string;
  newStage: Stage;
  notes?: string;
  contractDate?: string;
  contractValue?: number;
  lostReason?: string;
}) {
  if (!STAGES.includes(input.newStage)) throw new Error("Invalid pipeline stage");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase.rpc("move_project_stage", {
    p_project_id: input.projectId,
    p_new_action: input.newStage,
    p_notes: input.notes ?? null,
    p_contract_date: input.contractDate || null,
    p_contract_value: input.contractValue ?? null,
    p_lost_reason: input.lostReason || null,
  });
  if (error) throw new Error(error.message);
  return data;
}
