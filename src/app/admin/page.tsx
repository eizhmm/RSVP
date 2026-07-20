import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogoutAction } from "@/app/actions/admin";
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

  return (
    <div className="admin-body">
      <header className="admin-top">
        <div className="inner">
          <div>
            <Link className="brand-mark" href="/">
              Kind Table
            </Link>
            <span className="admin-badge">Admin</span>
          </div>
          <div className="actions">
            <a className="btn btn-ghost" href="/admin/export">
              Export CSV
            </a>
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

        {report.sessions.map(({ session, guests }) => {
          const pct = Math.round((session.seats_taken / session.capacity) * 100);
          const full = session.seats_left === 0 && session.seats_taken > 0;
          return (
            <section className="session-block" key={session.id}>
              <div className="session-head">
                <h3>
                  {formatSessionDate(session.event_date).replace(/,/g, "")} ·{" "}
                  {formatTimeLabel(session.starts_at, session.slot_label)}
                </h3>
                <span className={`pill${full ? " full" : ""}`}>
                  {session.seats_taken} / {session.capacity}{" "}
                  {full ? "full" : "registered"}
                </span>
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
      </div>
    </div>
  );
}
