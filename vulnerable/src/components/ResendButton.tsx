"use client";

import { useState } from "react";

// VULNERABILITY #4 (secret exposure): NEXT_PUBLIC_NOTIFY_API_KEY is inlined
// into this client bundle at build time. Anyone can read it from the
// browser devtools/sources tab and call the notification API directly,
// with no server in between. See VULNERABILITIES.md #4.
const NOTIFY_API_KEY = process.env.NEXT_PUBLIC_NOTIFY_API_KEY;

export default function ResendButton({
  bookingId,
  to,
  subject,
}: {
  bookingId: string;
  to: string;
  subject: string;
}) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleClick() {
    setPending(true);
    const res = await fetch("/api/mock-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, subject, apiKey: NOTIFY_API_KEY }),
    });
    setPending(false);
    setSent(res.ok);
  }

  return (
    <button
      data-booking-id={bookingId}
      disabled={pending}
      onClick={handleClick}
      className="text-xs text-neutral-500 hover:underline disabled:opacity-50"
    >
      {sent ? "Erneut gesendet ✓" : "Bestätigung erneut senden"}
    </button>
  );
}
