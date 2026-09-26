"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, Bell, BriefcaseBusiness, CalendarCheck2, ChartNoAxesCombined, CheckCircle2, CircleDollarSign, Database, FileCheck2, FolderKanban, Gauge, LayoutDashboard, LifeBuoy, Menu, Settings2, ShieldCheck, Target, UsersRound, TrendingDown, X, ChevronRight } from "lucide-react";

type IconComponent = React.ComponentType<{ size?: number; strokeWidth?: number }>;
type NavItem = [string,string,IconComponent];
const workspace:NavItem[]=[
 ["/dashboard","Dashboard",LayoutDashboard],[ "/sales-performance","Sales Performance",ChartNoAxesCombined],[ "/projects","Projects",FolderKanban],[ "/pipeline","Pipeline",ChartNoAxesCombined],
 ["/focus-projects","Focus Projects",Target],[ "/follow-ups","Follow Ups",CalendarCheck2],[ "/contracts","Contracts",FileCheck2],
 ["/collections","Collections",CircleDollarSign],[ "/deals-done","Deals Done",CheckCircle2],
];
const customers:NavItem[]=[[ "/clients","Clients",BriefcaseBusiness],[ "/reports","Reports",Gauge],[ "/notifications","Notifications",Bell]];
export default function NexusNav({role,name,email}:{role:string;name?:string|null;email?:string|null}){
 const pathname=usePathname(); const [open,setOpen]=useState(false); const admin=role==="Admin"||role==="Manager";
 const active=(href:string)=>pathname===href||pathname.startsWith(href+"/");
 const adminItems:NavItem[]=[];
 if(admin)adminItems.push(["/data-management","Data Management",Database],["/automation","Automation",Activity],["/settings","Settings",Settings2]);
 if(role==="Admin")adminItems.push(["/settings/users","User Access",UsersRound]);
 if(admin)adminItems.push(["/audit-log","Audit Log",ShieldCheck]);
 const render=(items:NavItem[])=>items.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={active(href)?"is-active":""}><span className="nexus-icon-box"><Icon size={18} strokeWidth={1.9}/></span><span>{label}</span>{label==="Notifications"&&<b className="nexus-nav-dot"/>}{active(href)&&<ChevronRight className="nexus-active-chevron" size={14}/>}</Link>);
 return <><button className="nexus-mobile-toggle" onClick={()=>setOpen(v=>!v)} aria-label="Open navigation">{open?<X size={21}/>:<Menu size={21}/>}</button>{open&&<button className="nexus-sidebar-overlay" onClick={()=>setOpen(false)} aria-label="Close navigation"/>}
 <aside className={"nexus-sidebar"+(open?" is-open":"")}><div className="nexus-brand"><div className="nexus-logo-mark"><span>EN</span></div><div><strong>EMDAD</strong><span>NEXUS</span></div></div>
 <div className="nexus-workspace"><div className="nexus-workspace-icon"><Activity size={15}/></div><div><small>WORKSPACE</small><strong>Sales CRM</strong></div><span className="nexus-online-dot"/></div>
 <nav className="nexus-sidebar-nav"><div className="nexus-nav-label">WORKSPACE</div>{render(workspace)}<div className="nexus-nav-label nexus-nav-label-secondary">CUSTOMERS &amp; REPORTING</div>{render(customers)}{adminItems.length>0&&<><div className="nexus-nav-label nexus-nav-label-secondary">ADMINISTRATION</div>{render(adminItems)}</>}</nav>
 <div className="nexus-sidebar-bottom"><div className="nexus-help"><LifeBuoy size={16}/><span>Need help?</span><span className="nexus-help-kbd">?</span></div><div className="nexus-user-card"><div className="nexus-avatar">{(name||email||role||"U").trim().charAt(0).toUpperCase()}</div><div className="nexus-user-copy"><strong>{name||email||"User"}</strong><span>{role||"Sales"} · Online</span></div></div></div></aside></>;
}