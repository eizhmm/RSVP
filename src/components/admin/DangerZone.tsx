"use client";

import { useState, useTransition } from "react";
import { deleteAllRegistrations } from "@/app/actions/admin-data";

export function DangerZone() {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const canDelete = confirm === "DELETE";

  function onDelete() {
    setError("");
    startTransition(async () => {
      const result = await deleteAllRegistrations(confirm);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirm("");
    });
  }

  return (
    <section className="danger-zone" aria-labelledby="danger-zone-title">
      <div className="danger-zone-rule" aria-hidden="true" />
      <h2 id="danger-zone-title">Danger zone</h2>
      <p className="danger-zone-disclaimer">
        Deleting registrations is irreversible. All guest and party records will be removed and
        seats will become available again. Dinner sittings and capacities are not deleted.
      </p>
      <label className="danger-zone-label" htmlFor="delete-confirm">
        Type <kbd>DELETE</kbd> to enable wipe
      </label>
      <div className="danger-zone-row">
        <input
          id="delete-confirm"
          className="danger-zone-input"
          autoComplete="off"
          spellCheck={false}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
        />
        <button
          type="button"
          className="btn btn-danger"
          disabled={!canDelete || pending}
          onClick={onDelete}
        >
          {pending ? "Deleting…" : "Delete all registrations"}
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </section>
  );
}
