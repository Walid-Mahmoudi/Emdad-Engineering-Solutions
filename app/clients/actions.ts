"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireContactWrite(deleteMode=false){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Unauthorized");
  const {data:profile}=await supabase.from("users").select("role,active").eq("email",user.email||"").maybeSingle();
  if(!profile?.active) throw new Error("Account is inactive");
  if(deleteMode ? !["Admin","Manager"].includes(profile.role) : !["Admin","Manager","Sales"].includes(profile.role)) throw new Error("You do not have permission to manage contacts.");
  return supabase;
}
function clean(v:unknown){return String(v??"").trim();}
export async function createContact(input:{name:string;jobTitle?:string;company:string;mobile?:string;whatsapp?:string;email?:string;contactType?:string;notes?:string}){
  const supabase=await requireContactWrite();
  const name=clean(input.name), company=clean(input.company);
  if(!name||!company) throw new Error("Name and Company are required.");
  const {error}=await supabase.from("contacts").insert({contact_id:crypto.randomUUID(),name,job_title:clean(input.jobTitle),company,mobile:clean(input.mobile),whatsapp:clean(input.whatsapp),email:clean(input.email),contact_type:clean(input.contactType)||"Other",notes:clean(input.notes)});
  if(error) throw new Error(error.message);
  revalidatePath("/clients"); revalidatePath("/contacts");
}
export async function updateContact(input:{contactId:string;name:string;jobTitle?:string;company:string;mobile?:string;whatsapp?:string;email?:string;contactType?:string;notes?:string}){
  const supabase=await requireContactWrite();
  const name=clean(input.name), company=clean(input.company);
  if(!input.contactId||!name||!company) throw new Error("Contact ID, Name and Company are required.");
  const {error}=await supabase.from("contacts").update({name,job_title:clean(input.jobTitle),company,mobile:clean(input.mobile),whatsapp:clean(input.whatsapp),email:clean(input.email),contact_type:clean(input.contactType)||"Other",notes:clean(input.notes),updated_at:new Date().toISOString()}).eq("contact_id",input.contactId);
  if(error) throw new Error(error.message);
  revalidatePath("/clients"); revalidatePath("/contacts");
}
export async function deleteContact(contactId:string){
  const supabase=await requireContactWrite(true);
  if(!contactId) throw new Error("Contact ID is required.");
  const {error}=await supabase.from("contacts").delete().eq("contact_id",contactId);
  if(error) throw new Error(error.message);
  revalidatePath("/clients"); revalidatePath("/contacts");
}
