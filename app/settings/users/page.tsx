import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, UsersRound } from "lucide-react";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <main className="nexus-page"><h1>User Access</h1><p>Unauthorized</p></main>;

  const { data: profile } = await supabase.from("users").select("role").eq("user_id", user.id).maybeSingle();
  if (!profile || profile.role !== "Admin") return <main className="nexus-page"><h1>User Access</h1><p>Admin only.</p></main>;

  const { data } = await supabase.from("users").select("user_id,name,email,role,active,sales_name,created_at,updated_at").order("name");
  const rows = data ?? [];
  const active = rows.filter((row) => row.active).length;

  return (
    <main className="nexus-page users-workspace">
      <header className="nexus-page-head">
        <div><div className="eyebrow">ADMINISTRATION</div><h1>User Access</h1><p>Users, roles, sales names and access scope.</p></div>
        <div className="nexus-head-actions"><span className="workspace-chip"><ShieldCheck size={14} /> Admin only</span></div>
      </header>

      <section className="dashboard-stat-grid user-kpis">
        <div className="nexus-stat-card"><div className="nexus-stat-icon blue"><UsersRound size={18} /></div><div><span>Total Users</span><strong>{rows.length}</strong><small>CRM accounts</small></div></div>
        <div className="nexus-stat-card"><div className="nexus-stat-icon green"><ShieldCheck size={18} /></div><div><span>Active Users</span><strong>{active}</strong><small>Currently enabled</small></div></div>
      </section>

      <section className="nexus-card">
        <div className="nexus-table-wrap">
          <table className="nexus-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Sales Name</th><th>Active</th></tr></thead>
            <tbody>
              {rows.map((row) => <tr key={row.user_id}><td>{row.name}</td><td>{row.email}</td><td>{row.role}</td><td>{row.sales_name || "—"}</td><td>{row.active ? "Active" : "Inactive"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
