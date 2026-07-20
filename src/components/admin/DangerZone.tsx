"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAllRegistrations } from "@/app/actions/admin-data";

export function DangerZone({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  return (
    <section
      className={`danger-zone${embedded ? " danger-zone-embedded" : ""}`}
      aria-labelledby="danger-zone-title"
    >
      {!embedded ? <div className="danger-zone-rule" aria-hidden="true" /> : null}
      <h2 id="danger-zone-title">{embedded ? "Delete all registrations" : "Danger zone"}</h2>
      <p className="danger-zone-disclaimer">
        Deleting registrations permanently removes guest records (including email and phone). Those
        contacts can register again afterward. Seats reopen; dinner sittings and capacities stay.
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
