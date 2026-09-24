"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(e:FormEvent){
    e.preventDefault(); setError(""); setLoading(true);
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError(error.message);setLoading(false);return;}
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="login-shell"><form className="login-card" onSubmit={submit}>
    <div className="eyebrow">EMDAD ENGINEERING SOLUTIONS</div><h1>EMDAD NEXUS</h1><p className="muted">Sign in to your CRM workspace.</p>
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
    {error && <div className="error">{error}</div>}<button disabled={loading}>{loading?"Signing in…":"Sign in"}</button>
  </form></main>;
}
