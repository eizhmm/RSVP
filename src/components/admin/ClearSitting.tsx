"use client";

import { useState, useTransition } from "react";
import { deleteSessionRegistrations } from "@/app/actions/admin-data";

export function ClearSitting({
  sessionId,
  sessionLabel,
  guestCount,
}: {
  sessionId: string;
  sessionLabel: string;
  guestCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const canDelete = confirm === "DELETE";

  function close() {
    setOpen(false);
    setConfirm("");
    setError("");
  }

  function onClear() {
    setError("");
    startTransition(async () => {
      const result = await deleteSessionRegistrations(sessionId, confirm);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost clear-sitting-btn"
        disabled={guestCount === 0}
        onClick={() => setOpen(true)}
      >
        Clear sitting…
      </button>

      {open ? (
        <div className="confirm-overlay" role="presentation">
          <div className="confirm-dialog danger-confirm" role="dialog" aria-modal="true">
            <h2>Clear this sitting?</h2>
            <p className="confirm-summary">
              Remove all registrations for <strong>{sessionLabel}</strong> ({guestCount} guest
              {guestCount === 1 ? "" : "s"}). Sittings stay; only guest data is deleted.
            </p>
            <label className="danger-zone-label" htmlFor={`clear-${sessionId}`}>
              Type <kbd>DELETE</kbd> to confirm
            </label>
            <input
              id={`clear-${sessionId}`}
              className="danger-zone-input"
              autoComplete="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
            />
            {error ? <p className="field-error">{error}</p> : null}
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-danger"
                disabled={!canDelete || pending}
                onClick={onClear}
              >
                {pending ? "Clearing…" : "Clear sitting"}
              </button>
              <button type="button" className="btn btn-outline" disabled={pending} onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
