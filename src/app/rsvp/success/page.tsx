import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { VENUE, formatSessionDate, formatTimeLabel } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = createServiceClient();

  const { data: party } = code
    ? await supabase
        .from("rsvp_parties")
        .select(
          `
          confirmation_code,
          pax,
          dinner_sessions ( event_date, starts_at, slot_label ),
          rsvp_guests ( full_name, email, is_lead, sort_order )
        `,
        )
        .eq("confirmation_code", code)
        .maybeSingle()
    : { data: null };

  const guests = [...(party?.rsvp_guests ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const lead = guests.find((g) => g.is_lead) ?? guests[0];
  const session = Array.isArray(party?.dinner_sessions)
    ? party?.dinner_sessions[0]
    : party?.dinner_sessions;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="inner">
          <Link className="brand-mark" href="/">
            Kind Table
          </Link>
          <Link href="/">Home</Link>
        </div>
      </header>
      <main className="page-main">
        <div className="success-panel">
          <div className="success-icon" aria-hidden="true">
            ✓
          </div>
          <h1 className="page-title">You are on the list</h1>
          <p className="page-lead" style={{ marginInline: "auto" }}>
            Thank you for supporting Kind Table. Your seat at our charity donation dinner is
            reserved.
          </p>
          <div className="confirm-code" aria-label="Confirmation code">
            {party?.confirmation_code ?? code ?? "—"}
          </div>
          <div className="detail-rows">
            <dl>
              <dt>Lead guest</dt>
              <dd>{lead?.full_name ?? "—"}</dd>
              <dt>Party size</dt>
              <dd>{party?.pax ?? "—"} pax</dd>
              {guests.length > 1 ? (
                <>
                  <dt>Guests</dt>
                  <dd>{guests.filter((g) => !g.is_lead).map((g) => g.full_name).join(", ")}</dd>
                </>
              ) : null}
              <dt>Date</dt>
              <dd>{session ? formatSessionDate(session.event_date) : "—"}</dd>
              <dt>Sitting</dt>
              <dd>
                {session ? formatTimeLabel(session.starts_at, session.slot_label) : "—"}
              </dd>
              <dt>Venue</dt>
              <dd>
                {VENUE.name} · {VENUE.address}
              </dd>
              <dt>Email</dt>
              <dd>{lead?.email ?? "—"}</dd>
            </dl>
          </div>
          <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Please arrive 15 minutes early. Keep this confirmation code for check-in.
          </p>
          <Link className="btn btn-primary" href="/">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
