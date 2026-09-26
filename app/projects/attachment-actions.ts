"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

const BUCKET = "project-attachments";

async function requireActiveUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile, error } = await supabase
    .from("users")
    .select("user_id,email,role,active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile?.active) throw new Error("Account is inactive");
  return { supabase, user, profile };
}

async function requireProject(supabase: any, projectId: string) {
  const id = projectId.trim();
  if (!id) throw new Error("Project ID is required.");
  const { data: project, error } = await supabase
    .from("projects")
    .select("project_id,project_name,deleted_at")
    .eq("project_id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!project) throw new Error("Project not found.");
  return project;
}

function safeFileName(name: string) {
  const cleaned = name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "").slice(0, 160);
  return cleaned || "attachment";
}

export async function uploadProjectAttachment(projectId: string, file: File) {
  const { supabase, user } = await requireActiveUser();
  const project = await requireProject(supabase, projectId);
  if (project.deleted_at) throw new Error("Deleted projects cannot receive attachments.");
  if (!file || file.size === 0) throw new Error("Please select a file.");

  const path = `${project.project_id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const attachmentId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("attachments").insert({
    attachment_id: attachmentId,
    project_id: project.project_id,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    storage_path: path,
    file_url: null,
    uploaded_at: new Date().toISOString(),
    uploaded_by: user.email || user.id,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(insertError.message);
  }

  revalidatePath(`/projects/${encodeURIComponent(project.project_id)}`);
  revalidatePath("/projects");
  return { attachmentId };
}

export async function getProjectAttachmentUrl(attachmentId: string) {
  const { supabase } = await requireActiveUser();
  const { data: attachment, error } = await supabase
    .from("attachments")
    .select("attachment_id,project_id,file_name,storage_path,file_url")
    .eq("attachment_id", attachmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!attachment) throw new Error("Attachment not found.");

  if (!attachment.storage_path) {
    if (!attachment.file_url) throw new Error("Attachment has no download source.");
    return { url: attachment.file_url };
  }

  const { data, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(attachment.storage_path, 300);
  if (signedError) throw new Error(signedError.message);
  return { url: data.signedUrl };
}

export async function deleteProjectAttachment(attachmentId: string) {
  const { supabase, user, profile } = await requireActiveUser();
  if (!["Admin","Manager"].includes(profile.role)) throw new Error("Only Admin or Manager can delete attachments.");
  const { data: attachment, error } = await supabase
    .from("attachments")
    .select("attachment_id,project_id,file_name,storage_path")
    .eq("attachment_id", attachmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!attachment) throw new Error("Attachment not found.");

  const project = await requireProject(supabase, attachment.project_id);
  if (project.deleted_at) throw new Error("Deleted projects cannot have attachments changed.");

  if (attachment.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([attachment.storage_path]);
    if (storageError) throw new Error(storageError.message);
  }

  const { error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("attachment_id", attachment.attachment_id);
  if (deleteError) throw new Error(deleteError.message);

  await writeAuditLog({userEmail:user.email||"unknown",action:"Attachment Deleted",entityType:"Attachment",entityId:attachment.attachment_id,details:{project_id:attachment.project_id,file_name:attachment.file_name}});
  revalidatePath(`/projects/${encodeURIComponent(attachment.project_id)}`);
  return { deleted: true };
}
