import "./globals.css";
import type { Metadata } from "next";
import {createClient} from "@/lib/supabase/server";
import NexusNav from "./NexusNav";
import NexusTopbar from "./NexusTopbar";
export const metadata:Metadata={title:"EMDAD NEXUS",description:"EMDAD Engineering Solutions CRM"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();let role=""; let name=""; let email="";
 if(user){const {data:p}=await s.from("users").select("name,email,role,active").eq("user_id",user.id).maybeSingle();if(p?.active){role=p.role||"";name=p.name||"";email=p.email||user.email||"";}}
 return <html lang="en"><body>{role?<><NexusNav role={role} name={name} email={email}/><main className="nexus-main"><NexusTopbar role={role}/>{children}</main></>:children}</body></html>
}