import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <main className="nexus-page"><h1>Notifications</h1><p>Unauthorized</p></main>;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("notification_id,kind,project_id,title,message,due_date,created_at,read_at")
    .eq("recipient_email", profile?.email || "")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="nexus-page">
      <div className="nexus-header">
        <div>
          <h1>Notifications</h1>
          <p>CRM reminders and alerts.</p>
        </div>
      </div>
      <section className="nexus-card">
        <div className="nexus-table-wrap">
          <table className="nexus-table">
            <thead>
              <tr><th>Due</th><th>Kind</th><th>Title</th><th>Message</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(notifications || []).map((x) => (
                <tr key={x.notification_id}>
                  <td>{x.due_date || "—"}</td>
                  <td>{x.kind}</td>
                  <td>{x.title}</td>
                  <td>{x.message}</td>
                  <td>{x.read_at ? "Read" : "Unread"}</td>
                </tr>
              ))}
              {!notifications?.length && (
                <tr><td colSpan={5}>No notifications.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
