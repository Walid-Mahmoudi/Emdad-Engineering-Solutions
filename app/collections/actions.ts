"use server";
import { createClient } from "@/lib/supabase/server";
export async function addCollection(input:{contractId:string;projectId:string;date:string;amount:number;paymentMethod?:string;notes?:string}){
 if(!input.date||!Number.isFinite(input.amount)||input.amount<=0)throw new Error("Collection date and a positive amount are required");
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)throw new Error("Unauthorized");
 const {data:contract,error:ce}=await supabase.from("contracts").select("contract_id,project_id,contract_value").eq("contract_id",input.contractId).eq("project_id",input.projectId).maybeSingle();
 if(ce)throw new Error(ce.message);if(!contract)throw new Error("Contract not found or not accessible");
 const {data:rows}=await supabase.from("collections").select("amount").eq("contract_id",input.contractId);
 const collected=(rows||[]).reduce((s,r)=>s+Number(r.amount||0),0);const remaining=Number(contract.contract_value)-collected;
 if(input.amount>remaining)throw new Error("Collection amount exceeds remaining balance");
 const id=crypto.randomUUID();const {error}=await supabase.from("collections").insert({collection_id:id,contract_id:input.contractId,project_id:input.projectId,collection_date:input.date,amount:input.amount,payment_method:input.paymentMethod||null,notes:input.notes||null,created_at:new Date().toISOString()});
 if(error)throw new Error(error.message);
 await supabase.from("audit_log").insert({log_id:crypto.randomUUID(),timestamp:new Date().toISOString(),user:user.email||"unknown",action:"Collection Created",entity_type:"Collection",entity_id:id,details:JSON.stringify({project_id:input.projectId,contract_id:input.contractId,amount:input.amount})});
 return id;
}
export async function deleteCollection(collectionId:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Unauthorized");
 const {data:c}=await supabase.from("collections").select("collection_id,project_id").eq("collection_id",collectionId).maybeSingle();if(!c)throw new Error("Collection not found");
 const {error}=await supabase.from("collections").delete().eq("collection_id",collectionId);if(error)throw new Error(error.message);
 await supabase.from("audit_log").insert({log_id:crypto.randomUUID(),timestamp:new Date().toISOString(),user:user.email||"unknown",action:"Collection Deleted",entity_type:"Collection",entity_id:collectionId,details:JSON.stringify({project_id:c.project_id})});
 return true;
}
