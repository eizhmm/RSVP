import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import type { DinnerSession } from "@/lib/event";

/** Fresh seat counts — use for admin / after writes. */
export async function fetchSessionsWithSeats(): Promise<DinnerSession[]> {
  const supabase = createServiceClient();

  const [sessionsResult, partiesResult] = await Promise.all([
    supabase
      .from("dinner_sessions")
      .select("id, event_date, slot_key, slot_label, starts_at, capacity")
      .order("event_date", { ascending: true })
      .order("starts_at", { ascending: true }),
    supabase.from("rsvp_parties").select("session_id, pax"),
  ]);

  if (sessionsResult.error) throw sessionsResult.error;
  if (partiesResult.error) throw partiesResult.error;

  const takenBySession = new Map<string, number>();
  for (const party of partiesResult.data ?? []) {
    takenBySession.set(
      party.session_id,
      (takenBySession.get(party.session_id) ?? 0) + party.pax,
    );
  }

  return (sessionsResult.data ?? []).map((session) => {
    const seats_taken = takenBySession.get(session.id) ?? 0;
    return {
      ...session,
      seats_taken,
      seats_left: Math.max(0, session.capacity - seats_taken),
    };
  });
}

/** Cached for public pages (home / RSVP). Invalidated on booking via revalidateTag("sessions"). */
export const getSessionsWithSeats = unstable_cache(
  async () => fetchSessionsWithSeats(),
  ["sessions-with-seats"],
  { revalidate: 60, tags: ["sessions"] },
);

export async function getAdminReport() {
  const supabase = createServiceClient();
  const sessions = await fetchSessionsWithSeats();

  const { data: parties, error } = await supabase
    .from("rsvp_parties")
    .select(
      `
      id,
      pax,
      confirmation_code,
      lead_email,
      created_at,
      session_id,
      rsvp_guests (
        id,
        full_name,
        phone,
        email,
        designation,
        dietary_note,
        is_lead,
        sort_order
      )
    `,
    )
    .order("created_at", { ascending: true });

  if (error) throw error;

  const bySession = sessions.map((session) => {
    const sessionParties = (parties ?? []).filter((p) => p.session_id === session.id);
    const guests = sessionParties.flatMap((party) => {
      const list = [...(party.rsvp_guests ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      return list.map((guest) => ({
        ...guest,
        party_code: party.confirmation_code,
        registered_at: party.created_at,
      }));
    });

    return { session, guests, partyCount: sessionParties.length };
  });

  const totalRegistered = sessions.reduce((sum, s) => sum + s.seats_taken, 0);
  const totalCapacity = sessions.reduce((sum, s) => sum + s.capacity, 0);

  return {
    sessions: bySession,
    totalRegistered,
    totalCapacity,
    sessionsOpen: sessions.filter((s) => s.seats_left > 0).length,
  };
}
