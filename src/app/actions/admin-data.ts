"use server";

import { revalidatePath, updateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export type AdminDataResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<AdminDataResult | null> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }
  return null;
}

function requireDeleteConfirm(confirm: string): AdminDataResult | null {
  if (confirm !== "DELETE") {
    return { ok: false, error: 'Type DELETE exactly to confirm.' };
  }
  return null;
}

async function refreshAdminCaches() {
  updateTag("sessions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/rsvp");
}

export async function deleteAllRegistrations(confirm: string): Promise<AdminDataResult> {
  const auth = await assertAdmin();
  if (auth) return auth;
  const confirmErr = requireDeleteConfirm(confirm);
  if (confirmErr) return confirmErr;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("rsvp_parties")
    .delete()
    .gte("created_at", "1970-01-01");

  if (error) return { ok: false, error: error.message };

  await refreshAdminCaches();
  return { ok: true };
}

export async function deleteSessionRegistrations(
  sessionId: string,
  confirm: string,
): Promise<AdminDataResult> {
  const auth = await assertAdmin();
  if (auth) return auth;
  const confirmErr = requireDeleteConfirm(confirm);
  if (confirmErr) return confirmErr;

  if (!sessionId.trim()) {
    return { ok: false, error: "Missing session." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("rsvp_parties")
    .delete()
    .eq("session_id", sessionId);

  if (error) return { ok: false, error: error.message };

  await refreshAdminCaches();
  return { ok: true };
}
