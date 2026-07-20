import { redirect } from "next/navigation";
import { adminLogoutAction } from "@/app/actions/admin";
import { BrandMark } from "@/components/BrandMark";
import { ClearSitting } from "@/components/admin/ClearSitting";
import { DangerZone } from "@/components/admin/DangerZone";
import { ExportToolbar } from "@/components/admin/ExportToolbar";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminReport } from "@/lib/rsvp/queries";
import { VENUE, formatSessionDate, formatTimeLabel } from "@/lib/event";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const report = await getAdminReport();
  const fill =
    report.totalCapacity === 0
      ? 0
      : Math.round((report.totalRegistered / report.totalCapacity) * 100);

  const exportSessions = report.sessions.map(({ session, guests, partyCount }) => ({
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
    <div className="admin-body">
      <header className="admin-top">
        <div className="inner">
          <div>
            <BrandMark />
            <span className="admin-badge">Admin</span>
          </div>
          <div className="actions">
            <form action={adminLogoutAction}>
              <button className="btn btn-ghost" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="admin-wrap">
        <h1 style={{ fontSize: "1.85rem", marginBottom: "0.35rem" }}>Registration report</h1>
        <p className="muted" style={{ marginBottom: "0.35rem" }}>
          Charity Donation Dinner · 15–16 Aug 2026 · 30 seats total
        </p>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          Venue: {VENUE.name} · {VENUE.address}
        </p>

        <div className="stats-row">
          <div className="stat-box">
            <div className="k">Total registered</div>
            <div className="v">{report.totalRegistered}</div>
            <div className="s">of {report.totalCapacity} seats</div>
          </div>
          <div className="stat-box">
            <div className="k">Sessions open</div>
            <div className="v">{report.sessionsOpen}</div>
            <div className="s">of {report.sessions.length}</div>
          </div>
          <div className="stat-box">
            <div className="k">Fill rate</div>
            <div className="v">{fill}%</div>
            <div className="s">overall</div>
          </div>
          <div className="stat-box">
            <div className="k">Parties</div>
            <div className="v">
              {report.sessions.reduce((sum, s) => sum + s.partyCount, 0)}
            </div>
            <div className="s">bookings</div>
          </div>
        </div>

        <ExportToolbar sessions={exportSessions} />

        {report.sessions.map(({ session, guests }) => {
          const pct = Math.round((session.seats_taken / session.capacity) * 100);
          const full = session.seats_left === 0 && session.seats_taken > 0;
          const sessionLabel = `${formatSessionDate(session.event_date).replace(/,/g, "")} · ${formatTimeLabel(session.starts_at, session.slot_label)}`;
          return (
            <section className="session-block" key={session.id}>
              <div className="session-head">
                <h3>{sessionLabel}</h3>
                <div className="session-head-actions">
                  <span className={`pill${full ? " full" : ""}`}>
                    {session.seats_taken} / {session.capacity}{" "}
                    {full ? "full" : "registered"}
                  </span>
                  <ClearSitting
                    sessionId={session.id}
                    sessionLabel={sessionLabel}
                    guestCount={guests.length}
                  />
                </div>
              </div>
              <div className={`bar${full ? " full" : ""}`} aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Designation</th>
                      <th>Dietary</th>
                      <th>Code</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan={7}>No registrations yet for this sitting.</td>
                      </tr>
                    ) : (
                      guests.map((g) => (
                        <tr key={g.id}>
                          <td>{g.full_name}</td>
                          <td>{g.phone}</td>
                          <td>{g.email}</td>
                          <td>{g.designation}</td>
                          <td>{g.dietary_note || "—"}</td>
                          <td>{g.party_code}</td>
                          <td>
                            {new Date(g.registered_at).toLocaleString("en-MY", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <DangerZone />
      </div>
    </div>
  );
}
