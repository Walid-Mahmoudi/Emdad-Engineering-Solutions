"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Command, Plus, Search, ChevronDown } from "lucide-react";
import { FormEvent, useState } from "react";

const titles:Record<string,string> = {
  "/dashboard":"Dashboard",
  "/projects":"Projects",
  "/pipeline":"Pipeline",
  "/focus-projects":"Focus Projects",
  "/follow-ups":"Follow Ups",
  "/contracts":"Contracts",
  "/collections":"Collections",
  "/deals-done":"Deals Done",
  "/clients":"Clients",
  "/contacts":"Contacts",
  "/reports":"Reports",
  "/notifications":"Notifications",
};

export default function NexusTopbar({role}:{role:string}){
  const pathname=usePathname();
  const router=useRouter();
  const [q,setQ]=useState("");
  const title=Object.entries(titles).find(([p])=>pathname===p||pathname.startsWith(p+"/"))?.[1]||"Workspace";
  function submit(e:FormEvent){e.preventDefault();if(q.trim())router.push("/projects?search="+encodeURIComponent(q.trim()));}
  return <header className="nexus-topbar">
    <div className="nexus-breadcrumb"><span>Sales Workspace</span><b>/</b><strong>{title}</strong></div>
    <div className="nexus-topbar-actions">
      <form className="nexus-global-search" onSubmit={submit}>
        <Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search CRM..." aria-label="Search CRM"/>
        <kbd><Command size={11}/> K</kbd>
      </form>
      <Link href="/projects/new" className="nexus-create"><Plus size={16}/> Create</Link>
      <Link href="/notifications" className="nexus-top-icon" aria-label="Notifications"><Bell size={18}/><i/></Link>
      <button className="nexus-top-profile"><span>W</span><strong>Walid</strong><ChevronDown size={14}/></button>
    </div>
  </header>;
}