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

/**
 * Hard-delete guests then parties so unique email/phone indexes free up
 * and those contacts can register again.
 */
async function wipeParties(partyIds: string[]): Promise<AdminDataResult> {
  if (partyIds.length === 0) return { ok: true };

  const supabase = createServiceClient();

  const { error: guestError } = await supabase
    .from("rsvp_guests")
    .delete()
    .in("party_id", partyIds);

  if (guestError) return { ok: false, error: guestError.message };

  const { error: partyError } = await supabase
    .from("rsvp_parties")
    .delete()
    .in("id", partyIds);

  if (partyError) return { ok: false, error: partyError.message };

  return { ok: true };
}

export async function deleteAllRegistrations(confirm: string): Promise<AdminDataResult> {
  const auth = await assertAdmin();
  if (auth) return auth;
  const confirmErr = requireDeleteConfirm(confirm);
  if (confirmErr) return confirmErr;

  const supabase = createServiceClient();
  const { data: parties, error: listError } = await supabase
    .from("rsvp_parties")
    .select("id");

  if (listError) return { ok: false, error: listError.message };

  const result = await wipeParties((parties ?? []).map((p) => p.id));
  if (!result.ok) return result;

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
  const { data: parties, error: listError } = await supabase
    .from("rsvp_parties")
    .select("id")
    .eq("session_id", sessionId);

  if (listError) return { ok: false, error: listError.message };

  const result = await wipeParties((parties ?? []).map((p) => p.id));
  if (!result.ok) return result;

  await refreshAdminCaches();
  return { ok: true };
}
