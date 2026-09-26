"use client";

import { useState } from "react";
import { disableUser, saveUser } from "./actions";

type User = {
  user_id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Sales";
  active: boolean;
  sales_name: string | null;
};

export default function UserAccessClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setBusy(true); setMessage("");
    try {
      await saveUser({
        userId: editing?.user_id,
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        role: String(formData.get("role") || "Sales") as User["role"],
        active: formData.get("active") === "on",
        salesName: String(formData.get("salesName") || "")
      });
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save user.");
    } finally { setBusy(false); }
  }

  async function deactivate(id: string) {
    if (!window.confirm("Disable this user's EMDAD NEXUS access?")) return;
    setBusy(true); setMessage("");
    try { await disableUser(id); setUsers(prev => prev.map(u => u.user_id === id ? {...u, active:false} : u)); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to disable user."); }
    finally { setBusy(false); }
  }

  const formUser = editing;
  return <div className="users-access-client">
    {message && <div className="nexus-alert">{message}</div>}
    <div className="nexus-card" style={{marginBottom:16}}>
      <div className="section-head"><div><h2>{formUser ? "Edit User" : "Add User"}</h2><p className="muted">Admin-only access management. Sales users require a unique Sales Name.</p></div><button className="btn" type="button" onClick={()=>setEditing(null)}>New User</button></div>
      <form action={submit} className="settings-form">
        <div className="settings-form-grid">
          <label>Name<input name="name" required defaultValue={formUser?.name || ""}/></label>
          <label>Email<input name="email" type="email" required defaultValue={formUser?.email || ""}/></label>
          <label>Role<select name="role" defaultValue={formUser?.role || "Sales"}><option>Sales</option><option>Manager</option><option>Admin</option></select></label>
          <label>Sales Name<input name="salesName" defaultValue={formUser?.sales_name || ""} placeholder="Required for Sales"/></label>
          <label><span>Active</span><input name="active" type="checkbox" defaultChecked={formUser ? formUser.active : true}/></label>
        </div>
        <div className="settings-form-actions"><button className="btn primary" disabled={busy} type="submit">{busy ? "Saving..." : formUser ? "Save Changes" : "Create User"}</button></div>
      </form>
    </div>
    <div className="nexus-table-wrap"><table className="nexus-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Sales Name</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {users.map(u=><tr key={u.user_id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.sales_name || "—"}</td><td>{u.active ? "Active" : "Inactive"}</td><td><button className="btn" type="button" onClick={()=>setEditing(u)}>Edit</button>{u.active&&<button className="btn" type="button" onClick={()=>deactivate(u.user_id)} style={{marginLeft:6}}>Disable</button>}</td></tr>)}
    </tbody></table></div>
  </div>;
}
