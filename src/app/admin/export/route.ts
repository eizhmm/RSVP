import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminReport } from "@/lib/rsvp/queries";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export async function GET() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const report = await getAdminReport();
  const rows = [
    ["session_date", "slot", "name", "phone", "email", "designation", "dietary", "code", "registered_at"],
  ];

  for (const { session, guests } of report.sessions) {
    for (const g of guests) {
      rows.push([
        session.event_date,
        `${session.starts_at} ${session.slot_label}`,
        g.full_name,
        g.phone,
        g.email,
        g.designation,
        g.dietary_note ?? "",
        g.party_code,
        g.registered_at,
      ]);
    }
  }

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kind-table-rsvp.csv"',
    },
  });
}
