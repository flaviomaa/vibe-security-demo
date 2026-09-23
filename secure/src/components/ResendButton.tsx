"use client";

import { useState, useTransition } from "react";

export default function ResendButton({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (bookingId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action(bookingId);
          setSent(result.ok);
        })
      }
      className="text-xs text-neutral-500 hover:underline disabled:opacity-50"
    >
      {sent ? "Erneut gesendet ✓" : "Bestätigung erneut senden"}
    </button>
  );
}
