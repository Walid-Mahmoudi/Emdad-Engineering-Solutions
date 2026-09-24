import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <main className="nexus-page"><h1>Deals Done</h1><p>Unauthorized</p></main>;

  const { data: contracts } = await supabase
    .from("contracts")
    .select("contract_id,project_id,contract_date,contract_value,projects(project_id,project_name,client,current_action)")
    .order("contract_date", { ascending: false });

  const contractRows = contracts || [];
  const ids = contractRows.map((c) => c.contract_id);
  let collections: { contract_id: string; amount: number | null }[] = [];

  if (ids.length) {
    const r = await supabase.from("collections").select("contract_id,amount").in("contract_id", ids);
    collections = (r.data || []) as { contract_id: string; amount: number | null }[];
  }

  const rows = contractRows.map((c) => {
    const project = Array.isArray(c.projects) ? c.projects[0] : c.projects;
    const collected = collections
      .filter((x) => x.contract_id === c.contract_id)
      .reduce((s, x) => s + Number(x.amount || 0), 0);
    const value = Number(c.contract_value || 0);
    return { ...c, project, collected, remaining: Math.max(0, value - collected), pct: value ? Math.round(collected / value * 100) : 0 };
  });

  const totalValue = rows.reduce((s, r) => s + Number(r.contract_value || 0), 0);
  const totalCollected = rows.reduce((s, r) => s + r.collected, 0);

  return (
    <main className="nexus-page">
      <div className="nexus-header"><div><h1>Deals Done</h1><p>Closed Won contracts and collection progress.</p></div></div>
      <div className="pipeline-kpis">
        <div className="pipeline-kpi"><span>Deals Done</span><strong>{rows.length}</strong></div>
        <div className="pipeline-kpi"><span>Contract Value</span><strong>{totalValue.toLocaleString()} EGP</strong></div>
        <div className="pipeline-kpi"><span>Collected</span><strong>{totalCollected.toLocaleString()} EGP</strong></div>
        <div className="pipeline-kpi"><span>Remaining</span><strong>{Math.max(0, totalValue - totalCollected).toLocaleString()} EGP</strong></div>
      </div>
      <section className="nexus-card">
        <div className="nexus-table-wrap">
          <table className="nexus-table">
            <thead><tr><th>ID</th><th>Project</th><th>Client</th><th>Contract Date</th><th>Contract Value</th><th>Collected</th><th>Remaining</th><th>%</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.contract_id}>
                  <td>{r.project_id}</td>
                  <td><Link href={"/projects/" + encodeURIComponent(r.project_id)}>{r.project?.project_name || "—"}</Link></td>
                  <td>{r.project?.client || "—"}</td>
                  <td>{r.contract_date}</td>
                  <td>{Number(r.contract_value || 0).toLocaleString()} EGP</td>
                  <td>{r.collected.toLocaleString()} EGP</td>
                  <td>{r.remaining.toLocaleString()} EGP</td>
                  <td>{r.pct}%</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8}>No closed deals yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
