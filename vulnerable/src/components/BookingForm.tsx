"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SessionTypeOption = {
  id: string;
  name: string;
  priceCents: number;
};

export default function BookingForm({
  sessionTypes,
}: {
  sessionTypes: SessionTypeOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setLoading(true);

    const form = new FormData(formEl);
    const sessionTypeId = form.get("sessionTypeId");
    const selected = sessionTypes.find((st) => st.id === sessionTypeId);

    // The normal UI always sends the catalog price for the selected
    // session — but nothing stops a direct API request from sending any
    // other value (VULNERABILITY #6, see api/bookings/route.ts).
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionTypeId,
        scheduledAt: form.get("scheduledAt"),
        priceCents: selected?.priceCents ?? 0,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Buchung fehlgeschlagen.");
      return;
    }

    formEl.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded border border-neutral-200 bg-white p-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="sessionTypeId">
          Session
        </label>
        <select
          id="sessionTypeId"
          name="sessionTypeId"
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          {sessionTypes.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name} — {(st.priceCents / 100).toFixed(2)} €
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="scheduledAt">
          Termin
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {loading ? "..." : "Buchen"}
      </button>
    </form>
  );
}
