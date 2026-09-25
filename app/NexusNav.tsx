"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, Bell, BriefcaseBusiness, CalendarCheck2, ChartNoAxesCombined,
  CheckCircle2, CircleDollarSign, ClipboardList, ContactRound, Database,
  FileCheck2, FolderKanban, Gauge, LayoutDashboard, LifeBuoy, Menu,
  PanelLeftClose, Settings2, ShieldCheck, Target, UsersRound, X
} from "lucide-react";

type IconComponent = React.ComponentType<{ size?: number; strokeWidth?: number }>;
type NavItem = [string, string, IconComponent];

const mainItems: NavItem[] = [
  ["/dashboard","Dashboard",LayoutDashboard],
  ["/projects","Projects",FolderKanban],
  ["/pipeline","Pipeline",ChartNoAxesCombined],
  ["/focus-projects","Focus Projects",Target],
  ["/follow-ups","Follow Ups",CalendarCheck2],
  ["/contracts","Contracts",FileCheck2],
  ["/collections","Collections",CircleDollarSign],
  ["/deals-done","Deals Done",CheckCircle2],
  ["/clients","Clients",BriefcaseBusiness],
  ["/contacts","Contacts",ContactRound],
  ["/reports","Reports",Gauge],
  ["/notifications","Notifications",Bell],
];

export default function NexusNav({role}:{role:string}){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const admin=role==="Admin"||role==="Manager";
  const items:NavItem[]=[...mainItems];
  if(admin) items.push(["/data-management","Data Management",Database],["/settings","Settings",Settings2]);
  if(role==="Admin") items.push(["/settings/users","User Access",UsersRound]);
  if(admin) items.push(["/audit-log","Audit Log",ShieldCheck]);
  const active=(href:string)=>pathname===href||pathname.startsWith(href+"/");

  return <>
    <button className="nexus-mobile-toggle" onClick={()=>setOpen(v=>!v)} aria-label="Open navigation">
      {open?<X size={21}/>:<Menu size={21}/>}
    </button>
    {open&&<button className="nexus-sidebar-overlay" onClick={()=>setOpen(false)} aria-label="Close navigation"/>}
    <aside className={"nexus-sidebar"+(open?" is-open":"")}>
      <div className="nexus-brand">
        <div className="nexus-logo-mark"><span>EN</span></div>
        <div><strong>EMDAD</strong><span>NEXUS</span></div>
      </div>

      <div className="nexus-workspace">
        <div className="nexus-workspace-icon"><Activity size={15}/></div>
        <div><small>WORKSPACE</small><strong>Sales CRM</strong></div>
        <span className="nexus-online-dot"/>
      </div>

      <nav className="nexus-sidebar-nav">
        <div className="nexus-nav-label">WORKSPACE</div>
        {items.slice(0,12).map(([href,label,Icon])=>
          <Link key={href} href={href} onClick={()=>setOpen(false)} className={active(href)?"is-active":""} title={label}>
            <span className="nexus-icon-box"><Icon size={18} strokeWidth={1.9}/></span>
            <span>{label}</span>
            {label==="Notifications"&&<b className="nexus-nav-dot"/>}
          </Link>
        )}
        {admin&&<div className="nexus-nav-label nexus-nav-label-secondary">ADMINISTRATION</div>}
        {items.slice(12).map(([href,label,Icon])=>
          <Link key={href} href={href} onClick={()=>setOpen(false)} className={active(href)?"is-active":""} title={label}>
            <span className="nexus-icon-box"><Icon size={18} strokeWidth={1.9}/></span>
            <span>{label}</span>
          </Link>
        )}
      </nav>

      <div className="nexus-sidebar-bottom">
        <div className="nexus-help"><LifeBuoy size={16}/><span>Need help?</span><span className="nexus-help-kbd">?</span></div>
        <div className="nexus-user-card">
          <div className="nexus-avatar">W</div>
          <div className="nexus-user-copy"><strong>Walid Mahmoudi</strong><span>{role||"Sales"}</span></div>
          <PanelLeftClose size={15} className="nexus-user-menu"/>
        </div>
      </div>
    </aside>
  </>;
}
