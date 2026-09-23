"use client";

import { useState } from "react";

type Booking = {
  id: string;
  scheduledAt: string;
  priceCents: number;
  sessionType: { name: string };
  invoice: { id: string; paid: boolean } | null;
  client: { id: string; name: string; email: string };
};

type SearchResult = { id: string; name: string; email: string; role: string };

export default function AdminDashboard({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearching(true);
    const res = await fetch(
      `/api/admin/search?q=${encodeURIComponent(query)}`
    );
    setSearching(false);
    if (res.ok) {
      setResults(await res.json());
    }
  }

  async function markPaid(invoiceId: string) {
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "PATCH",
    });
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) =>
          b.invoice?.id === invoiceId
            ? { ...b, invoice: { ...b.invoice, paid: true } }
            : b
        )
      );
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Kunden-Suche</h2>
        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name oder E-Mail"
            className="w-full max-w-sm rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            Suchen
          </button>
        </form>
        {results && (
          <ul className="mt-3 space-y-1 text-sm">
            {results.length === 0 && (
              <li className="text-neutral-500">Keine Treffer.</li>
            )}
            {results.map((r) => (
              <li key={r.id} className="rounded border border-neutral-200 bg-white px-3 py-2">
                {r.name} — {r.email} ({r.role})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Alle Buchungen</h2>
        <div className="mt-3 space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">
                  {b.sessionType.name} — {b.client.name}
                </p>
                <p className="text-sm text-neutral-500">
                  {b.client.email} ·{" "}
                  {new Date(b.scheduledAt).toLocaleString("de-DE")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {(b.priceCents / 100).toFixed(2)} €
                </span>
                {b.invoice?.paid ? (
                  <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Bezahlt
                  </span>
                ) : (
                  b.invoice && (
                    <button
                      onClick={() => markPaid(b.invoice!.id)}
                      className="rounded border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100"
                    >
                      Als bezahlt markieren
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
