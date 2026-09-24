import { createClient } from "@/lib/supabase/server";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <main className="nexus-page"><h1>Collections</h1><p>Unauthorized</p></main>;

  const { data } = await supabase
    .from("collections")
    .select("collection_id,project_id,contract_id,collection_date,amount,payment_method,notes,projects(project_name,client)")
    .order("collection_date", { ascending: false });

  const rows = data || [];
  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <main className="nexus-page">
      <div className="nexus-header"><div><h1>Collections</h1><p>Recorded customer collections.</p></div></div>
      <div className="pipeline-kpis">
        <div className="pipeline-kpi"><span>Collected</span><strong>{total.toLocaleString()} EGP</strong></div>
        <div className="pipeline-kpi"><span>Transactions</span><strong>{rows.length}</strong></div>
      </div>
      <section className="nexus-card">
        <div className="nexus-table-wrap">
          <table className="nexus-table">
            <thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Amount</th><th>Method</th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const project = Array.isArray(c.projects) ? c.projects[0] : c.projects;
                return (
                  <tr key={c.collection_id}>
                    <td>{c.collection_date}</td>
                    <td>{project?.project_name || c.project_id}</td>
                    <td>{project?.client || "—"}</td>
                    <td>{Number(c.amount || 0).toLocaleString()} EGP</td>
                    <td>{c.payment_method || "—"}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={5}>No collections yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
