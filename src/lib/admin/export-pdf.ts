import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EVENT_NAME, EVENT_TAGLINE, VENUE, formatSessionDate, formatTimeLabel } from "@/lib/event";
import type { ExportSessionBlock } from "@/lib/admin/export-types";

const COLORS = {
  ink: [20, 32, 28] as [number, number, number],
  moss: [61, 90, 76] as [number, number, number],
  sage: [107, 143, 122] as [number, number, number],
  gold: [184, 149, 74] as [number, number, number],
  cream: [244, 247, 244] as [number, number, number],
  mist: [232, 239, 233] as [number, number, number],
  muted: [92, 107, 100] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  line: [210, 220, 214] as [number, number, number],
};

function formatRegistered(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function drawHeaderBand(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(14, 28, pageWidth - 14, 28);

  doc.setTextColor(...COLORS.gold);
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text(EVENT_NAME, 14, 12);

  doc.setTextColor(...COLORS.mist);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(EVENT_TAGLINE.toUpperCase(), 14, 19);

  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.sage);
  doc.text("Guest registration report", pageWidth - 14, 12, { align: "right" });
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.35);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(`${VENUE.name} · Confidential`, 14, pageHeight - 7);
    doc.text(`Page ${i} of ${total}`, pageWidth - 14, pageHeight - 7, {
      align: "right",
    });
  }
}

function sessionTitle(block: ExportSessionBlock) {
  return `${formatSessionDate(block.session.event_date)} · ${formatTimeLabel(
    block.session.starts_at,
    block.session.slot_label,
  )}`;
}

export function downloadRsvpPdf(blocks: ExportSessionBlock[], filename: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalGuests = blocks.reduce((sum, b) => sum + b.guests.length, 0);
  const totalCapacity = blocks.reduce((sum, b) => sum + b.session.capacity, 0);
  const totalTaken = blocks.reduce((sum, b) => sum + b.session.seats_taken, 0);

  drawHeaderBand(doc, pageWidth);

  let y = 36;
  doc.setTextColor(...COLORS.ink);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(
    blocks.length === 1 ? sessionTitle(blocks[0]) : "All sittings",
    14,
    y,
  );

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${VENUE.name} · ${VENUE.address}`, 14, y);

  y += 5;
  doc.text(
    `Generated ${generatedAt} · ${totalGuests} guest${totalGuests === 1 ? "" : "s"} · ${totalTaken}/${totalCapacity} seats filled`,
    14,
    y,
  );

  y += 4;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.4);
  doc.line(14, y, 70, y);

  y += 8;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (i > 0) {
      doc.addPage();
      drawHeaderBand(doc, pageWidth);
      y = 36;
    }

    doc.setFillColor(...COLORS.cream);
    doc.roundedRect(14, y - 4, pageWidth - 28, 12, 1, 1, "F");

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.moss);
    doc.text(sessionTitle(block), 18, y + 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${block.session.seats_taken} / ${block.session.capacity} registered · ${block.partyCount} part${block.partyCount === 1 ? "y" : "ies"}`,
      pageWidth - 18,
      y + 3,
      { align: "right" },
    );
    y += 12;

    const isEmpty = block.guests.length === 0;
    const body = isEmpty
      ? [["No registrations for this sitting yet.", "", "", "", "", "", ""]]
      : block.guests.map((g) => [
          g.full_name,
          g.phone,
          g.email,
          g.designation,
          g.dietary_note || "—",
          g.party_code,
          formatRegistered(g.registered_at),
        ]);

    autoTable(doc, {
      startY: y,
      head: [["Name", "Phone", "Email", "Designation", "Dietary", "Code", "Registered"]],
      body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: { top: 2.4, right: 2.5, bottom: 2.4, left: 2.5 },
        textColor: COLORS.ink,
        lineColor: COLORS.line,
        lineWidth: 0.15,
        valign: "middle",
      },
      headStyles: {
        fillColor: COLORS.moss,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
      },
      alternateRowStyles: isEmpty
        ? undefined
        : {
            fillColor: COLORS.cream,
          },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold" },
        1: { cellWidth: 28 },
        2: { cellWidth: 52 },
        3: { cellWidth: 36 },
        4: { cellWidth: 34 },
        5: { cellWidth: 28 },
        6: { cellWidth: 36 },
      },
      margin: { left: 14, right: 14, top: 32, bottom: 16 },
      didParseCell: (data) => {
        if (isEmpty && data.section === "body" && data.column.index === 0) {
          data.cell.colSpan = 7;
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.textColor = COLORS.muted;
          data.cell.styles.halign = "center";
        }
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeaderBand(doc, pageWidth);
        }
      },
    });

    const finalY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y = finalY + 10;
  }

  drawFooter(doc, pageWidth, pageHeight);
  doc.save(filename);
}
