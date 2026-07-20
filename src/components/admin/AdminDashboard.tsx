"use client";

import { useMemo, useState } from "react";
import { adminLogoutAction } from "@/app/actions/admin";
import { BrandMark } from "@/components/BrandMark";
import { ClearSitting } from "@/components/admin/ClearSitting";
import { DangerZone } from "@/components/admin/DangerZone";
import { downloadRsvpPdf } from "@/lib/admin/export-pdf";
import type { ExportSessionBlock } from "@/lib/admin/export-types";
import { VENUE, formatClock, formatSessionDate, formatTimeLabel } from "@/lib/event";

type AdminDashboardProps = {
  sessions: ExportSessionBlock[];
  totalRegistered: number;
  totalCapacity: number;
};

type FlatGuest = ExportSessionBlock["guests"][number] & {
  sessionId: string;
  sittingLabel: string;
  sittingShort: string;
};

function shortSittingLabel(eventDate: string, startsAt: string) {
  const d = new Date(`${eventDate}T12:00:00`);
  const weekday = d.toLocaleDateString("en-MY", { weekday: "short" });
  return `${weekday} ${formatClock(startsAt)}`;
}

function formatRegistered(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminDashboard({
  sessions,
  totalRegistered,
  totalCapacity,
}: AdminDashboardProps) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const fill =
    totalCapacity === 0 ? 0 : Math.round((totalRegistered / totalCapacity) * 100);

  const totalParties = sessions.reduce((sum, s) => sum + s.partyCount, 0);

  const flatGuests = useMemo<FlatGuest[]>(() => {
    return sessions.flatMap(({ session, guests }) => {
      const sittingLabel = `${formatSessionDate(session.event_date).replace(/,/g, "")} · ${formatTimeLabel(session.starts_at, session.slot_label)}`;
      const sittingShort = shortSittingLabel(session.event_date, session.starts_at);
      return guests.map((g) => ({
        ...g,
        sessionId: session.id,
        sittingLabel,
        sittingShort,
      }));
    });
  }, [sessions]);

  const activeBlock = filter === "all" ? null : sessions.find((s) => s.session.id === filter);

  const filteredBlocks = useMemo(() => {
    if (filter === "all") return sessions;
    return sessions.filter((s) => s.session.id === filter);
  }, [sessions, filter]);

  const visibleGuests = useMemo(() => {
    const base =
      filter === "all" ? flatGuests : flatGuests.filter((g) => g.sessionId === filter);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((g) => {
      const hay = [g.full_name, g.phone, g.email, g.designation, g.party_code, g.dietary_note ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [flatGuests, filter, query]);

  const listTitle =
    filter === "all"
      ? "All sittings"
      : activeBlock
        ? shortSittingLabel(activeBlock.session.event_date, activeBlock.session.starts_at)
        : "Guests";

  const slotKeyForExport =
    filter === "all"
      ? "all"
      : (activeBlock?.session.slot_key ?? "session");

  function exportCsv() {
    const url =
      filter === "all"
        ? "/admin/export"
        : `/admin/export?session=${encodeURIComponent(filter)}`;
    window.location.href = url;
    setExportOpen(false);
  }

  function exportPdf() {
    downloadRsvpPdf(
      filteredBlocks,
      filter === "all"
        ? "kind-table-rsvp-all.pdf"
        : `kind-table-rsvp-${slotKeyForExport}.pdf`,
    );
    setExportOpen(false);
  }

  return (
    <div className="admin-body">
      <header className="admin-top">
        <div className="inner">
          <div className="admin-top-brand">
            <BrandMark />
            <span className="admin-badge">Admin</span>
          </div>
          <div className="actions">
            <div className="admin-export-menu">
              <button
                type="button"
                className="btn btn-ghost"
                aria-expanded={exportOpen}
                aria-haspopup="menu"
                onClick={() => setExportOpen((o) => !o)}
              >
                Export
              </button>
              {exportOpen ? (
                <div className="admin-export-dropdown" role="menu">
                  <p className="admin-export-scope">
                    {filter === "all" ? "All sittings" : listTitle}
                  </p>
                  <button type="button" role="menuitem" onClick={exportCsv}>
                    Download CSV
                  </button>
                  <button type="button" role="menuitem" onClick={exportPdf}>
                    Download PDF
                  </button>
                </div>
              ) : null}
            </div>
            <form action={adminLogoutAction}>
              <button className="btn btn-ghost" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {exportOpen ? (
        <button
          type="button"
          className="admin-export-backdrop"
          aria-label="Close export menu"
          onClick={() => setExportOpen(false)}
        />
      ) : null}

      <div className="admin-wrap">
        <header className="admin-page-head">
          <h1>Registrations</h1>
          <p className="muted">
            Charity Donation Dinner · 15–16 Aug 2026 · {VENUE.name}
          </p>
        </header>

        <section className="admin-overview" aria-label="Overview">
          <div className="admin-overview-stats">
            <div className="admin-metric">
              <span className="k">Registered</span>
              <span className="v">
                {totalRegistered}
                <span className="v-sub"> / {totalCapacity}</span>
              </span>
            </div>
            <div className="admin-metric">
              <span className="k">Fill</span>
              <span className="v">{fill}%</span>
            </div>
          </div>
          <div className="admin-sitting-chips" role="list">
            {sessions.map(({ session }) => {
              const full = session.seats_taken >= session.capacity && session.seats_taken > 0;
              const short = shortSittingLabel(session.event_date, session.starts_at);
              return (
                <button
                  key={session.id}
                  type="button"
                  role="listitem"
                  className={`admin-sitting-chip${filter === session.id ? " is-active" : ""}${full ? " is-full" : ""}`}
                  onClick={() => setFilter(session.id)}
                >
                  <span className="chip-label">{short}</span>
                  <span className="chip-count">
                    {session.seats_taken}/{session.capacity}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="admin-list-panel">
          <div className="admin-tabs" role="tablist" aria-label="Sitting filter">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={`admin-tab${filter === "all" ? " is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
              <span className="tab-count">{totalRegistered}</span>
            </button>
            {sessions.map(({ session }) => {
              const short = shortSittingLabel(session.event_date, session.starts_at);
              return (
                <button
                  key={session.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === session.id}
                  className={`admin-tab${filter === session.id ? " is-active" : ""}`}
                  onClick={() => setFilter(session.id)}
                >
                  {short}
                  <span className="tab-count">{session.seats_taken}</span>
                </button>
              );
            })}
          </div>

          <div className="admin-list-toolbar">
            <div>
              <h2 className="admin-list-title">{listTitle}</h2>
              <p className="muted admin-list-meta">
                {visibleGuests.length} guest{visibleGuests.length === 1 ? "" : "s"}
                {query.trim() ? " matching search" : ""}
                {filter === "all" ? ` · ${totalParties} parties` : null}
                {activeBlock
                  ? ` · ${activeBlock.partyCount} part${activeBlock.partyCount === 1 ? "y" : "ies"} · ${activeBlock.session.seats_taken}/${activeBlock.session.capacity} seats`
                  : null}
              </p>
            </div>
            <label className="admin-search">
              <span className="sr-only">Search guests</span>
              <input
                type="search"
                placeholder="Search name, email, phone, code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          {activeBlock ? (
            <div
              className={`admin-fill-bar${activeBlock.session.seats_taken >= activeBlock.session.capacity ? " is-full" : ""}`}
              aria-hidden="true"
            >
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (activeBlock.session.seats_taken / activeBlock.session.capacity) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
          ) : null}

          <div className="table-wrap admin-table-wrap">
            <table className="data admin-data">
              <thead>
                <tr>
                  {filter === "all" ? <th>Sitting</th> : null}
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
                {visibleGuests.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={filter === "all" ? 8 : 7}>
                      {query.trim()
                        ? "No guests match your search."
                        : "No registrations for this view yet."}
                    </td>
                  </tr>
                ) : (
                  visibleGuests.map((g) => (
                    <tr key={g.id}>
                      {filter === "all" ? <td className="admin-sitting-cell">{g.sittingShort}</td> : null}
                      <td className="admin-name-cell">{g.full_name}</td>
                      <td>{g.phone}</td>
                      <td>{g.email}</td>
                      <td>{g.designation}</td>
                      <td className={g.dietary_note ? "admin-dietary-note" : ""}>
                        {g.dietary_note || "—"}
                      </td>
                      <td>
                        <code className="admin-code">{g.party_code}</code>
                      </td>
                      <td>{formatRegistered(g.registered_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <details className="admin-manage">
          <summary>
            <span>Manage data</span>
            <span className="muted">
              Clear a sitting or wipe all — deleted guests can register again
            </span>
          </summary>
          <div className="admin-manage-body">
            <div className="admin-manage-block">
              <h3>Clear this sitting</h3>
              <p className="muted">
                Removes guests for the sitting you have selected above. Their emails and phones can
                be used to register again. Dinner sittings stay.
              </p>
              {filter === "all" ? (
                <p className="admin-manage-hint">Select a sitting tab first to clear it.</p>
              ) : activeBlock ? (
                <ClearSitting
                  sessionId={activeBlock.session.id}
                  sessionLabel={`${formatSessionDate(activeBlock.session.event_date)} · ${formatTimeLabel(activeBlock.session.starts_at, activeBlock.session.slot_label)}`}
                  guestCount={activeBlock.guests.length}
                  buttonClassName="btn btn-outline"
                  buttonLabel="Clear this sitting…"
                />
              ) : null}
            </div>
            <DangerZone embedded />
          </div>
        </details>
      </div>
    </div>
  );
}
