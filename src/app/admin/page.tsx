import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminReport } from "@/lib/rsvp/queries";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const report = await getAdminReport();

  const sessions = report.sessions.map(({ session, guests, partyCount }) => ({
    session: {
      id: session.id,
      slot_key: session.slot_key,
      event_date: session.event_date,
      starts_at: session.starts_at,
      slot_label: session.slot_label,
      capacity: session.capacity,
      seats_taken: session.seats_taken,
    },
    guests: guests.map((g) => ({
      id: g.id,
      full_name: g.full_name,
      phone: g.phone,
      email: g.email,
      designation: g.designation,
      dietary_note: g.dietary_note,
      party_code: g.party_code,
      registered_at: g.registered_at,
    })),
    partyCount,
  }));

  return (
    <AdminDashboard
      sessions={sessions}
      totalRegistered={report.totalRegistered}
      totalCapacity={report.totalCapacity}
    />
  );
}
