"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function resendConfirmation(bookingId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Nicht angemeldet." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { sessionType: true, user: true },
  });
  if (!booking || booking.userId !== session.sub) {
    return { ok: false as const, error: "Nicht erlaubt." };
  }

  // NOTIFY_API_KEY is a server-only env var (no NEXT_PUBLIC_ prefix) — it
  // is read here, inside a Server Action, and never shipped to the browser.
  console.log(
    `[mock-email] to=${booking.user.email} subject=Buchung bestätigt: ${booking.sessionType.name} key=${process.env.NOTIFY_API_KEY?.slice(0, 8)}...`
  );

  return { ok: true as const };
}
