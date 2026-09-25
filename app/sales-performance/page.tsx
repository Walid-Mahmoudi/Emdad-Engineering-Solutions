import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Activity, AlertTriangle, CalendarCheck2, ChartNoAxesCombined, CircleDollarSign, FileCheck2, Target, TrendingUp } from "lucide-react";

const stages=["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"];
const weights:Record<string,number>={Tender:.1,"Tender – High Probability":.3,"In Hand":.6,Negotiation:.8};
type PerformanceCard=[React.ComponentType<{size?:number;strokeWidth?:number}>,string,string|number,string,string];

function money(v:number){return new Intl.NumberFormat("en-EG",{maximumFractionDigits:0}).format(v||0)+" EGP";}
function day(v:any){if(!v)return null;const d=new Date(v);return isNaN(d.getTime())?null:d;}
function startOfWeek(d:Date){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-x.getDay());return x;}

export default async function SalesPerformancePage(){
 const s=await createClient();
 const {data:{user}}=await s.auth.getUser();
 if(!user)return <main className="nexus-page"><h1>Sales Performance</h1><p>Unauthorized</p></main>;
 const [pRes,hRes,fRes,cRes]=await Promise.all([
  s.from("projects").select("*"),
  s.from("action_history").select("*").order("action_date",{ascending:false}),
  s.from("follow_ups").select("*"),
  s.from("contracts").select("contract_id,project_id,contract_date,contract_value")
 ]);
 const projects=pRes.data??[], history=hRes.data??[], followups=fRes.data??[], contracts=cRes.data??[];
 const contractByProject=new Map(contracts.map(c=>[String(c.project_id),c]));
 const collectionsByContract=new Map<string,number>();
 if(contracts.length){
  const {data}=await s.from("collections").select("contract_id,amount").in("contract_id",contracts.map(c=>c.contract_id));
  for(const c of data??[]) collectionsByContract.set(c.contract_id,(collectionsByContract.get(c.contract_id)||0)+Number(c.amount||0));
 }
 const active=projects.filter(p=>!["Closed Won","Closed Lost"].includes(p.current_action));
 const won=projects.filter(p=>p.current_action==="Closed Won");
 const today=new Date();today.setHours(0,0,0,0);
 const week=startOfWeek(today), nextWeek=new Date(week);nextWeek.setDate(nextWeek.getDate()+7);
 const inWeek=(v:any)=>{const d=day(v);return !!d&&d>=week&&d<nextWeek};
 const pending=(f:any)=>String(f.next_action_status||"Pending")!=="Completed"&&!f.completed_at;
 const todayCount=followups.filter(f=>pending(f)&&day(f.next_action_date)?.toDateString()===today.toDateString()).length;
 const overdue=followups.filter(f=>pending(f)&&day(f.next_action_date)&&day(f.next_action_date)!==null&&day(f.next_action_date)!>=new Date("1900-01-01")&&day(f.next_action_date)!<today).length;
 const noNext=active.filter(p=>!p.next_followup_date).length;
 const age=(p:any)=>{const d=day(p.last_followup_date||p.created_at||p.opportunity_date);return d?Math.max(0,Math.floor((today.getTime()-new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime())/86400000)):999};
 const stale=active.filter(p=>age(p)>14);
 const weighted=active.reduce((n,p)=>n+Number(p.estimated_value||0)*(weights[p.current_action]||0),0);
 const openPipeline=active.reduce((n,p)=>n+Number(p.estimated_value||0),0);
 const stageRows=stages.map(stage=>{const arr=stage==="Closed Won"?won:projects.filter(p=>p.current_action===stage);const value=arr.reduce((n,p)=>n+Number(stage==="Closed Won"?(contractByProject.get(String(p.project_id))?.contract_value||0):(p.estimated_value||0)),0);return {stage,count:arr.length,value}});
 const contractValue=won.reduce((n,p)=>n+Number(contractByProject.get(String(p.project_id))?.contract_value||0),0);
 const collected=won.reduce((n,p)=>{const c=contractByProject.get(String(p.project_id));return n+(c?collectionsByContract.get(c.contract_id)||0:0)},0);
 const movements=stages.slice(0,4).map(stage=>({stage,count:new Set(history.filter(h=>inWeek(h.action_date)&&h.new_action===stage).map(h=>String(h.project_id))).size}));
 const periodProjects=projects.filter(p=>inWeek(p.created_at)).length;
 const calls=followups.filter(f=>inWeek(f.follow_up_date)&&String(f.follow_up_type||"").toLowerCase()==="call").length;
 const visits=followups.filter(f=>inWeek(f.follow_up_date)&&String(f.follow_up_type||"").toLowerCase()==="visit").length;
 const meetings=followups.filter(f=>inWeek(f.follow_up_date)&&String(f.follow_up_type||"").toLowerCase()==="meeting").length;
 const focus=new Set(history.filter(h=>inWeek(h.action_date)&&["Tender – High Probability","In Hand"].includes(h.new_action)).map(h=>String(h.project_id))).size;
 const top=active.slice().sort((a,b)=>Number(b.estimated_value||0)-Number(a.estimated_value||0)).slice(0,8);
 return <main className="nexus-page sales-performance-workspace">
  <header className="nexus-page-head"><div><div className="eyebrow">ANALYTICS & PERFORMANCE</div><h1>Sales Performance</h1><p>Sales activity, pipeline movement, forecast and commercial performance.</p></div><div className="nexus-head-actions"><span className="workspace-chip"><Activity size={14}/> Current week · {week.toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span></div></header>
  <section className="dashboard-stat-grid sales-period-kpis">
   {([ [ChartNoAxesCombined,"New Projects",periodProjects,"Created this week","blue"],[CalendarCheck2,"Calls",calls,"Recorded this week","purple"],[Target,"Visits",visits,"Customer / site visits","green"],[CalendarCheck2,"Meetings",meetings,"Recorded this week","amber"],[Target,"Moved to Focus",focus,"High probability / In Hand","blue"],[TrendingUp,"Negotiation",active.filter(p=>p.current_action==="Negotiation").length,"Current projects","purple"],[FileCheck2,"Deals Done",won.length,"Closed Won","green"],[CircleDollarSign,"Open Pipeline",money(openPipeline),"Active estimated value","amber" ]] as PerformanceCard[]).map(([Icon,label,value,sub,tone])=><div className="nexus-stat-card" key={label as string}><div className={"nexus-stat-icon "+tone}><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>)}
  </section>
  <div className="sales-performance-grid">
   <section className="nexus-card"><div className="section-head"><div><h2>Pipeline by Stage</h2><p className="muted">Current commercial portfolio</p></div></div><div className="sales-stage-list">{stageRows.map(x=><div className="sales-stage-row" key={x.stage}><div><strong>{x.stage}</strong><span>{x.count} projects</span></div><b>{money(x.value)}</b><i><em style={{width:openPipeline?Math.min(100,x.value/openPipeline*100):0}}/></i></div>)}</div></section>
   <section className="nexus-card"><div className="section-head"><div><h2>Follow-up Control</h2><p className="muted">Items requiring attention</p></div></div><div className="sales-control-grid"><div><AlertTriangle size={16}/><span>Overdue</span><b>{overdue}</b></div><div><CalendarCheck2 size={16}/><span>Today</span><b>{todayCount}</b></div><div><Target size={16}/><span>No Next Action</span><b>{noNext}</b></div><div><Activity size={16}/><span>Stale &gt;14d</span><b>{stale.length}</b></div></div></section>
  </div>
  <div className="sales-performance-grid">
   <section className="nexus-card"><div className="section-head"><div><h2>Pipeline Movement</h2><p className="muted">Unique projects moved during the current week</p></div></div><div className="sales-movement-list">{movements.map(x=><div key={x.stage}><span>{x.stage}</span><strong>{x.count}</strong></div>)}</div></section>
   <section className="nexus-card"><div className="section-head"><div><h2>Commercial Overview</h2><p className="muted">Signed value and collection progress</p></div></div><div className="commercial-grid"><div><span>Contract Value</span><b>{money(contractValue)}</b></div><div><span>Collected</span><b>{money(collected)}</b></div><div><span>Remaining</span><b>{money(Math.max(0,contractValue-collected))}</b></div><div><span>Collection %</span><b>{contractValue?((collected/contractValue)*100).toFixed(1):"0.0"}%</b></div></div><div className="finance-progress"><i style={{width:contractValue?Math.min(100,collected/contractValue*100):0}}/></div></section>
  </div>
  <section className="nexus-card"><div className="section-head"><div><h2>Weighted Sales Forecast</h2><p className="muted">Explicit stage weights from the legacy CRM: Tender 10% · High Probability 30% · In Hand 60% · Negotiation 80%</p></div><span className="workspace-chip">{money(weighted)} weighted</span></div><div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Stage</th><th>Projects</th><th>Open Value</th><th>Weight</th><th>Weighted Value</th></tr></thead><tbody>{stageRows.slice(0,4).map(x=>{const w=weights[x.stage]||0;return <tr key={x.stage}><td>{x.stage}</td><td>{x.count}</td><td>{money(x.value)}</td><td>{Math.round(w*100)}%</td><td>{money(x.value*w)}</td></tr>})}</tbody></table></div></section>
  <section className="nexus-card"><div className="section-head"><div><h2>Top Active Opportunities</h2><p className="muted">Highest estimated value</p></div></div><div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Estimated Value</th><th>Last Follow-up</th><th>Next Follow-up</th></tr></thead><tbody>{top.map(p=><tr key={p.project_id}><td><Link href={"/projects/"+encodeURIComponent(p.project_id)} className="finance-project-link"><strong>{p.project_name}</strong></Link></td><td>{p.client||"—"}</td><td>{p.current_action}</td><td>{money(Number(p.estimated_value||0))}</td><td>{p.last_followup_date||"—"}</td><td>{p.next_followup_date||"—"}</td></tr>)}{!top.length&&<tr><td colSpan={6}><div className="nexus-empty-inline">No active opportunities.</div></td></tr>}</tbody></table></div></section>
 </main>;
}
