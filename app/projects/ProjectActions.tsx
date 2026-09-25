"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addFollowUp, completeFollowUp } from "@/app/follow-ups/actions";
import { createContract } from "@/app/contracts/actions";
import { addCollection } from "@/app/collections/actions";

const STAGES = ["Tender","Tender – High Probability","In Hand","Negotiation","Closed Won","Closed Lost"] as const;
const TYPES = ["Call","Visit","Email","Meeting","WhatsApp","Other"] as const;

export default function ProjectActions({project, followUps, contract, collected}:{project:{project_id:string;current_action:string|null;estimated_value:number|null};followUps:Array<{followup_id:string;followup_type:string|null;result:string|null;followup_date:string;completed_at:string|null}>;contract:{contract_id:string;contract_value:number}|null;collected:number}) {
  const [busy,setBusy]=useState(false);
  const [stage,setStage]=useState(project.current_action||"Tender");
  const [stageMsg,setStageMsg]=useState("");
  const [fuDate,setFuDate]=useState(""); const [fuTime,setFuTime]=useState(""); const [fuType,setFuType]=useState("Call");
  const [fuResult,setFuResult]=useState(""); const [fuNotes,setFuNotes]=useState(""); const [nextDate,setNextDate]=useState(""); const [nextType,setNextType]=useState("Call"); const [fuMsg,setFuMsg]=useState("");
  const [contractDate,setContractDate]=useState(""); const [contractValue,setContractValue]=useState(String(project.estimated_value||"")); const [contractMsg,setContractMsg]=useState("");
  const [collectionDate,setCollectionDate]=useState(""); const [collectionAmount,setCollectionAmount]=useState(""); const [paymentMethod,setPaymentMethod]=useState(""); const [collectionNotes,setCollectionNotes]=useState(""); const [collectionMsg,setCollectionMsg]=useState("");
  const [completeOpen,setCompleteOpen]=useState<string|null>(null); const [lostOpen,setLostOpen]=useState(false); const [lostReason,setLostReason]=useState(""); const [completeType,setCompleteType]=useState("Call"); const [completeResult,setCompleteResult]=useState(""); const [completeNotes,setCompleteNotes]=useState(""); const [completeNextDate,setCompleteNextDate]=useState(""); const [completeNextType,setCompleteNextType]=useState("Call"); const [completeMsg,setCompleteMsg]=useState("");

  async function withBusy(fn:()=>Promise<void>){setBusy(true);try{await fn()}finally{setBusy(false)}}
  function err(e:unknown){return e instanceof Error?e.message:String(e)}

  async function persistStage(reason?:string){
    await withBusy(async()=>{
      const supabase=createClient();
      const {data,error}=await supabase.rpc("move_project_stage",{
        p_project_id:project.project_id,p_new_action:stage,p_notes:null,
        p_contract_date:stage==="Closed Won"?contractDate:null,
        p_contract_value:stage==="Closed Won"?Number(contractValue):null,p_lost_reason:reason||null
      });
      if(error) throw new Error(error.message);
      if(data===false) throw new Error("Stage update was not applied.");
      setStageMsg("Stage updated successfully. Refreshing…"); window.location.reload();
    }).catch(e=>setStageMsg(err(e)));
  }

  async function changeStage(){
    setStageMsg("");
    if(stage==="Closed Lost"){setLostOpen(true);return;}
    await persistStage();
  }

  async function confirmLost(){
    const reason=lostReason.trim();
    if(!reason){setStageMsg("Lost reason is required.");return;}
    setLostOpen(false);
    await persistStage(reason);
  }

  async function createFU(){
    setFuMsg("");
    await withBusy(async()=>{
      try{
        if(!fuDate) throw new Error("Follow-up date is required");
        await addFollowUp({projectId:project.project_id,date:fuDate,time:fuTime,type:fuType,result:fuResult,notes:fuNotes,nextActionDate:nextDate,nextActionType:nextDate?nextType:undefined});
        setFuMsg("Follow-up created. Refreshing…"); window.location.reload();
      }catch(e){setFuMsg(err(e))}
    });
  }

  async function completeFU(id:string){
    setCompleteMsg("");
    await withBusy(async()=>{
      try{
        if(!completeResult.trim()&&!completeNotes.trim()) throw new Error("Result or notes are required");
        await completeFollowUp({followUpId:id,type:completeType,result:completeResult.trim(),notes:completeNotes.trim(),nextActionDate:completeNextDate||undefined,nextActionType:completeNextDate?completeNextType:undefined});
        setCompleteOpen(null); window.location.reload();
      }catch(e){setCompleteMsg(err(e))}
    });
  }

  async function saveContract(){
    setContractMsg("");
    await withBusy(async()=>{
      try{
        if(!contractDate||!Number(contractValue)||Number(contractValue)<=0)throw new Error("Contract date and value are required");
        await createContract({projectId:project.project_id,contractDate,contractValue:Number(contractValue)});
        setContractMsg("Contract created. Refreshing…"); window.location.reload();
      }catch(e){setContractMsg(err(e))}
    });
  }

  async function saveCollection(){
    setCollectionMsg("");
    await withBusy(async()=>{
      try{
        if(!contract)throw new Error("No contract found"); if(!collectionDate||!Number(collectionAmount)||Number(collectionAmount)<=0)throw new Error("Collection date and amount are required");
        await addCollection({projectId:project.project_id,contractId:contract.contract_id,date:collectionDate,amount:Number(collectionAmount),paymentMethod,notes:collectionNotes});
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
    {stageMsg&&<p className="muted">{stageMsg}</p>}{lostOpen&&<div className="nexus-modal-backdrop" role="dialog" aria-modal="true"><div className="nexus-modal"><div className="nexus-modal-head"><div><div className="eyebrow">DEAL MANAGEMENT</div><h3>Close as Lost</h3><p>Record the reason so the loss is visible in reporting.</p></div><button className="nexus-icon-button" onClick={()=>setLostOpen(false)} aria-label="Close"><X size={18}/></button></div><div className="nexus-form-grid"><label style={{gridColumn:"1/-1"}}>Lost Reason<textarea value={lostReason} onChange={e=>setLostReason(e.target.value)} rows={4} autoFocus placeholder="Why was the opportunity lost?"/></label></div><div className="nexus-modal-foot"><button className="nexus-secondary" onClick={()=>setLostOpen(false)}>Cancel</button><button className="nexus-primary" disabled={busy||!lostReason.trim()} onClick={confirmLost}>Confirm Closed Lost</button></div></div></div>}
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
    <div className="compact-list" style={{marginTop:14}}>{followUps.slice(0,8).map(f=><div className="list-row" key={f.followup_id}><div><strong>{f.followup_type||"Other"}</strong><span>{f.result||"Pending"} · {f.followup_date}</span></div>{!f.completed_at&&<button className="nexus-secondary" disabled={busy} onClick={()=>{setCompleteOpen(f.followup_id);setCompleteType(f.followup_type||"Call");setCompleteResult(f.result||"");setCompleteNotes("");setCompleteNextDate("");setCompleteNextType("Call");setCompleteMsg("");}}><CheckCircle2 size={14}/> Complete</button>}</div>)}</div>
    {completeOpen&&<div className="nexus-modal-backdrop" role="dialog" aria-modal="true"><div className="nexus-modal"><div className="nexus-modal-head"><div><div className="eyebrow">ACTIVITY MANAGEMENT</div><h3>Complete Follow-up</h3><p>Record what happened and optionally schedule the next action.</p></div><button className="nexus-icon-button" onClick={()=>setCompleteOpen(null)} aria-label="Close"><X size={18}/></button></div><div className="nexus-form-grid"><label>Follow-up Type<select value={completeType} onChange={e=>setCompleteType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label><label>Result<input value={completeResult} onChange={e=>setCompleteResult(e.target.value)} placeholder="What was the outcome?"/></label><label style={{gridColumn:"1/-1"}}>Notes<textarea value={completeNotes} onChange={e=>setCompleteNotes(e.target.value)} rows={3} placeholder="Add useful context for the next person or next visit"/></label><label>Next Action Date<input type="date" value={completeNextDate} onChange={e=>setCompleteNextDate(e.target.value)}/></label><label>Next Action Type<select value={completeNextType} onChange={e=>setCompleteNextType(e.target.value)} disabled={!completeNextDate}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label></div>{completeMsg&&<p className="form-error">{completeMsg}</p>}<div className="nexus-modal-foot"><button className="nexus-secondary" onClick={()=>setCompleteOpen(null)}>Cancel</button><button className="nexus-primary" disabled={busy} onClick={()=>completeFU(completeOpen)}><CheckCircle2 size={14}/>{busy?"Saving…":"Complete Follow-up"}</button></div></div></div>}
    {project.current_action==="Closed Won"&&<><hr style={{margin:"20px 0",border:0,borderTop:"1px solid #e5e7eb"}}/><h3>Contract</h3>
      {!contract?<><div className="nexus-form-grid"><label>Contract Date<input type="date" value={contractDate} onChange={e=>setContractDate(e.target.value)}/></label><label>Contract Value<input type="number" min="0" value={contractValue} onChange={e=>setContractValue(e.target.value)}/></label><div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy} onClick={saveContract}>Create Contract</button></div></div>{contractMsg&&<p className="form-error">{contractMsg}</p>}</>:<p className="muted">Contract: {Number(contract.contract_value||0).toLocaleString("en-EG")} EGP</p>}
      {contract&&<><h3 style={{marginTop:18}}>Add Collection</h3><div className="nexus-form-grid"><label>Date<input type="date" value={collectionDate} onChange={e=>setCollectionDate(e.target.value)}/></label><label>Amount<input type="number" min="0" value={collectionAmount} onChange={e=>setCollectionAmount(e.target.value)}/></label><label>Payment Method<input value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}/></label><label>Notes<input value={collectionNotes} onChange={e=>setCollectionNotes(e.target.value)}/></label><div style={{display:"flex",alignItems:"end"}}><button className="nexus-primary" disabled={busy} onClick={saveCollection}>Record Collection</button></div></div><p className="muted">Collected: {collected.toLocaleString("en-EG")} EGP · Remaining: {Math.max(0,Number(contract.contract_value||0)-collected).toLocaleString("en-EG")} EGP</p>{collectionMsg&&<p className="muted">{collectionMsg}</p>}</>}
    </>}
  </section>;
}
