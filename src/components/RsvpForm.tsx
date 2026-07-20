"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking } from "@/app/actions/booking";
import type { DinnerSession } from "@/lib/event";
import { VENUE, formatClock, formatSessionDate, formatTimeLabel } from "@/lib/event";

type GuestDraft = {
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  dietaryNote: string;
};

const emptyGuest = (): GuestDraft => ({
  fullName: "",
  phone: "",
  email: "",
  designation: "",
  dietaryNote: "",
});

function arriveHint(startsAt: string) {
  const [h, m] = startsAt.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m - 15, 0, 0);
  const hour = d.getHours();
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = ((hour + 11) % 12) + 1;
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `Arrive by ${display}:${mins} ${suffix}`;
}

export function RsvpForm({ sessions }: { sessions: DinnerSession[] }) {
  const dates = useMemo(() => {
    const map = new Map<string, DinnerSession[]>();
    for (const s of sessions) {
      const list = map.get(s.event_date) ?? [];
      list.push(s);
      map.set(s.event_date, list);
    }
    return [...map.entries()];
  }, [sessions]);

  const [date, setDate] = useState("");
  const [slotKey, setSlotKey] = useState("");
  const [pax, setPax] = useState(1);
  const [lead, setLead] = useState<GuestDraft>(emptyGuest());
  const [companions, setCompanions] = useState<GuestDraft[]>([]);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [invite, setInvite] = useState<{
    names: string[];
    pax: number;
    confirmationCode: string;
    eventDate: string;
    startsAt: string;
    slotLabel: string;
    emailSent: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = sessions.find((s) => s.slot_key === slotKey);
  const maxSeats = selected?.seats_left ?? 1;
  const daySessions = date ? sessions.filter((s) => s.event_date === date) : [];

  function updatePax(next: number) {
    const capped = Math.max(1, Math.min(maxSeats, next));
    setPax(capped);
    setCompanions((prev) => {
      const copy = [...prev];
      while (copy.length < capped - 1) copy.push(emptyGuest());
      return copy.slice(0, Math.max(0, capped - 1));
    });
  }

  function onPickSlot(key: string) {
    setSlotKey(key);
    const seat = sessions.find((s) => s.slot_key === key)?.seats_left ?? 1;
    const nextPax = Math.min(pax, seat);
    setPax(nextPax);
    setCompanions((prev) => prev.slice(0, Math.max(0, nextPax - 1)));
  }

  function openConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !slotKey || !selected) {
      setError("Please choose a date and sitting.");
      return;
    }
    if (pax > selected.seats_left) {
      setError("Party size exceeds seats left for this sitting.");
      return;
    }
    setConfirmOpen(true);
  }

  function submitBooking() {
    if (!selected) return;
    startTransition(async () => {
      const result = await createBooking({
        slotKey,
        pax,
        lead: {
          fullName: lead.fullName,
          phone: lead.phone,
          email: lead.email,
          designation: lead.designation,
          dietaryNote: lead.dietaryNote || undefined,
        },
        companions: companions.map((c) => ({
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          designation: c.designation,
          dietaryNote: c.dietaryNote || undefined,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }

      setConfirmOpen(false);
      setInvite({
        names: result.names,
        pax: result.pax,
        confirmationCode: result.confirmationCode,
        eventDate: result.eventDate,
        startsAt: result.startsAt,
        slotLabel: result.slotLabel,
        emailSent: result.emailSent,
      });
    });
  }

  function engravedNames(names: string[]) {
    if (names.length === 1) return names[0];
    if (names.length === 2)
      return (
        <>
          {names[0]} <span className="invite-amp">&amp;</span> {names[1]}
        </>
      );
    return (
      <>
        {names.slice(0, -1).join(", ")} <span className="invite-amp">&amp;</span>{" "}
        {names[names.length - 1]}
      </>
    );
  }

  return (
    <>
      <aside className="venue-banner" aria-label="Venue">
        <strong>Venue</strong>
        <span>{VENUE.name}</span>
        <span className="muted">{VENUE.address}</span>
      </aside>

      <form className="form-panel form-panel-wide" onSubmit={openConfirm}>
        <fieldset className="form-section">
          <legend>Your details</legend>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              required
              value={lead.fullName}
              onChange={(e) => setLead({ ...lead, fullName: e.target.value })}
              placeholder="Aisha Rahman"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                required
                value={lead.phone}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                placeholder="01X-XXXX XXXX"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input
              id="designation"
              required
              value={lead.designation}
              onChange={(e) => setLead({ ...lead, designation: e.target.value })}
              placeholder="e.g. Donor, Community Partner, Guest"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dietary">
              Dietary / accessibility <span className="muted">(optional)</span>
            </label>
            <textarea
              id="dietary"
              value={lead.dietaryNote}
              onChange={(e) => setLead({ ...lead, dietaryNote: e.target.value })}
              placeholder="e.g. vegetarian, no nuts"
            />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>When are you coming?</legend>
          <div className="form-group">
            <span className="field-label">Date</span>
            <div className="date-list" role="radiogroup" aria-label="Event date">
              {dates.map(([eventDate]) => {
                const d = new Date(`${eventDate}T12:00:00`);
                return (
                  <label className="date-option" key={eventDate}>
                    <input
                      type="radio"
                      name="date"
                      required
                      checked={date === eventDate}
                      onChange={() => {
                        setDate(eventDate);
                        setSlotKey("");
                        setPax(1);
                        setCompanions([]);
                      }}
                    />
                    <span className="date-option-face">
                      <span className="date-num">{d.getDate()}</span>
                      <span className="date-copy">
                        <span className="date-title">
                          {d.toLocaleDateString("en-MY", { weekday: "long" })}
                        </span>
                        <span className="date-sub">
                          {d.toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {date ? (
            <div className="form-group">
              <span className="field-label">Sitting</span>
              <div className="slot-list" role="radiogroup" aria-label="Sitting">
                {daySessions.map((session) => {
                  const full = session.seats_left <= 0;
                  return (
                    <label
                      className={`slot-option${full ? " is-full" : ""}`}
                      key={session.slot_key}
                    >
                      <input
                        type="radio"
                        name="slot"
                        required
                        disabled={full}
                        checked={slotKey === session.slot_key}
                        onChange={() => onPickSlot(session.slot_key)}
                      />
                      <span className="slot-option-face">
                        <span className="slot-time">{formatClock(session.starts_at)}</span>
                        <span className="slot-name">{session.slot_label}</span>
                        <span className="slot-meta">{arriveHint(session.starts_at)}</span>
                        <span className={`seat-badge${session.seats_left === session.capacity ? " open" : ""}`}>
                          {full ? "Full" : `${session.seats_left} left`}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </fieldset>

        {selected ? (
          <fieldset className="form-section">
            <legend>Party size</legend>
            <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
              Choose how many seats you need, including yourself. Up to {maxSeats} seat
              {maxSeats === 1 ? "" : "s"} left.
            </p>
            <div className="pax-control">
              <button
                type="button"
                className="pax-btn"
                aria-label="Fewer guests"
                disabled={pax <= 1}
                onClick={() => updatePax(pax - 1)}
              >
                −
              </button>
              <div className="pax-display">
                <input type="number" readOnly value={pax} aria-live="polite" />
                <span className="pax-unit">pax</span>
              </div>
              <button
                type="button"
                className="pax-btn"
                aria-label="More guests"
                disabled={pax >= maxSeats}
                onClick={() => updatePax(pax + 1)}
              >
                +
              </button>
            </div>
          </fieldset>
        ) : null}

        {companions.length > 0 ? (
          <fieldset className="form-section">
            <legend>Guests you are bringing</legend>
            <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
              Enter details for each additional guest.
            </p>
            {companions.map((guest, idx) => (
              <div className="companion-card" key={idx}>
                <h3>Guest {idx + 2}</h3>
                <div className="form-group">
                  <label>Full name</label>
                  <input
                    required
                    value={guest.fullName}
                    onChange={(e) => {
                      const next = [...companions];
                      next[idx] = { ...guest, fullName: e.target.value };
                      setCompanions(next);
                    }}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      required
                      value={guest.phone}
                      onChange={(e) => {
                        const next = [...companions];
                        next[idx] = { ...guest, phone: e.target.value };
                        setCompanions(next);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      required
                      value={guest.email}
                      onChange={(e) => {
                        const next = [...companions];
                        next[idx] = { ...guest, email: e.target.value };
                        setCompanions(next);
                      }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input
                    required
                    value={guest.designation}
                    onChange={(e) => {
                      const next = [...companions];
                      next[idx] = { ...guest, designation: e.target.value };
                      setCompanions(next);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    Dietary note <span className="muted">(optional)</span>
                  </label>
                  <input
                    value={guest.dietaryNote}
                    onChange={(e) => {
                      const next = [...companions];
                      next[idx] = { ...guest, dietaryNote: e.target.value };
                      setCompanions(next);
                    }}
                  />
                </div>
              </div>
            ))}
          </fieldset>
        ) : null}

        {error ? (
          <p className="hint" style={{ color: "var(--danger)", marginBottom: "1rem" }}>
            {error}
          </p>
        ) : null}

        <div className="form-actions">
          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            Confirm reservation
          </button>
        </div>
      </form>

      {confirmOpen && selected ? (
        <div className="confirm-overlay" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <h2>Confirm your reservation?</h2>
            <p className="confirm-summary">
              <strong>{lead.fullName || "Guest"}</strong> · {pax} pax ·{" "}
              {formatSessionDate(selected.event_date)} ·{" "}
              {formatTimeLabel(selected.starts_at, selected.slot_label)}
              {companions.length > 0 ? (
                <>
                  <br />
                  <span className="muted">
                    With: {companions.map((c) => c.fullName || "Guest").join(", ")}
                  </span>
                </>
              ) : null}
            </p>
            <p className="confirm-note">Once confirmed, your seats will be held for this sitting.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending}
                onClick={submitBooking}
              >
                {pending ? "Saving…" : "Yes, confirm"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                No, go back
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {invite ? (
        <div className="invite-overlay" role="presentation">
          <div className="invite-dialog" role="dialog" aria-modal="true">
            <article className="invite-card">
              <div className="invite-frame">
                <div className="invite-inner">
                  <p className="invite-eyebrow">You are cordially invited</p>
                  <div className="invite-flourish" aria-hidden="true">
                    <span />
                    <i>❀</i>
                    <span />
                  </div>
                  <h2 className="invite-brand">Kind Table</h2>
                  <p className="invite-event">Charity Donation Dinner</p>
                  <div className="invite-flourish" aria-hidden="true">
                    <span />
                    <i>✦</i>
                    <span />
                  </div>
                  <p className="invite-honour">engraved for</p>
                  <p className="invite-names">{engravedNames(invite.names)}</p>
                  {invite.pax > 1 ? (
                    <p className="invite-pax">Party of {invite.pax}</p>
                  ) : null}
                  <div className="invite-flourish soft" aria-hidden="true">
                    <span />
                    <i>❀</i>
                    <span />
                  </div>
                  <p className="invite-when">
                    {formatSessionDate(invite.eventDate)}
                    <br />
                    <span className="invite-time">
                      {formatTimeLabel(invite.startsAt, invite.slotLabel)}
                    </span>
                  </p>
                  <p className="invite-where">
                    {VENUE.name}
                    <br />
                    {VENUE.address}
                  </p>
                  <p className="invite-code">
                    Confirmation <span>{invite.confirmationCode}</span>
                  </p>
                  {invite.emailSent ? (
                    <p className="hint" style={{ marginTop: "0.85rem" }}>
                      Invitation emailed to {lead.email}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
            <div className="invite-actions">
              <a className="btn btn-primary" href={`/rsvp/success?code=${invite.confirmationCode}`}>
                Done
              </a>
              <button type="button" className="btn btn-outline" onClick={() => setInvite(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
