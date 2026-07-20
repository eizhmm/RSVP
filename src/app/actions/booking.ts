"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/rsvp/schema";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import { revalidatePath, updateTag } from "next/cache";

export type BookingResult =
  | {
      ok: true;
      confirmationCode: string;
      pax: number;
      names: string[];
      eventDate: string;
      startsAt: string;
      slotLabel: string;
      slotKey: string;
      emailSent: boolean;
    }
  | { ok: false; error: string };

function mapDbError(message: string) {
  if (message.includes("SESSION_FULL")) return "Not enough seats left for this party size.";
  if (message.includes("EMAIL_ALREADY_REGISTERED")) return "This email already has a reservation.";
  if (message.includes("SESSION_NOT_FOUND")) return "That sitting was not found.";
  if (message.includes("COMPANION_COUNT_MISMATCH")) return "Please fill in every guest you are bringing.";
  return "Could not complete reservation. Please try again.";
}

export async function createBooking(raw: unknown): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form data" };
  }

  const { slotKey, pax, lead, companions } = parsed.data;
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("create_rsvp_booking", {
    p_slot_key: slotKey,
    p_pax: pax,
    p_lead: {
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      designation: lead.designation,
      dietaryNote: lead.dietaryNote ?? "",
    },
    p_companions: companions.map((c) => ({
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      designation: c.designation,
      dietaryNote: c.dietaryNote ?? "",
    })),
  });

  if (error) {
    return { ok: false, error: mapDbError(error.message) };
  }

  const result = data as {
    confirmationCode: string;
    pax: number;
    eventDate: string;
    startsAt: string;
    slotLabel: string;
    slotKey: string;
  };

  const names = [lead.fullName, ...companions.map((c) => c.fullName)];

  let emailSent = false;
  try {
    const emailResult = await sendInvitationEmail({
      to: lead.email,
      names,
      pax: result.pax,
      confirmationCode: result.confirmationCode,
      eventDate: result.eventDate,
      startsAt: String(result.startsAt).slice(0, 5),
      slotLabel: result.slotLabel,
    });
    emailSent = !emailResult.skipped;
  } catch (err) {
    console.error("Resend failed", err);
  }

  updateTag("sessions");
  revalidatePath("/");
  revalidatePath("/rsvp");
  revalidatePath("/admin");

  return {
    ok: true,
    confirmationCode: result.confirmationCode,
    pax: result.pax,
    names,
    eventDate: result.eventDate,
    startsAt: String(result.startsAt).slice(0, 5),
    slotLabel: result.slotLabel,
    slotKey: result.slotKey,
    emailSent,
  };
}
