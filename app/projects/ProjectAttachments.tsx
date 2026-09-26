"use client";

import { useRef, useState } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { deleteProjectAttachment, getProjectAttachmentUrl, uploadProjectAttachment } from "./attachment-actions";

type Attachment = {
  attachment_id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  storage_path: string | null;
  file_url: string | null;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectAttachments({
  projectId,
  attachments,
  canManage,
}: {
  projectId: string;
  attachments: Attachment[];
  canManage: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      await uploadProjectAttachment(projectId, file);
      if (inputRef.current) inputRef.current.value = "";
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const { url } = await getProjectAttachmentUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this attachment?")) return;
    setBusy(true);
    setMessage("");
    try {
      await deleteProjectAttachment(id);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>Attachments</h2>
        <span className="muted">{attachments.length}</span>
      </div>
      {canManage && (
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
          <input ref={inputRef} type="file" onChange={() => void upload()} disabled={busy} />
          <span className="muted"><Upload size={14} style={{verticalAlign:"middle"}} /> Max 20 MB</span>
        </div>
      )}
      {message && <p className="muted">{message}</p>}
      {attachments.length ? (
        <div className="compact-list">
          {attachments.map((a) => (
            <div className="list-row" key={a.attachment_id}>
              <div>
                <strong><Paperclip size={14} style={{verticalAlign:"middle"}} /> {a.file_name}</strong>
                <span>{a.mime_type || "File"} · {formatSize(a.file_size)} · {a.uploaded_by || "—"}</span>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button type="button" onClick={() => void download(a.attachment_id)} disabled={busy} aria-label={`Download ${a.file_name}`}><Download size={16} /></button>
                {canManage && <button type="button" onClick={() => void remove(a.attachment_id)} disabled={busy} aria-label={`Delete ${a.file_name}`}><Trash2 size={16} /></button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="muted">No attachments.</p>}
    </section>
  );
}
