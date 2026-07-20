"use client";

import { useMemo, useState } from "react";
import { downloadRsvpPdf } from "@/lib/admin/export-pdf";
import type { ExportSessionBlock } from "@/lib/admin/export-types";

export function ExportToolbar({ sessions }: { sessions: ExportSessionBlock[] }) {
  const [selected, setSelected] = useState("all");

  const options = useMemo(
    () =>
      sessions.map((b) => ({
        value: b.session.id,
        label: `${b.session.event_date} · ${b.session.starts_at.slice(0, 5)} ${b.session.slot_label}`,
        slotKey: b.session.slot_key,
      })),
    [sessions],
  );

  const filtered = useMemo(() => {
    if (selected === "all") return sessions;
    return sessions.filter((b) => b.session.id === selected);
  }, [sessions, selected]);

  const slotKey =
    selected === "all"
      ? "all"
      : (options.find((o) => o.value === selected)?.slotKey ?? "session");

  function exportCsv() {
    const url =
      selected === "all" ? "/admin/export" : `/admin/export?session=${encodeURIComponent(selected)}`;
    window.location.href = url;
  }

  function exportPdf() {
    const name =
      selected === "all"
        ? "kind-table-rsvp-all.pdf"
        : `kind-table-rsvp-${slotKey}.pdf`;
    downloadRsvpPdf(filtered, name);
  }

  return (
    <div className="export-toolbar">
      <div className="export-toolbar-copy">
        <h2>Export</h2>
        <p>Download guest lists as CSV or a formatted PDF report.</p>
      </div>
      <div className="export-toolbar-controls">
        <label className="export-select-wrap">
          <span className="sr-only">Sitting</span>
          <select
            className="export-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="all">All sittings</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-outline" onClick={exportCsv}>
          Export CSV
        </button>
        <button type="button" className="btn btn-primary" onClick={exportPdf}>
          Export PDF
        </button>
      </div>
    </div>
  );
}
