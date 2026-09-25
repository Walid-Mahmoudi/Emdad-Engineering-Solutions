"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES = ["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"] as const;
const TYPES = ["Call","Visit","Email","Meeting","WhatsApp","Other"] as const;

export default function ProjectActions({project, followUps, contract, collected}:{project:{project_id:string;current_action:string|null;estimated_value:number|null};followUps:Array<{follow_up_id:string;follow_up_type:string|null;result:string|null;follow_up_date:string;completed_at:string|null}>;contract:{contract_id:string;contract_value:number}|null;collected:number}) {
  const [busy,setBusy]=useState(false);
  const [stage,setStage]=useState(project.current_action||"Tender");
  const [stageMsg,setStageMsg]=useState("");
  const [fuDate,setFuDate]=useState(""); const [fuTime,setFuTime]=useState(""); const [fuType,setFuType]=useState("Call");
  const [fuResult,setFuResult]=useState(""); const [fuNotes,setFuNotes]=useState(""); const [nextDate,setNextDate]=useState(""); const [nextType,setNextType]=useState("Call"); const [fuMsg,setFuMsg]=useState("");
  const [contractDate,setContractDate]=useState(""); const [contractValue,setContractValue]=useState(String(project.estimated_value||"")); const [contractMsg,setContractMsg]=useState("");
  const [collectionDate,setCollectionDate]=useState(""); const [collectionAmount,setCollectionAmount]=useState(""); const [paymentMethod,setPaymentMethod]=useState(""); const [collectionNotes,setCollectionNotes]=useState(""); const [collectionMsg,setCollectionMsg]=useState("");

  async function withBusy(fn:()=>Promise<void>){setBusy(true);try{await fn()}finally{setBusy(false)}}
  function err(e:unknown){return e instanceof Error?e.message:String(e)}

  async function changeStage(){
    setStageMsg("");
    await withBusy(async()=>{
      const supabase=createClient();
      let lostReason: string|undefined;
      if(stage==="Closed Lost") lostReason=window.prompt("Lost Reason:")||undefined;
      const {data,error}=await supabase.rpc("move_project_stage",{
        p_project_id:project.project_id,p_new_action:stage,p_notes:null,
        p_contract_date:stage==="Closed Won"?contractDate:null,
        p_contract_value:stage==="Closed Won"?Number(contractValue):null,p_lost_reason:lostReason||null
      });
      if(error) throw new Error(error.message);
      if(data===false) throw new Error("Stage update was not applied.");
      setStageMsg("Stage updated successfully. Refreshing…"); window.location.reload();
    }).catch(e=>setStageMsg(err(e)));
  }

  async function createFU(){
    setFuMsg("");
    await withBusy(async()=>{
      try{
        if(!fuDate) throw new Error("Follow-up date is required");
        const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("Unauthorized");
        const id=crypto.randomUUID(); const now=new Date().toISOString();
        const {error}=await supabase.from("follow_ups").insert({follow_up_id:id,project_id:project.project_id,follow_up_date:fuDate,follow_up_time:fuTime||null,follow_up_type:fuType,result:fuResult||null,next_action_date:nextDate||null,next_action_type:nextDate?nextType:null,next_action_status:nextDate?"Pending":null,notes:fuNotes||null,created_at:now});
        if(error) throw new Error(error.message);
        const {error:pe}=await supabase.from("projects").update({last_followup_date:fuDate,next_followup_date:nextDate||null,updated_at:now}).eq("project_id",project.project_id);
        if(pe) throw new Error(pe.message);
        await supabase.from("audit_log").insert({log_id:crypto.randomUUID(),timestamp:now,user:user.email||"unknown",action:"Follow Up Created",entity_type:"Follow Up",entity_id:id,details:JSON.stringify({project_id:project.project_id})});
        setFuMsg("Follow-up created. Refreshing…"); window.location.reload();
      }catch(e){setFuMsg(err(e))}
    });
  }

  async function completeFU(id:string){
    const result=window.prompt("Follow-up result:")||""; const notes=window.prompt("Notes (optional):")||"";
    if(!result&&!notes)return;
    await withBusy(async()=>{
      try{
        const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)throw new Error("Unauthorized");
        const {data:f,error:fe}=await supabase.from("follow_ups").select("*").eq("follow_up_id",id).maybeSingle(); if(fe)throw new Error(fe.message); if(!f)throw new Error("Follow-up not found");
        const now=new Date().toISOString();
        const {error}=await supabase.from("follow_ups").update({result:result||f.result||null,completed_at:now,completed_result:result||f.result||null,completed_notes:notes||null,next_action_status:"Completed",notes:notes||f.notes||null}).eq("follow_up_id",id);
        if(error)throw new Error(error.message);
        await supabase.from("projects").update({last_followup_date:f.follow_up_date,updated_at:now}).eq("project_id",f.project_id);
        await supabase.from("audit_log").insert({log_id:crypto.randomUUID(),timestamp:now,user:user.email||"unknown",action:"Follow Up Completed",entity_type:"Follow Up",entity_id:id,details:JSON.stringify({project_id:f.project_id})});
        window.location.reload();
      }catch(e){window.alert(err(e))}
    });
  }

  async function saveContract(){
    setContractMsg("");
    await withBusy(async()=>{
      try{
        if(!contractDate||!Number(contractValue)||Number(contractValue)<=0)throw new Error("Contract date and value are required");
        const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)throw new Error("Unauthorized");
        const {data:p,error:pe}=await supabase.from("projects").select("current_action").eq("project_id",project.project_id).maybeSingle(); if(pe)throw new Error(pe.message); if(p?.current_action!=="Closed Won")throw new Error("Contract requires Closed Won");
        const id=crypto.randomUUID(); const now=new Date().toISOString();
        const {error}=await supabase.from("contracts").insert({contract_id:id,project_id:project.project_id,contract_date:contractDate,contract_value:Number(contractValue),created_at:now,updated_at:now}); if(error)throw new Error(error.message);
        setContractMsg("Contract created. Refreshing…"); window.location.reload();
      }catch(e){setContractMsg(err(e))}
    });
  }

  async function saveCollection(){
    setCollectionMsg("");
    await withBusy(async()=>{
      try{
        if(!contract)throw new Error("No contract found"); if(!collectionDate||!Number(collectionAmount)||Number(collectionAmount)<=0)throw new Error("Collection date and amount are required");
        const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)throw new Error("Unauthorized");
        const {data:rows,error:re}=await supabase.from("collections").select("amount").eq("contract_id",contract.contract_id); if(re)throw new Error(re.message);
        const remaining=Number(contract.contract_value)-(rows||[]).reduce((s,r)=>s+Number(r.amount||0),0); if(Number(collectionAmount)>remaining)throw new Error("Collection amount exceeds remaining balance");
        const id=crypto.randomUUID(); const now=new Date().toISOString();
        const {error}=await supabase.from("collections").insert({collection_id:id,contract_id:contract.contract_id,project_id:project.project_id,collection_date:collectionDate,amount:Number(collectionAmount),payment_method:paymentMethod||null,notes:collectionNotes||null,created_at:now}); if(error)throw new Error(error.message);
        await supabase.from("audit_log").insert({log_id:crypto.randomUUID(),timestamp:now,user:user.email||"unknown",action:"Collection Created",entity_type:"Collection",entity_id:id,details:JSON.stringify({project_id:project.project_id,amount:Number(collectionAmount)})});
        setCollectionMsg("Collection recorded. Refreshing…"); window.location.reload();
      }catch(e){setCollectionMsg(err(e))}
    });
  }

  return <section className="card">
    <div className="section-head"><h2>Project Actions</h2><span className="muted">{busy?"Saving…":""}</span></div>
    <div className="nexus-form-grid">
      <label>Stage<select value={stage} onChange={e=>setStage(e.target.value)}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></label>
      {stage==="Closed Won"&&<label>Contract Date<input type="date" value={contractDate} onChange={e=>setContractDate(e.target.value)}/></label>}
      {stage==="Closed Won"&&<label>Contract Value<input type="number" min="0" value={contractValue} onChange={e=>setContractValue(e.target.value)}/></label>}
      <div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy||stage===project.current_action} onClick={changeStage}>Update Stage</button></div>
    </div>
    {stageMsg&&<p className="muted">{stageMsg}</p>}
    <hr style={{margin:"20px 0",border:0,borderTop:"1px solid #e5e7eb"}}/>
    <h3>Create Follow-up</h3>
    <div className="nexus-form-grid">
      <label>Date<input type="date" value={fuDate} onChange={e=>setFuDate(e.target.value)}/></label><label>Time<input type="time" value={fuTime} onChange={e=>setFuTime(e.target.value)}/></label>
      <label>Type<select value={fuType} onChange={e=>setFuType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Result<input value={fuResult} onChange={e=>setFuResult(e.target.value)} placeholder="Optional"/></label>
      <label>Next Action Date<input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}/></label><label>Next Action Type<select value={nextType} onChange={e=>setNextType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
      <label style={{gridColumn:"1/-1"}}>Notes<textarea value={fuNotes} onChange={e=>setFuNotes(e.target.value)} rows={2}/></label>
      <div><button className="nexus-primary" disabled={busy} onClick={createFU}>Create Follow-up</button></div>
    </div>
    {fuMsg&&<p className="muted">{fuMsg}</p>}
    <div className="compact-list" style={{marginTop:14}}>{followUps.slice(0,8).map(f=><div className="list-row" key={f.follow_up_id}><div><strong>{f.follow_up_type||"Other"}</strong><span>{f.result||"Pending"} · {f.follow_up_date}</span></div>{!f.completed_at&&<button className="nexus-secondary" disabled={busy} onClick={()=>completeFU(f.follow_up_id)}>Complete</button>}</div>)}</div>
    {project.current_action==="Closed Won"&&<><hr style={{margin:"20px 0",border:0,borderTop:"1px solid #e5e7eb"}}/><h3>Contract</h3>
      {!contract?<div className="nexus-form-grid"><label>Contract Date<input type="date" value={contractDate} onChange={e=>setContractDate(e.target.value)}/></label><label>Contract Value<input type="number" min="0" value={contractValue} onChange={e=>setContractValue(e.target.value)}/></label><div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy} onClick={saveContract}>Create Contract</button></div></div>:<p className="muted">Contract: {Number(contract.contract_value||0).toLocaleString("en-EG")} EGP</p>}
      {contract&&<><h3 style={{marginTop:18}}>Add Collection</h3><div className="nexus-form-grid"><label>Date<input type="date" value={collectionDate} onChange={e=>setCollectionDate(e.target.value)}/></label><label>Amount<input type="number" min="0" value={collectionAmount} onChange={e=>setCollectionAmount(e.target.value)}/></label><label>Payment Method<input value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}/></label><label>Notes<input value={collectionNotes} onChange={e=>setCollectionNotes(e.target.value)}/></label><div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy} onClick={saveCollection}>Record Collection</button></div></div><p className="muted">Collected: {collected.toLocaleString("en-EG")} EGP · Remaining: {Math.max(0,Number(contract.contract_value||0)-collected).toLocaleString("en-EG")} EGP</p>{collectionMsg&&<p className="muted">{collectionMsg}</p>}</>}
    </>}
  </section>;
}
