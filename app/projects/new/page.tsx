"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { createProject } from "./actions";

export default function NewProjectPage(){
  const [form,setForm]=useState({projectId:"",projectName:"",client:"",sourceCase:"",offerSent:"",estimatedValue:"",projectType:"",location:"",consultant:"",opportunityDate:"",notes:""});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [created,setCreated]=useState("");
  const set=(key:string,value:string)=>setForm(x=>({...x,[key]:value}));
  async function submit(e:React.FormEvent){
    e.preventDefault(); setBusy(true); setMessage(""); setCreated("");
    try{
      const id=await createProject({...form,estimatedValue:form.estimatedValue?Number(form.estimatedValue):undefined});
      setCreated(id);
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  }
  return <main className="nexus-page">
    <div className="record-breadcrumb"><Link href="/projects"><ArrowLeft size={14}/> Projects</Link><span>/</span><span>New Project</span></div>
    <header className="nexus-page-head">
      <div><div className="eyebrow">SALES WORKSPACE</div><h1>Create Project</h1><p>Add a new opportunity to the CRM pipeline. New projects start in Tender.</p></div>
    </header>
    <form className="nexus-card nexus-create-form" onSubmit={submit}>
      <div className="section-head"><div><h2>Project Details</h2><p className="muted">Core commercial and project information.</p></div><Building2 size={18}/></div>
      <div className="nexus-form-grid">
        <label>Project ID<input required value={form.projectId} onChange={e=>set("projectId",e.target.value)} placeholder="e.g. PRJ-2026-001"/></label>
        <label>Project Name<input required value={form.projectName} onChange={e=>set("projectName",e.target.value)} placeholder="Project name"/></label>
        <label>Client<input value={form.client} onChange={e=>set("client",e.target.value)} placeholder="Client / company"/></label>
        <label>Estimated Value (EGP)<input type="number" min="0" step="0.01" value={form.estimatedValue} onChange={e=>set("estimatedValue",e.target.value)} placeholder="0"/></label>
        <label>Project Type<input value={form.projectType} onChange={e=>set("projectType",e.target.value)} placeholder="Commercial / Residential / ..."/></label>
        <label>Location<input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Project location"/></label>
        <label>Consultant<input value={form.consultant} onChange={e=>set("consultant",e.target.value)} placeholder="Consultant"/></label>
        <label>Opportunity Date<input type="date" value={form.opportunityDate} onChange={e=>set("opportunityDate",e.target.value)}/></label>
        <label>Source Case<input value={form.sourceCase} onChange={e=>set("sourceCase",e.target.value)} placeholder="Source / lead case"/></label>
        <label>Offer Sent<input value={form.offerSent} onChange={e=>set("offerSent",e.target.value)} placeholder="Yes / No / date"/></label>
        <label className="full">Notes<textarea rows={4} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Commercial notes, requirements, next context…"/></label>
      </div>
      {message&&<p className="form-error">{message}</p>}
      {created&&<div className="form-success">Project created successfully. <Link href={"/projects/"+encodeURIComponent(created)}>Open Project 360</Link></div>}
      <div className="nexus-modal-foot"><Link href="/projects" className="nexus-secondary">Cancel</Link><button className="nexus-primary" disabled={busy}><Save size={14}/>{busy?"Creating…":"Create Project"}</button></div>
    </form>
  </main>;
}