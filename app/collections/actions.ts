"use server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
const collectedStatuses = new Set(["collected","paid","تم التحصيل","محصل","محصلة","تحصيل"]);
const cancelledStatuses = new Set(["cancelled","canceled","ملغى","ملغاة"]);
function countsAsCollected(row:{status?:string|null;collection_date?:string|null}){const status=String(row.status||"").trim().toLowerCase();const date=String(row.collection_date||"").trim();return !cancelledStatuses.has(status)&&(collectedStatuses.has(status)||date!=="");}

export async function addCollection(input:{contractId:string;projectId:string;date:string;amount:number;paymentMethod?:string;status?:string;dueDate?:string;quarter?:string;notes?:string}) {
 if(!input.date||!Number.isFinite(input.amount)||input.amount<=0)throw new Error("Collection date and a positive amount are required");
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Unauthorized");
 const {data:contract,error:contractError}=await supabase.from("contracts").select("contract_id,project_id,contract_value").eq("contract_id",input.contractId).eq("project_id",input.projectId).maybeSingle();
 if(contractError)throw new Error(contractError.message);if(!contract)throw new Error("Contract not found or not accessible");
 const {data:rows,error:rowsError}=await supabase.from("collections").select("amount,status,collection_date").eq("contract_id",input.contractId);
 if(rowsError)throw new Error(rowsError.message);
 const collected=(rows||[]).filter(countsAsCollected).reduce((sum,row)=>sum+Number(row.amount||0),0);
 const remaining=Number(contract.contract_value||0)-collected;if(input.amount>remaining)throw new Error("Collection amount exceeds remaining balance");
 const id=crypto.randomUUID(),now=new Date().toISOString();
 const {error}=await supabase.from("collections").insert({collection_id:id,contract_id:input.contractId,project_id:input.projectId,collection_date:input.date,due_date:input.dueDate||null,amount:input.amount,payment_method:input.paymentMethod||null,status:input.status||null,quarter:input.quarter||null,notes:input.notes||null,created_at:now});
 if(error)throw new Error(error.message);
 await writeAuditLog({timestamp:now,userEmail:user.email||"unknown",action:"Collection Created",entityType:"Collection",entityId:id,details:{project_id:input.projectId,contract_id:input.contractId,amount:input.amount,status:input.status||null}});
 return id;
}
export async function deleteCollection(collectionId:string){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Unauthorized");
 const {data:collection,error:fetchError}=await supabase.from("collections").select("collection_id,project_id,amount").eq("collection_id",collectionId).maybeSingle();
 if(fetchError)throw new Error(fetchError.message);if(!collection)throw new Error("Collection not found");
 const {error}=await supabase.from("collections").delete().eq("collection_id",collectionId);if(error)throw new Error(error.message);
 await writeAuditLog({userEmail:user.email||"unknown",action:"Collection Deleted",entityType:"Collection",entityId:collectionId,details:{project_id:collection.project_id,amount:collection.amount}});
 return true;
}