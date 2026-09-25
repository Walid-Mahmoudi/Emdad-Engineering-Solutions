"use client";

import { useState } from "react";
import { moveProjectStage } from "@/app/pipeline/actions";
import { addFollowUp, completeFollowUp } from "@/app/follow-ups/actions";
import { createContract } from "@/app/contracts/actions";
import { addCollection } from "@/app/collections/actions";
const STAGES = ["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"] as const;
const TYPES = ["Call","Visit","Email","Meeting","WhatsApp","Other"] as const;

export default function ProjectActions({project, followUps, contract, collected}:{project:{project_id:string;current_action:string|null;estimated_value:number|null};followUps:Array<{follow_up_id:string;follow_up_type:string|null;result:string|null;follow_up_date:string;completed_at:string|null}>;contract:{contract_id:string;contract_value:number}|null;collected:number}) {
  const [busy,setBusy]=useState(false);
  const [stage,setStage]=useState(project.current_action||"Tender");
  const [stageMsg,setStageMsg]=useState("");
  const [fuDate,setFuDate]=useState("");
  const [fuTime,setFuTime]=useState("");
  const [fuType,setFuType]=useState("Call");
  const [fuResult,setFuResult]=useState("");
  const [fuNotes,setFuNotes]=useState("");
  const [nextDate,setNextDate]=useState("");
  const [nextType,setNextType]=useState("Call");
  const [fuMsg,setFuMsg]=useState("");
  const [contractDate,setContractDate]=useState("");
  const [contractValue,setContractValue]=useState(String(project.estimated_value||""));
  const [contractMsg,setContractMsg]=useState("");
  const [collectionDate,setCollectionDate]=useState("");
  const [collectionAmount,setCollectionAmount]=useState("");
  const [paymentMethod,setPaymentMethod]=useState("");
  const [collectionNotes,setCollectionNotes]=useState("");
  const [collectionMsg,setCollectionMsg]=useState("");

  async function run(fn:()=>Promise<void>){
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  async function changeStage(){
    setStageMsg("");
    await run(async()=>{
      try{
        await moveProjectStage({
          projectId:project.project_id,
          newStage:stage as typeof STAGES[number],
          contractDate:stage==="Closed Won"?contractDate:undefined,
          contractValue:stage==="Closed Won"?Number(contractValue):undefined,
          lostReason:stage==="Closed Lost"?prompt("Lost Reason:")||undefined:undefined
        });
        setStageMsg("Stage updated successfully. Refreshing…");
        window.location.reload();
      }catch(e:any){setStageMsg(e.message||"Stage update failed");}
    });
  }

  async function createFU(){
    setFuMsg("");
    await run(async()=>{
      try{
        if(!fuDate) throw new Error("Follow-up date is required");
        await addFollowUp({projectId:project.project_id,date:fuDate,time:fuTime,type:fuType,result:fuResult,notes:fuNotes,nextActionDate:nextDate,nextActionType:nextDate?nextType:undefined});
        setFuMsg("Follow-up created. Refreshing…");
        window.location.reload();
      }catch(e:any){setFuMsg(e.message||"Follow-up failed");}
    });
  }

  async function completeFU(id:string){
    const result=prompt("Follow-up result:")||"";
    const notes=prompt("Notes (optional):")||"";
    if(!result&&!notes) return;
    await run(async()=>{
      try{ await completeFollowUp({followUpId:id,result,notes}); window.location.reload(); }
      catch(e:any){alert(e.message||"Could not complete follow-up");}
    });
  }

  async function saveContract(){
    setContractMsg("");
    await run(async()=>{
      try{
        if(!contractDate||!Number(contractValue)) throw new Error("Contract date and value are required");
        await createContract({projectId:project.project_id,contractDate,contractValue:Number(contractValue)});
        setContractMsg("Contract created. Refreshing…");
        window.location.reload();
      }catch(e:any){setContractMsg(e.message||"Contract creation failed");}
    });
  }

  async function saveCollection(){
    setCollectionMsg("");
    await run(async()=>{
      try{
        if(!contract) throw new Error("No contract found");
        await addCollection({contractId:contract.contract_id,projectId:project.project_id,date:collectionDate,amount:Number(collectionAmount),paymentMethod,notes:collectionNotes});
        setCollectionMsg("Collection recorded. Refreshing…");
        window.location.reload();
      }catch(e:any){setCollectionMsg(e.message||"Collection failed");}
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
      <label>Date<input type="date" value={fuDate} onChange={e=>setFuDate(e.target.value)}/></label>
      <label>Time<input type="time" value={fuTime} onChange={e=>setFuTime(e.target.value)}/></label>
      <label>Type<select value={fuType} onChange={e=>setFuType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Result<input value={fuResult} onChange={e=>setFuResult(e.target.value)} placeholder="Optional"/></label>
      <label>Next Action Date<input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}/></label>
      <label>Next Action Type<select value={nextType} onChange={e=>setNextType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
      <label style={{gridColumn:"1/-1"}}>Notes<textarea value={fuNotes} onChange={e=>setFuNotes(e.target.value)} rows={2}/></label>
      <div><button className="nexus-primary" disabled={busy} onClick={createFU}>Create Follow-up</button></div>
    </div>
    {fuMsg&&<p className="muted">{fuMsg}</p>}

    <div className="compact-list" style={{marginTop:14}}>
      {followUps.slice(0,8).map(f=><div className="list-row" key={f.follow_up_id}>
        <div><strong>{f.follow_up_type||"Other"}</strong><span>{f.result||"Pending"} · {f.follow_up_date}</span></div>
        {!f.completed_at&&<button className="nexus-secondary" disabled={busy} onClick={()=>completeFU(f.follow_up_id)}>Complete</button>}
      </div>)}
    </div>

    {project.current_action==="Closed Won"&&<><hr style={{margin:"20px 0",border:0,borderTop:"1px solid #e5e7eb"}}/>
      <h3>Contract</h3>
      {!contract?<div className="nexus-form-grid">
        <label>Contract Date<input type="date" value={contractDate} onChange={e=>setContractDate(e.target.value)}/></label>
        <label>Contract Value<input type="number" min="0" value={contractValue} onChange={e=>setContractValue(e.target.value)}/></label>
        <div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy} onClick={saveContract}>Create Contract</button></div>
      </div>:<p className="muted">Contract: {Number(contract.contract_value||0).toLocaleString("en-EG")} EGP</p>}

      {contract&&<><h3 style={{marginTop:18}}>Add Collection</h3>
        <div className="nexus-form-grid">
          <label>Date<input type="date" value={collectionDate} onChange={e=>setCollectionDate(e.target.value)}/></label>
          <label>Amount<input type="number" min="0" value={collectionAmount} onChange={e=>setCollectionAmount(e.target.value)}/></label>
          <label>Payment Method<input value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}/></label>
          <label>Notes<input value={collectionNotes} onChange={e=>setCollectionNotes(e.target.value)}/></label>
          <div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy} onClick={saveCollection}>Record Collection</button></div>
        </div>
        <p className="muted">Collected: {collected.toLocaleString("en-EG")} EGP · Remaining: {Math.max(0,Number(contract.contract_value||0)-collected).toLocaleString("en-EG")} EGP</p>
        {collectionMsg&&<p className="muted">{collectionMsg}</p>}
      </>}
    </>}
  </section>;
}
