import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <main className="nexus-page"><h1>Settings</h1><p>Unauthorized</p></main>;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !["Admin", "Manager"].includes(profile.role)) {
    return <main className="nexus-page"><h1>Settings</h1><p>Access restricted to Admin and Manager.</p></main>;
  }

  const { data: rows } = await supabase
    .from("settings")
    .select("type,value")
    .order("type");

  return (
    <main className="nexus-page">
      <div className="nexus-header">
        <div>
          <h1>Settings</h1>
          <p>EMDAD NEXUS Control Center.</p>
        </div>
      </div>
      <section className="nexus-card">
        <h2>Current Configuration</h2>
        <div className="nexus-table-wrap">
          <table className="nexus-table">
            <thead><tr><th>Setting</th><th>Value</th></tr></thead>
            <tbody>
              {(rows || []).map((x) => (
                <tr key={x.type}>
                  <td>{x.type}</td>
                  <td>{x.value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
